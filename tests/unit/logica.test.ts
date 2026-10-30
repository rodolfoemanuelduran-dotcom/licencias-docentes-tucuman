import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { calcularDias, contarDias } from '../../src/lib/dias';
import { bytesDe, planArchivos } from '../../src/lib/acciones';
import { calcularSaldo, corresponde, saldosDisponibles } from '../../src/lib/saldos';
import { GUIA } from '../../src/lib/guia';
import { advertencias, validarDocente, validarLicencia } from '../../src/lib/validacion';
import { cifrar, derivarClave, descifrar, ITERACIONES, nuevaSal } from '../../src/lib/cripto';
import { articuloCorto, datosDelParte, generarPDF } from '../../src/lib/pdf/generarPDF';
import { inicialApellido, nombreArchivo } from '../../src/lib/archivo';
import { LICENCIAS, buscarTipo, coincide } from '../../src/lib/catalogo';
import { activarCifrado, bloquear, desbloquear, guardarRegistro, listarRegistros } from '../../src/lib/db';
import { escuelaNueva, escuelasPorDefecto, licenciaNueva, normalizarDocente, normalizarLicencia, ordenarAdjuntos, type Licencia } from '../../src/types';

const docente = normalizarDocente({ apellido: 'Gómez', nombres: 'Juan Pablo', dni: '30123456', domicilio: 'Calle 1', escuela: 'Esc. 1', cargo: 'Maestro' });
const base = (): Licencia => ({ ...licenciaNueva(docente), tipoId: 'corto-tratamiento', desde: '2026-10-05', hasta: '2026-10-09', dias: 5 });

describe('calcularDias', () => {
  it('cuenta ambos extremos', () => {
    expect(calcularDias('2026-10-05', '2026-10-05')).toBe(1);
    expect(calcularDias('2026-10-05', '2026-10-09')).toBe(5);
  });
  it('cruza meses y años bisiestos', () => {
    expect(calcularDias('2028-02-28', '2028-03-01')).toBe(3);
    expect(calcularDias('2026-12-30', '2027-01-02')).toBe(4);
  });
  it('devuelve null si falta, es inválida o el fin es anterior', () => {
    expect(calcularDias('', '2026-10-09')).toBeNull();
    expect(calcularDias('2026-02-30', '2026-03-02')).toBeNull();
    expect(calcularDias('2026-10-09', '2026-10-05')).toBeNull();
  });
});

describe('validación', () => {
  it('solo apellido, nombre y DNI son obligatorios del docente', () => {
    expect(Object.keys(validarDocente({ ...docente, domicilio: '', escuelas: [] }))).toEqual([]);
    expect(Object.keys(validarDocente({ ...docente, apellido: '', dni: '12' })).sort()).toEqual(['apellido', 'dni']);
  });
  it('exige tipo y fechas', () => {
    const e = validarLicencia({ ...base(), tipoId: '', desde: '' }, undefined);
    expect(e.tipoId).toBeTruthy();
    expect(e.desde).toBeTruthy();
  });
  it('advierte documentación faltante y registro no verificado', () => {
    const tipo = buscarTipo('corto-tratamiento')!;
    const a = advertencias(base(), tipo);
    expect(a).toContain('Falta adjuntar el certificado médico.');
    expect(advertencias(base(), buscarTipo('matrimonio')!).some((x) => x.includes('documentación'))).toBe(true);
    expect(a).not.toContain('Verificar en Mesa de Entradas antes de presentar.');
    expect(advertencias(base(), buscarTipo('cargo-mayor-jerarquia')!)).toContain('Verificar en Mesa de Entradas antes de presentar.');
  });
  it('no advierte documentación en tipos que no la piden', () => {
    const a = advertencias(base(), buscarTipo('anual-ordinaria')!);
    expect(a.some((x) => x.includes('documentación'))).toBe(false);
  });
});

describe('catálogo', () => {
  it('todos los registros tienen la forma pedida', () => {
    for (const l of LICENCIAS) {
      expect(typeof l.verificado).toBe('boolean');
      expect(Array.isArray(l.requisitos)).toBe(true);
      expect(Array.isArray(l.documentacion)).toBe(true);
      expect(l.fuente).toBeTruthy();
    }
    expect(new Set(LICENCIAS.map((l) => l.id)).size).toBe(LICENCIAS.length);
  });
});

