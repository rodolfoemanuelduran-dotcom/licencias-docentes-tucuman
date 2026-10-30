import { useEffect, useState } from 'react';
import { escuelasDeLicencia, type Docente, type Escuela, type Licencia } from '../../types';
import { LICENCIAS, buscarTipo, coincide } from '../../lib/catalogo';
import { calcularDias, contarDias, formatearFecha } from '../../lib/dias';
import { advertencias, validarLicencia, type Errores } from '../../lib/validacion';
import { compartirLicencia, descargarArchivo, descargarLicencia, imprimirLicencia, planArchivos, puedeCompartir } from '../../lib/acciones';
import { calcularSaldo, hoyISO, type UsosPrevios } from '../../lib/saldos';
import { leerRegistro, listarRegistros } from '../../lib/db';
import DetalleTipo, { refTipo } from '../../components/DetalleTipo';
import { EscuelasEditor, FormPersonal } from '../../components/FormDocente';
import FirmaPad from '../../components/FirmaPad';
import GuiaSesop from '../../components/GuiaSesop';
import Documentacion from '../../components/Documentacion';
import { Aviso, AvisoVerificar, Campo, Insignia, Modal } from '../../components/ui';

export interface PasoProps {
  lic: Licencia;
  cambiar: (p: Partial<Licencia>) => void;
  errores: Errores;
}


