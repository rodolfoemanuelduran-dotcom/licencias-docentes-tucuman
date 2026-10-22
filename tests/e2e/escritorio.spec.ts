import { expect, test } from '@playwright/test';
import { flujoCompleto } from './flujo';

test('Nueva licencia completa en 1280 px con vista previa y atajos', async ({ page }) => {
  await flujoCompleto(page, true);
  await page.goto('/#/nueva');
  await expect(page.getByTitle('Vista previa del PDF')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
});
