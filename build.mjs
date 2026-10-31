// Construye dist/index.html: una sola página que funciona sin internet.
// - Inserta las librerías (ExcelJS, jsPDF, jsPDF-AutoTable) dentro del HTML.
// - Inserta el logo y la plantilla Excel original en base64.
// - Lee el listado de equipos (N° y ubicación) directamente de la plantilla Excel,
//   así que si cambian el Excel solo hay que volver a desplegar.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { build } from 'esbuild';

const read = (p) => readFileSync(p, 'utf8');
const lib = (pkg, file) => read(`node_modules/${pkg}/${file}`);

const TEMPLATE = 'assets/plantilla_inspeccion.xlsx';
const HOJAS = ['DETECTORES', 'ALARMAS', 'LÁMPARAS'];

async function leerEquipos() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  const out = {};
  for (const nombre of HOJAS) {
    const ws = wb.getWorksheet(nombre);
    if (!ws) throw new Error(`La plantilla no tiene la hoja "${nombre}"`);
    const items = [];
    ws.eachRow((row, rn) => {
      if (rn < 8) return; // filas 1-7 son encabezado del formato
      const n = row.getCell(1).value;
      const ubic = row.getCell(3).value;
      if (typeof n === 'number' && ubic != null) {
        const txt = typeof ubic === 'object' && ubic.richText ? ubic.richText.map((t) => t.text).join('') : String(ubic);
        items.push([n, txt.trim()]);
      }
    });
    out[nombre] = items;
    console.log(`  ${nombre}: ${items.length} equipos`);
  }
  return out;
}

// Configuración de Firebase (opcional). En Render se pone en Environment → FIREBASE_CONFIG.
// Acepta el bloque que da Firebase, con o sin "const firebaseConfig =".
function leerConfigNube() {
  let raw = (process.env.FIREBASE_CONFIG || '').trim();
  if (!raw) { console.log('  Nube: NO configurada (cada dispositivo guarda lo suyo)'); return null; }
  raw = raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''); // quita "const firebaseConfig =" y ";"
  let cfg;
  try { cfg = JSON.parse(raw); }
  catch { cfg = Function(`"use strict"; return (${raw});`)(); } // permite claves sin comillas
  for (const k of ['apiKey', 'authDomain', 'projectId', 'appId']) if (!cfg[k]) throw new Error(`FIREBASE_CONFIG no tiene "${k}"`);
  console.log(`  Nube: Firebase proyecto "${cfg.projectId}"${cfg.emulator ? ' (EMULADOR)' : ''}`);
  return cfg;
}

const equipos = await leerEquipos();
const nube = leerConfigNube();
let libNube = '';
if (nube) {
  const r = await build({ entryPoints: ['src/cloud.js'], bundle: true, minify: true, format: 'iife', target: 'es2019', write: false, legalComments: 'none' });
  libNube = r.outputFiles[0].text;
}
let html = read('src/app.html');
const reemplazos = {
  '/*LIB_EXCELJS*/': lib('exceljs', 'dist/exceljs.min.js'),
  '/*LIB_JSPDF*/': lib('jspdf', 'dist/jspdf.umd.min.js'),
  '/*LIB_AUTOTABLE*/': lib('jspdf-autotable', 'dist/jspdf.plugin.autotable.min.js'),
  '/*LOGO_B64*/': readFileSync('assets/logo.png').toString('base64'),
  '/*TEMPLATE_B64*/': readFileSync(TEMPLATE).toString('base64'),
  '/*EQUIPOS_JSON*/': JSON.stringify(equipos),
  '/*LIB_CLOUD*/': libNube.replace(/<\/script/gi, '<\\/script'),
  '/*CLOUD_CONFIG*/null': nube ? JSON.stringify(nube) : 'null',
};
for (const [k, v] of Object.entries(reemplazos)) {
  if (html.split(k).length !== 2) throw new Error(`Marcador ${k} no encontrado una sola vez en src/app.html`);
  html = html.split(k).join(v);
}

if (existsSync('dist')) rmSync('dist', { recursive: true });
mkdirSync('dist');
writeFileSync('dist/index.html', html);
cpSync('public', 'dist', { recursive: true });
// Versión del caché offline = fecha de compilación, para que los teléfonos tomen la versión nueva
const sw = read('dist/sw.js').replace('__VERSION__', new Date().toISOString());
writeFileSync('dist/sw.js', sw);
console.log(`Listo: dist/index.html (${(html.length / 1e6).toFixed(2)} MB)`);
