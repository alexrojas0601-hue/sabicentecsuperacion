// Prueba del generador procedural de fichas: node scripts/test-taller-mate.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TM = require(path.join(raiz, 'taller-mate.js'));

let pruebas = 0, fallos = 0;
const errores = [];
function ok(cond, msg) { pruebas++; if (!cond) { fallos++; if (errores.length < 40) errores.push(msg); } }

const MALO = /NaN|undefined|Infinity|\[object|\bnull\b/;
function svgBienFormado(s) {
  if (typeof s !== 'string' || !s.startsWith('<svg') || !s.trimEnd().endsWith('</svg>') || !/viewBox="[\d.\s-]+"/.test(s)) return false;
  const pila = [], re = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(s))) {
    if (m[1]) { if (pila.pop() !== m[2]) return false; }
    else if (!m[4]) pila.push(m[2]);
  }
  return pila.length === 0;
}
function revisarTexto(v, donde) { ok(typeof v === 'string' && v.length > 0, donde + ': texto vacío'); ok(!MALO.test(String(v)), donde + ': contiene valor inválido -> ' + String(v).slice(0, 160)); }
const num = (s) => Number(String(s).replace(/\./g, '').replace(',', '.').replace(/[()]/g, ''));

function revisarFicha(f, cfg, cant) {
  const id = JSON.stringify(cfg);
  ['titulo', 'instruccion', 'idea'].forEach((k) => revisarTexto(f[k], id + ' ' + k));
  ok(Array.isArray(f.items) && f.items.length === cant, id + ': número de ítems ' + (f.items && f.items.length) + ' != ' + cant);
  f.items.forEach((it, i) => {
    const d = id + ' ítem ' + (i + 1);
    ok(it.n === i + 1, d + ': numeración');
    revisarTexto(it.enunciado, d + ' enunciado'); revisarTexto(it.respuesta, d + ' respuesta'); revisarTexto(it.explicacion, d + ' explicación');
    if (it.svg !== undefined) { ok(svgBienFormado(it.svg), d + ': SVG mal formado'); ok(!MALO.test(it.svg), d + ': SVG con valor inválido'); }
    if (cfg.tipo === 'error') {
      ok(Array.isArray(it.pasos) && it.pasos.length >= 2, d + ': faltan pasos');
      const marcados = (it.pasos || []).filter((p) => p.error === true);
      ok(marcados.length === 1, d + ': pasos con error = ' + marcados.length);
      ok(marcados[0] && it.paso_error === marcados[0].n, d + ': paso_error no coincide');
      (it.pasos || []).forEach((p) => ok(it.enunciado.includes('Paso ' + p.n + ': '), d + ': paso ' + p.n + ' no aparece numerado'));
      ok(it.respuesta.includes('paso ' + it.paso_error), d + ': la respuesta no indica el paso');
    }
    if (cfg.tipo === 'calculo') { // verificación aritmética independiente de las operaciones simples
      const m = it.enunciado.match(/^(-?[\d.]+) ([+\-×]) \(?(-?[\d.]+)\)? = ___$/);
      if (m && !/,/.test(it.enunciado)) {
        const a = num(m[1]), b = num(m[3]), r = m[2] === '+' ? a + b : m[2] === '-' ? a - b : a * b;
        ok(num(it.respuesta) === r, d + ': aritmética ' + it.enunciado + ' => ' + it.respuesta + ' (esperado ' + r + ')');
      }
    }
  });
  const r = f.reto_final;
  ok(r && typeof r === 'object', id + ': falta reto_final');
  if (r) ['enunciado', 'respuesta', 'explicacion'].forEach((k) => revisarTexto(r[k], id + ' reto ' + k));
}

// API
ok(Array.isArray(TM.tipos) && TM.tipos.length === 6, 'tipos debe tener 6 elementos');
const ids = ['calculo', 'problemas', 'series', 'geometria', 'dinero', 'error'];
ids.forEach((t) => ok(TM.tipos.some((x) => x.id === t && x.nombre && x.descripcion), 'falta tipo ' + t));

let fichas = 0, distintas = 0;
for (const tipo of ids) {
  for (let g = 0; g <= 11; g++) {
    const ops = TM.opciones(tipo, g);
    ok(Array.isArray(ops) && ops.every((o) => o.id && o.etiqueta && o.valor !== undefined), 'opciones inválidas ' + tipo + ' ' + g);
    const firmas = new Set();
    for (let s = 1; s <= 30; s++) {
      const semilla = g * 1000 + s * 7919 + ids.indexOf(tipo);
      const cant = s % 3 === 0 ? 4 + (s % 11) : 10;
      const cfg = { tipo, grado: g, semilla, cantidad: cant };
      try {
        const f = TM.generar(cfg); fichas++;
        revisarFicha(f, cfg, cant);
        const f2 = TM.generar(cfg);
        ok(JSON.stringify(f) === JSON.stringify(f2), JSON.stringify(cfg) + ': no es determinista');
        firmas.add(JSON.stringify(f.items));
      } catch (e) { ok(false, JSON.stringify(cfg) + ': excepción ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
    }
    distintas += firmas.size;
    ok(firmas.size >= 28, tipo + ' grado ' + g + ': solo ' + firmas.size + ' fichas distintas de 30');
    // Cada valor de cada control
    ops.filter((o) => o.valores).forEach((o) => o.valores.forEach((v) => {
      for (let s = 1; s <= 4; s++) {
        const cfg = { tipo, grado: g, semilla: 'op-' + s, [o.id]: v.valor };
        try { const f = TM.generar(cfg); revisarFicha(f, cfg, 10); fichas++; }
        catch (e) { ok(false, JSON.stringify(cfg) + ': excepción ' + (e && e.message)); }
      }
    }));
  }
}

console.log('Fichas generadas: ' + fichas + ' | fichas distintas en el barrido principal: ' + distintas + '/' + ids.length * 12 * 30);
console.log('Comprobaciones: ' + pruebas + ' | fallos: ' + fallos + ' | éxito: ' + ((100 * (pruebas - fallos)) / pruebas).toFixed(2) + ' %');
if (fallos) { errores.forEach((e) => console.log('  - ' + e)); process.exit(1); }
console.log('OK: todas las pruebas pasaron.');
