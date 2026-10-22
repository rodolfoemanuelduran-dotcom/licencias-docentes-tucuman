import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { Adjunto } from '../../types';
import { deBase64 } from '../cripto';
import { aLatin1 } from './plantillaParte';

const A4: [number, number] = [595.28, 841.89];

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
        const page = doc.addPage(A4);
        const caja = { w: A4[0] - 80, h: A4[1] - 120 };
        const esc = Math.min(caja.w / img.width, caja.h / img.height, 1.5);
        const w = img.width * esc;
        const h = img.height * esc;
        page.drawImage(img, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2 - 10, width: w, height: h });
        page.drawText(aLatin1(a.nombre).slice(0, 80), { x: 40, y: A4[1] - 40, size: 9, font });
      }
    } catch {
      const page = doc.addPage(A4);
      page.drawText(aLatin1(`No se pudo incluir el adjunto: ${a.nombre}`), { x: 40, y: A4[1] - 60, size: 11, font });
    }
  }
}
