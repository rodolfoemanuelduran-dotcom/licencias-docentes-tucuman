import { PDFDocument } from 'pdf-lib';
import type { Licencia } from '../../types';
import { buscarTipo } from '../catalogo';
import { calcularDias, formatearFecha } from '../dias';
import { agregarAdjuntos } from './adjuntos';
import { dibujarParte, type DatosParte } from './plantillaParte';

export function datosDelParte(l: Licencia): DatosParte {
  const tipo = buscarTipo(l.tipoId);
  const dias = l.dias ?? calcularDias(l.desde, l.hasta);
  return {
    tipo: tipo?.nombre ?? '',
    referencia: tipo ? `Art. ${tipo.articulo}${tipo.inciso ? ` inc. ${tipo.inciso}` : ''} - ${tipo.fuente}` : '',
    duracionTipo: tipo?.duracion ?? '',
    goce: tipo?.goce ?? '',
    apellidoNombres: `${l.docente.apellido}, ${l.docente.nombres}`.trim(),
    dni: l.docente.dni,
    domicilio: l.docente.domicilio,
    escuela: l.docente.escuela,
    cargo: l.docente.cargo,
    desde: formatearFecha(l.desde),
    hasta: formatearFecha(l.hasta),
    dias: dias === null ? '-' : String(dias),
    motivo: l.motivo,
    observaciones: l.observaciones,
    adjuntos: l.adjuntos.map((a) => a.nombre),
    advertenciaNoVerificado: tipo ? !tipo.verificado : false,
    fechaEmision: formatearFecha(new Date().toISOString().slice(0, 10)),
  };
}

export async function generarPDF(licencia: Licencia): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Parte de solicitud de licencia');
  doc.setProducer('Licencias Docentes Tucumán (herramienta independiente)');
  await dibujarParte(doc, datosDelParte(licencia));
  await agregarAdjuntos(doc, licencia.adjuntos);
  return doc.save();
}
