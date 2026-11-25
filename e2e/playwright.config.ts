import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '8102';

if (!process.env.CI) {
  console.warn(
    `[e2e] Si un serveur écoute déjà sur le port ${PORT}, il sera réutilisé : la suite teste ce serveur, pas forcément le dist/ courant.`,
  );
}

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: 1,
  // Parallélisme par fichier (pas de fullyParallel). Défaut : 4 en local, 1 en CI ; `E2E_WORKERS=n` pour forcer.
  workers: Number(process.env.E2E_WORKERS ?? (process.env.CI ? 1 : 4)),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run preview:all',
    cwd: '..',
    env: { PORT },
    url: `http://localhost:${PORT}/fr/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } } },
  ],
});
