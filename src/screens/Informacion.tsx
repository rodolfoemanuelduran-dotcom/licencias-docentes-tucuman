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
        <strong>Sobre las fuentes:</strong> los datos salen de los textos oficiales del Decreto 505/14 (MGEyJ) de 1996 y de sus modificatorias 500/5-2009
        y 1.441/5-2020, y de la Ley 9254, todos del repositorio de leyes y decretos de Tucumán (verificados el 22/10/2026). Dos tipos todavía no se pudieron
        verificar (están marcados). Los pasos del SESOP salen de su web. Ante cualquier duda, consultá en la escuela o en Mesa de Entradas.
      </Aviso>
      <details className="tarjeta">
        <summary className="min-h-[48px] cursor-pointer py-2 text-lg font-bold">¿Cómo se presenta una licencia?</summary>
        <div className="space-y-3 pt-2 text-base">
          <p>
            <strong>Sí: toda licencia o inasistencia se pide por escrito en el formulario reglamentario</strong>, que hoy es el <strong>Parte de Licencias</strong>,
            y se presenta al superior inmediato (la dirección de tu escuela). Así lo fija el art. 54 del Decreto 505/14.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Si es previsible</strong> (matrimonio, examen, congreso, razones particulares…): presentá el parte antes, con la anticipación que pide cada
              licencia.
            </li>
            <li>
              <strong>Si es imprevisible</strong> (enfermedad, duelo, accidente): avisá a la escuela dentro de las 2 primeras horas y presentá el parte dentro de las
              24 horas del primer día. El atraso cuenta como inasistencia injustificada, salvo que no sea culpa tuya.
            </li>
            <li>
              <strong>Junto con la documentación</strong> que corresponda (constancia o código del SESOP, certificado, acta, etc.). La dirección no da curso a un parte
              incompleto y lo envía a Mesa de Entradas dentro de las 24 horas.
            </li>
            <li>
              <strong>Si trabajás en dos o más escuelas</strong>, presentás el pedido en la de mayor antigüedad, que avisa a las demás (art. 54 inc. e). La app arma un
              parte por escuela, con sus plazas, para que tengas uno para cada dirección.
            </li>
            <li>
              <strong>Quién la concede</strong> (art. 57): la dirección concede la licencia anual, corto tratamiento, matrimonio, nacimiento, duelo y franquicias. El
              área administrativa de la Secretaría concede largo tratamiento, accidente, maternidad, adopción, excedencia y donación de órganos, según el informe del
              SESOP. Las extraordinarias también las concede la Secretaría, y no podés usarlas hasta que te notifiquen.
            </li>
            <li>
              Algunos trámites llevan además una nota o un formulario propio (por ejemplo, cargo de mayor jerarquía o cobro de la asignación de la Ley 9254). Están en la
              Guía de Trámites del SIME.
            </li>
          </ul>
          <p className="text-sm text-slate-600">
            Fuentes: Decreto 505/14 (MGEyJ), arts. 54 a 57 (texto oficial); ATEP, “Nuevo parte de licencia para presentar en la escuela en caso de inasistencia”
            (2017).
          </p>
        </div>
      </details>
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
