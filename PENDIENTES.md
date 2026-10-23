# Pendientes

## 1. Parte de Licencias (resuelto en parte)
El PDF reproduce la estructura del **“Parte de Licencias” de la Dirección de Novedades Salariales** (sin logos): CUE, establecimiento, DNI, apellido y nombre, legajo, 16 plazas (IDPLAZA, turno, curso/div.), inicio y fin, código SESOP, artículo, conformidad del agente, fecha de recepción, horas de obligaciones por día y el sector de División Licencias en blanco. Se imprimen 1 a 3 originales.

- **Fuente del modelo:** copia publicada en Scribd en 2017 (“Formulario de Licencias Docentes Tucumán”). Los enlaces oficiales de la Guía de Trámites (Google Drive) dan 404 y el SIME no publica este formulario.
- **Pendiente:** confirmar en una escuela o en Novedades Salariales que es el modelo vigente y si exigen papel tamaño oficio. Si cambia, reemplazar solo `src/lib/pdf/plantillaParte.ts`.

## 2. SESOP
Los pasos de cada licencia de salud salen de la web del SESOP (copias archivadas de marzo de 2026, porque las páginas en vivo dan error 500) y del propio Parte de Licencias (Dcto. 1543/1, art. 3 inc. a y b).
- **Pendiente:** conseguir el texto del **Decreto 1543/1** para confirmar el alcance exacto del art. 3.
- **Pendiente:** confirmar el plazo de presentación en la escuela (el art. 54 habla de 24 horas; una escuela publica “dentro de los 2 días”).
- La app **no se conecta** con el SESOP: solo muestra pasos, la web y los teléfonos, y guarda el código que el docente copia.

## 3. Verificar los registros con `"verificado": false`
**28 de 30 registros** siguen en `false`. Verificados contra texto oficial: los dos de la **Ley 9254** (familiar con discapacidad: licencia y permiso horario), que además **derogó la Ley 5.806** que tenía el catálogo.

Sobre el Decreto 505: el Parte de Licencias oficial lo cita como **“Dcto 505/14”**; una copia del texto lo registra como 505/1 del 26-3-1996. Se usa “505/14” y se aclara la diferencia en la fuente. Modificatorias conocidas: 200/5-1999, 500/5-2009 y 1.441/5-2020 (maternidad 180 días; adopción y nacimiento ampliados, cantidades sin confirmar).

Dudas abiertas: mes de la licencia anual en escuelas de período especial; efecto de 500/5-2009 y 1.441/5-2020 sobre lactancia, excedencia y art. 38. El portal `leyes.tucuman.gob.ar` no respondía el 22/10/2026.

## 4. Validación legal
- Aviso “herramienta independiente, no oficial” y “Verificar en Mesa de Entradas”.
- Que el parte reproduzca la estructura del formulario oficial (sin logos ni marcas del Gobierno).
- Política de privacidad (`src/screens/Privacidad.tsx`, borrador) y pantalla de consentimiento.
- Datos de salud: el motivo es opcional, no se imprime en el parte y queda solo en el dispositivo.

## 5. Decisiones respecto del pedido original
- **Sin registro ni contraseña obligatoria** (contraseña opcional en Cuenta → Seguridad).
- **Apellido y nombre separados**, para nombrar los archivos por la inicial del apellido.
- **Datos del parte opcionales** (CUE, legajo, plazas, horas): si no se cargan, quedan en blanco para la escuela.

## 6. Publicación
Publicada en GitHub Pages desde la carpeta `docs/` (compilada localmente, subida por la web). El flujo de GitHub Actions quedó deshabilitado porque su despliegue se trababa. Para actualizar: `npm run build`, subir `dist/` a `docs/`.

## 7. Verificación realizada (22/10/2026, local)
- Vitest: 18 pruebas OK (días, validación, cifrado, base cifrada, PDF, parte con originales, casilla Art., aviso de código SESOP, datos de versiones anteriores, Ley 9254).
- Playwright: flujo completo en 390 px y 1280 px, flujo de licencia por enfermedad con SESOP y carga sin conexión: OK.
- Falta probar la instalación real en Android y iPhone.
