export default {
  layout: 'layouts/article.njk',
  permalink: (data) => `${data.site.sections.articles}${data.page.fileSlug}/`,
};
