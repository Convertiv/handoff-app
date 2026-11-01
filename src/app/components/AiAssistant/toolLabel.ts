/** How one tool call reads in the collapsed row under the answer. */
export const toolCallLabel = (toolName: string, input: unknown): string => {
  const args = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const value = (key: string): string | undefined => (typeof args[key] === 'string' && args[key] ? (args[key] as string) : undefined);

  switch (toolName) {
    case 'handoff_search_components':
      return value('query') ? `Searched components for “${value('query')}”` : 'Listed components';
    case 'handoff_get_component':
      return `Read component ${value('id') ?? ''}`.trim();
    case 'handoff_get_component_source':
      return `Read ${value('id') ?? 'component'} source`;
    case 'handoff_get_component_preview':
      return `Read ${value('id') ?? 'component'} preview ${value('preview') ?? ''}`.trim();
    case 'handoff_get_tokens':
      return value('set') ? `Read tokens for ${value('set')}` : 'Read design tokens';
    case 'handoff_search_pages':
      return value('query') ? `Searched pages for “${value('query')}”` : 'Listed pages';
    case 'handoff_list_custom_previews':
      return `Listed custom previews of ${value('componentId') ?? 'component'}`;
    case 'handoff_get_custom_preview':
      return 'Read custom preview';
    case 'handoff_create_custom_preview':
      return value('title') ? `Saved custom preview “${value('title')}”` : 'Saved custom preview';
    case 'handoff_update_custom_preview':
      return 'Updated custom preview';
    case 'handoff_delete_custom_preview':
      return 'Deleted custom preview';
    case 'handoff_get_page':
      return `Read page ${value('url') ?? ''}`.trim();
    default:
      return toolName;
  }
};
