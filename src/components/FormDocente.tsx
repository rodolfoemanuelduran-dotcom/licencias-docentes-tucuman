import { DIAS_SEMANA, MAX_PLAZAS, type DiaSemana, type Docente, type Plaza } from '../types';
import type { Errores } from '../lib/validacion';
import { Campo } from './ui';

const NOMBRE_DIA: Record<DiaSemana, string> = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie' };

export default function FormDocente({ valor, onCambio, errores = {} }: { valor: Docente; onCambio: (d: Docente) => void; errores?: Errores }) {
  const set = (k: keyof Docente) => (e: { target: { value: string } }) => onCambio({ ...valor, [k]: e.target.value });
  const plazas = valor.plazas ?? [];
  const setPlaza = (i: number, k: keyof Plaza, v: string) => onCambio({ ...valor, plazas: plazas.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  const setHora = (d: DiaSemana, v: string) => onCambio({ ...valor, horas: { ...valor.horas, [d]: v.replace(/[^\d.,]/g, '') } });

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
      <Campo etiqueta="Escuela (nombre del establecimiento)">
        {(p) => <input {...p} value={valor.escuela} onChange={set('escuela')} />}
      </Campo>
      <Campo etiqueta="Cargo">
        {(p) => <input {...p} value={valor.cargo} onChange={set('cargo')} />}
      </Campo>

      <details className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3" open={!!(valor.cue || valor.legajo || plazas.length)}>
        <summary className="min-h-[48px] cursor-pointer py-3 text-base font-semibold">Datos para el Parte de Licencias (opcionales)</summary>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600">
            El parte tiene un sector que completa la escuela. Si sabés estos datos, cargalos una vez y quedan guardados; si no, quedan en blanco.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="CUE de la escuela">
              {(p) => <input {...p} inputMode="numeric" value={valor.cue} onChange={set('cue')} />}
            </Campo>
            <Campo etiqueta="Número de legajo">
              {(p) => <input {...p} inputMode="numeric" value={valor.legajo} onChange={set('legajo')} />}
            </Campo>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-base font-semibold">Plazas afectadas (todas las de esta escuela)</legend>
            {plazas.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_5.5rem_3rem] items-end gap-2">
                <label className="text-sm">
                  IDPLAZA {i + 1}
                  <input className="input" inputMode="numeric" value={p.idPlaza} onChange={(e) => setPlaza(i, 'idPlaza', e.target.value)} />
                </label>
                <label className="text-sm">
                  Turno
                  <input className="input !px-2" value={p.turno} onChange={(e) => setPlaza(i, 'turno', e.target.value)} />
                </label>
                <label className="text-sm">
                  Curso/div.
                  <input className="input !px-2" value={p.cursoDiv} onChange={(e) => setPlaza(i, 'cursoDiv', e.target.value)} />
                </label>
                <button
                  type="button"
                  className="btn-sec !min-h-[48px] !px-0 !text-red-700"
                  aria-label={`Quitar plaza ${i + 1}`}
                  onClick={() => onCambio({ ...valor, plazas: plazas.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </div>
            ))}
            {plazas.length < MAX_PLAZAS && (
              <button type="button" className="btn-sec w-full" onClick={() => onCambio({ ...valor, plazas: [...plazas, { idPlaza: '', turno: '', cursoDiv: '' }] })}>
                + Agregar plaza
              </button>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-base font-semibold">Horas de obligaciones por día</legend>
            <p className="mb-2 text-sm text-slate-600">El parte pide detallarlas en todos los casos.</p>
            <div className="grid grid-cols-5 gap-2">
              {DIAS_SEMANA.map((d) => (
                <label key={d} className="text-center text-sm">
                  {NOMBRE_DIA[d]}
                  <input className="input !px-1 text-center" inputMode="decimal" value={valor.horas[d]} onChange={(e) => setHora(d, e.target.value)} />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  );
}
