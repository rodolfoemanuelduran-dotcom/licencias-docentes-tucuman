import { DIAS_SEMANA, MAX_ESCUELAS, MAX_PLAZAS, escuelaNueva, type DiaSemana, type Docente, type Escuela, type Plaza, type Revista } from '../types';
import type { Errores } from '../lib/validacion';
import { Campo } from './ui';

const NOMBRE_DIA: Record<DiaSemana, string> = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie' };

/** Datos personales que se repiten en todas las licencias. */
export function FormPersonal({ valor, onCambio, errores = {} }: { valor: Docente; onCambio: (d: Docente) => void; errores?: Errores }) {
  const set = (k: 'apellido' | 'nombres' | 'dni' | 'domicilio') => (e: { target: { value: string } }) => onCambio({ ...valor, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <Campo etiqueta="Apellido (obligatorio)" error={errores.apellido}>
        {(p) => <input {...p} autoComplete="family-name" value={valor.apellido} onChange={set('apellido')} />}
      </Campo>
      <Campo etiqueta="Nombre (obligatorio)" error={errores.nombres}>
        {(p) => <input {...p} autoComplete="given-name" value={valor.nombres} onChange={set('nombres')} />}
      </Campo>
      <Campo etiqueta="DNI (obligatorio)" error={errores.dni} ayuda="Solo números, sin puntos.">
        {(p) => <input {...p} inputMode="numeric" autoComplete="off" value={valor.dni} onChange={set('dni')} />}
      </Campo>
      <Campo etiqueta="Domicilio">
        {(p) => <input {...p} autoComplete="street-address" value={valor.domicilio} onChange={set('domicilio')} />}
      </Campo>
    </div>
  );
}

function EditorEscuela({
  e,
  n,
  onCambio,
  onQuitar,
  onPrincipal,
}: {
  e: Escuela;
  n: number;
  onCambio: (e: Escuela) => void;
  onQuitar: () => void;
  onPrincipal: () => void;
}) {
  const set = (k: 'nombre' | 'cue' | 'legajo' | 'cargo') => (ev: { target: { value: string } }) => onCambio({ ...e, [k]: ev.target.value });
  const setPlaza = (i: number, k: keyof Plaza, v: string) => onCambio({ ...e, plazas: e.plazas.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  const setHora = (d: DiaSemana, v: string) => onCambio({ ...e, horas: { ...e.horas, [d]: v.replace(/[^\d.,]/g, '') } });
  return (
    <fieldset className="space-y-4 rounded-2xl border-2 border-slate-200 bg-white p-4">
      <legend className="px-1 text-base font-bold">
        Escuela {n}
        {e.nombre ? `: ${e.nombre}` : ''}
      </legend>
      <Campo etiqueta="Nombre del establecimiento">
        {(p) => <input {...p} value={e.nombre} onChange={set('nombre')} />}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="CUE">
          {(p) => <input {...p} inputMode="numeric" value={e.cue} onChange={set('cue')} />}
        </Campo>
        <Campo etiqueta="Número de legajo">
          {(p) => <input {...p} inputMode="numeric" value={e.legajo} onChange={set('legajo')} />}
        </Campo>
      </div>
      <Campo etiqueta="Cargo o materias">
        {(p) => <input {...p} value={e.cargo} onChange={set('cargo')} />}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Situación de revista" ayuda="Define qué licencias te corresponden.">
          {(p) => (
            <select {...p} value={e.revista} onChange={(ev) => onCambio({ ...e, revista: ev.target.value as Revista | '' })}>
              <option value="">Elegí una opción</option>
              <option value="titular">Titular</option>
              <option value="interino">Interino/a</option>
              <option value="suplente">Suplente</option>
              <option value="contratado">Contratado/a</option>
            </select>
          )}
        </Campo>
        <Campo etiqueta="Fecha de ingreso al cargo" ayuda="Para calcular la antigüedad.">
          {(p) => <input {...p} type="date" value={e.fechaIngreso} onChange={(ev) => onCambio({ ...e, fechaIngreso: ev.target.value })} />}
        </Campo>
      </div>
      <label className="flex min-h-[48px] items-start gap-3 text-base">
        <input type="radio" name="escuela-principal" className="mt-1 h-6 w-6 shrink-0" checked={e.principal} onChange={onPrincipal} />
        <span>
          Es la escuela donde tengo <strong>mayor antigüedad</strong> (ahí se presenta el pedido, art. 54 inc. e)
        </span>
      </label>

      <div className="space-y-2">
        <p className="text-base font-semibold">Plazas afectadas</p>
        {e.plazas.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_4.5rem_5.5rem_3rem] items-end gap-2">
            <label className="text-sm">
              IDPLAZA {i + 1}
              <input className="input" inputMode="numeric" value={p.idPlaza} onChange={(ev) => setPlaza(i, 'idPlaza', ev.target.value)} />
            </label>
            <label className="text-sm">
              Turno
              <input className="input !px-2" value={p.turno} onChange={(ev) => setPlaza(i, 'turno', ev.target.value)} />
            </label>
            <label className="text-sm">
              Curso/div.
              <input className="input !px-2" value={p.cursoDiv} onChange={(ev) => setPlaza(i, 'cursoDiv', ev.target.value)} />
            </label>
            <button
              type="button"
              className="btn-sec !min-h-[48px] !px-0 !text-red-700"
              aria-label={`Quitar plaza ${i + 1} de la escuela ${n}`}
              onClick={() => onCambio({ ...e, plazas: e.plazas.filter((_, j) => j !== i) })}
            >
              ✕
            </button>
          </div>
        ))}
        {e.plazas.length < MAX_PLAZAS && (
          <button type="button" className="btn-sec w-full" onClick={() => onCambio({ ...e, plazas: [...e.plazas, { idPlaza: '', turno: '', cursoDiv: '' }] })}>
            + Agregar plaza
          </button>
        )}
      </div>

      <div>
        <p className="text-base font-semibold">Horas de obligaciones por día</p>
        <p className="mb-2 text-sm text-slate-600">El parte pide detallarlas en todos los casos.</p>
        <div className="grid grid-cols-5 gap-2">
          {DIAS_SEMANA.map((d) => (
            <label key={d} className="text-center text-sm">
              {NOMBRE_DIA[d]}
              <input className="input !px-1 text-center" inputMode="decimal" value={e.horas[d]} onChange={(ev) => setHora(d, ev.target.value)} />
            </label>
          ))}
        </div>
      </div>
      <button type="button" className="btn-sec w-full !text-red-700" onClick={onQuitar}>
        Quitar esta escuela
      </button>
    </fieldset>
  );
}

