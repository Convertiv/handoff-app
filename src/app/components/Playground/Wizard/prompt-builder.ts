import { PlaygroundComponent, SelectedPlaygroundComponent } from '../types';

/**
 * Recursively simplify a properties object for the prompt, keeping
 * only the fields the LLM needs: type, name, description, items, properties, rules, options.
 */
function simplifyProperties(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!value || typeof value !== 'object') continue;
    const entry: Record<string, any> = {};
    if (value.type) entry.type = value.type;
    if (value.name) entry.name = value.name;
    if (value.description) entry.description = value.description;
    if (value.options) entry.options = value.options;
    if (value.rules) {
      const r: Record<string, any> = {};
      if (value.rules.required) r.required = true;
      if (value.rules.dimensions) r.dimensions = value.rules.dimensions;
      if (value.rules.maxLength) r.maxLength = value.rules.maxLength;
      if (Object.keys(r).length > 0) entry.rules = r;
    }
    if (value.properties) {
      entry.properties = simplifyProperties(value.properties);
    }
    if (value.items?.properties) {
      entry.items = { properties: simplifyProperties(value.items.properties) };
    }
    result[key] = entry;
  }
  return result;
}

function buildCatalogEntry(component: PlaygroundComponent): object {
  const simplified = simplifyProperties(component.properties || {});
  return {
    id: component.id,
    title: component.title,
    description: component.description || '',
    group: component.group || '',
    tags: component.tags || [],
    schema: simplified,
  };
}

function buildGroupedCatalog(components: PlaygroundComponent[]): string {
  const groups = new Map<string, object[]>();
  for (const c of components) {
    const group = c.group || 'Ungrouped';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(buildCatalogEntry(c));
  }

  const sections: string[] = [];
  for (const [group, entries] of groups) {
    sections.push(`## ${group}\n${JSON.stringify(entries, null, 2)}`);
  }
  return sections.join('\n\n');
}

export function buildSystemPrompt(
  components: PlaygroundComponent[],
  currentPage?: SelectedPlaygroundComponent[]
): string {
  const catalog = buildGroupedCatalog(components);
  const groupNames = [...new Set(components.map((c) => c.group || 'Ungrouped'))];

  let currentPageContext = '';
  if (currentPage && currentPage.length > 0) {
    const summary = currentPage.map((c, i) => `  ${i + 1}. ${c.title} (${c.id})`).join('\n');
    currentPageContext = `
CURRENT PAGE STATE:
The user already has the following blocks on their page (top to bottom):
${summary}
When the user asks to modify or extend the page, incorporate these existing blocks unless told to start over.

`;
  }

  return `You are a page-builder assistant for Handoff, a design system platform. Users build pages by stacking reusable "blocks" (components) from their design system into a vertical layout. Your job is to select the right blocks, order them logically, and fill every property with high-quality content that matches the user's description.

CONTEXT:
- The page builder displays blocks in a single-column vertical stack, rendered top to bottom.
- Each block is a self-contained component defined by a data schema (listed below).
- The user's design system has ${components.length} components across ${groupNames.length} group${groupNames.length !== 1 ? 's' : ''}: ${groupNames.join(', ')}.
- You must ONLY use components whose "id" appears in the catalog.
${currentPageContext}
RESPONSE FORMAT:
Return a single JSON object with a top-level key "components" containing an ordered array.
Each element must be: { "componentId": "<id from catalog>", "data": { ... } }

SCHEMA RULES:
Populate every property in the "data" object according to the component's schema:
  - "text" / "string" → plain string
  - "richtext" → HTML string (use semantic markup: <h2>, <p>, <strong>, <em>, <ul>, <li>, etc.)
  - "image" → { "src": "<url>", "srcset": "<url>", "alt": "<description>" }
  - "link" → { "url": "<href>", "label": "<text>" }
  - "button" → { "label": "<text>", "url": "<href>" }
  - "boolean" → true or false
  - "number" → numeric value
  - "select" / "enum" → one of the listed options
  - "color" → CSS color string
  - "video" → { "src": "<url>", "poster": "<url>" }
  - "array" → array of objects matching the items schema
  - "object" → nested object matching the properties schema

CONTENT GUIDELINES:
1. Write realistic, professional copy. Avoid "lorem ipsum" unless the user explicitly asks for placeholder text.
2. For images, use "https://placehold.co/{width}x{height}" with contextually appropriate dimensions. If the schema specifies dimension rules, respect them.
3. You may use the same component ID multiple times if it makes sense for the layout.
4. Order blocks as they would naturally appear on a web page (e.g., hero → features → content → CTA → footer).
5. Match the tone of the user's description (corporate, playful, technical, etc.).
6. If a property has a "description" in the schema, use it as guidance for what content belongs there.
7. If the schema has "options" for a select/enum, pick the most appropriate one.

AVAILABLE BLOCKS:
${catalog}

Respond ONLY with the JSON object. No markdown fences, no explanation, no commentary.`;
}

export function buildUserPrompt(
  description: string,
  content?: string,
  currentPage?: SelectedPlaygroundComponent[]
): string {
  let prompt = description;

  if (content?.trim()) {
    prompt += `\n\nUse the following content to populate the components:\n\n${content}`;
  }

  if (currentPage && currentPage.length > 0) {
    prompt += '\n\nThe page already has blocks on it. You may keep, rearrange, or replace them as appropriate for the request.';
  }

  return prompt;
}
