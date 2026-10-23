import { useEffect, useRef, useState, type PointerEvent } from 'react';

const TINTA = '#1d3fa6';

/** Recorta el lienzo al área dibujada y devuelve un PNG en base64 (sin prefijo), o '' si está vacío. */
function exportar(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = canvas;
  const px = ctx.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return '';
  const m = 6;
  x0 = Math.max(0, x0 - m);
  y0 = Math.max(0, y0 - m);
  x1 = Math.min(w - 1, x1 + m);
  y1 = Math.min(h - 1, y1 + m);
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d')!.drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png').split(',')[1];
}

/** Panel para dibujar la firma con el dedo, el lápiz o el mouse. */
export default function FirmaPad({ valor, onCambio }: { valor: string; onCambio: (png: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const [vacio, setVacio] = useState(!valor);

  // Ajusta la resolución al tamaño real y redibuja la firma guardada.
  useEffect(() => {
    const c = canvas.current!;
    const escala = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * escala);
    c.height = Math.round(r.height * escala);
    const ctx = c.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 2.6 * escala;
    if (valor) {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(c.width / img.width, c.height / img.height, 1);
        ctx.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);
      };
      img.src = `data:image/png;base64,${valor}`;
    }
    // Solo al montar: después el lienzo es la fuente de verdad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const punto = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = canvas.current!.getBoundingClientRect();
    const escala = canvas.current!.width / r.width;
    return { x: (e.clientX - r.left) * escala, y: (e.clientY - r.top) * escala };
  };

  const empezar = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    ultimo.current = punto(e);
  };
  const mover = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current || !ultimo.current) return;
    const p = punto(e);
    const ctx = canvas.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
    setVacio(false);
  };
  const terminar = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    ultimo.current = null;
    onCambio(exportar(canvas.current!));
  };
  const borrar = () => {
    const c = canvas.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setVacio(true);
    onCambio('');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvas}
          aria-label="Panel para dibujar tu firma"
          role="img"
          className="h-44 w-full touch-none rounded-xl border-2 border-dashed border-slate-400 bg-white"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
        />
        {vacio && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-base text-slate-500">Firmá acá con el dedo o el mouse</p>}
        <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-slate-300" />
      </div>
      <button type="button" className="btn-sec w-full" onClick={borrar}>
        Borrar firma
      </button>
    </div>
  );
}
