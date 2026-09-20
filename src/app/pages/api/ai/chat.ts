import {
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { allowApiMethods } from '@/lib/api/methods';
import { authorizeAiRequest } from '@/lib/ai/auth';
import { AiConnectionError, createAiLanguageModel } from '@/lib/ai/model';
import { DOCS_ASSISTANT_PROMPT } from '@/lib/ai/prompt';
import { describeAiConnections, findAiConnection, selectAiModel } from '@/lib/ai/resolve';
import { createAiToolSession, type AiSource } from '@/lib/ai/tools';

/**
 * `/api/ai/chat`: the docs assistant's agent loop, streamed to the browser.
 *
 * The agent reads through the MCP tools in process (see `lib/ai/tools`), so it answers from the same
 * records `/api/mcp/` returns and a tool added there needs no work here.
 */

/**
 * How many model turns one question may take. A constant rather than config: a loop with no stop
 * condition can call tools without end, so this is a liveness control, not a spend control. Spend
 * belongs to the gateway, which enforces budgets and rate limits per key.
 */
const MAX_AGENT_STEPS = 12;

const readMessages = (body: unknown): UIMessage[] => {
  const messages = (body as { messages?: unknown })?.messages;
  return Array.isArray(messages) ? (messages as UIMessage[]) : [];
};

export default async function aiChatHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!allowApiMethods(req, res, ['POST'])) return;
  const reader = await authorizeAiRequest(req, res, true);
  if (!reader) return;

  const messages = readMessages(req.body);
  if (messages.length === 0) {
    res.status(400).json({ error: 'Ask a question to start.' });
    return;
  }

  const requested = typeof (req.body as { model?: unknown })?.model === 'string' ? (req.body as { model: string }).model : undefined;
  const selection = selectAiModel(await describeAiConnections(reader.userId), requested);
  if (!selection) {
    res.status(409).json({ error: 'No AI provider is available for this account.', code: 'no_usable_connection' });
    return;
  }

  const connection = findAiConnection(selection.connection.id);
  if (!connection) {
    res.status(409).json({ error: 'No AI provider is available for this account.', code: 'no_usable_connection' });
    return;
  }

  let model;
  try {
    model = await createAiLanguageModel(connection, selection.model, reader.userId);
  } catch (error) {
    if (error instanceof AiConnectionError) {
      res.status(409).json({ error: error.message, code: 'connection_unavailable' });
      return;
    }
    console.error('AI model could not be built.', error);
    res.status(500).json({ error: 'The AI provider could not be reached.' });
    return;
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Sources are written as the tools return them, so a link appears as soon as the agent has
      // read the page it came from. Deduplicated because one question often reads a page twice.
      const seen = new Set<string>();
      const writeSources = (sources: AiSource[]) => {
        for (const source of sources) {
          if (seen.has(source.url)) continue;
          seen.add(source.url);
          writer.write({ type: 'source-url', sourceId: source.url, url: source.url, title: source.title });
        }
      };

      const session = await createAiToolSession(writeSources);
      // Torn down with the response, the way `/api/mcp/` does it: the merged stream outlives this
      // function, and a reader who closes the modal mid-answer must not leave the session open.
      res.on('close', () => void session.close());

      const result = streamText({
        model,
        system: DOCS_ASSISTANT_PROMPT,
        messages: await convertToModelMessages(messages),
        tools: session.tools,
        stopWhen: stepCountIs(MAX_AGENT_STEPS),
      });
      writer.merge(toUIMessageStream({ stream: result.fullStream, tools: session.tools }));
    },
    onError: (error) => {
      console.error('AI chat request failed.', error);
      return 'The AI provider could not complete this answer.';
    },
  });

  await pipeUIMessageStreamToResponse({ response: res, stream });
}
