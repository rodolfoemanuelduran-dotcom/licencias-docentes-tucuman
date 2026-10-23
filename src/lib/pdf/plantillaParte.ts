import { StandardFonts, rgb, type PDFDocument, type PDFFont, type PDFPage } from 'pdf-lib';
import type { DiaSemana, Plaza } from '../../types';

/**
 * Plantilla del "Parte de Licencias".
 * Reproduce la estructura de campos del formulario de la Dirección de Novedades Salariales
 * (sin logos ni elementos institucionales). Para cambiarla, reemplazar solo este archivo
 * respetando el contrato `dibujarParte`: generarPDF y los adjuntos no dependen del dibujo.
 */
export interface DatosParte {
  cue: string;
  establecimiento: string;
  dni: string;
  apellidoNombre: string;
  legajo: string;
  plazas: Plaza[];
  inicio: string;
  fin: string;
  codigo: string;
  articulo: string;
  horas: Record<DiaSemana, string>;
  tipo: string;
  /** Firma del agente: PNG en base64 (sin prefijo) o vacío. */
  firma: string;
}

const LEYENDA = 'Documento generado por herramienta independiente. Verificar con el formulario oficial.';
const A4: [number, number] = [595.28, 841.89];
const M = 22;
const ANCHO = A4[0] - M * 2;
const NEGRO = rgb(0, 0, 0);
const GRIS = rgb(0.35, 0.35, 0.35);
const BANDA = rgb(0.85, 0.85, 0.85);
/** Color de los datos que completa el docente, como si se escribieran con birome azul. */
export const AZUL = rgb(0.07, 0.2, 0.62);

/** Las fuentes estándar solo admiten Latin-1: se reemplaza lo demás para no romper la generación. */
export function aLatin1(s: string): string {
  return s.replace(/[\r\t]/g, ' ').replace(/[^\n\x20-\x7E -ÿ]/g, '?');
}

interface Lienzo {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  /** Letra distinta para los datos cargados por el docente. */
  dato: PDFFont;
}

/** Coordenadas desde arriba a la izquierda, como se lee el formulario. */
function caja(c: Lienzo, x: number, y: number, w: number, h: number, relleno?: ReturnType<typeof rgb>) {
  c.page.drawRectangle({ x, y: A4[1] - y - h, width: w, height: h, borderColor: NEGRO, borderWidth: 0.6, color: relleno });
}

function texto(c: Lienzo, s: string, x: number, y: number, size = 7.5, negrita = false, color = NEGRO) {
  c.page.drawText(aLatin1(s), { x, y: A4[1] - y - size, size, font: negrita ? c.bold : c.font, color });
}

/** Escribe `s` dentro de una caja, achicando la letra si no entra. */
function valor(c: Lienzo, s: string, x: number, y: number, w: number, h: number) {
  if (!s) return;
  let size = 9.5;
  const limpio = aLatin1(s);
  while (size > 5 && c.dato.widthOfTextAtSize(limpio, size) > w - 4) size -= 0.5;
  let t = limpio;
  while (t.length > 1 && c.dato.widthOfTextAtSize(t, size) > w - 4) t = t.slice(0, -1);
  c.page.drawText(t, { x: x + 2, y: A4[1] - y - h + (h - size) / 2 + 1, size, font: c.dato, color: AZUL });
}

function centrado(c: Lienzo, s: string, x: number, y: number, w: number, size = 7.5, negrita = false) {
  const f = negrita ? c.bold : c.font;
  const t = aLatin1(s);
  texto(c, t, x + (w - f.widthOfTextAtSize(t, size)) / 2, y, size, negrita);
}

function banda(c: Lienzo, s: string, y: number) {
  caja(c, M, y, ANCHO, 14, BANDA);
  centrado(c, s, M, y + 3.5, ANCHO, 8.5, true);
}

function casilla(c: Lienzo, x: number, y: number) {
  caja(c, x, y, 9, 9);
}

