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
  /** Quién concede la licencia (art. 57). */
  concede?: string;
  /** Situaciones de revista que pueden usarla (arts. 3, 37 y 38). */
  revista?: Revista[];
  /** Tope que se puede llevar en cuenta. */
  cupo?: Cupo;
  /** Días mínimos entre un uso y otro. */
  intervalo?: number;
  /** Años de antigüedad en el cargo que exige. */
  antiguedad?: number;
}

export type Revista = 'titular' | 'interino' | 'suplente' | 'contratado';

export interface Cupo {
  /** Licencias que comparten el mismo tope. */
  grupo: string;
  cantidad: number;
  unidad: 'corridos' | 'habiles';
  periodo: 'anio' | 'continuidad' | 'quinquenio' | 'sexenio';
  mensual?: number;
  luego?: string;
}

export interface Plaza {
  idPlaza: string;
  turno: string;
  cursoDiv: string;
}

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface Escuela {
  id: string;
  nombre: string;
  cue: string;
  legajo: string;
  cargo: string;
  /** Plazas afectadas en esta escuela (el parte admite hasta 16). */
  plazas: Plaza[];
  /** Horas de obligaciones a cumplir por día en esta escuela. */
  horas: Record<DiaSemana, string>;
  /** Escuela de mayor antigüedad: ahí se presenta el pedido (art. 54 inc. e). */
  principal: boolean;
  /** Situación de revista en esta escuela. */
  revista: Revista | '';
  /** Fecha de ingreso al cargo, para calcular antigüedad. */
  fechaIngreso: string;
}

export interface Docente {
  apellido: string;
  nombres: string;
  dni: string;
  domicilio: string;
  escuelas: Escuela[];
  /** Firma dibujada, PNG en base64 (sin prefijo). Vacío si no hay. */
  firma: string;
}

export type CategoriaAdjunto = 'certificado' | 'sesop' | 'otro';

export interface Adjunto {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf';
  mime: string;
  /** Contenido en base64 (sin prefijo data:). */
  datos: string;
  /** Casilla donde se cargó: certificado médico, código del SESOP u otro. */
  categoria?: CategoriaAdjunto;
}

const ORDEN_CATEGORIA: Record<CategoriaAdjunto, number> = { certificado: 0, sesop: 1, otro: 2 };

export const categoriaDe = (a: Adjunto): CategoriaAdjunto => a.categoria ?? 'otro';

/** Orden de los adjuntos en el PDF: certificado, código del SESOP y otros; dentro de cada casilla, el orden de carga. */
export function ordenarAdjuntos(adjuntos: Adjunto[]): Adjunto[] {
  return adjuntos.map((a, i) => ({ a, i })).sort((x, y) => ORDEN_CATEGORIA[categoriaDe(x.a)] - ORDEN_CATEGORIA[categoriaDe(y.a)] || x.i - y.i).map((x) => x.a);
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
  /** Escuelas afectadas por esta licencia: se imprime un parte por cada una. */
  escuelasIds: string[];
  desde: string;
  hasta: string;
  dias: number | null;
  motivo: string;
  observaciones: string;
  adjuntos: Adjunto[];
  /** Código de inasistencia del SESOP. */
  codigoSesop: string;
  sesop: SeguimientoSesop;
  /** Cantidad de originales del parte a imprimir (por escuela). */
  copias: number;
}

export const MAX_PLAZAS = 16;
export const MAX_ESCUELAS = 5;

const HORAS_VACIAS: Record<DiaSemana, string> = { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '' };

export function escuelaNueva(principal = false): Escuela {
  return { id: crypto.randomUUID(), nombre: '', cue: '', legajo: '', cargo: '', plazas: [], horas: { ...HORAS_VACIAS }, principal, revista: '', fechaIngreso: '' };
}

export const DOCENTE_VACIO: Docente = { apellido: '', nombres: '', dni: '', domicilio: '', escuelas: [], firma: '' };

function normalizarEscuela(e: Partial<Escuela>, i: number): Escuela {
  return {
    id: e.id || `escuela-${i + 1}`,
    nombre: e.nombre ?? '',
    cue: e.cue ?? '',
    legajo: e.legajo ?? '',
    cargo: e.cargo ?? '',
    plazas: Array.isArray(e.plazas) ? e.plazas : [],
    horas: { ...HORAS_VACIAS, ...(e.horas ?? {}) },
    principal: !!e.principal,
    revista: e.revista ?? '',
    fechaIngreso: e.fechaIngreso ?? '',
  };
}

type DocenteAnterior = Partial<Docente> & Partial<{ escuela: string; cargo: string; cue: string; legajo: string; plazas: Plaza[]; horas: Record<DiaSemana, string> }>;

/** Completa los datos guardados por versiones anteriores (una sola escuela en campos sueltos). */
export function normalizarDocente(d: DocenteAnterior | undefined): Docente {
  let escuelas: Escuela[];
  if (Array.isArray(d?.escuelas)) escuelas = d.escuelas.map(normalizarEscuela);
  else if (d && (d.escuela || d.cue || d.legajo || d.cargo || d.plazas?.length)) {
    escuelas = [normalizarEscuela({ id: 'escuela-1', nombre: d.escuela, cue: d.cue, legajo: d.legajo, cargo: d.cargo, plazas: d.plazas, horas: d.horas, principal: true }, 0)];
  } else escuelas = [];
  if (escuelas.length && !escuelas.some((e) => e.principal)) escuelas[0].principal = true;
  return {
    apellido: d?.apellido ?? '',
    nombres: d?.nombres ?? '',
    dni: d?.dni ?? '',
    domicilio: d?.domicilio ?? '',
    escuelas,
    firma: d?.firma ?? '',
  };
}

/** Por defecto, la licencia afecta a la escuela principal (o a la única que haya). */
export function escuelasPorDefecto(d: Docente): string[] {
  const p = d.escuelas.find((e) => e.principal) ?? d.escuelas[0];
  return p ? [p.id] : [];
}

export function normalizarLicencia(l: Licencia): Licencia {
  const docente = normalizarDocente(l.docente as DocenteAnterior);
  const ids = Array.isArray(l.escuelasIds) ? l.escuelasIds.filter((id) => docente.escuelas.some((e) => e.id === id)) : escuelasPorDefecto(docente);
  return {
    ...l,
    docente,
    escuelasIds: ids,
    codigoSesop: l.codigoSesop ?? '',
    sesop: Object.assign({ avisoEscuela: false, concurrioPrimerDia: false, certificadoOk: false }, l.sesop),
    copias: l.copias ?? 1,
  };
}

export function licenciaNueva(docente: Docente = DOCENTE_VACIO): Licencia {
  const ahora = new Date().toISOString();
  const d = normalizarDocente(structuredClone(docente));
  return {
    id: crypto.randomUUID(),
    creadaEn: ahora,
    actualizadaEn: ahora,
    estado: 'borrador',
    paso: 1,
    tipoId: '',
    docente: d,
    escuelasIds: escuelasPorDefecto(d),
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

/** Escuelas seleccionadas en la licencia, en el orden en que están cargadas. */
export function escuelasDeLicencia(l: Licencia): Escuela[] {
  return l.docente.escuelas.filter((e) => l.escuelasIds.includes(e.id));
}
