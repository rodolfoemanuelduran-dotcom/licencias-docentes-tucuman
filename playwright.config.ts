import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 180000 },
  projects: [
    { name: 'movil-390', testMatch: /movil/, use: { viewport: { width: 390, height: 844 } } },
    { name: 'escritorio-1280', testMatch: /escritorio/, use: { viewport: { width: 1280, height: 800 } } },
  ],
});
