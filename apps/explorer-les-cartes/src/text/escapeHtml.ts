/**
 * Escapes the five HTML special characters: for text handed to a library that builds markup with
 * `innerHTML` (the geopf Catalog control), where a `<` or `"` of a record would be parsed as markup.
 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Reverses `escapeHtml`: for an escaped text that must leave the markup (a URL, a search). */
export function unescapeHtml(text: string): string {
  return text
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}
