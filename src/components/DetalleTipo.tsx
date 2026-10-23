import type { LicenciaCatalogo } from '../types';
import { AvisoVerificar } from './ui';
import GuiaSesop from './GuiaSesop';

const Lista = ({ items, vacio }: { items: string[]; vacio: string }) =>
  items.length ? (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <p className="text-slate-600">{vacio}</p>
  );

export const refTipo = (t: LicenciaCatalogo) =>
  t.articulo.startsWith('Ley') ? `${t.articulo}${t.inciso ? `, ${t.inciso}` : ''}` : `Art. ${t.articulo}${t.inciso ? ` inc. ${t.inciso}` : ''}`;

export default function DetalleTipo({ tipo }: { tipo: LicenciaCatalogo }) {
  return (
    <div className="space-y-4 text-base">
      {!tipo.verificado && <AvisoVerificar />}
      <dl className="space-y-3">
        <div>
          <dt className="font-bold">Referencia</dt>
          <dd>{refTipo(tipo)}</dd>
        </div>
        <div>
          <dt className="font-bold">Duración</dt>
          <dd>{tipo.duracion}</dd>
        </div>
        <div>
          <dt className="font-bold">Goce de haberes</dt>
          <dd>{tipo.goce}</dd>
        </div>
        {tipo.concede && (
          <div>
            <dt className="font-bold">Quién la concede</dt>
            <dd>{tipo.concede}</dd>
          </div>
        )}
        <div>
          <dt className="font-bold">Plazo de presentación</dt>
          <dd>{tipo.plazoPresentacion || 'No consta en la fuente.'}</dd>
        </div>
      </dl>
      <div>
        <h3 className="font-bold">Requisitos</h3>
        <Lista items={tipo.requisitos} vacio="La fuente no indica requisitos particulares." />
      </div>
      <div>
        <h3 className="font-bold">Documentación necesaria</h3>
        <Lista items={tipo.documentacion} vacio="La fuente no indica documentación particular." />
      </div>
      {tipo.sesop && (
        <div className="rounded-xl border-2 border-marca-600/30 bg-marca-50 p-3">
          <h3 className="mb-2 font-bold">Trámite en el SESOP</h3>
          <GuiaSesop guia={tipo.sesop} contacto={false} />
        </div>
      )}
      {tipo.notas && (
        <div>
          <h3 className="font-bold">Notas</h3>
          <p>{tipo.notas}</p>
        </div>
      )}
      <p className="text-sm text-slate-600">Fuente: {tipo.fuente}</p>
    </div>
  );
}
