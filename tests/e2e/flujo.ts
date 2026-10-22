import { expect, type Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Recorre el flujo completo de Nueva licencia hasta descargar el PDF. */
export async function flujoCompleto(page: Page, escritorio: boolean) {
  await page.goto('/');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Empezar' }).click();

  if (escritorio) await page.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: /Nueva licencia/ }).click();
  else await page.getByRole('button', { name: /Nueva licencia/ }).click();

  // Paso 1
  await page.getByLabel('Buscar licencia').fill('duelo');
  await page.getByRole('button', { name: /Duelo/ }).click();
  await expect(page.getByRole('dialog')).toContainText('5 días corridos');
  await expect(page.getByRole('dialog')).toContainText('Verificar en Mesa de Entradas antes de presentar');
  await page.getByRole('button', { name: 'Elegir esta licencia' }).click();

  // Paso 2
  await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
  await page.getByRole('button', { name: /Siguiente/ }).click();
  await expect(page.getByText('Escribí tu apellido.')).toBeVisible();
  await page.getByLabel('Apellido (obligatorio)').fill('Gómez');
  await page.getByLabel('Nombre (obligatorio)').fill('Juan Pablo');
  await page.getByLabel('DNI (obligatorio)').fill('30123456');
  await page.getByRole('button', { name: /Siguiente/ }).click();

  // Paso 3
  await page.getByLabel('Fecha de inicio').fill('2026-10-05');
  await page.getByLabel('Fecha de fin').fill('2026-10-09');
  await expect(page.getByText('Total: 5 días corridos')).toBeVisible();
  await page.getByRole('button', { name: /Siguiente/ }).click();

  // Paso 4
  await page.locator('input[type=file]').setInputFiles({ name: 'acta.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('1. acta.png')).toBeVisible();
  await page.getByRole('button', { name: /Siguiente/ }).click();

  // Paso 5
  await expect(page.getByRole('heading', { name: 'Revisión' })).toBeVisible();
  await expect(page.getByText('Gómez, Juan Pablo')).toBeVisible();
  await page.getByRole('button', { name: /Generar PDF/ }).click();

  // Paso 6
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar/ }).click();
  const d = await descarga;
  expect(d.suggestedFilename()).toMatch(/^G_Gomez_Juan-Pablo_art23c.*\.pdf$/);

  // Quedó en Mis licencias
  await page.goto('/#/mis');
  await expect(page.getByText('Gómez, Juan Pablo').first()).toBeVisible();
}
