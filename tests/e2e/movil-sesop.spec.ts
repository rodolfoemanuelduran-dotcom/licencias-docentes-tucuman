import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('licencia de suplente (art. 38 b) con SESOP, dos escuelas y firma dibujada', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: /Nueva licencia/ }).click();

  // Paso 1: art. 38 b
  await page.getByLabel('Buscar licencia').fill('suplentes');
  await page.getByRole('button', { name: /corto tratamiento \(suplentes/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Hasta 30 días por año calendario');
  await expect(page.getByRole('dialog')).not.toContainText('Verificar en Mesa de Entradas');
  await page.getByRole('button', { name: 'Elegir esta licencia' }).click();

  // Paso 2: datos personales y dos escuelas
  await page.getByLabel('Apellido (obligatorio)').fill('Pérez');
  await page.getByLabel('Nombre (obligatorio)').fill('Ana');
  await page.getByLabel('DNI (obligatorio)').fill('28123456');
  await expect(page.getByLabel(/Recordar mis datos/)).toBeChecked();
  await page.getByRole('button', { name: '+ Agregar escuela' }).click();
  await page.getByLabel('Nombre del establecimiento').fill('Escuela A');
  await page.getByLabel('CUE', { exact: true }).fill('900123400');
  await page.getByRole('button', { name: '+ Agregar plaza' }).click();
  await page.getByLabel('IDPLAZA 1').fill('555111');
  await page.getByRole('button', { name: '+ Agregar escuela' }).click();
  await page.getByLabel('Nombre del establecimiento').nth(1).fill('Escuela B');
  await expect(page.getByText('Se arma un parte por cada escuela')).toBeVisible();
  await page.getByRole('button', { name: /Siguiente/ }).click();

  // Paso 3: código SESOP y guía
  await expect(page.getByRole('heading', { name: 'Trámite en el SESOP' })).toBeVisible();
  await page.getByLabel('Fecha de inicio').fill('2026-10-05');
  await page.getByLabel('Fecha de fin').fill('2026-10-06');
  await page.getByLabel('Código de inasistencia del SESOP').fill('ab123');
  await page.getByRole('button', { name: /Siguiente/ }).click();
  await page.getByRole('button', { name: /Siguiente/ }).click();

  // Paso 5: resumen por escuela y firma con el dedo
  await expect(page.getByText('AB123')).toBeVisible();
  await expect(page.getByText('Parte 1: Escuela A')).toBeVisible();
  await expect(page.getByText('Parte 2: Escuela B')).toBeVisible();
  const lienzo = page.getByRole('img', { name: 'Panel para dibujar tu firma' });
  await lienzo.scrollIntoViewIfNeeded();
  const caja = (await lienzo.boundingBox())!;
  await page.mouse.move(caja.x + 30, caja.y + caja.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(caja.x + 30 + i * 20, caja.y + caja.height / 2 + (i % 2 ? -18 : 18));
  await page.mouse.up();
  await expect(page.getByText('Todavía no firmaste')).toHaveCount(0);

  // Paso 6: 3 originales por escuela
  await page.getByRole('button', { name: /Generar PDF/ }).click();
  await page.getByLabel('Originales del parte').selectOption('3');
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar/ }).click();
  const d = await descarga;
  expect(d.suggestedFilename()).toMatch(/^P_Perez_Ana_art38b/);
  const pdf = await PDFDocument.load(readFileSync((await d.path())!));
  expect(pdf.getPageCount()).toBe(6);
});
