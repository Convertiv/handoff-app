import { PlaygroundComponent } from '../types';

/**
 * Recursively simplify a properties object for the prompt, keeping
 * only the fields the LLM needs: type, name, description, items, properties.
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

function buildCatalogEntry(component: PlaygroundComponent): string {
  const simplified = simplifyProperties(component.properties || {});
  const entry = {
    id: component.id,
    title: component.title,
    description: component.description || '',
    group: component.group || '',
    tags: component.tags || [],
    properties: simplified,
  };
  return JSON.stringify(entry);
}

export function buildSystemPrompt(components: PlaygroundComponent[]): string {
  const catalog = components.map(buildCatalogEntry).join('\n');

  return `You are a page layout architect for a design system. Your job is to select components from the available catalog and populate them with user-provided content to create a complete page layout.

RULES:
1. Only use components whose "id" appears in the catalog below.
2. Return valid JSON with a single top-level key "components" containing an ordered array.
3. Each array element must be: { "componentId": "<id from catalog>", "data": { ... } }
4. The "data" object must match the component's property schema. Populate every property with appropriate content from the user's description or generate plausible placeholder content.
5. Respect property types:
   - "text": plain string
   - "richtext": HTML string
   - "image": { "src": "<url>", "alt": "<description>" } or a plain URL string
   - "link": { "url": "<href>", "label": "<text>" }
   - "button": { "label": "<text>", "url": "<href>" }
   - "array": array of objects matching the items schema
   - "object": nested object matching the properties schema
   - "number": numeric value
   - "select": one of the listed options
   - "color": CSS color string
   - "video": { "src": "<url>", "poster": "<url>" }
6. You may use the same component multiple times if it makes sense for the layout.
7. Order components top-to-bottom as they should appear on the page.
8. For image URLs where no specific image is provided, use "https://placehold.co/800x400" with appropriate dimensions.

AVAILABLE COMPONENTS:
${catalog}

Respond ONLY with the JSON object. No markdown, no explanation.`;
}

export function buildUserPrompt(description: string, content?: string): string {
  let prompt = `Create a page layout with the following description:\n\n${description}`;
  if (content?.trim()) {
    prompt += `\n\nUse this content to populate the components:\n\n${content}`;
  }
  return prompt;
}
