import { PDFDocument } from 'pdf-lib';
import { escuelaNueva, escuelasDeLicencia, normalizarLicencia, type Escuela, type Licencia } from '../../types';
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

/** Un parte por cada escuela elegida (o uno en blanco si no hay), repetido según los originales pedidos, y luego los adjuntos. */
export async function generarPDF(licencia: Licencia): Promise<Uint8Array> {
  const l = normalizarLicencia(licencia);
  const doc = await PDFDocument.create();
  doc.setTitle('Parte de Licencias');
  doc.setProducer('Licencias Docentes Tucumán (herramienta independiente)');
  const escuelas = escuelasDeLicencia(l);
  const copias = Math.min(3, Math.max(1, l.copias || 1));
  for (const e of escuelas.length ? escuelas : [undefined]) {
    const datos = datosDelParte(l, e);
    for (let i = 0; i < copias; i++) await dibujarParte(doc, datos);
  }
  await agregarAdjuntos(doc, l.adjuntos);
  return doc.save();
}
