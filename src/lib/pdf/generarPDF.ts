import { PDFDocument } from 'pdf-lib';
import { normalizarLicencia, type Licencia } from '../../types';
import { buscarTipo } from '../catalogo';
import { formatearFecha } from '../dias';
import { agregarAdjuntos } from './adjuntos';
import { dibujarParte, type DatosParte } from './plantillaParte';

/** Texto corto para la casilla "Art." del parte: 10a, 23c, 9254… */
export function articuloCorto(articulo: string, inciso: string): string {
  if (articulo.startsWith('Ley')) return 'L' + articulo.replace(/\D/g, '');
  return `${articulo}${inciso ? ' ' + inciso : ''}`;
}

export function datosDelParte(entrada: Licencia): DatosParte {
  const l = normalizarLicencia(entrada);
  const tipo = buscarTipo(l.tipoId);
  return {
    cue: l.docente.cue,
    establecimiento: l.docente.escuela,
    dni: l.docente.dni,
    apellidoNombre: `${l.docente.apellido}, ${l.docente.nombres}`.replace(/^, |, $/g, ''),
    legajo: l.docente.legajo,
    plazas: l.docente.plazas,
    inicio: formatearFecha(l.desde),
    fin: formatearFecha(l.hasta),
    codigo: l.codigoSesop,
    articulo: tipo ? articuloCorto(tipo.articulo, tipo.inciso) : '',
    horas: l.docente.horas,
    tipo: tipo?.nombre ?? '',
  };
}

export async function generarPDF(licencia: Licencia): Promise<Uint8Array> {
  const l = normalizarLicencia(licencia);
  const doc = await PDFDocument.create();
  doc.setTitle('Parte de Licencias');
  doc.setProducer('Licencias Docentes Tucumán (herramienta independiente)');
  const datos = datosDelParte(l);
  const copias = Math.min(3, Math.max(1, l.copias || 1));
  for (let i = 0; i < copias; i++) await dibujarParte(doc, datos);
  await agregarAdjuntos(doc, l.adjuntos);
  return doc.save();
}
