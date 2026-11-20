import { defineScreenTools, defineTool, toolError, toolResult } from 'handoff-app/screens/server';
import { notes } from './collections';

/** Tools the assistant can use while a reader is on this screen. They are listed as {{prefix}}_<name>. */
export default defineScreenTools(({ collections, docs }) => {
  const store = collections.get(notes);

  return [
    defineTool(
      {
        name: 'link_component',
        description: 'Link a design system component to a note. Find the component id with handoff_search_components first.',
        inputSchema: {
          type: 'object',
          required: ['noteId', 'componentId'],
          properties: { noteId: { type: 'string' }, componentId: { type: 'string' } },
        },
      },
      async ({ noteId, componentId }) => {
        if (!(await docs.component(componentId))) return toolError(`Component "${componentId}" does not exist. Search the components first.`);
        const note = await store.update(noteId, (current) => ({
          ...current,
          componentIds: [...new Set([...current.componentIds, componentId])],
        }));
        return toolResult({ componentIds: note.data.componentIds }, { changed: [note.ref] });
      }
    ),
  ];
});
