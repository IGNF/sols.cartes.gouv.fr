// Point d'entrée ESM : les briques peuvent aussi importer `@sols/brand/brand.json` directement
// (Vite) ou lire le fichier avec `fs` (Eleventy, scripts).
import brand from './brand.json' with { type: 'json' };

export default brand;
export const { service, sections, badges, header, footer, external } = brand;
