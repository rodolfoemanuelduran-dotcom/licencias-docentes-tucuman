import { categoriaDe, escuelasDeLicencia, normalizarLicencia, type CategoriaAdjunto, type Escuela, type Licencia } from '../types';
import { buscarTipo } from './catalogo';
import { guardarPDF, nombreArchivo } from './archivo';
import { generarAdjuntos, generarParte, generarPDF } from './pdf/generarPDF';

export interface ArchivoPlan {
  clave: string;
  titulo: string;
  nombre: string;
  escuela?: Escuela;
  categoria?: CategoriaAdjunto;
}

const NOMBRES: Record<CategoriaAdjunto, { titulo: string; sufijo: string }> = {
  certificado: { titulo: 'Certificado médico', sufijo: 'certificado' },
  sesop: { titulo: 'Código del SESOP', sufijo: 'codigo-sesop' },
  otro: { titulo: 'Otra documentación', sufijo: 'documentacion' },
};

/**
 * Lista de PDF separados de una licencia: un parte por escuela, y un PDF por cada casilla de adjuntos
 * (certificado médico, código del SESOP y otra documentación).
 */
export function planArchivos(licencia: Licencia): ArchivoPlan[] {
  const l = normalizarLicencia(licencia);
  const escuelas = escuelasDeLicencia(l);
  const plan: ArchivoPlan[] = escuelas.length
    ? escuelas.map((e, i) => ({
        clave: `parte:${e.id}`,
        titulo: escuelas.length > 1 ? `Parte de Licencias: ${e.nombre || `escuela ${i + 1}`}` : 'Parte de Licencias',
        nombre: nombreArchivo(l, escuelas.length > 1 ? `parte ${e.nombre || i + 1}` : 'parte'),
        escuela: e,
      }))
    : [{ clave: 'parte', titulo: 'Parte de Licencias', nombre: nombreArchivo(l, 'parte') }];
  for (const c of ['certificado', 'sesop', 'otro'] as CategoriaAdjunto[]) {
    if (l.adjuntos.some((a) => categoriaDe(a) === c)) {
      plan.push({ clave: c, titulo: NOMBRES[c].titulo, nombre: nombreArchivo(l, NOMBRES[c].sufijo), categoria: c });
    }
  }
  return plan;
}

export function bytesDe(l: Licencia, a: ArchivoPlan): Promise<Uint8Array> {
  if (a.categoria) return generarAdjuntos(l.adjuntos.filter((x) => categoriaDe(x) === a.categoria), a.titulo);
  return generarParte(l, a.escuela);
}

export async function descargarArchivo(l: Licencia, a: ArchivoPlan): Promise<'carpeta' | 'descarga'> {
  return guardarPDF(await bytesDe(l, a), a.nombre);
}

/** Descarga todos los PDF de la licencia, uno atrás del otro. */
export async function descargarLicencia(l: Licencia): Promise<{ cantidad: number; destino: 'carpeta' | 'descarga' }> {
  const plan = planArchivos(l);
  let destino: 'carpeta' | 'descarga' = 'descarga';
  for (const a of plan) {
    destino = await descargarArchivo(l, a);
    // Pausa breve: algunos navegadores frenan las descargas seguidas.
    await new Promise((r) => setTimeout(r, 400));
  }
  return { cantidad: plan.length, destino };
}

export function puedeCompartir(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function compartirLicencia(l: Licencia): Promise<void> {
  const files: File[] = [];
  for (const a of planArchivos(l)) files.push(new File([(await bytesDe(l, a)) as BlobPart], a.nombre, { type: 'application/pdf' }));
  if (navigator.canShare?.({ files })) {
    await navigator.share({ files, title: 'Parte de licencia' });
  } else {
    throw new Error('Tu navegador no permite compartir archivos. Usá “Descargar”.');
  }
}

/** Imprime todo junto desde un iframe oculto; si el navegador no lo permite, abre el PDF en otra pestaña. */
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

export const tipoDe = (l: Licencia) => buscarTipo(l.tipoId);