describe('cifrado', () => {
  it('usa al menos 600.000 iteraciones', () => expect(ITERACIONES).toBeGreaterThanOrEqual(600_000));
  it('cifra y descifra; falla con clave incorrecta', async () => {
    const sal = nuevaSal();
    const k = await derivarClave('clave-correcta', sal);
    const sobre = await cifrar(k, { a: 'ñandú', n: 1 });
    expect(sobre.data).not.toContain('andú');
    expect(await descifrar(k, sobre)).toEqual({ a: 'ñandú', n: 1 });
    await expect(descifrar(await derivarClave('otra', sal), sobre)).rejects.toThrow();
  });
  it('la base guarda en claro por defecto y cifra al activar la contraseña', async () => {
    await guardarRegistro('licencia', 'x1', { dni: '111' });
    expect(await listarRegistros('licencia')).toEqual([{ dni: '111' }]);
    await activarCifrado('mi-clave-segura');
    const { bd } = await import('../../src/lib/db');
    expect(JSON.stringify(await bd.registros.toArray())).not.toContain('111');
    bloquear();
    await expect(desbloquear('mala')).rejects.toThrow('Contraseña incorrecta');
    await desbloquear('mi-clave-segura');
    expect(await listarRegistros('licencia')).toEqual([{ dni: '111' }]);
  });
});

describe('archivo y PDF', () => {
  it('el nombre empieza con la inicial del apellido', () => {
    expect(inicialApellido('Ñañez')).toBe('N');
    expect(inicialApellido('')).toBe('_');
    expect(nombreArchivo(base()).startsWith('G_Gomez_Juan-Pablo_')).toBe(true);
  });
  it('genera un PDF válido con el parte y respeta el orden de los adjuntos', async () => {
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
    const sub = await PDFDocument.create();
    sub.addPage();
    sub.addPage();
    const pdfB64 = Buffer.from(await sub.save()).toString('base64');
    const l = base();
    l.motivo = 'Motivo con ñ y emoji 😀';
    l.adjuntos = [
      { id: '1', nombre: 'foto.png', tipo: 'imagen', mime: 'image/png', datos: Buffer.from(png).toString('base64') },
      { id: '2', nombre: 'doc.pdf', tipo: 'pdf', mime: 'application/pdf', datos: pdfB64 },
    ];
    const bytes = await generarPDF(l);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1 + 1 + 2);
  });
});

describe('Parte de Licencias y SESOP', () => {
  it('imprime la cantidad de originales pedida y los adjuntos una sola vez', async () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const l = { ...base(), copias: 3, adjuntos: [{ id: '1', nombre: 'a.png', tipo: 'imagen' as const, mime: 'image/png', datos: png }] };
    expect((await PDFDocument.load(await generarPDF(l))).getPageCount()).toBe(4);
  });
  it('arma la casilla "Art." y los datos del parte', () => {
    expect(articuloCorto('10', 'a')).toBe('10 a');
    expect(articuloCorto('Ley 9254', 'art. 6')).toBe('L9254');
    const d = datosDelParte({ ...base(), codigoSesop: 'X123' });
    expect(d.codigo).toBe('X123');
    expect(d.articulo).toBe('10 a');
    expect(d.inicio).toBe('05/10/2026');
  });
  it('avisa si falta el código SESOP, salvo que haya ido el primer día', () => {
    const tipo = buscarTipo('corto-tratamiento')!;
    expect(advertencias(base(), tipo).some((a) => a.startsWith('Falta el código'))).toBe(true);
    const fue = { ...base(), sesop: { avisoEscuela: true, concurrioPrimerDia: true, certificadoOk: false } };
    expect(advertencias(fue, tipo).some((a) => a.startsWith('Falta el código'))).toBe(false);
    expect(advertencias(base(), buscarTipo('duelo')!).some((a) => a.startsWith('Falta el código'))).toBe(false);
  });
  it('completa los datos guardados por versiones anteriores', () => {
    const vieja = { ...base() } as Partial<Licencia>;
    delete vieja.codigoSesop;
    delete vieja.copias;
    const n = normalizarLicencia({ ...vieja, docente: { apellido: 'X' } } as unknown as Licencia);
    expect(n.copias).toBe(1);
    expect(n.codigoSesop).toBe('');
    expect(n.docente.escuelas).toEqual([]);
    expect(n.escuelasIds).toEqual([]);
  });
  it('la Ley 9254 reemplaza a la 5.806 y está verificada', () => {
    const t = buscarTipo('familiar-discapacitado')!;
    expect(t.articulo).toBe('Ley 9254');
    expect(t.verificado).toBe(true);
    expect(LICENCIAS.filter((l) => l.sesop).length).toBeGreaterThanOrEqual(7);
  });
});

