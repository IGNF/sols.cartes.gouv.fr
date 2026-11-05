import { ABSTRACT_EXCERPT_LENGTH } from '../config/map';

/** Cuts a text on a word boundary and adds an ellipsis. */
export function excerpt(text: string, length = ABSTRACT_EXCERPT_LENGTH): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= length) return clean;
  const cut = clean.slice(0, length);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : length)}…`;
}