export function Paso1({ lic, cambiar, errores, siguiente }: PasoProps & { siguiente: () => void }) {
  const [q, setQ] = useState('');
  const [detalle, setDetalle] = useState<string | null>(null);
  const lista = LICENCIAS.filter((l) => coincide(l, q));
  const tipo = detalle ? buscarTipo(detalle) : undefined;
  return (
    <div className="space-y-3">
      <input className="input" type="search" aria-label="Buscar licencia" placeholder="Buscá: enfermedad, 38b, suplentes, duelo…" value={q} onChange={(e) => setQ(e.target.value)} />
      {errores.tipoId && <Aviso tipo="error">{errores.tipoId}</Aviso>}
      <ul className="space-y-2">
        {lista.map((l) => (
          <li key={l.id}>
            <button
              onClick={() => setDetalle(l.id)}
              aria-pressed={lic.tipoId === l.id}
              className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left ${
                lic.tipoId === l.id ? 'border-marca-600 bg-marca-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span>
                <span className="block text-base font-semibold">{l.nombre}</span>
                <span className="block text-sm text-slate-600">{refTipo(l)}</span>
              </span>
              {lic.tipoId === l.id && <span aria-label="Elegida">✓</span>}
            </button>
          </li>
        ))}
        {lista.length === 0 && <li className="text-base text-slate-700">No encontramos licencias con “{q}”.</li>}
      </ul>
      {tipo && (
        <Modal titulo={tipo.nombre} onCerrar={() => setDetalle(null)}>
          <DetalleTipo tipo={tipo} />
          <div className="mt-5 flex flex-col gap-3">
            <button
              className="btn-primario"
              onClick={() => {
                cambiar({ tipoId: tipo.id });
                setDetalle(null);
                siguiente();
              }}
            >
              Elegir esta licencia
            </button>
            <button className="btn-sec" onClick={() => setDetalle(null)}>
              Volver a la lista
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Paso2({ lic, cambiar, errores, recordar, onRecordar }: PasoProps & { recordar: boolean; onRecordar: (v: boolean) => void }) {
  const [editar, setEditar] = useState(lic.docente.escuelas.length === 0);
  const escuelas = lic.docente.escuelas;
  const alternar = (id: string, v: boolean) =>
    cambiar({ escuelasIds: v ? escuelas.filter((e) => e.id === id || lic.escuelasIds.includes(e.id)).map((e) => e.id) : lic.escuelasIds.filter((x) => x !== id) });
  const cambiarDocente = (docente: Docente) => {
    const ids = lic.escuelasIds.filter((id) => docente.escuelas.some((e) => e.id === id));
    const nuevas = docente.escuelas.filter((e) => !escuelas.some((x) => x.id === e.id)).map((e) => e.id);
    cambiar({ docente, escuelasIds: [...ids, ...nuevas] });
  };
  const principal = escuelas.find((e) => e.principal);
  return (
    <div className="space-y-5">
      <p className="text-base text-slate-700">Solo apellido, nombre y DNI son obligatorios.</p>
      <FormPersonal valor={lic.docente} onCambio={cambiarDocente} errores={errores} />
      <label className="flex min-h-[48px] items-start gap-3 rounded-xl bg-slate-100 p-3 text-base">
        <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={recordar} onChange={(e) => onRecordar(e.target.checked)} />
        <span>
          <strong>Recordar mis datos y mis escuelas</strong> en este dispositivo para la próxima licencia.
        </span>
      </label>

      <section className="space-y-3" aria-labelledby="titulo-escuelas">
        <h3 id="titulo-escuelas" className="text-lg font-bold">
          ¿En qué escuela es esta licencia?
        </h3>
        {escuelas.length > 0 ? (
          <>
            {escuelas.map((e, i) => (
              <label key={e.id} className="flex min-h-[48px] items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-base">
                <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={lic.escuelasIds.includes(e.id)} onChange={(ev) => alternar(e.id, ev.target.checked)} />
                <span>
                  <strong>{e.nombre || `Escuela ${i + 1} (sin nombre)`}</strong>
                  {e.principal && <span className="ml-2 text-sm text-marca-700">mayor antigüedad</span>}
                  <span className="block text-sm text-slate-600">
                    {[e.cargo, e.cue && `CUE ${e.cue}`, e.plazas.length ? `${e.plazas.length} plaza(s)` : ''].filter(Boolean).join(' · ') || 'Sin datos del parte'}
                  </span>
                </span>
              </label>
            ))}
            {lic.escuelasIds.length > 1 && (
              <Aviso>
                Se arma un parte por cada escuela, con sus plazas y horas. Según el art. 54 inc. e, el pedido se presenta en la escuela de mayor antigüedad
                {principal ? ` (${principal.nombre || 'la marcada'})` : ''}, que avisa a las demás.
              </Aviso>
            )}
          </>
        ) : (
          <p className="text-base text-slate-700">Todavía no cargaste escuelas. Podés seguir sin ellas: el parte sale con ese sector en blanco.</p>
        )}
        <button type="button" className="btn-sec w-full" aria-expanded={editar} onClick={() => setEditar(!editar)}>
          {editar ? 'Ocultar mis escuelas' : escuelas.length ? 'Editar mis escuelas' : 'Cargar mis escuelas'}
        </button>
        {editar && <EscuelasEditor valor={lic.docente} onCambio={cambiarDocente} />}
      </section>
    </div>
  );
}

export function Paso3({ lic, cambiar, errores }: PasoProps) {
  const fechas = (desde: string, hasta: string) => ({ desde, hasta, dias: calcularDias(desde, hasta) });
  const tipo = buscarTipo(lic.tipoId);
  return (
    <div className="space-y-4">
      {tipo && <Aviso>Plazo de presentación: {tipo.plazoPresentacion || 'no consta en la fuente'}</Aviso>}
      <Campo etiqueta="Fecha de inicio" error={errores.desde}>
        {(p) => <input {...p} type="date" value={lic.desde} onChange={(e) => cambiar(fechas(e.target.value, lic.hasta))} />}
      </Campo>
      <Campo etiqueta="Fecha de fin" error={errores.hasta}>
        {(p) => <input {...p} type="date" value={lic.hasta} min={lic.desde || undefined} onChange={(e) => cambiar(fechas(lic.desde, e.target.value))} />}
      </Campo>
      {lic.dias !== null && (
        <p className="rounded-xl bg-marca-50 p-3 text-lg font-bold text-marca-900" aria-live="polite">
          Total: {lic.dias} {lic.dias === 1 ? 'día' : 'días'} corridos
        </p>
      )}
      <AvisoSaldo lic={lic} />
      <Campo
        etiqueta="Código de inasistencia del SESOP"
        ayuda={
          tipo?.sesop?.codigo
            ? 'Se imprime en la casilla “Código” del parte. Si fuiste al SESOP el primer día, no hace falta.'
            : 'Opcional: completalo solo si el SESOP te dio un código. Se imprime en la casilla “Código” del parte.'
        }
      >
        {(p) => <input {...p} autoComplete="off" value={lic.codigoSesop} onChange={(e) => cambiar({ codigoSesop: e.target.value.toUpperCase() })} />}
      </Campo>
      {tipo?.sesop && <BloqueSesop lic={lic} cambiar={cambiar} errores={errores} />}
      <Campo etiqueta="Motivo (opcional)" ayuda="No hace falta que escribas diagnósticos. Queda solo en tu dispositivo y no se imprime en el parte.">
        {(p) => <textarea {...p} rows={3} value={lic.motivo} onChange={(e) => cambiar({ motivo: e.target.value })} />}
      </Campo>
      <Campo etiqueta="Observaciones (opcional)">
        {(p) => <textarea {...p} rows={3} value={lic.observaciones} onChange={(e) => cambiar({ observaciones: e.target.value })} />}
      </Campo>
    </div>
  );
}

/** Muestra cuántos días quedan de esta licencia, según el historial del dispositivo. */
function AvisoSaldo({ lic }: { lic: Licencia }) {
  const [texto, setTexto] = useState<{ t: string; exceso: boolean } | null>(null);
  const tipo = buscarTipo(lic.tipoId);
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!tipo?.cupo) return setTexto(null);
      const [lista, previos] = await Promise.all([listarRegistros<Licencia>('licencia'), leerRegistro<UsosPrevios>('docente', 'usos')]);
      const s = calcularSaldo(tipo, lista.filter((x) => x.id !== lic.id), previos ?? {}, lic.desde || hoyISO());
      if (!vivo || !s) return;
      const pedidos = lic.desde && lic.hasta ? contarDias(lic.desde, lic.hasta, s.cupo.unidad) : 0;
      const unidad = s.cupo.unidad === 'habiles' ? 'días hábiles' : 'días';
      const exceso = pedidos > s.disponibles;
      setTexto({
        t: `Te quedan ${s.disponibles} de ${s.cupo.cantidad} ${unidad} ${s.periodo}.${exceso ? ` Estás pidiendo ${pedidos}: superás el tope. ${s.cupo.luego ?? ''}` : ''}`,
        exceso,
      });
    })();
    return () => {
      vivo = false;
    };
  }, [tipo, lic.id, lic.desde, lic.hasta]);
  return texto ? <Aviso tipo={texto.exceso ? 'alerta' : 'info'}>{texto.t}</Aviso> : null;
}