describe('Varias escuelas, firma y art. 38', () => {
  const dosEscuelas = () => {
    const l = base();
    const a = { ...escuelaNueva(true), nombre: 'Escuela A', cue: '111', plazas: [{ idPlaza: '1', turno: 'M', cursoDiv: '1A' }] };
    const b = { ...escuelaNueva(), nombre: 'Escuela B', cue: '222' };
    l.docente = { ...l.docente, escuelas: [a, b] };
    l.escuelasIds = [a.id, b.id];
    return l;
  };
  it('arma un parte por escuela y por original, y después los adjuntos', async () => {
    const l = { ...dosEscuelas(), copias: 2 };
    expect((await PDFDocument.load(await generarPDF(l))).getPageCount()).toBe(4);
    const d = datosDelParte(l, l.docente.escuelas[1]);
    expect(d.establecimiento).toBe('Escuela B');
    expect(d.cue).toBe('222');
  });
  it('sin escuelas elegidas sale un parte con el sector en blanco', async () => {
    const l = { ...dosEscuelas(), escuelasIds: [] };
    expect((await PDFDocument.load(await generarPDF(l))).getPageCount()).toBe(1);
    expect(advertencias(l, buscarTipo('duelo')!).some((a) => a.startsWith('No elegiste'))).toBe(true);
  });
  it('convierte la escuela única de versiones anteriores en la lista de escuelas', () => {
    const d = normalizarDocente({ apellido: 'X', escuela: 'Esc. 5', cue: '9', plazas: [{ idPlaza: '7', turno: 'T', cursoDiv: '' }] } as never);
    expect(d.escuelas).toHaveLength(1);
    expect(d.escuelas[0]).toMatchObject({ nombre: 'Esc. 5', cue: '9', principal: true });
    expect(escuelasPorDefecto(d)).toEqual([d.escuelas[0].id]);
  });
  it('inserta la firma dibujada en el parte', async () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const l = base();
    l.docente = { ...l.docente, firma: png };
    const bytes = await generarPDF(l);
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Image');
    expect(advertencias(l, buscarTipo('duelo')!).some((a) => a.startsWith('Todavía no firmaste'))).toBe(false);
  });
  it('art. 38 b: 30 días con goce para suplentes, según el Decreto 500/5-2009', () => {
    const t = buscarTipo('corto-tratamiento-suplentes')!;
    expect(`${t.articulo}${t.inciso}`).toBe('38b');
    expect(t.verificado).toBe(true);
    expect(t.duracion).toContain('30 días');
    expect(t.fuente).toContain('500/5');
    expect(articuloCorto(t.articulo, t.inciso)).toBe('38 b');
    expect(t.sesop?.codigo).toBe(true);
  });
  it('art. 30 (cargo electivo) es sin goce, como dice el texto oficial', () => {
    expect(buscarTipo('cargo-electivo')!.goce).toMatch(/^Sin goce/);
    expect(LICENCIAS.filter((l) => l.verificado).length).toBeGreaterThanOrEqual(30);
  });
});

