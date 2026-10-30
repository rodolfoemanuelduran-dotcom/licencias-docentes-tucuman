# Licencias Docentes Tucumán

Aplicación web progresiva (PWA) para que docentes de Tucumán completen su parte de licencia desde el celular o la computadora y descarguen un PDF listo para imprimir o enviar a la escuela.

> **Herramienta independiente, no oficial.** No usa logos, colores ni tipografías institucionales, no se conecta con CIME ni con ningún sistema del Estado y no envía datos a ningún servidor: todo se procesa y se guarda en el dispositivo.

## Para docentes

### Instalar la app

La app funciona en el navegador, pero conviene instalarla para tenerla como una aplicación más (y que ande sin conexión).

- **Android (Chrome):** abrí la dirección de la app → menú ⋮ → **Agregar a la pantalla de inicio** (o **Instalar app**).
- **iPhone (Safari):** abrí la dirección en Safari → tocá **Compartir** (cuadrado con flecha) → **Agregar a inicio**.
- **PC (Chrome o Edge):** en la barra de direcciones, tocá el ícono de instalación (monitor con flecha) → **Instalar**.

### Cómo se usa

1. La primera vez leés y aceptás cómo se guardan los datos. **No hace falta registrarse.**
2. **Nueva licencia** → seis pasos con guardado automático: tipo, datos, detalles (con la guía del SESOP en las licencias de salud), documentación, revisión y descarga del **Parte de Licencias**.
3. **Mis licencias** → descargar de nuevo, duplicar o eliminar.
   - **¿Qué licencia me corresponde?** → guía con preguntas según tu situación de revista.
   - **Mis disponibles** → cuántos días te quedan de cada licencia con tope.
   - Cada licencia genera PDF separados: un parte por escuela, el certificado médico y el código del SESOP.
4. **Cuenta** → tus datos, tus escuelas (podés cargar varias), tu firma, contraseña opcional, carpeta “Mis licencias”, copia de seguridad y borrado total.

### Carpeta “Mis licencias” y nombres de archivo

Los PDF se llaman `Inicial_Apellido_Nombre_art…_fecha.pdf` (por ejemplo `G_Gomez_Juan-Pablo_art23c-duelo-fallecimiento-de-fami_2026-10-05.pdf`), así quedan ordenados por la primera letra del apellido.

- En **Chrome o Edge de PC**: en *Cuenta → Carpeta “Mis licencias”* elegís (o creás) la carpeta y los PDF se guardan ahí directamente.
- En **celular y otros navegadores**: el PDF se descarga con el mismo nombre a la carpeta de descargas; después podés moverlo a una carpeta “Mis licencias”.

### Contraseña (opcional)

No se pide al empezar. Si querés, en *Cuenta → Seguridad* activás una contraseña y todo se guarda cifrado (AES-GCM, clave con PBKDF2 de 600.000 iteraciones). **Si la perdés, los datos no se pueden recuperar.** Con contraseña activa hay bloqueo automático por inactividad.

### Copia de seguridad

*Cuenta → Copia de seguridad* exporta un archivo siempre cifrado con la contraseña que elijas. Si borrás los datos del navegador o cambiás de dispositivo, perdés lo guardado salvo que tengas esa copia.

## Para desarrolladores

Stack: Vite + React + TypeScript, Tailwind CSS 3, vite-plugin-pwa, pdf-lib, Dexie, Web Crypto, Vitest y Playwright.

```bash
npm install
npm run dev        # desarrollo
npm run build      # producción (carpeta dist/)
npm run preview    # sirve dist/ en http://localhost:4173
npm test           # Vitest (unitarias)
npx playwright install chromium   # una sola vez
npm run test:e2e   # Playwright (390 px y 1280 px, y modo sin conexión)
```

### Estructura

```
src/data/licencias.json     catálogo (única fuente de datos de licencias)
src/lib/dias.ts             cálculo de días
src/lib/validacion.ts       obligatorios y advertencias por tipo
src/lib/cripto.ts           AES-GCM + PBKDF2
src/lib/db.ts               Dexie; cifrado opcional, copias de seguridad
src/lib/archivo.ts          nombre de archivo y carpeta “Mis licencias”
src/lib/pdf/generarPDF.ts   generarPDF(licencia) → Uint8Array
src/lib/pdf/plantillaParte.ts  Parte de Licencias (estructura del formulario de Novedades Salariales)
src/lib/pdf/adjuntos.ts     adjuntos como páginas siguientes, en orden de carga
src/screens/               pantallas; nueva/ tiene los seis pasos y la vista previa
```

### Reglas del proyecto

- Toda la información de licencias sale de `src/data/licencias.json`. Un registro con `"verificado": false` muestra “Verificar en Mesa de Entradas antes de presentar”.
- Sin analítica ni scripts de terceros. CSP estricta en `index.html` y en los encabezados (`netlify.toml`, `public/_headers`), con `connect-src 'none'` en producción.
- Interfaz en español rioplatense (voseo).
- Cambiar la plantilla del PDF: reemplazar solo `plantillaParte.ts` (mismo contrato `dibujarParte`).

### Despliegue en GitHub Pages (listo para usar)

El proyecto usa rutas relativas (`base: './'`), así que funciona en `https://USUARIO.github.io/REPOSITORIO/`.

1. Subí el proyecto a un repositorio de GitHub (rama `main`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El flujo `.github/workflows/pages.yml` corre las pruebas, compila y publica en cada push a `main`. La dirección final aparece en la pestaña **Actions** y en Settings → Pages.

GitHub Pages no permite encabezados HTTP personalizados; la política de seguridad (CSP) queda aplicada por la etiqueta `<meta>` de `index.html`. Para aplicar los encabezados completos usá Netlify o Cloudflare Pages.

### Despliegue (Netlify o Cloudflare Pages)

La PWA necesita HTTPS para instalarse; ambos lo dan gratis.

- **Netlify:** conectar el repositorio (o arrastrar la carpeta `dist/` en *Deploys*). `netlify.toml` ya define build y encabezados.
- **Cloudflare Pages:** comando de build `npm run build`, directorio de salida `dist`. `public/_headers` aplica los encabezados.

### Verificación hecha

Ver `PENDIENTES.md`.
