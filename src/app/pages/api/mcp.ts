import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerRuntimeConfig } from '@/lib/docs-api/runtime-config';
import { authorizeMcpRequest, createMcpServer } from '@/lib/mcp';

/**
 * `/api/mcp`, the Model Context Protocol endpoint, over stateless Streamable HTTP.
 *
 * Server and transport are built per request and torn down with the response: there is no session to
 * resume and no affinity to preserve, so a long-lived Node server and a cold serverless function
 * behave the same. POST carries every JSON-RPC call; DELETE is left to the transport, which rejects
 * it for want of a session.
 *
 * Static exports have no API routes, so this exists only in workspace dev and registry deployments.
 *
 * A build with `runtime.mcp: false` answers 404 rather than 403, so a turned-off feature reads as
 * absent instead of as something a credential would unlock. That check runs before any auth work.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!getServerRuntimeConfig().mcp) {
    res.status(404).end();
    return;
  }

  if (!(await authorizeMcpRequest(req, res))) {
    return;
  }

  // A GET opens the standalone SSE stream. Nothing here is ever sent unprompted and a stateless
  // endpoint has no session to attach a stream to, so the stream would only hold the connection
  // (and on serverless the function) open until it timed out.
  if (req.method === 'GET') {
    res.setHeader('Allow', 'POST, DELETE');
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    return;
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    // Next has already consumed the body stream, so pass the parsed body instead of letting the
    // transport read it again.
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request failed.', error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Unexpected MCP error.' }, id: null });
    }
  }
}