export async function dibujarParte(doc: PDFDocument, d: DatosParte): Promise<PDFPage> {
  const page = doc.addPage(A4);
  const c: Lienzo = {
    page,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    dato: await doc.embedFont(StandardFonts.CourierBold),
  };

  // Encabezado
  caja(c, M, M, ANCHO, A4[1] - M * 2 - 26);
  texto(c, 'PARTE DE LICENCIAS', M + 8, M + 8, 13, true);
  texto(c, 'Herramienta independiente, no oficial', M + ANCHO - 150, M + 11, 7, false, GRIS);

  let y = M + 28;
  banda(c, 'INFORMACIÓN A LLENAR POR EL ESTABLECIMIENTO', y);
  y += 20;

  texto(c, 'CUE:', M + 4, y + 3);
  caja(c, M + 26, y, 90, 14);
  valor(c, d.cue, M + 26, y, 90, 14);
  texto(c, 'Nombre del Establecimiento:', M + 130, y + 3);
  caja(c, M + 238, y, ANCHO - 242, 14);
  valor(c, d.establecimiento, M + 238, y, ANCHO - 242, 14);
  y += 22;

  texto(c, 'DNI:', M + 4, y + 3);
  caja(c, M + 26, y, 90, 14);
  valor(c, d.dni, M + 26, y, 90, 14);
  texto(c, 'Apellido y Nombre:', M + 130, y + 3);
  caja(c, M + 202, y, 210, 14);
  valor(c, d.apellidoNombre, M + 202, y, 210, 14);
  texto(c, 'Nro. de Legajo:', M + 420, y + 3);
  caja(c, M + 478, y, ANCHO - 482, 14);
  valor(c, d.legajo, M + 478, y, ANCHO - 482, 14);
  y += 20;

  texto(c, 'Plazas Afectadas: (todas las que sean del Establecimiento)', M + 4, y, 7);
  y += 11;
  const col = ANCHO / 2;
  for (let i = 0; i < 8; i++) {
    for (let k = 0; k < 2; k++) {
      const n = i + k * 8;
      const p = d.plazas[n];
      const x = M + 4 + k * col;
      const fy = y + i * 15;
      texto(c, `IDPLAZA ${n + 1}`, x, fy + 3, 6.8);
      caja(c, x + 41, fy, 80, 13);
      valor(c, p?.idPlaza ?? '', x + 41, fy, 80, 13);
      texto(c, 'TURNO', x + 125, fy + 3, 6.8);
      caja(c, x + 152, fy, 25, 13);
      valor(c, p?.turno ?? '', x + 152, fy, 25, 13);
      texto(c, 'CURSO/DIV', x + 180, fy + 3, 6.8);
      caja(c, x + 221, fy, 47, 13);
      valor(c, p?.cursoDiv ?? '', x + 221, fy, 47, 13);
    }
  }
  page.drawLine({ start: { x: M + col, y: A4[1] - y + 2 }, end: { x: M + col, y: A4[1] - y - 8 * 15 }, thickness: 0.6, color: NEGRO });
  y += 8 * 15 + 8;

  // Inicio / recepción / obligaciones
  const tercio = ANCHO / 3;
  const altoBloque = 190;
  for (let k = 0; k < 3; k++) caja(c, M + k * tercio, y, tercio, altoBloque);
  const titulos = ['INICIO / FIN DE LICENCIA / INASIST.', 'FECHA DE RECEPCIÓN', 'CANTIDAD DE OBLIGACIONES A CUMPLIR'];
  titulos.forEach((t, k) => {
    caja(c, M + k * tercio, y, tercio, 14);
    centrado(c, t, M + k * tercio, y + 4, tercio, 7, true);
  });
  let by = y + 24;
  texto(c, 'Fecha de inicio:', M + 6, by + 3);
  caja(c, M + 70, by, 100, 14);
  valor(c, d.inicio, M + 70, by, 100, 14);
  by += 22;
  texto(c, 'Fecha de fin:', M + 6, by + 3);
  caja(c, M + 70, by, 100, 14);
  valor(c, d.fin, M + 70, by, 100, 14);
  by += 22;
  texto(c, 'Código:', M + 6, by + 3);
  caja(c, M + 36, by, 82, 14);
  valor(c, d.codigo, M + 36, by, 82, 14);
  texto(c, 'Art.:', M + 124, by + 3);
  caja(c, M + 144, by, 38, 14);
  valor(c, d.articulo, M + 144, by, 38, 14);
  by += 22;
  if (d.tipo) {
    const lineas = partir(c.dato, `(${d.tipo})`, 6.5, tercio - 12).slice(0, 3);
    lineas.forEach((l, i) => c.page.drawText(l, { x: M + 6, y: A4[1] - by - i * 8 - 6.5, size: 6.5, font: c.dato, color: AZUL }));
  }
  const yFirma = y + altoBloque - 22;
  if (d.firma) {
    try {
      const img = await doc.embedPng(Uint8Array.from(atob(d.firma), (ch) => ch.charCodeAt(0)));
      const maxW = tercio - 44;
      const maxH = 42;
      const k = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * k;
      const h = img.height * k;
      page.drawImage(img, { x: M + (tercio - w) / 2, y: A4[1] - yFirma + 1, width: w, height: h });
    } catch {
      /* si la imagen está dañada, el parte sale sin firma */
    }
  }
  page.drawLine({ start: { x: M + 20, y: A4[1] - yFirma }, end: { x: M + tercio - 20, y: A4[1] - yFirma }, thickness: 0.5, color: NEGRO });
  centrado(c, 'Conformidad del Agente', M, yFirma + 4, tercio, 7);

  const capRecep = ['Fecha de Recepción de la documentación en el', 'establecimiento (Firma y sello del Director)'];
  capRecep.forEach((l, i) => centrado(c, l, M + tercio, y + altoBloque - 24 + i * 9, tercio, 6.5));

  const dias: [DiaSemana, string][] = [
    ['lunes', 'Lunes:'],
    ['martes', 'Martes:'],
    ['miercoles', 'Miércoles:'],
    ['jueves', 'Jueves:'],
    ['viernes', 'Viernes:'],
  ];
  dias.forEach(([k, et], i) => {
    const fy = y + 24 + i * 24;
    const x = M + tercio * 2 + 16;
    texto(c, et, x, fy + 3);
    caja(c, x + 54, fy, 34, 15);
    valor(c, d.horas[k], x + 54, fy, 34, 15);
    texto(c, 'horas', x + 94, fy + 3);
  });
  const capObl = ['La cantidad de obligaciones a cumplir deben ser', 'detalladas en TODOS los casos'];
  capObl.forEach((l, i) => centrado(c, l, M + tercio * 2, y + altoBloque - 24 + i * 9, tercio, 6.5));
  y += altoBloque + 6;

  // División Licencias (en blanco, lo completa la administración)
  banda(c, 'INFORMACIÓN A LLENAR POR DIVISIÓN LICENCIAS', y);
  y += 22;
  texto(c, 'Las siguientes observaciones implican inasistencias injustificadas', M + 14, y, 7.5);
  y += 14;
  const obs = [
    'Documentación presentada fuera de término (Dcto 505/14 Art 54 Inc. b): Fecha de presentación ___/___/_____',
    'El certificado no corresponde al centro asistencial más cercano al domicilio del agente (Dcto 1543/1 Art 3 Inc. b)',
    'Falta sello del centro asistencial (Dcto 1543/1 Art 3 Inc. b)',
    'Sin código de inasistencia de SESOP (Dcto 1543/1 Art 3 Inc. a): Día de comienzo del certificado ___/___/_____, Cantidad de días ____',
    'Documentación presuntamente adulterada. Campo presuntamente adulterado: ______________________________',
    'Otros: ________________________________________________________________',
  ];
  for (const o of obs) {
    casilla(c, M + 16, y);
    const ls = partir(c.font, o, 7.2, ANCHO - 52);
    ls.forEach((l, i) => texto(c, l, M + 32, y + 1 + i * 9, 7.2));
    y += Math.max(16, ls.length * 9 + 7);
  }
  y += 4;
  texto(c, 'Para constancia de lo antes observado firma el responsable de la presentación de las licencias del establecimiento', M + 14, y, 7);
  y += 34;
  page.drawLine({ start: { x: M + 60, y: A4[1] - y }, end: { x: M + 230, y: A4[1] - y }, thickness: 0.5, color: NEGRO, dashArray: [2, 2] });
  page.drawLine({ start: { x: M + 320, y: A4[1] - y }, end: { x: M + 490, y: A4[1] - y }, thickness: 0.5, color: NEGRO, dashArray: [2, 2] });
  centrado(c, 'Firma del responsable del establecimiento', M + 60, y + 4, 170, 6.5);
  centrado(c, 'Aclaración del responsable del establecimiento', M + 320, y + 4, 170, 6.5);
  y += 18;

  const fondo = A4[1] - M - 26;
  caja(c, M, y, ANCHO * 0.36, fondo - y);
  caja(c, M + ANCHO * 0.36, y, ANCHO * 0.64, fondo - y);
  texto(c, 'Fecha / Firma y Sello Licencias', M + 4, fondo - 12, 6.5);
  texto(c, 'Observaciones:', M + ANCHO * 0.36 + 4, y + 4, 7);

  centrado(c, 'El presente documento tiene carácter de Declaración Jurada', M, fondo + 4, ANCHO, 7);
  centrado(c, LEYENDA, M, fondo + 14, ANCHO, 6.5);
  return page;
}

function partir(font: PDFFont, s: string, size: number, ancho: number): string[] {
  const out: string[] = [];
  let actual = '';
  for (const p of aLatin1(s).split(' ')) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (font.widthOfTextAtSize(prueba, size) > ancho && actual) {
      out.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) out.push(actual);
  return out;
}
