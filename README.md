# Sistema SOS FIRE · Inspección Decameron

App para hacer desde el teléfono la inspección de **detectores de humo**, **alarmas de emergencia** (estaciones manuales) y **lámparas de emergencia**. Reemplaza las hojas impresas y genera el reporte en **Excel** y **PDF** con el mismo formato que se usa hoy.

## Qué hace

- Tres pestañas separadas: Detectores (239), Alarmas (89) y Lámparas (205), tomadas del Excel original.
- Búsqueda rápida sin importar tildes ni mayúsculas: "guardalino 20", "cocina oliva", "145". Con Enter se abre el primer resultado.
- Se marca con ✓ / ✕ / N/A por criterio, con comentarios rápidos. El botón **✓ OK** de la lista guarda un equipo en buen estado con un solo toque.
- Filtros de Pendientes, Con falla y OK, y avance por tipo.
- **Corregir marcas:** los equipos ya marcados muestran **✎ Editar** para cambiar checks y comentarios. Desde *Reporte → Hallazgos* también se toca una falla para corregirla. Cada guardado tiene **Deshacer** por unos segundos, y el equipo queda señalado como "corregido" (la app guarda las últimas 5 versiones).
- Fecha, técnico, encargado y **firmas con el dedo**.
- **Excel:** llena la plantilla original (`assets/plantilla_inspeccion.xlsx`) con logo, colores y las tres hojas.
- **PDF:** página de resumen con los hallazgos y una sección por tipo, con el mismo diseño.
- **Varios técnicos:** cada uno exporta su respaldo (.json) y la encargada los une. Si dos marcaron el mismo equipo, queda la marca más reciente.
- Funciona **sin internet**: los datos se guardan en el teléfono y la app se puede instalar en la pantalla de inicio.

> Importante: en esta versión los datos viven en el navegador de cada teléfono. Si se borran los datos del navegador, se pierde lo que no se haya exportado. Hay que exportar el respaldo o el reporte al terminar.

## Estructura

```
src/app.html                  Código de la app (HTML, CSS y JavaScript)
assets/plantilla_inspeccion.xlsx   Formato Excel original; de aquí sale el listado de equipos
assets/logo.png               Logo SOS FIRE
public/                       Manifest, íconos y service worker (modo app y sin internet)
build.mjs                     Une todo en dist/index.html
render.yaml                   Configuración para Render
```

## Probar en la computadora

Requiere Node.js 18 o más reciente.

```bash
npm install
npm run build      # genera dist/index.html
npm start          # abre http://localhost:3000
```

También se puede abrir `dist/index.html` con doble clic. Funciona igual, solo que sin el modo "instalar app".

## Cambiar el listado de equipos

1. Edite el Excel `assets/plantilla_inspeccion.xlsx`. Respete las hojas `DETECTORES`, `ALARMAS` y `LÁMPARAS`, el N° en la columna A y la ubicación en la columna C, desde la fila 8.
2. Súbalo al repositorio (commit + push). Render vuelve a publicar solo y los teléfonos reciben la versión nueva la próxima vez que abran la app con internet.

## Publicar en Render (Static Site, gratis)

**Opción A – Blueprint (usa `render.yaml`)**
1. Entre a https://dashboard.render.com e inicie sesión con GitHub.
2. Toque **New +** → **Blueprint**.
3. Conecte el repositorio `SISTEMA-SOS-FIRE` y toque **Apply**.

**Opción B – Manual**
1. **New +** → **Static Site** → elija el repositorio `SISTEMA-SOS-FIRE`.
2. Llene así:
   - Name: `sistema-sos-fire`
   - Branch: `main`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
3. Toque **Create Static Site** y espere a que diga **Live** (1–3 minutos).

La app queda en una dirección como `https://sistema-sos-fire.onrender.com`.

## Instalar en los teléfonos

- **Android (Chrome):** abra el enlace → menú ⋮ → **Agregar a pantalla principal** / **Instalar app**.
- **iPhone (Safari):** abra el enlace → botón Compartir → **Agregar a inicio**.

Abra la app una vez con internet. Después funciona sin señal.
