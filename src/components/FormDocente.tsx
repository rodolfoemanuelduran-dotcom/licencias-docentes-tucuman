import type { Docente } from '../types';
import type { Errores } from '../lib/validacion';
import { Campo } from './ui';

export default function FormDocente({ valor, onCambio, errores = {} }: { valor: Docente; onCambio: (d: Docente) => void; errores?: Errores }) {
  const set = (k: keyof Docente) => (e: { target: { value: string } }) => onCambio({ ...valor, [k]: e.target.value });
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
      <Campo etiqueta="Escuela">
        {(p) => <input {...p} value={valor.escuela} onChange={set('escuela')} />}
      </Campo>
      <Campo etiqueta="Cargo">
        {(p) => <input {...p} value={valor.cargo} onChange={set('cargo')} />}
      </Campo>
    </div>
  );
}
