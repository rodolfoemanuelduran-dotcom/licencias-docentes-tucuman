import { StandardFonts, rgb, type PDFDocument, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * Plantilla del "Parte de solicitud de licencia".
 * Para usar el formulario oficial, reemplazar solo este archivo (mismo contrato `dibujarParte`):
 * generarPDF y los adjuntos no dependen de cómo se dibuje la primera página.
 */
export interface DatosParte {
  tipo: string;
  referencia: string;
  duracionTipo: string;
  goce: string;
  apellidoNombres: string;
  dni: string;
  domicilio: string;
  escuela: string;
  cargo: string;
  desde: string;
  hasta: string;
  dias: string;
  motivo: string;
  observaciones: string;
  adjuntos: string[];
  advertenciaNoVerificado: boolean;
  fechaEmision: string;
}

const LEYENDA = 'Documento generado por herramienta independiente. Verificar con el formulario oficial.';
const A4: [number, number] = [595.28, 841.89];
const MARGEN = 50;

/** Las fuentes estándar solo admiten Latin-1: se reemplaza lo demás para no romper la generación. */
export function aLatin1(s: string): string {
  return s.replace(/[\r\t]/g, ' ').replace(/[^\n\x20-\x7E -ÿ]/g, '?');
}

function partir(texto: string, font: PDFFont, size: number, ancho: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of aLatin1(texto).split('\n')) {
    let actual = '';
    for (const palabra of parrafo.split(' ')) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > ancho && actual) {
        lineas.push(actual);
        actual = palabra;
      } else actual = prueba;
    }
    lineas.push(actual);
  }
  return lineas;
}

export async function dibujarParte(doc: PDFDocument, d: DatosParte): Promise<PDFPage> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(A4);
  const ancho = A4[0] - MARGEN * 2;
  let y = A4[1] - MARGEN;
  const gris = rgb(0.35, 0.35, 0.35);

  const linea = (txt: string, o: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}) => {
    const size = o.size ?? 11;
    const f = o.f ?? font;
    for (const l of partir(txt, f, size, ancho)) {
      page.drawText(l, { x: MARGEN, y, size, font: f, color: o.color ?? rgb(0, 0, 0) });
      y -= size + 4;
    }
  };
  const campo = (etiqueta: string, valor: string) => {
    page.drawText(aLatin1(etiqueta), { x: MARGEN, y, size: 9, font: bold, color: gris });
    y -= 13;
    linea(valor || '-', { size: 11 });
    y -= 4;
  };

  linea('PARTE DE SOLICITUD DE LICENCIA', { size: 18, f: bold });
  linea('Herramienta independiente, no oficial', { size: 10, color: gris });
  y -= 6;
  page.drawLine({ start: { x: MARGEN, y }, end: { x: MARGEN + ancho, y }, thickness: 1, color: gris });
  y -= 18;

  campo('FECHA DE EMISIÓN', d.fechaEmision);
  campo('DOCENTE', d.apellidoNombres);
  campo('DNI', d.dni);
  campo('DOMICILIO', d.domicilio);
  campo('ESCUELA', d.escuela);
  campo('CARGO', d.cargo);
  y -= 6;
  campo('TIPO DE LICENCIA', d.tipo);
  campo('REFERENCIA NORMATIVA', d.referencia);
  campo('DURACIÓN SEGÚN NORMATIVA', d.duracionTipo);
  campo('GOCE DE HABERES', d.goce);
  campo('PERÍODO SOLICITADO', `Desde ${d.desde} hasta ${d.hasta} (${d.dias} días)`);
  if (d.motivo) campo('MOTIVO', d.motivo);
  if (d.observaciones) campo('OBSERVACIONES', d.observaciones);
  campo('DOCUMENTACIÓN ADJUNTA', d.adjuntos.length ? d.adjuntos.map((a, i) => `${i + 1}. ${a}`).join('\n') : 'Ninguna');

  if (d.advertenciaNoVerificado) {
    linea('Verificar en Mesa de Entradas antes de presentar.', { size: 10, f: bold });
  }

  const yFirma = 130;
  page.drawLine({ start: { x: MARGEN, y: yFirma }, end: { x: MARGEN + 220, y: yFirma }, thickness: 0.8, color: rgb(0, 0, 0) });
  page.drawText('Firma', { x: MARGEN, y: yFirma - 13, size: 9, font, color: gris });
  page.drawLine({ start: { x: MARGEN + 280, y: yFirma }, end: { x: MARGEN + ancho, y: yFirma }, thickness: 0.8, color: rgb(0, 0, 0) });
  page.drawText('Aclaración', { x: MARGEN + 280, y: yFirma - 13, size: 9, font, color: gris });

  page.drawText(LEYENDA, { x: MARGEN, y: 50, size: 8.5, font, color: gris });
  return page;
}