describe('Búsqueda y documentación de salud', () => {
  const ids = (q: string) => LICENCIAS.filter((l) => coincide(l, q)).map((l) => l.id);
  it('encuentra el art. 38 b escrito de varias formas', () => {
    for (const q of ['38b', '38 b', '38B', 'art 38 b', 'art. 38 inc. b', 'Artículo 38 inciso b']) expect(ids(q)).toEqual(['corto-tratamiento-suplentes']);
    expect(ids('38')).toEqual(expect.arrayContaining(['corto-tratamiento-suplentes', 'accidente-trabajo-suplentes', 'nacimiento-hijo-suplentes']));
    expect(ids('10 c')).toEqual(expect.arrayContaining(['largo-tratamiento', 'enfermedad-critica']));
    expect(ids('ley 9254').length).toBe(2);
    expect(ids('suplentes').length).toBeGreaterThanOrEqual(5);
    expect(ids('enfermedad')).toContain('corto-tratamiento');
  });
  it('ordena los adjuntos: certificado, código SESOP y otros', () => {
    const a = (id: string, categoria?: 'certificado' | 'sesop' | 'otro') => ({ id, nombre: id, tipo: 'imagen' as const, mime: 'image/png', datos: '', categoria });
    expect(ordenarAdjuntos([a('x'), a('s', 'sesop'), a('c1', 'certificado'), a('c2', 'certificado')]).map((x) => x.id)).toEqual(['c1', 'c2', 's', 'x']);
  });
  it('pide certificado y código del SESOP en las licencias de salud', () => {
    const tipo = buscarTipo('corto-tratamiento-suplentes')!;
    const l = base();
    expect(advertencias(l, tipo)).toEqual(expect.arrayContaining(['Falta adjuntar el certificado médico.', 'Falta adjuntar el código o la constancia del SESOP.']));
    l.adjuntos = [
      { id: '1', nombre: 'c', tipo: 'imagen', mime: 'image/png', datos: '', categoria: 'certificado' },
      { id: '2', nombre: 's', tipo: 'imagen', mime: 'image/png', datos: '', categoria: 'sesop' },
    ];
    expect(advertencias(l, tipo).some((x) => x.startsWith('Falta adjuntar'))).toBe(false);
  });
  it('art. 32 verificado y suplentes con los incisos e, f y h', () => {
    expect(buscarTipo('perfeccionamiento')!.verificado).toBe(true);
    expect(buscarTipo('nacimiento-hijo-suplentes')!.duracion).toBe('1 día hábil');
    expect(buscarTipo('matrimonio-suplentes')!.duracion).toBe('2 días hábiles');
    expect(buscarTipo('adopcion-suplentes')!.duracion).toBe('30 días corridos');
  });
});

