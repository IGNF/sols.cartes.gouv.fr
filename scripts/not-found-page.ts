/**
 * Root 404.html of the GitHub Pages preview (the only fallback page Pages serves). A path under a
 * single-page brick (catalogue, carto) is sent to that brick's entry page; any other path shows a short
 * "page not found" message with a link to the home page. Styled with the DSFR stylesheet of the edito.
 */
import type { AppSpec } from './apps';

export function notFoundPage(base: string, apps: readonly AppSpec[]): string {
  const spaRoots = apps
    .filter((app) => app.publicPath !== '/')
    .map((app) => `${base}${app.publicPath.replace(/^\/+|\/+$/g, '')}/`);
  // The script only redirects; without JS the message and the home link stay usable.
  const script = `(function(){var roots=${JSON.stringify(spaRoots)};var p=location.pathname;for(var i=0;i<roots.length;i++){if(p.indexOf(roots[i])===0||p+'/'===roots[i]){location.replace(roots[i]);return;}}})();`;
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Page non trouvée - sols.cartes.gouv.fr</title>
    <meta name="description" content="La page demandée n'existe pas ou a été déplacée.">
    <link rel="stylesheet" href="${base}dsfr/dsfr.min.css">
    <script>${script}</script>
  </head>
  <body>
    <main id="contenu" class="fr-container fr-py-6w">
      <h1>Page non trouvée</h1>
      <p>La page que vous cherchez est introuvable. Excusez-nous pour la gêne occasionnée.</p>
      <p><a class="fr-link" href="${base}">Page d'accueil</a></p>
    </main>
  </body>
</html>
`;
}
