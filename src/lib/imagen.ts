import type { Adjunto } from '../types';
import { aBase64 } from './cripto';

const MAX_LADO = 1600;
const MAX_PDF = 8 * 1024 * 1024;

/** Reduce y recomprime la foto en el dispositivo antes de guardarla. */
async function comprimirImagen(file: File): Promise<{ datos: string; mime: string }> {
  const bmp = await createImageBitmap(file);
  const esc = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * esc);
  c.height = Math.round(bmp.height * esc);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const blob = await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('No se pudo comprimir'))), 'image/jpeg', 0.7));
  return { datos: aBase64(new Uint8Array(await blob.arrayBuffer())), mime: 'image/jpeg' };
}

export async function procesarArchivo(file: File): Promise<Adjunto> {
  const id = crypto.randomUUID();
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF) throw new Error('El PDF pesa más de 8 MB. Probá con uno más liviano.');
    return { id, nombre: file.name, tipo: 'pdf', mime: file.type, datos: aBase64(new Uint8Array(await file.arrayBuffer())) };
  }
  if (file.type.startsWith('image/')) {
    const { datos, mime } = await comprimirImagen(file);
    return { id, nombre: file.name, tipo: 'imagen', mime, datos };
  }
  throw new Error('Solo se pueden adjuntar fotos o PDF.');
}
