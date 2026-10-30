/**
 * Árbol de preguntas de la guía "¿Qué licencia me corresponde?".
 * Solo ordena las licencias del catálogo por situación: la información sale de licencias.json.
 */
export interface OpcionGuia {
  texto: string;
  ayuda?: string;
  /** Siguiente pregunta. */
  ir?: string;
  /** Licencias que se proponen (ids del catálogo). */
  licencias?: string[];
  /** Aclaración para el resultado. */
  nota?: string;
}

export interface PreguntaGuia {
  titulo: string;
  opciones: OpcionGuia[];
}

export const GUIA: Record<string, PreguntaGuia> = {
  inicio: {
    titulo: '¿Qué te pasó o qué necesitás?',
    opciones: [
      { texto: 'Estoy enfermo/a o me tengo que operar', ir: 'enfermedad' },
      { texto: 'Tuve un accidente', ir: 'accidente' },
      { texto: 'Embarazo, nacimiento o adopción', ir: 'familia' },
      { texto: 'Tengo que cuidar a un familiar', ir: 'cuidado' },
      { texto: 'Falleció un familiar', licencias: ['duelo'] },
      { texto: 'Me caso', licencias: ['matrimonio', 'matrimonio-suplentes', 'franq-prematrimonial'] },
      { texto: 'Rindo, me capacito o integro una mesa', ir: 'estudio' },
      { texto: 'No puedo ir por un trámite, citación, clima o una donación', ir: 'franquicia' },
      { texto: 'Necesito tiempo por motivos personales', licencias: ['franq-particular', 'razones-particulares'] },
      { texto: 'Voy a ocupar otro cargo o función', ir: 'cargo' },
      { texto: 'Vacaciones de verano o invierno', licencias: ['anual-ordinaria'] },
    ],
  },
  enfermedad: {
    titulo: '¿Cómo es tu problema de salud?',
    opciones: [
      {
        texto: 'Algo común o una operación menor',
        ayuda: 'Gripe, una lesión, una cirugía menor: hasta unos 30 días al año.',
        licencias: ['corto-tratamiento', 'corto-tratamiento-suplentes'],
      },
      {
        texto: 'Un tratamiento largo',
        ayuda: 'Una afección de larga evolución que te impide trabajar, a criterio del SESOP.',
        licencias: ['largo-tratamiento'],
        nota: 'No hace falta agotar antes los 30 días de corto tratamiento.',
      },
      {
        texto: 'El SESOP me dijo que es crítica o irreversible',
        licencias: ['enfermedad-critica'],
      },
      {
        texto: 'Me descompuse en la escuela',
        licencias: ['corto-tratamiento', 'corto-tratamiento-suplentes'],
        nota: 'Art. 10 inc. b: si trabajaste menos de media jornada, cuenta como corto tratamiento; si trabajaste más, tenés permiso de salida sin reponer horas.',
      },
    ],
  },
  accidente: {
    titulo: '¿Dónde fue el accidente?',
    opciones: [
      {
        texto: 'En la escuela o yendo o volviendo del trabajo',
        licencias: ['accidente-trabajo', 'accidente-trabajo-suplentes'],
        nota: 'Si fue en la vía pública, hacé la denuncia policial.',
      },
      {
        texto: 'En otro lado',
        licencias: ['corto-tratamiento', 'corto-tratamiento-suplentes', 'largo-tratamiento'],
        nota: 'Un accidente común se trata como enfermedad: la licencia depende del tiempo de recuperación.',
      },
    ],
  },
  familia: {
    titulo: '¿Cuál es tu caso?',
    opciones: [
      { texto: 'Estoy embarazada o tuve a mi bebé', licencias: ['maternidad'] },
      { texto: 'Soy el otro responsable parental', ayuda: 'Nació tu hijo o hija y no gestaste.', licencias: ['nacimiento-hijo', 'nacimiento-hijo-suplentes'] },
      { texto: 'Estoy amamantando', licencias: ['lactancia'] },
      { texto: 'Terminó mi licencia y necesito más tiempo', licencias: ['excedencia-maternidad'] },
      { texto: 'Me dieron una guarda con fines de adopción', licencias: ['adopcion', 'adopcion-suplentes'] },
    ],
  },
  cuidado: {
    titulo: '¿A quién tenés que cuidar?',
    opciones: [
      { texto: 'Un familiar enfermo a mi cargo', licencias: ['familiar-enfermo'] },
      { texto: 'Un familiar con discapacidad', licencias: ['familiar-discapacitado', 'permiso-ley-9254'] },
    ],
  },
  estudio: {
    titulo: '¿Qué vas a hacer?',
    opciones: [
      { texto: 'Rendir un examen final', ayuda: 'En enseñanza superior o universitaria.', licencias: ['examen-final'] },
      { texto: 'Integrar una mesa examinadora o un jurado', licencias: ['mesa-examinadora'] },
      { texto: 'Ir a un congreso, simposio o curso', licencias: ['congreso-pedagogico'] },
      { texto: 'Hacer una beca o un estudio largo', licencias: ['perfeccionamiento'] },
    ],
  },
  franquicia: {
    titulo: '¿Qué pasó?',
    opciones: [
      { texto: 'Temporal u otro caso de fuerza mayor', licencias: ['franq-meteorologico'] },
      { texto: 'Doné sangre', licencias: ['franq-sangre'] },
      { texto: 'Me citó un juzgado o una autoridad', licencias: ['franq-citacion'] },
      { texto: 'La escuela me apartó por posible contagio', licencias: ['franq-profilaxis'] },
      { texto: 'Doné un órgano o piel', licencias: ['donacion-organos'] },
    ],
  },
  cargo: {
    titulo: '¿Qué vas a hacer?',
    opciones: [
      { texto: 'Un cargo de mayor jerarquía sin estabilidad', licencias: ['cargo-mayor-jerarquia'] },
      { texto: 'Un cargo electivo o político', licencias: ['cargo-electivo'] },
      { texto: 'Un cargo gremial', licencias: ['gremial'] },
      { texto: 'Acompañar a mi cónyuge en una misión oficial', licencias: ['conyuge-mision-oficial'] },
      { texto: 'Actividades deportivas no rentadas', licencias: ['deportiva'] },
    ],
  },
};