function BloqueSesop({ lic, cambiar }: PasoProps) {
  const guia = buscarTipo(lic.tipoId)!.sesop!;
  const marca = (k: keyof Licencia['sesop'], v: boolean) => cambiar({ sesop: { ...lic.sesop, [k]: v } });
  const check = (k: keyof Licencia['sesop'], texto: string) => (
    <label className="flex min-h-[48px] items-start gap-3 text-base">
      <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={lic.sesop[k]} onChange={(e) => marca(k, e.target.checked)} />
      <span>{texto}</span>
    </label>
  );
  return (
    <section className="space-y-3 rounded-2xl border-2 border-marca-600/30 bg-marca-50 p-4" aria-labelledby="titulo-sesop">
      <h3 id="titulo-sesop" className="text-lg font-bold text-marca-900">
        Trámite en el SESOP
      </h3>
      <p className="text-base">Esta licencia la justifica el Servicio de Salud Ocupacional Provincial. Seguí estos pasos:</p>
      <GuiaSesop guia={guia} />
      <div className="space-y-1">
        {check('avisoEscuela', 'Avisé a la escuela dentro de las dos primeras horas.')}
        {guia.codigo && check('concurrioPrimerDia', 'Fui al SESOP el primer día (tengo la constancia).')}
        {guia.codigo && check('certificadoOk', 'Mi certificado es original y tiene membrete, fecha, diagnóstico, días de reposo, firma, sello y matrícula.')}
      </div>
    </section>
  );
}

export function Paso4({ lic, cambiar }: PasoProps) {
  return <Documentacion lic={lic} cambiar={cambiar} />;
}

