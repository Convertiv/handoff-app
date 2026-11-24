import { defineCollection, type DocumentOf } from 'handoff-app/screens';

/**
 * The data this screen stores. Each document is checked against the schema on every write.
 * To change the schema later, bump `version` and add a `migrate` step for the new version.
 */
export const notes = defineCollection({
  name: 'notes',
  version: 1,
  // Gives the assistant {{prefix}}_notes_list, _get, _create, _update and _delete on this screen.
  mcp: true,
  schema: {
    type: 'object',
    required: ['title', 'body', 'componentIds'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 120 },
      body: { type: 'string', maxLength: 20000 },
      componentIds: { type: 'array', items: { type: 'string' }, maxItems: 50 },
    },
    additionalProperties: false,
  },
});

export type Note = DocumentOf<typeof notes>;
