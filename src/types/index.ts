export interface GuiaSesop {
  /** true si la licencia necesita código de inasistencia del SESOP (Dcto. 1543/1, art. 3). */
  codigo: boolean;
  pasos: string[];
  fuente: string;
}

export interface LicenciaCatalogo {
  id: string;
  articulo: string;
  inciso: string;
  nombre: string;
  duracion: string;
  goce: string;
  requisitos: string[];
  documentacion: string[];
  plazoPresentacion: string;
  fuente: string;
  verificado: boolean;
  notas: string;
  sesop?: GuiaSesop;
}

export interface Plaza {
  idPlaza: string;
  turno: string;
  cursoDiv: string;
}

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface Docente {
  apellido: string;
  nombres: string;
  dni: string;
  domicilio: string;
  escuela: string;
  cargo: string;
  cue: string;
  legajo: string;
  /** Plazas afectadas del establecimiento (el parte admite hasta 16). */
  plazas: Plaza[];
  /** Horas de obligaciones a cumplir por día. */
  horas: Record<DiaSemana, string>;
}

export interface Adjunto {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf';
  mime: string;
  /** Contenido en base64 (sin prefijo data:). */
  datos: string;
}

export interface SeguimientoSesop {
  avisoEscuela: boolean;
  concurrioPrimerDia: boolean;
  certificadoOk: boolean;
}

export interface Licencia {
  id: string;
  creadaEn: string;
  actualizadaEn: string;
  estado: 'borrador' | 'final';
  paso: number;
  tipoId: string;
  docente: Docente;
  desde: string;
  hasta: string;
  dias: number | null;
  motivo: string;
  observaciones: string;
  adjuntos: Adjunto[];
  /** Código de inasistencia del SESOP. */
  codigoSesop: string;
  sesop: SeguimientoSesop;
  /** Cantidad de originales del parte a imprimir. */
  copias: number;
}

export const MAX_PLAZAS = 16;

export const DOCENTE_VACIO: Docente = {
  apellido: '',
  nombres: '',
  dni: '',
  domicilio: '',
  escuela: '',
  cargo: '',
  cue: '',
  legajo: '',
  plazas: [],
  horas: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '' },
};

/** Completa con valores por defecto los datos guardados por versiones anteriores de la app. */
export function normalizarDocente(d: Partial<Docente> | undefined): Docente {
  return {
    ...DOCENTE_VACIO,
    ...d,
    plazas: Array.isArray(d?.plazas) ? d.plazas : [],
    horas: { ...DOCENTE_VACIO.horas, ...(d?.horas ?? {}) },
  };
}

export function normalizarLicencia(l: Licencia): Licencia {
  return {
    ...l,
    docente: normalizarDocente(l.docente),
    codigoSesop: l.codigoSesop ?? '',
    sesop: Object.assign({ avisoEscuela: false, concurrioPrimerDia: false, certificadoOk: false }, l.sesop),
    copias: l.copias ?? 1,
  };
}

export function licenciaNueva(docente: Docente = DOCENTE_VACIO): Licencia {
  const ahora = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    creadaEn: ahora,
    actualizadaEn: ahora,
    estado: 'borrador',
    paso: 1,
    tipoId: '',
    docente: normalizarDocente(structuredClone(docente)),
    desde: '',
    hasta: '',
    dias: null,
    motivo: '',
    observaciones: '',
    adjuntos: [],
    codigoSesop: '',
    sesop: { avisoEscuela: false, concurrioPrimerDia: false, certificadoOk: false },
    copias: 1,
  };
}