/** Lista de escuelas del docente (suelen ser 2 o 3). */
export function EscuelasEditor({ valor, onCambio }: { valor: Docente; onCambio: (d: Docente) => void }) {
  const escuelas = valor.escuelas;
  const cambiar = (lista: Escuela[]) => {
    if (lista.length && !lista.some((e) => e.principal)) lista = lista.map((e, i) => ({ ...e, principal: i === 0 }));
    onCambio({ ...valor, escuelas: lista });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Cargá una vez cada escuela donde trabajás. Si no sabés el CUE, el legajo o las plazas, dejalos vacíos: los completa la escuela en el parte.
      </p>
      {escuelas.map((e, i) => (
        <EditorEscuela
          key={e.id}
          e={e}
          n={i + 1}
          onCambio={(nueva) => cambiar(escuelas.map((x) => (x.id === e.id ? nueva : x)))}
          onQuitar={() => cambiar(escuelas.filter((x) => x.id !== e.id))}
          onPrincipal={() => cambiar(escuelas.map((x) => ({ ...x, principal: x.id === e.id })))}
        />
      ))}
      {escuelas.length < MAX_ESCUELAS && (
        <button type="button" className="btn-sec w-full" onClick={() => cambiar([...escuelas, escuelaNueva(escuelas.length === 0)])}>
          + Agregar escuela
        </button>
      )}
    </div>
  );
}

/** Formulario completo (Cuenta): datos personales y escuelas. */
export default function FormDocente({ valor, onCambio, errores = {} }: { valor: Docente; onCambio: (d: Docente) => void; errores?: Errores }) {
  return (
    <div className="space-y-6">
      <FormPersonal valor={valor} onCambio={onCambio} errores={errores} />
      <div className="space-y-3">
        <h4 className="text-lg font-bold">Mis escuelas</h4>
        <EscuelasEditor valor={valor} onCambio={onCambio} />
      </div>
    </div>
  );
}