describe('PDF separados, saldos y situación de revista', () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const adj = (id: string, categoria: 'certificado' | 'sesop' | 'otro') => ({ id, nombre: id, tipo: 'imagen' as const, mime: 'image/png', datos: png, categoria });
  const final = (tipoId: string, desde: string, hasta: string): Licencia => ({ ...base(), tipoId, desde, hasta, estado: 'final' });

  it('genera un PDF por escuela, otro con el certificado y otro con el código del SESOP', async () => {
    const l = base();
    const a = { ...escuelaNueva(true), nombre: 'Escuela A' };
    const b = { ...escuelaNueva(), nombre: 'Escuela B' };
    l.docente = { ...l.docente, escuelas: [a, b] };
    l.escuelasIds = [a.id, b.id];
    l.copias = 2;
    l.adjuntos = [adj('c1', 'certificado'), adj('c2', 'certificado'), adj('s', 'sesop')];
    const plan = planArchivos(l);
    expect(plan.map((p) => p.clave)).toEqual([`parte:${a.id}`, `parte:${b.id}`, 'certificado', 'sesop']);
    expect(new Set(plan.map((p) => p.nombre)).size).toBe(4);
    const paginas = await Promise.all(plan.map(async (p) => (await PDFDocument.load(await bytesDe(l, p))).getPageCount()));
    expect(paginas).toEqual([2, 2, 2, 1]);
  });
  it('sin adjuntos ni escuelas sale solo el parte', () => {
    expect(planArchivos({ ...base(), escuelasIds: [] }).map((p) => p.clave)).toEqual(['parte']);
  });
  it('cuenta días hábiles sin sábados ni domingos', () => {
    expect(contarDias('2026-10-05', '2026-10-11', 'habiles')).toBe(5);
    expect(contarDias('2026-10-05', '2026-10-11', 'corridos')).toBe(7);
  });
  it('resta del tope las licencias finales del año y lo cargado a mano', () => {
    const tipo = buscarTipo('corto-tratamiento')!;
    const ls = [final('corto-tratamiento', '2026-03-02', '2026-03-06'), final('corto-tratamiento', '2025-03-02', '2025-03-20'), { ...final('corto-tratamiento', '2026-04-01', '2026-04-10'), estado: 'borrador' as const }];
    const s = calcularSaldo(tipo, ls, { 2026: { corto: 2 } }, '2026-10-30')!;
    expect(s.usados).toBe(7);
    expect(s.disponibles).toBe(23);
  });
  it('recorta las licencias que cruzan de un año al otro', () => {
    const s = calcularSaldo(buscarTipo('corto-tratamiento-suplentes')!, [final('corto-tratamiento-suplentes', '2025-12-30', '2026-01-02')], {}, '2026-06-01')!;
    expect(s.usados).toBe(2);
  });
  it('marca el tope mensual de asuntos particulares (art. 51 inc. f)', () => {
    const s = calcularSaldo(buscarTipo('franq-particular')!, [final('franq-particular', '2026-10-05', '2026-10-05')], {}, '2026-10-30')!;
    expect(s.disponibles).toBe(4);
    expect(s.esteMes).toBe(0);
  });
  it('largo tratamiento suma períodos salvo que pasen más de 2 años', () => {
    const t = buscarTipo('largo-tratamiento')!;
    const ls = [final('largo-tratamiento', '2026-01-01', '2026-01-10'), final('largo-tratamiento', '2025-01-01', '2025-01-10'), final('largo-tratamiento', '2020-01-01', '2020-01-31')];
    expect(calcularSaldo(t, ls, {}, '2026-10-30')!.usados).toBe(20);
  });
  it('filtra por situación de revista y antigüedad', () => {
    expect(corresponde(buscarTipo('familiar-enfermo')!, 'suplente', '', '2026-10-30').corresponde).toBe(false);
    expect(corresponde(buscarTipo('familiar-enfermo')!, 'contratado', '', '2026-10-30').corresponde).toBe(false);
    expect(corresponde(buscarTipo('familiar-enfermo')!, 'interino', '', '2026-10-30').corresponde).toBe(true);
    expect(corresponde(buscarTipo('corto-tratamiento-suplentes')!, 'contratado', '', '2026-10-30').corresponde).toBe(true);
    expect(corresponde(buscarTipo('razones-particulares')!, 'titular', '2025-01-01', '2026-10-30').corresponde).toBe(false);
    expect(corresponde(buscarTipo('razones-particulares')!, 'titular', '2020-01-01', '2026-10-30').corresponde).toBe(true);
    expect(saldosDisponibles('suplente', [], {}, '2026-10-30').map((s) => s.cupo.grupo)).not.toContain('familiar');
  });
  it('el art. 51 tiene sus incisos a al f', () => {
    const incs = LICENCIAS.filter((l) => l.articulo === '51').map((l) => l.inciso).sort();
    expect(incs).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(LICENCIAS.filter((l) => coincide(l, '51 f')).map((l) => l.id)).toEqual(['franq-particular']);
  });
  it('toda licencia de la guía existe en el catálogo y todas indican revista', () => {
    const ids = Object.values(GUIA).flatMap((p) => p.opciones.flatMap((o) => o.licencias ?? []));
    for (const id of ids) expect(buscarTipo(id), id).toBeTruthy();
    for (const p of Object.values(GUIA)) for (const o of p.opciones) if (o.ir) expect(GUIA[o.ir], o.ir).toBeTruthy();
    expect(LICENCIAS.filter((l) => !l.revista)).toEqual([]);
    const usados = new Set(ids);
    expect(LICENCIAS.filter((l) => !usados.has(l.id)).map((l) => l.id)).toEqual([]);
  });
});
