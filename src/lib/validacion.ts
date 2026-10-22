import type { Docente, Licencia, LicenciaCatalogo } from '../types';
import { calcularDias } from './dias';

export type Errores = Record<string, string>;

export function validarDocente(d: Docente): Errores {
  const e: Errores = {};
  if (!d.apellido.trim()) e.apellido = 'Escribí tu apellido.';
  if (!d.nombres.trim()) e.nombres = 'Escribí tu nombre.';
  const dni = d.dni.replace(/\D/g, '');
  if (!dni) e.dni = 'Escribí tu DNI.';
  else if (dni.length < 7 || dni.length > 8) e.dni = 'El DNI debe tener 7 u 8 números.';
  return e;
}

export function validarDetalles(l: Pick<Licencia, 'desde' | 'hasta'>): Errores {
  const e: Errores = {};
  if (!l.desde) e.desde = 'Elegí la fecha de inicio.';
  if (!l.hasta) e.hasta = 'Elegí la fecha de fin.';
  if (l.desde && l.hasta && calcularDias(l.desde, l.hasta) === null) e.hasta = 'La fecha de fin no puede ser anterior al inicio.';
  return e;
}

/** Campos obligatorios para poder generar el parte, según el tipo elegido. */
export function validarLicencia(l: Licencia, tipo: LicenciaCatalogo | undefined): Errores {
  const e: Errores = { ...validarDocente(l.docente), ...validarDetalles(l) };
  if (!tipo) e.tipoId = 'Elegí un tipo de licencia.';
  return e;
}

/** Avisos no bloqueantes para la pantalla de revisión. */
export function advertencias(l: Licencia, tipo: LicenciaCatalogo | undefined): string[] {
  const a: string[] = [];
  if (!tipo) return a;
  if (tipo.documentacion.length > 0 && l.adjuntos.length === 0) {
    a.push(`Este tipo de licencia pide documentación (${tipo.documentacion.join('; ')}) y todavía no adjuntaste nada.`);
  }
  if (!tipo.verificado) a.push('Verificar en Mesa de Entradas antes de presentar.');
  return a;
}
