import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contexto } from '../App';
import type { Licencia } from '../types';
import { borrarRegistro, guardarRegistro, listarRegistros } from '../lib/db';
import { buscarTipo, LICENCIAS } from '../lib/catalogo';
import { formatearFecha } from '../lib/dias';
import { descargarLicencia } from '../lib/acciones';
import { Aviso, Confirmar, Insignia } from '../components/ui';
import { useEsEscritorio } from '../hooks/hooks';

type Orden = 'actualizada' | 'desde' | 'apellido';

export default function MisLicencias({ ctx }: { ctx: Contexto }) {
  const [todas, setTodas] = useState<Licencia[] | null>(null);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [orden, setOrden] = useState<Orden>('actualizada');
  const [borrar, setBorrar] = useState<Licencia | null>(null);
  const [msg, setMsg] = useState('');
  const escritorio = useEsEscritorio();

  const cargar = useCallback(async () => setTodas(await listarRegistros<Licencia>('licencia')), []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const lista = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (todas ?? [])
      .filter((l) => (!tipo || l.tipoId === tipo) && (!desde || l.desde >= desde) && (!hasta || (l.desde || '9999') <= hasta))
      .filter((l) => !n || `${l.docente.apellido} ${l.docente.nombres} ${buscarTipo(l.tipoId)?.nombre ?? ''}`.toLowerCase().includes(n))
      .sort((a, b) =>
        orden === 'apellido'
          ? a.docente.apellido.localeCompare(b.docente.apellido, 'es')
          : orden === 'desde'
            ? b.desde.localeCompare(a.desde)
            : b.actualizadaEn.localeCompare(a.actualizadaEn),
      );
  }, [todas, q, tipo, desde, hasta, orden]);

  async function bajar(l: Licencia) {
    setMsg('');
    try {
      const donde = await descargarLicencia(l);
      setMsg(donde === 'carpeta' ? 'Guardado en tu carpeta Mis licencias.' : 'PDF descargado.');
    } catch {
      setMsg('No se pudo generar el PDF.');
    }
  }

  async function duplicar(l: Licencia) {
    const ahora = new Date().toISOString();
    const copia: Licencia = { ...l, id: crypto.randomUUID(), estado: 'borrador', paso: 1, creadaEn: ahora, actualizadaEn: ahora };
    await guardarRegistro('licencia', copia.id, copia);
    ctx.irA('nueva/' + copia.id);
  }

  async function eliminar() {
    if (!borrar) return;
    await borrarRegistro(borrar.id);
    setBorrar(null);
    await cargar();
  }

  const acciones = (l: Licencia) => (
    <div className="flex flex-wrap gap-2">
      {l.estado === 'borrador' && (
        <button className="btn-primario !px-4" onClick={() => ctx.irA('nueva/' + l.id)}>
          Continuar
        </button>
      )}
      <button className="btn-sec !px-4" onClick={() => bajar(l)}>
        Descargar
      </button>
      <button className="btn-sec !px-4" onClick={() => duplicar(l)}>
        Duplicar
      </button>
      <button className="btn-sec !px-4 !text-red-700" onClick={() => setBorrar(l)}>
        Eliminar
      </button>
    </div>
  );

  const nombre = (l: Licencia) => buscarTipo(l.tipoId)?.nombre ?? 'Sin tipo elegido';
  const periodo = (l: Licencia) => (l.desde ? `${formatearFecha(l.desde)} al ${formatearFecha(l.hasta)}${l.dias ? ` (${l.dias} d.)` : ''}` : 'Sin fechas');

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Mis licencias</h2>
      <div className="grid gap-3 lg:grid-cols-[2fr_2fr_1fr_1fr_1fr]">
        <input className="input" type="search" aria-label="Buscar" placeholder="Buscar por apellido o tipo" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {LICENCIAS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <input className="input" type="date" aria-label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input className="input" type="date" aria-label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <select className="input" aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
          <option value="actualizada">Más recientes</option>
          <option value="desde">Por fecha de inicio</option>
          <option value="apellido">Por apellido</option>
        </select>
      </div>
      {msg && <Aviso>{msg}</Aviso>}
      {todas && lista.length === 0 && (
        <div className="tarjeta space-y-3 text-center">
          <p className="text-base">{todas.length ? 'No hay licencias con esos filtros.' : 'Todavía no creaste ninguna licencia.'}</p>
          <button className="btn-primario" onClick={() => ctx.irA('nueva')}>
            Nueva licencia
          </button>
        </div>
      )}
      {escritorio && lista.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Docente</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Período</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <tr key={l.id} className="border-t border-slate-200 align-top">
                  <td className="p-3">
                    {l.docente.apellido}, {l.docente.nombres}
                  </td>
                  <td className="p-3">{nombre(l)}</td>
                  <td className="p-3">{periodo(l)}</td>
                  <td className="p-3">
                    <Insignia color={l.estado === 'final' ? 'verde' : 'ambar'}>{l.estado === 'final' ? 'Lista' : 'Borrador'}</Insignia>
                  </td>
                  <td className="p-3">{acciones(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((l) => (
            <li key={l.id} className="tarjeta space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-bold">{nombre(l)}</p>
                <Insignia color={l.estado === 'final' ? 'verde' : 'ambar'}>{l.estado === 'final' ? 'Lista' : 'Borrador'}</Insignia>
              </div>
              <p className="text-base">
                {l.docente.apellido}, {l.docente.nombres}
              </p>
              <p className="text-base text-slate-700">{periodo(l)}</p>
              {acciones(l)}
            </li>
          ))}
        </ul>
      )}
      {borrar && (
        <Confirmar
          titulo="¿Eliminar esta licencia?"
          texto="Se borra de este dispositivo junto con sus adjuntos. Los PDF que ya descargaste no se tocan. No se puede deshacer."
          accion="Sí, eliminar"
          onConfirmar={eliminar}
          onCerrar={() => setBorrar(null)}
        />
      )}
    </div>
  );
}
