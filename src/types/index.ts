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
}

export interface Docente {
  apellido: string;
  nombres: string;
  dni: string;
  domicilio: string;
  escuela: string;
  cargo: string;
}

export interface Adjunto {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf';
  mime: string;
  /** Contenido en base64 (sin prefijo data:). */
  datos: string;
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
}

export const DOCENTE_VACIO: Docente = { apellido: '', nombres: '', dni: '', domicilio: '', escuela: '', cargo: '' };

export function licenciaNueva(docente: Docente = DOCENTE_VACIO): Licencia {
  const ahora = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    creadaEn: ahora,
    actualizadaEn: ahora,
    estado: 'borrador',
    paso: 1,
    tipoId: '',
    docente: { ...docente },
    desde: '',
    hasta: '',
    dias: null,
    motivo: '',
    observaciones: '',
    adjuntos: [],
  };
}
