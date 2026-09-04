import matter from 'gray-matter';

/**
 * Parse markdown frontmatter without the process-lifetime cache in gray-matter.
 *
 * `matter(text)` caches every document it parses, keyed by the whole input string, and only when the call passes no
 * options. Nothing clears that cache, so a long-running server keeps a copy of every distinct document it parsed.
 * Passing `{}` skips the cache and matches the defaults of the parser, so the result does not change. Use this
 * wherever a request, a regeneration, or a watch can parse markdown again.
 */
export const parseMarkdown = (text: string): matter.GrayMatterFile<string> => matter(text, {});
