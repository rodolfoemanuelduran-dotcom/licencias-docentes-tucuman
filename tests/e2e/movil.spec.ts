import { expect, test } from '@playwright/test';
import { flujoCompleto } from './flujo';

test('Nueva licencia completa en 390 px', async ({ page }) => {
  await flujoCompleto(page, false);
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(390);
});

test('funciona sin conexión después de la primera carga', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la página ya queda controlada por el service worker
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Licencias Docentes Tucumán' })).toBeVisible();
});
