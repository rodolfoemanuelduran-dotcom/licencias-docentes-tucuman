import { useMemo, useState } from 'react';
import { LICENCIAS } from '../lib/catalogo';
import DetalleTipo, { refTipo } from '../components/DetalleTipo';
import { Aviso, Insignia } from '../components/ui';
import { ContactoSesop } from '../components/GuiaSesop';

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
        <strong>Sobre las fuentes:</strong> los datos salen del Decreto 505/14 (régimen de licencias docentes) tomado de copias no oficiales, con maternidad, adopción y nacimiento
        ampliados por el Decreto 1.441/5 del 13-8-2020. La licencia por familiar con discapacidad sale del texto oficial de la Ley 9254 (verificada el 22/10/2026), y los pasos del
        SESOP, de su web. <strong>El resto todavía no se verificó contra el texto oficial.</strong> Verificá en Mesa de Entradas antes de presentar.
      </Aviso>
      <details className="tarjeta">
        <summary className="min-h-[48px] cursor-pointer py-2 text-lg font-bold">Licencias de salud y el SESOP</summary>
        <div className="space-y-3 pt-2 text-base">
          <p>
            El <strong>SESOP</strong> (Servicio de Salud Ocupacional Provincial) es quien justifica las licencias por enfermedad, accidente de trabajo, maternidad, familiar
            enfermo y familiar con discapacidad. La escuela recibe el <strong>Parte de Licencias</strong> y lo eleva a Novedades Salariales, donde se controla:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>que tenga el código de inasistencia del SESOP (o que hayas ido al SESOP el primer día);</li>
            <li>que el certificado sea del centro asistencial más cercano a tu domicilio y tenga su sello;</li>
            <li>que se presente en término (art. 54 del Decreto 505/14).</li>
          </ul>
          <p>Si falta algo de eso, la inasistencia puede quedar como injustificada. Cada licencia de salud tiene sus pasos en su ficha.</p>
          <ContactoSesop />
        </div>
      </details>
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
              <span className="flex shrink-0 flex-col items-end gap-1">
                {l.sesop && <Insignia>SESOP</Insignia>}
                {l.verificado ? <Insignia color="verde">Verificada</Insignia> : <Insignia color="ambar">Sin verificar</Insignia>}
              </span>
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
