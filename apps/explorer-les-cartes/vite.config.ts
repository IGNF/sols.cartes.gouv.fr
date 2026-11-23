import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { siteBase, withSiteBase } from '../../scripts/site-base.mjs';

/** Site prefix (SITE_BASE, "/" by default; "/sols.cartes.gouv.fr/" for the GitHub Pages preview). */
const SITE_BASE = siteBase();
/** Public path under which the carto brick is served (see scripts/apps.ts at the repository root). */
const BASE_PATH = `${SITE_BASE}explorer-les-cartes/`;

/** Recursively prefixes the root-absolute paths ("/aide/", "/fr/"...) of a JSON value with SITE_BASE. */
function prefixPaths(value: unknown): unknown {
  if (typeof value === 'string') return withSiteBase(value, SITE_BASE);
  if (Array.isArray(value)) return value.map(prefixPaths);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, prefixPaths(item)]));
  }
  return value;
}

/**
 * The portal links of the carto brick all come from @sols/brand/brand.json (src/config/urls.ts, site.ts):
 * under a SITE_BASE other than "/", its same-origin paths are prefixed at build time, in one place.
 */
function brandSiteBase(): Plugin {
  return {
    name: 'sols-brand-site-base',
    enforce: 'pre',
    transform(code, id) {
      if (SITE_BASE === '/' || !/[\\/]brand[\\/]brand\.json$/.test(id.split('?')[0] ?? ''))
        return null;
      return { code: JSON.stringify(prefixPaths(JSON.parse(code))), map: null };
    },
  };
}
const DEV_PORT = 5173;

export default defineConfig({
  base: BASE_PATH,
  plugins: [brandSiteBase(), react()],
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: DEV_PORT, strictPort: true },
  css: {
    lightningcss: {
      // The DSFR stylesheet contains IE hacks (`min-width: 0\0`) that lightningcss rejects.
      errorRecovery: true,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The lazily loaded map chunk (OpenLayers + geopf-extensions) is about 0.9 MB minified.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/sols-layers/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'text'],
    },
  },
});
