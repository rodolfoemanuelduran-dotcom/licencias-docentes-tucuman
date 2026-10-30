import { readFileSync } from 'node:fs';
import { expect, test, type Download } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('licencia de suplente (art. 38 b) con SESOP, dos escuelas y firma dibujada', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: /Nueva licencia/ }).click();

  // Paso 1: art. 38 b
  await page.getByLabel('Buscar licencia').fill('38b');
  await expect(page.getByRole('button', { name: /corto tratamiento \(suplentes/ })).toHaveCount(1);
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

  // Paso 4: dos casillas, certificado médico y código del SESOP
  await page.getByLabel('Adjuntar: 1. Certificado médico').setInputFiles({ name: 'certificado.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('certificado.png')).toBeVisible();
  await page.getByRole('button', { name: /Siguiente/ }).click();
  await expect(page.getByText('Falta adjuntar el código o la constancia del SESOP.')).toBeVisible();
  await expect(page.getByText('Falta adjuntar el certificado médico.')).toHaveCount(0);

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
  // Después de llenar el parte también se puede cargar el código del SESOP
  await page.getByLabel('Adjuntar: 2. Código o constancia del SESOP').setInputFiles({ name: 'codigo-sesop.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('codigo-sesop.png')).toBeVisible();
  await page.getByLabel('Originales del parte').selectOption('3');
  // Un PDF por parte (2 escuelas), uno con el certificado y otro con el código del SESOP
  await expect(page.getByRole('heading', { name: 'Tus 4 PDF' })).toBeVisible();
  const descargas: Download[] = [];
  page.on('download', (d) => descargas.push(d));
  await page.getByRole('button', { name: 'Descargar los 4 PDF' }).click();
  await expect.poll(() => descargas.length, { timeout: 15000 }).toBe(4);
  const paginas: Record<string, number> = {};
  for (const d of descargas) paginas[d.suggestedFilename().replace(/^.*_2026-10-05_/, '')] = (await PDFDocument.load(readFileSync((await d.path())!))).getPageCount();
  expect(descargas[0].suggestedFilename()).toMatch(/^P_Perez_Ana_art38b/);
  expect(paginas).toEqual({ 'parte-escuela-a.pdf': 3, 'parte-escuela-b.pdf': 3, 'certificado.pdf': 1, 'codigo-sesop.pdf': 1 });
});

test('la guía orienta según la situación de revista y lleva al parte', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: /Qué licencia me corresponde/ }).click();
  await page.getByLabel('Tu situación de revista').selectOption('suplente');
  await page.getByRole('button', { name: /Estoy enfermo/ }).click();
  await page.getByRole('button', { name: /Algo común/ }).click();
  await expect(page.getByRole('heading', { name: 'Te corresponde esta licencia' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /suplentes y contratados/ })).toBeVisible();
  await expect(page.getByText(/Te quedan 30 de 30 días en/)).toBeVisible();
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
  await page.getByRole('button', { name: /Tengo que cuidar/ }).click();
  await page.getByRole('button', { name: /familiar enfermo/ }).click();
  await expect(page.getByText('No encontramos una licencia para tu situación')).toBeVisible();
  await page.getByLabel('Tu situación de revista').selectOption('titular');
  await page.getByRole('button', { name: 'Hacer el parte de esta licencia' }).click();
  await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
});
