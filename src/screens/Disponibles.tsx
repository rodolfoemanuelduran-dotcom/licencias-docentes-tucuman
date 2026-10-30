import { useEffect, useState } from 'react';
import type { Contexto } from '../App';
import type { Licencia, Revista } from '../types';
import { guardarRegistro, leerRegistro, listarRegistros } from '../lib/db';
import { LICENCIAS } from '../lib/catalogo';
import { aniosDesde, corresponde, hoyISO, proximaFecha, revistaPrincipal, saldosDisponibles, type UsosPrevios } from '../lib/saldos';
import { formatearFecha } from '../lib/dias';
import { Aviso, Campo } from '../components/ui';

/** Cuánto queda de las licencias con tope, según el historial de la app y lo que el docente cargue a mano. */
export default function Disponibles({ ctx }: { ctx: Contexto }) {
  const principal = revistaPrincipal(ctx.docente.escuelas);
  const [revista, setRevista] = useState<Revista | ''>(principal.revista);
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [previos, setPrevios] = useState<UsosPrevios>({});
  const hoy = hoyISO();
  const anio = hoy.slice(0, 4);

  useEffect(() => {
    listarRegistros<Licencia>('licencia').then(setLicencias);
    leerRegistro<UsosPrevios>('docente', 'usos').then((u) => setPrevios(u ?? {}));
  }, []);

  const cambiarPrevio = (grupo: string, v: string) => {
    const n = Math.max(0, Number(v.replace(/\D/g, '')) || 0);
    const nuevo = { ...previos, [anio]: { ...(previos[anio] ?? {}), [grupo]: n } };
    setPrevios(nuevo);
    void guardarRegistro('docente', 'usos', nuevo);
  };

  const saldos = saldosDisponibles(revista, licencias, previos, hoy);
  const antig = aniosDesde(principal.fechaIngreso, hoy);
  const sangre = LICENCIAS.find((t) => t.id === 'franq-sangre')!;
  const proximaSangre = proximaFecha(sangre, licencias, hoy);
  const bloqueadas = LICENCIAS.filter((t) => t.antiguedad && !corresponde(t, revista, principal.fechaIngreso, hoy).corresponde && t.revista?.includes('titular') && revista === 'titular');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold">Mis licencias disponibles</h2>
      <Campo etiqueta="Tu situación de revista">
        {(p) => (
          <select {...p} value={revista} onChange={(e) => setRevista(e.target.value as Revista | '')}>
            <option value="">Sin elegir (muestra todas)</option>
            <option value="titular">Titular</option>
            <option value="interino">Interino/a</option>
            <option value="suplente">Suplente</option>
            <option value="contratado">Contratado/a</option>
          </select>
        )}
      </Campo>
      {antig !== null && <p className="text-base text-slate-700">Antigüedad en el cargo: {antig} {antig === 1 ? 'año' : 'años'}.</p>}
      <Aviso>
        La cuenta usa las licencias que hiciste en esta app (las que descargaste o compartiste). Si usaste días por fuera de la app, cargalos abajo. Es una estimación: el registro
        oficial lo tiene tu escuela. Los días hábiles se cuentan de lunes a viernes, sin descontar feriados.
      </Aviso>
      <ul className="space-y-3">
        {saldos.map((s) => {
          const pct = Math.min(100, Math.round((s.usados / s.cupo.cantidad) * 100));
          const unidad = s.cupo.unidad === 'habiles' ? 'días hábiles' : 'días';
          return (
            <li key={s.cupo.grupo} className="tarjeta space-y-2">
              <h3 className="text-base font-bold">{s.tipo.nombre}</h3>
              <p className={`text-lg font-bold ${s.disponibles ? 'text-marca-900' : 'text-red-700'}`}>
                Te quedan {s.disponibles} de {s.cupo.cantidad} {unidad}
              </p>
              <div role="progressbar" aria-label={`Usados ${s.usados} de ${s.cupo.cantidad}`} aria-valuemin={0} aria-valuemax={s.cupo.cantidad} aria-valuenow={Math.min(s.usados, s.cupo.cantidad)} className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full ${s.disponibles ? 'bg-marca-600' : 'bg-red-700'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-slate-600">
                Usados {s.usados} {s.periodo}.{s.esteMes === 0 ? ' Ya usaste el de este mes.' : ''} {s.cupo.luego ?? ''}
              </p>
              <Campo etiqueta={`Días usados en ${anio} fuera de la app`}>
                {(p) => <input {...p} inputMode="numeric" value={previos[anio]?.[s.cupo.grupo] || ''} onChange={(e) => cambiarPrevio(s.cupo.grupo, e.target.value)} />}
              </Campo>
            </li>
          );
        })}
      </ul>
      {proximaSangre && <Aviso tipo="alerta">Donación de sangre: podés volver a usarla desde el {formatearFecha(proximaSangre)} (art. 51 inc. b).</Aviso>}
      {bloqueadas.map((t) => (
        <Aviso key={t.id} tipo="alerta">
          {t.nombre}: {corresponde(t, revista, principal.fechaIngreso, hoy).motivo}
        </Aviso>
      ))}
      <button className="btn-sec w-full" onClick={() => ctx.irA('guia')}>
        ¿Qué licencia me corresponde?
      </button>
    </div>
  );
}
