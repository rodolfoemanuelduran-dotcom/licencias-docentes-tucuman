import { useId, useRef, useState, type DragEvent } from 'react';
import { categoriaDe, type Adjunto, type CategoriaAdjunto, type Licencia } from '../types';
import { buscarTipo } from '../lib/catalogo';
import { procesarArchivo } from '../lib/imagen';
import { Aviso } from './ui';

interface Props {
  lic: Licencia;
  cambiar: (p: Partial<Licencia>) => void;
}

function Casilla({ lic, cambiar, categoria, titulo, ayuda }: Props & { categoria: CategoriaAdjunto; titulo: string; ayuda: string }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const idTitulo = useId();
  const propios = lic.adjuntos.filter((a) => categoriaDe(a) === categoria);

  async function agregar(files: FileList | File[]) {
    setTrabajando(true);
    setError('');
    const nuevos: Adjunto[] = [];
    for (const f of Array.from(files)) {
      try {
        nuevos.push({ ...(await procesarArchivo(f)), categoria });
      } catch (e) {
        setError((e as Error).message);
      }
    }
    cambiar({ adjuntos: [...lic.adjuntos, ...nuevos] });
    setTrabajando(false);
    if (input.current) input.current.value = '';
    if (camara.current) camara.current.value = '';
  }
  /** Mueve un adjunto dentro de su casilla. */
  const mover = (a: Adjunto, d: number) => {
    const i = propios.indexOf(a);
    const otro = propios[i + d];
    if (!otro) return;
    const lista = [...lic.adjuntos];
    const x = lista.indexOf(a);
    const y = lista.indexOf(otro);
    [lista[x], lista[y]] = [lista[y], lista[x]];
    cambiar({ adjuntos: lista });
  };
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files.length) agregar(e.dataTransfer.files);
  };

  return (
    <section
      aria-labelledby={idTitulo}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={soltar}
      className={`space-y-3 rounded-2xl border-2 p-4 ${arrastrando ? 'border-marca-600 bg-marca-50' : propios.length ? 'border-green-600 bg-green-50' : 'border-dashed border-slate-400 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={idTitulo} className="text-lg font-bold">
          {titulo}
        </h3>
        {propios.length > 0 && <span className="shrink-0 rounded-full bg-green-700 px-3 py-1 text-sm font-semibold text-white">✓ Cargado</span>}
      </div>
      <p className="text-sm text-slate-700">{ayuda}</p>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="sr-only"
        aria-label={`Adjuntar: ${titulo}`}
        onChange={(e) => e.target.files && agregar(e.target.files)}
      />
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label={`Sacar foto: ${titulo}`}
        onChange={(e) => e.target.files && agregar(e.target.files)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="btn-primario" onClick={() => camara.current?.click()} disabled={trabajando}>
          {trabajando ? 'Procesando…' : propios.length ? '📷 Sacar otra foto' : '📷 Sacar foto'}
        </button>
        <button className="btn-sec" onClick={() => input.current?.click()} disabled={trabajando}>
          Elegir archivo
        </button>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {propios.length > 0 && (
        <ol className="space-y-2">
          {propios.map((a, i) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-white p-2">
              {a.tipo === 'imagen' ? (
                <img src={`data:${a.mime};base64,${a.datos}`} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="text-3xl" aria-hidden>
                  📄
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-base">{a.nombre}</span>
              {propios.length > 1 && (
                <>
                  <button className="btn-sec !min-h-[48px] !px-3" disabled={i === 0} onClick={() => mover(a, -1)} aria-label={`Subir ${a.nombre}`}>
                    ↑
                  </button>
                  <button className="btn-sec !min-h-[48px] !px-3" disabled={i === propios.length - 1} onClick={() => mover(a, 1)} aria-label={`Bajar ${a.nombre}`}>
                    ↓
                  </button>
                </>
              )}
              <button
                className="btn-sec !min-h-[48px] !px-3 !text-red-700"
                onClick={() => cambiar({ adjuntos: lic.adjuntos.filter((x) => x.id !== a.id) })}
                aria-label={`Quitar ${a.nombre}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export const AYUDA_CERTIFICADO =
  'Foto clara de frente o PDF del certificado original: membrete, lugar y fecha, tu nombre y DNI, diagnóstico, días de reposo, firma, sello y matrícula del médico.';
export const AYUDA_SESOP = 'Captura de pantalla de la web del SESOP con el código de inasistencia, o foto de la constancia que te dio el SESOP.';

/**
 * Casillas de documentación. En las licencias de salud: certificado médico y código del SESOP por separado.
 * Con `soloSalud`, muestra solo esas dos (para cargarlas después de llenar el parte).
 */
export default function Documentacion({ lic, cambiar, soloSalud = false }: Props & { soloSalud?: boolean }) {
  const tipo = buscarTipo(lic.tipoId);
  const salud = !!tipo?.sesop?.codigo;
  if (soloSalud && !salud) return null;
  return (
    <div className="space-y-4">
      {salud && (
        <>
          <Casilla lic={lic} cambiar={cambiar} categoria="certificado" titulo="1. Certificado médico" ayuda={AYUDA_CERTIFICADO} />
          <Casilla lic={lic} cambiar={cambiar} categoria="sesop" titulo="2. Código o constancia del SESOP" ayuda={AYUDA_SESOP} />
        </>
      )}
      {!soloSalud && (
        <Casilla
          lic={lic}
          cambiar={cambiar}
          categoria="otro"
          titulo={salud ? '3. Otros documentos (opcional)' : 'Documentación'}
          ayuda={
            salud
              ? 'Estudios médicos u otra documentación que quieras sumar.'
              : tipo?.documentacion.length
                ? `Esta licencia pide: ${tipo.documentacion.join('; ')}.`
                : 'Si tenés algún comprobante, adjuntalo acá (opcional).'
          }
        />
      )}
      <p className="text-sm text-slate-600">
        {salud ? 'El certificado y el código del SESOP salen cada uno en su propio PDF, separados del parte.' : 'La documentación sale en un PDF aparte del parte.'} Las fotos se
        ajustan en tu dispositivo antes de guardarse.
      </p>
    </div>
  );
}
