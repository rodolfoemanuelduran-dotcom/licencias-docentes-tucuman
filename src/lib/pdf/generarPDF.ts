import { PDFDocument } from 'pdf-lib';
import { escuelaNueva, escuelasDeLicencia, normalizarLicencia, ordenarAdjuntos, type Adjunto, type Escuela, type Licencia } from '../../types';
import { buscarTipo } from '../catalogo';
import { formatearFecha } from '../dias';
import { agregarAdjuntos } from './adjuntos';
import { dibujarParte, type DatosParte } from './plantillaParte';

/** Texto corto para la casilla "Art." del parte: 10 a, 38 b, L9254… */
export function articuloCorto(articulo: string, inciso: string): string {
  if (articulo.startsWith('Ley')) return 'L' + articulo.replace(/\D/g, '');
  return `${articulo}${inciso ? ' ' + inciso.split(' ')[0] : ''}`;
}

/** Datos de un parte para una escuela. Sin escuela, sus casillas quedan en blanco para que las complete la dirección. */
export function datosDelParte(entrada: Licencia, escuela?: Escuela): DatosParte {
  const l = normalizarLicencia(entrada);
  const e = escuela ?? escuelasDeLicencia(l)[0] ?? escuelaNueva();
  const tipo = buscarTipo(l.tipoId);
  return {
    cue: e.cue,
    establecimiento: e.nombre,
    dni: l.docente.dni,
    apellidoNombre: `${l.docente.apellido}, ${l.docente.nombres}`.replace(/^, |, $/g, ''),
    legajo: e.legajo,
    plazas: e.plazas,
    inicio: formatearFecha(l.desde),
    fin: formatearFecha(l.hasta),
    codigo: l.codigoSesop,
    articulo: tipo ? articuloCorto(tipo.articulo, tipo.inciso) : '',
    horas: e.horas,
    tipo: tipo?.nombre ?? '',
    firma: l.docente.firma,
  };
}

async function nuevoDocumento(titulo: string): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  doc.setTitle(titulo);
  doc.setProducer('Licencias Docentes Tucumán (herramienta independiente)');
  return doc;
}

async function dibujarPartes(doc: PDFDocument, l: Licencia, e: Escuela | undefined): Promise<void> {
  const datos = datosDelParte(l, e);
  const copias = Math.min(3, Math.max(1, l.copias || 1));
  for (let i = 0; i < copias; i++) await dibujarParte(doc, datos);
}

/** PDF con el parte de una escuela, repetido según los originales pedidos. */
export async function generarParte(licencia: Licencia, escuela?: Escuela): Promise<Uint8Array> {
  const doc = await nuevoDocumento('Parte de Licencias');
  await dibujarPartes(doc, normalizarLicencia(licencia), escuela);
  return doc.save();
}

/** PDF con un grupo de adjuntos (por ejemplo, las fotos del certificado médico). */
export async function generarAdjuntos(adjuntos: Adjunto[], titulo: string): Promise<Uint8Array> {
  const doc = await nuevoDocumento(titulo);
  await agregarAdjuntos(doc, adjuntos);
  return doc.save();
}

/** Todo en un solo PDF: para la vista previa y para imprimir de una vez. */
export async function generarPDF(licencia: Licencia): Promise<Uint8Array> {
  const l = normalizarLicencia(licencia);
  const doc = await nuevoDocumento('Parte de Licencias');
  const escuelas = escuelasDeLicencia(l);
  for (const e of escuelas.length ? escuelas : [undefined]) await dibujarPartes(doc, l, e);
  await agregarAdjuntos(doc, ordenarAdjuntos(l.adjuntos));
  return doc.save();
}
