import type { Docente, Licencia, LicenciaCatalogo } from '../types';
import { calcularDias } from './dias';
import { corresponde } from './saldos';

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
  if (tipo.sesop?.codigo && !(l.codigoSesop ?? '').trim() && !l.sesop?.concurrioPrimerDia) {
    a.push(
      'Falta el código de inasistencia del SESOP. Sin código (y sin haber ido al SESOP el primer día) la inasistencia puede tomarse como injustificada (Dcto. 1543/1, art. 3 inc. a).',
    );
  }
  if (tipo.sesop?.codigo) {
    const hay = (c: string) => l.adjuntos.some((x) => (x.categoria ?? 'otro') === c);
    if (!hay('certificado') && !l.sesop?.concurrioPrimerDia) a.push('Falta adjuntar el certificado médico.');
    if (!hay('sesop')) a.push('Falta adjuntar el código o la constancia del SESOP.');
  } else if (tipo.documentacion.length > 0 && l.adjuntos.length === 0) {
    a.push(`Este tipo de licencia pide documentación (${tipo.documentacion.join('; ')}) y todavía no adjuntaste nada.`);
  }
  const escuelas = l.docente.escuelas.filter((e) => l.escuelasIds.includes(e.id));
  const hoy = l.desde || new Date().toISOString().slice(0, 10);
  for (const e of escuelas) {
    const c = corresponde(tipo, e.revista, e.fechaIngreso, hoy);
    if (!c.corresponde) a.push(`Revisá esta licencia para ${e.nombre || 'tu escuela'}: ${c.motivo} Usar una licencia no prevista puede hacerte cesar en el cargo si no sos titular (art. 40).`);
  }
  if (!escuelas.length) {
    a.push('No elegiste ninguna escuela: el parte sale con el sector del establecimiento en blanco para que lo complete la dirección.');
  } else if (escuelas.some((e) => !e.cue.trim() || !e.plazas.length)) {
    a.push('El parte lleva CUE, número de legajo y plazas. Si no los cargás, quedan en blanco para que los complete la escuela.');
  }
  if (!l.docente.firma) a.push('Todavía no firmaste. Podés firmar en el paso de revisión o a mano después de imprimir.');
  if (!tipo.verificado) a.push('Verificar en Mesa de Entradas antes de presentar.');
  return a;
}
