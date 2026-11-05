import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Public path under which the carto brick is served (see scripts/apps.ts at the repository root). */
const BASE_PATH = '/explorer-les-cartes/';
const DEV_PORT = 5173;

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
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
  },
});
