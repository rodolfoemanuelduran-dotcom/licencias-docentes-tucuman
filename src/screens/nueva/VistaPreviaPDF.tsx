import { useEffect, useState } from 'react';
import type { Licencia } from '../../types';
import { generarPDF } from '../../lib/pdf/generarPDF';

/** Vista previa en vivo: renderiza exactamente los mismos bytes que se descargan. */
export default function VistaPreviaPDF({ licencia }: { licencia: Licencia }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    let actual: string | null = null;
    const t = window.setTimeout(async () => {
      try {
        const bytes = await generarPDF(licencia);
        if (!vivo) return;
        actual = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
        setUrl((previa) => {
          if (previa) URL.revokeObjectURL(previa);
          return actual;
        });
        setError(false);
      } catch {
        if (vivo) setError(true);
      }
    }, 500);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [licencia]);

  useEffect(() => () => setUrl((u) => (u && URL.revokeObjectURL(u), null)), []);

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-slate-200">
      <p className="bg-white px-3 py-2 text-sm font-semibold text-slate-700">Vista previa del PDF (se actualiza mientras escribís)</p>
      {error ? (
        <p className="p-4 text-base">No se pudo armar la vista previa.</p>
      ) : url ? (
        <iframe title="Vista previa del PDF" src={url} className="h-full w-full flex-1" />
      ) : (
        <p className="p-4 text-base">Armando vista previa…</p>
      )}
    </div>
  );
}
