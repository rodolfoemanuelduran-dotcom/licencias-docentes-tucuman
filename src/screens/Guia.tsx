import { useEffect, useState } from 'react';
import type { Contexto } from '../App';
import type { Licencia, Revista } from '../types';
import { GUIA, type OpcionGuia } from '../lib/guia';
import { buscarTipo } from '../lib/catalogo';
import { leerRegistro, listarRegistros } from '../lib/db';
import { calcularSaldo, corresponde, hoyISO, proximaFecha, revistaPrincipal, type UsosPrevios } from '../lib/saldos';
import { formatearFecha } from '../lib/dias';
import { refTipo } from '../components/DetalleTipo';
import { Aviso, Campo, Insignia } from '../components/ui';

/** Guía paso a paso: pregunta la situación y propone las licencias que corresponden. */
export default function Guia({ ctx }: { ctx: Contexto }) {
  const principal = revistaPrincipal(ctx.docente.escuelas);
  const [revista, setRevista] = useState<Revista | ''>(principal.revista);
  const [camino, setCamino] = useState<string[]>(['inicio']);
  const [resultado, setResultado] = useState<OpcionGuia | null>(null);
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [previos, setPrevios] = useState<UsosPrevios>({});
  const hoy = hoyISO();

  useEffect(() => {
    listarRegistros<Licencia>('licencia').then(setLicencias);
    leerRegistro<UsosPrevios>('docente', 'usos').then((u) => setPrevios(u ?? {}));
  }, []);

  const volver = () => {
    if (resultado) setResultado(null);
    else setCamino(camino.slice(0, -1));
  };
  const reiniciar = () => {
    setResultado(null);
    setCamino(['inicio']);
  };
  const pregunta = GUIA[camino[camino.length - 1]];
  const elegir = (o: OpcionGuia) => {
    if (o.ir) setCamino([...camino, o.ir]);
    else setResultado(o);
    window.scrollTo({ top: 0 });
  };

  const tipos = (resultado?.licencias ?? []).map(buscarTipo).filter((t) => t !== undefined);
  const evaluadas = tipos.map((t) => ({ t, c: corresponde(t, revista, principal.fechaIngreso, hoy) }));
  const lasQueSi = evaluadas.filter((x) => x.c.corresponde);
  const lasQueNo = evaluadas.filter((x) => !x.c.corresponde);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold">¿Qué licencia me corresponde?</h2>
      <Campo etiqueta="Tu situación de revista" ayuda="Las licencias cambian según seas titular, interino/a, suplente o contratado/a (arts. 3, 37 y 38).">
        {(p) => (
          <select {...p} value={revista} onChange={(e) => setRevista(e.target.value as Revista | '')}>
            <option value="">No sé / elegir después</option>
            <option value="titular">Titular</option>
            <option value="interino">Interino/a</option>
            <option value="suplente">Suplente</option>
            <option value="contratado">Contratado/a</option>
          </select>
        )}
      </Campo>

      {!resultado && (
        <section className="space-y-2" aria-labelledby="titulo-pregunta">
          <h3 id="titulo-pregunta" className="text-lg font-bold">
            {pregunta.titulo}
          </h3>
          {pregunta.opciones.map((o) => (
            <button key={o.texto} className="tarjeta block min-h-[56px] w-full text-left hover:bg-marca-50" onClick={() => elegir(o)}>
              <span className="block text-base font-semibold">{o.texto}</span>
              {o.ayuda && <span className="block text-sm text-slate-600">{o.ayuda}</span>}
            </button>
          ))}
        </section>
      )}

      {resultado && (
        <section className="space-y-3" aria-labelledby="titulo-resultado">
          <h3 id="titulo-resultado" className="text-lg font-bold">
            {lasQueSi.length === 1 ? 'Te corresponde esta licencia' : lasQueSi.length ? 'Estas son las licencias para tu caso' : 'No encontramos una licencia para tu situación'}
          </h3>
          {resultado.nota && <Aviso>{resultado.nota}</Aviso>}
          {lasQueSi.map(({ t }) => {
            const s = calcularSaldo(t, licencias, previos, hoy);
            const proxima = proximaFecha(t, licencias, hoy);
            return (
              <article key={t.id} className="tarjeta space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-bold">{t.nombre}</h4>
                  {!t.verificado && <Insignia color="ambar">Sin verificar</Insignia>}
                </div>
                <p className="text-sm text-slate-600">{refTipo(t)}</p>
                <p className="text-base">
                  <strong>Duración:</strong> {t.duracion}
                </p>
                <p className="text-base">
                  <strong>Goce:</strong> {t.goce}
                </p>
                <p className="text-base">
                  <strong>Plazo:</strong> {t.plazoPresentacion}
                </p>
                {s && (
                  <p className="rounded-xl bg-marca-50 p-2 text-base font-semibold text-marca-900">
                    Te quedan {s.disponibles} de {s.cupo.cantidad} {s.cupo.unidad === 'habiles' ? 'días hábiles' : 'días'} {s.periodo}.
                  </p>
                )}
                {proxima && <Aviso tipo="alerta">Podés volver a usarla desde el {formatearFecha(proxima)}.</Aviso>}
                <button className="btn-primario w-full" onClick={() => ctx.irA(`nueva/${crypto.randomUUID()}/${t.id}`)}>
                  Hacer el parte de esta licencia
                </button>
              </article>
            );
          })}
          {lasQueNo.length > 0 && (
            <details className="tarjeta">
              <summary className="min-h-[48px] cursor-pointer py-2 text-base font-semibold">Por qué no te corresponden otras</summary>
              <ul className="list-disc space-y-1 pl-5 text-base">
                {lasQueNo.map(({ t, c }) => (
                  <li key={t.id}>
                    <strong>{t.nombre}:</strong> {c.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {!lasQueSi.length && (
            <Aviso tipo="alerta">
              Para no titulares, usar una licencia no prevista puede hacerte cesar en el cargo (art. 40). Consultá en la dirección de tu escuela.
            </Aviso>
          )}
        </section>
      )}

      <div className="flex gap-3">
        {(camino.length > 1 || resultado) && (
          <button className="btn-sec flex-1" onClick={volver}>
            ← Atrás
          </button>
        )}
        {resultado && (
          <button className="btn-sec flex-1" onClick={reiniciar}>
            Empezar de nuevo
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600">Orientación según el Decreto 505/14 y sus modificatorias. No reemplaza lo que resuelva la dirección, el SESOP o la Secretaría.</p>
    </div>
  );
}
