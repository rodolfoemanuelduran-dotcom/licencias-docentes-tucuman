import type { Licencia } from '../types';
import { guardarPDF, nombreArchivo } from './archivo';
import { generarPDF } from './pdf/generarPDF';

export async function descargarLicencia(l: Licencia): Promise<'carpeta' | 'descarga'> {
  return guardarPDF(await generarPDF(l), nombreArchivo(l));
}

export function puedeCompartir(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function compartirLicencia(l: Licencia): Promise<void> {
  const archivo = new File([(await generarPDF(l)) as BlobPart], nombreArchivo(l), { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [archivo] })) {
    await navigator.share({ files: [archivo], title: 'Parte de licencia' });
  } else {
    throw new Error('Tu navegador no permite compartir archivos. Usá “Descargar”.');
  }
}

/** Imprime el PDF desde un iframe oculto; si el navegador no lo permite, abre el PDF en otra pestaña. */
export async function imprimirLicencia(l: Licencia): Promise<void> {
  const url = URL.createObjectURL(new Blob([(await generarPDF(l)) as BlobPart], { type: 'application/pdf' }));
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  f.src = url;
  f.onload = () => {
    try {
      f.contentWindow?.focus();
      f.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
    setTimeout(() => {
      f.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(f);
}
