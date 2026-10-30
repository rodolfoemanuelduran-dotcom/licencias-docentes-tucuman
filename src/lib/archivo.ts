import type { Licencia } from '../types';
import { buscarTipo } from './catalogo';
import { bd } from './db';

function limpiar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Primera letra del apellido en mayúscula, o "_" si no hay apellido. */
export function inicialApellido(apellido: string): string {
  const l = limpiar(apellido).charAt(0).toUpperCase();
  return l || '_';
}

/** Ej.: G_Gomez_Juan-Pablo_art10-corto-tratamiento_2026-10-22.pdf (el prefijo permite filtrar por letra). */
export function nombreArchivo(l: Licencia, sufijo = ''): string {
  const tipo = buscarTipo(l.tipoId);
  const t = tipo ? `art${tipo.articulo}${tipo.inciso}-${limpiar(tipo.nombre).slice(0, 30).toLowerCase()}` : 'licencia';
  const partes = [
    inicialApellido(l.docente.apellido),
    limpiar(l.docente.apellido) || 'SinApellido',
    limpiar(l.docente.nombres) || 'SinNombre',
    t,
    l.desde || l.actualizadaEn.slice(0, 10),
  ];
  return partes.join('_') + (sufijo ? `_${limpiar(sufijo).toLowerCase()}` : '') + '.pdf';
}

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission(o: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(o: { mode: 'readwrite' }): Promise<PermissionState>;
};

export function carpetaSoportada(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function carpetaElegida(): Promise<string | null> {
  const h = (await bd.meta.get('carpeta'))?.v as DirHandle | undefined;
  return h?.name ?? null;
}

/** Pide al docente que elija (o cree) la carpeta "Mis licencias". Solo en navegadores de escritorio compatibles. */
export async function elegirCarpeta(): Promise<string | null> {
  if (!carpetaSoportada()) return null;
  const h = await (window as unknown as { showDirectoryPicker(o: object): Promise<DirHandle> }).showDirectoryPicker({
    id: 'mis-licencias',
    mode: 'readwrite',
    startIn: 'documents',
  });
  await bd.meta.put({ k: 'carpeta', v: h });
  return h.name;
}

function descargar(bytes: Uint8Array, nombre: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Guarda en la carpeta "Mis licencias" si hay una elegida; si no, descarga el archivo con el mismo nombre. */
export async function guardarPDF(bytes: Uint8Array, nombre: string): Promise<'carpeta' | 'descarga'> {
  try {
    const h = (await bd.meta.get('carpeta'))?.v as DirHandle | undefined;
    if (h) {
      let permiso = await h.queryPermission({ mode: 'readwrite' });
      if (permiso !== 'granted') permiso = await h.requestPermission({ mode: 'readwrite' });
      if (permiso === 'granted') {
        const f = await h.getFileHandle(nombre, { create: true });
        const w = await f.createWritable();
        await w.write(bytes as BlobPart);
        await w.close();
        return 'carpeta';
      }
    }
  } catch {
    /* si falla la carpeta, se descarga normalmente */
  }
  descargar(bytes, nombre);
  return 'descarga';
}
