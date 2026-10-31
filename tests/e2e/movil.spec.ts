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

test('el botón de actualizar recarga la app sin borrar los datos', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByText(/Versión del \d/)).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto('./#/cuenta');
  await page.getByLabel('Apellido (obligatorio)').fill('Pérez');
  await page.getByLabel('Nombre (obligatorio)').fill('Ana');
  await page.getByLabel('DNI (obligatorio)').fill('28123456');
  await page.getByRole('button', { name: 'Guardar mis datos' }).click();
  await expect(page.getByText('Datos guardados en este dispositivo.')).toBeVisible();
  const recarga = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Actualizar la app ahora' }).click();
  await recarga;
  await expect(page.getByLabel('Apellido (obligatorio)')).toHaveValue('Pérez');
});
