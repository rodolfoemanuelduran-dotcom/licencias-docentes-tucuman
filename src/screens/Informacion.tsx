import { useMemo, useState } from 'react';
import { LICENCIAS } from '../lib/catalogo';
import DetalleTipo, { refTipo } from '../components/DetalleTipo';
import { Aviso, Insignia } from '../components/ui';

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Informacion() {
  const [q, setQ] = useState('');
  const [goce, setGoce] = useState<'todas' | 'con' | 'sin'>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);

  const lista = useMemo(() => {
    const n = sinTildes(q);
    return LICENCIAS.filter((l) => {
      if (goce === 'con' && !/^con goce/i.test(l.goce)) return false;
      if (goce === 'sin' && !/^sin goce/i.test(l.goce)) return false;
      return !n || sinTildes([l.nombre, l.duracion, l.requisitos.join(' '), l.documentacion.join(' '), l.articulo].join(' ')).includes(n);
    });
  }, [q, goce]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold">Información</h2>
      <Aviso tipo="alerta">
        <strong>Sobre las fuentes:</strong> los datos salen del Decreto 505/1 del 26-3-1996 (régimen de licencias docentes) y la Ley 5.806, tomados de copias no oficiales, y
        maternidad, adopción y nacimiento fueron ampliados por el Decreto 1.441/5 del 13-8-2020. <strong>Todavía no se verificaron contra el texto oficial</strong> (último intento:
        22/10/2026; el portal oficial no estaba disponible). Verificá en Mesa de Entradas antes de presentar.
      </Aviso>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input className="input" type="search" placeholder="Buscar licencia (ej.: duelo, examen)" aria-label="Buscar licencia" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-56" aria-label="Filtrar por goce de haberes" value={goce} onChange={(e) => setGoce(e.target.value as typeof goce)}>
          <option value="todas">Todas</option>
          <option value="con">Con goce</option>
          <option value="sin">Sin goce</option>
        </select>
      </div>
      <p className="text-sm text-slate-600" aria-live="polite">
        {lista.length} {lista.length === 1 ? 'licencia' : 'licencias'}
      </p>
      <ul className="space-y-2">
        {lista.map((l) => (
          <li key={l.id} className="tarjeta !p-0">
            <button
              className="flex min-h-[56px] w-full items-center justify-between gap-3 p-4 text-left"
              aria-expanded={abierta === l.id}
              onClick={() => setAbierta(abierta === l.id ? null : l.id)}
            >
              <span>
                <span className="block text-base font-bold">{l.nombre}</span>
                <span className="block text-sm text-slate-600">{refTipo(l)}</span>
              </span>
              {!l.verificado && <Insignia color="ambar">Sin verificar</Insignia>}
            </button>
            {abierta === l.id && (
              <div className="border-t border-slate-200 p-4">
                <DetalleTipo tipo={l} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
