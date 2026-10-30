import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { Adjunto } from '../../types';
import { deBase64 } from '../cripto';
import { aLatin1 } from './plantillaParte';

const A4: [number, number] = [595.28, 841.89];
const MARGEN = 28;

/** Agrega los adjuntos como páginas siguientes, en el orden en que los cargó el docente. */
export async function agregarAdjuntos(doc: PDFDocument, adjuntos: Adjunto[]): Promise<void> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const a of adjuntos) {
    const bytes = deBase64(a.datos);
    try {
      if (a.tipo === 'pdf') {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const paginas = await doc.copyPages(src, src.getPageIndices());
        paginas.forEach((p) => doc.addPage(p));
      } else {
        const img = a.mime === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        // La foto ocupa toda la hoja: apaisada si la imagen es más ancha que alta.
        const [pw, ph] = img.width > img.height ? [A4[1], A4[0]] : A4;
        const page = doc.addPage([pw, ph]);
        const esc = Math.min((pw - MARGEN * 2) / img.width, (ph - MARGEN * 2) / img.height);
        const w = img.width * esc;
        const h = img.height * esc;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
    } catch {
      const page = doc.addPage(A4);
      page.drawText(aLatin1(`No se pudo incluir el adjunto: ${a.nombre}`), { x: 40, y: A4[1] - 60, size: 11, font });
    }
  }
}