/** Hacia qué paso lleva cada aviso de la revisión. */
function destinoAviso(a: string): { paso?: number; texto: string } {
  if (a.startsWith('Falta el código')) return { paso: 3, texto: 'Cargar el código' };
  if (a.startsWith('Este tipo de licencia pide') || a.startsWith('Falta adjuntar')) return { paso: 4, texto: 'Adjuntar' };
  if (a.startsWith('No elegiste') || a.startsWith('El parte lleva')) return { paso: 2, texto: 'Completar escuelas' };
  return { texto: '' };
}

export function Paso5({
  lic,
  irAPaso,
  cambiar,
  recordarFirma,
  onRecordarFirma,
}: {
  lic: Licencia;
  irAPaso: (n: number) => void;
  cambiar: (p: Partial<Licencia>) => void;
  recordarFirma: boolean;
  onRecordarFirma: (v: boolean) => void;
}) {
  const tipo = buscarTipo(lic.tipoId);
  const errores = validarLicencia(lic, tipo);
  const avisos = advertencias(lic, tipo).filter((a) => a !== 'Verificar en Mesa de Entradas antes de presentar.');
  const escuelas = escuelasDeLicencia(lic);
  const fila = (k: string, v: string) => (
    <div key={k} className="flex flex-col border-b border-slate-100 py-2 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-semibold text-slate-600">{k}</dt>
      <dd className="text-base">{v || '—'}</dd>
    </div>
  );
  const horas = (e: Escuela) =>
    Object.values(e.horas).some(Boolean)
      ? `Lun ${e.horas.lunes || '—'} · Mar ${e.horas.martes || '—'} · Mié ${e.horas.miercoles || '—'} · Jue ${e.horas.jueves || '—'} · Vie ${e.horas.viernes || '—'}`
      : '';
  return (
    <div className="space-y-4">
      {Object.keys(errores).length > 0 && (
        <Aviso tipo="error">
          Faltan datos obligatorios: {Object.values(errores).join(' ')}{' '}
          <button className="font-bold underline" onClick={() => irAPaso(errores.tipoId ? 1 : errores.desde || errores.hasta ? 3 : 2)}>
            Completarlos
          </button>
        </Aviso>
      )}
      {avisos.map((a) => {
        const d = destinoAviso(a);
        return (
          <Aviso key={a} tipo="alerta">
            {a}{' '}
            {d.paso && (
              <button className="font-bold underline" onClick={() => irAPaso(d.paso!)}>
                {d.texto}
              </button>
            )}
          </Aviso>
        );
      })}
      {tipo && !tipo.verificado && <AvisoVerificar />}
      <dl className="tarjeta">
        {fila('Licencia', tipo ? `${tipo.nombre} (${refTipo(tipo)})` : '')}
        {fila('Docente', `${lic.docente.apellido}, ${lic.docente.nombres}`)}
        {fila('DNI', lic.docente.dni)}
        {fila('Domicilio', lic.docente.domicilio)}
        {fila('Período', lic.desde ? `${formatearFecha(lic.desde)} al ${formatearFecha(lic.hasta)} (${lic.dias ?? '—'} días)` : '')}
        {fila('Código SESOP', lic.codigoSesop || (lic.sesop.concurrioPrimerDia ? 'Fui al SESOP el primer día' : ''))}
        {fila('Motivo', lic.motivo)}
        {fila('Observaciones', lic.observaciones)}
        {fila('Adjuntos', lic.adjuntos.map((a) => a.nombre).join(', '))}
      </dl>
      {escuelas.map((e, i) => (
        <dl key={e.id} className="tarjeta">
          <p className="pb-1 text-base font-bold">
            Parte {i + 1}: {e.nombre || 'Escuela sin nombre'}
          </p>
          {fila('Cargo', e.cargo)}
          {fila('CUE / Legajo', [e.cue, e.legajo].filter(Boolean).join(' / '))}
          {fila('Plazas', e.plazas.map((p) => [p.idPlaza, p.turno, p.cursoDiv].filter(Boolean).join(' · ')).join('; '))}
          {fila('Horas por día', horas(e))}
        </dl>
      ))}

      <section className="tarjeta space-y-3" aria-labelledby="titulo-firma">
        <h3 id="titulo-firma" className="text-lg font-bold">
          Tu firma (conformidad del agente)
        </h3>
        <p className="text-base text-slate-700">Se imprime en azul sobre la línea “Conformidad del Agente” de cada parte. Si preferís, firmá a mano después de imprimir.</p>
        <FirmaPad valor={lic.docente.firma} onCambio={(firma) => cambiar({ docente: { ...lic.docente, firma } })} />
        <label className="flex min-h-[48px] items-start gap-3 text-base">
          <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={recordarFirma} onChange={(e) => onRecordarFirma(e.target.checked)} />
          <span>Recordar mi firma en este dispositivo para las próximas licencias.</span>
        </label>
      </section>
    </div>
  );
}

