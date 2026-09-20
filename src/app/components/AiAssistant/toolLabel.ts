/** How one tool call reads in the collapsed row under the answer. */
export const toolCallLabel = (toolName: string, input: unknown): string => {
  const args = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const value = (key: string): string | undefined => (typeof args[key] === 'string' && args[key] ? (args[key] as string) : undefined);

  switch (toolName) {
    case 'handoff_search_components':
      return value('query') ? `Searched components for “${value('query')}”` : 'Listed components';
    case 'handoff_get_component':
      return `Read component ${value('id') ?? ''}`.trim();
    case 'handoff_get_tokens':
      return value('id') ? `Read tokens for ${value('id')}` : 'Read design tokens';
    case 'handoff_search_pages':
      return value('query') ? `Searched pages for “${value('query')}”` : 'Listed pages';
    case 'handoff_get_page':
      return `Read page ${value('url') ?? ''}`.trim();
    default:
      return toolName;
  }
};
