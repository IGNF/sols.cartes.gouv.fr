/**
 * Per-page locale data. Pages under /fr/ and /en/ read their strings from i18n/<locale>.js;
 * shell pages set `pageKey` and take their title and description from i18n.pages[pageKey].
 */
import { localeOf } from '../../lib/i18n.js';

export default {
  locale: (data) => localeOf(data.page.url),
  t: (data) => data.i18n[localeOf(data.page.url)],
  heading: (data) => {
    const strings = data.i18n[localeOf(data.page.url)];
    return data.pageKey ? strings.pages[data.pageKey].title : data.title;
  },
  metaDescription: (data) => {
    const strings = data.i18n[localeOf(data.page.url)];
    if (data.pageKey) return strings.pages[data.pageKey].description;
    return data.description || strings.description;
  },
};