export function Paso6({ lic, alFinal, cambiar }: { lic: Licencia; alFinal: () => void; cambiar: (p: Partial<Licencia>) => void }) {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const archivos = planArchivos(lic);
  async function correr(f: () => Promise<string | void>) {
    setTrabajando(true);
    setMsg('');
    setError('');
    try {
      const r = await f();
      if (r) setMsg(r);
      alFinal();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message || 'No se pudo completar la acción.');
    } finally {
      setTrabajando(false);
    }
  }
  const aviso = (destino: 'carpeta' | 'descarga', n: number) =>
    destino === 'carpeta' ? `Guardado en tu carpeta Mis licencias (${n} PDF).` : `Listo: ${n === 1 ? 'se descargó 1 PDF' : `se descargaron ${n} PDF`}. Buscalos en tus descargas.`;
  return (
    <div className="space-y-4">
      {buscarTipo(lic.tipoId)?.sesop?.codigo && (
        <section className="space-y-3" aria-labelledby="titulo-adjuntos-salud">
          <h3 id="titulo-adjuntos-salud" className="text-lg font-bold">
            Certificado médico y código del SESOP
          </h3>
          <p className="text-base text-slate-700">Si todavía no los cargaste, sacales una foto acá: cada uno sale en su propio PDF.</p>
          <Documentacion lic={lic} cambiar={cambiar} soloSalud />
        </section>
      )}
      <Campo etiqueta="Originales del parte" ayuda="Muchas escuelas piden más de un original.">
        {(p) => (
          <select {...p} value={lic.copias} onChange={(e) => cambiar({ copias: Number(e.target.value) })}>
            <option value={1}>1 original</option>
            <option value={2}>2 originales</option>
            <option value={3}>3 originales</option>
          </select>
        )}
      </Campo>
      <section className="space-y-2" aria-labelledby="titulo-archivos">
        <h3 id="titulo-archivos" className="text-lg font-bold">
          Tus {archivos.length} PDF
        </h3>
        <ul className="space-y-2">
          {archivos.map((a) => (
            <li key={a.clave} className="tarjeta flex items-center gap-3 !p-3">
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">📄 {a.titulo}</span>
                <span className="block truncate text-sm text-slate-600">{a.nombre}</span>
              </span>
              <button
                className="btn-sec !min-h-[48px] shrink-0 !px-3"
                disabled={trabajando}
                aria-label={`Descargar ${a.titulo}`}
                onClick={() => correr(async () => aviso(await descargarArchivo(lic, a), 1))}
              >
                ⬇
              </button>
            </li>
          ))}
        </ul>
      </section>
      {msg && <Aviso>{msg}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="grid gap-3">
        <button
          className="btn-primario"
          disabled={trabajando}
          onClick={() =>
            correr(async () => {
              const r = await descargarLicencia(lic);
              return aviso(r.destino, r.cantidad);
            })
          }
        >
          ⬇ Descargar {archivos.length > 1 ? `los ${archivos.length} PDF` : 'el PDF'}
        </button>
        {puedeCompartir() && (
          <button className="btn-sec" disabled={trabajando} onClick={() => correr(() => compartirLicencia(lic))}>
            Compartir
          </button>
        )}
        <button className="btn-sec" disabled={trabajando} onClick={() => correr(() => imprimirLicencia(lic))}>
          🖨 Imprimir todo
        </button>
      </div>
      <p className="text-sm text-slate-600">
        <Insignia>Recordá</Insignia> firmar el parte antes de presentarlo. La licencia queda guardada en “Mis licencias”.
      </p>
    </div>
  );
}
