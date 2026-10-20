/*
  SABI · Taller de Matemáticas CENTEC
  ------------------------------------
  Generador procedural de fichas de matemáticas (Transición a 11°), sin IA y sin dependencias.
  Cada semilla produce una ficha distinta y la misma semilla produce siempre la misma ficha.

  API:
    TallerMate.tipos                      -> [{id, nombre, descripcion}]
    TallerMate.opciones(tipo, grado)      -> [{id, etiqueta, valores?:[{valor, etiqueta}], valor, min?, max?}]
    TallerMate.generar({tipo, grado, cantidad = 10, semilla, ...opciones})
        -> {titulo, instruccion, idea, items:[{n, enunciado, svg?, respuesta, explicacion, pasos?}], reto_final,
            tipo, grado, semilla}

  Grado 0 = Transición. Colores: trazo #1A2D7A, rellenos #F47C20 y #F5C518.
*/
(function (raiz) {
  'use strict';

  const AZUL = '#1A2D7A', NAR = '#F47C20', AMA = '#F5C518', CLARO = '#EEF1FA', BLANCO = '#FFFFFF';

  /* ---------- Azar con semilla (mulberry32) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normalizarSemilla(s) {
    if (s === undefined || s === null || s === '') return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
    if (typeof s === 'number' && isFinite(s)) return Math.floor(Math.abs(s)) >>> 0;
    const txt = String(s); let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function crearAzar(semilla) {
    const f = mulberry32(semilla);
    return {
      f,
      ent(a, b) { if (b < a) { const t = a; a = b; b = t; } return a + Math.floor(f() * (b - a + 1)); },
      elegir(arr) { return arr[Math.floor(f() * arr.length)]; },
      mezclar(arr) { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); const t = c[i]; c[i] = c[j]; c[j] = t; } return c; },
      prob(p) { return f() < p; },
      signo() { return f() < 0.5 ? -1 : 1; },
      noCero(a, b) { let x = 0; while (x === 0) x = a + Math.floor(f() * (b - a + 1)); return x; }
    };
  }

  /* ---------- Números en formato colombiano ---------- */
  function miles(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fmt(n, dec) {
    if (typeof n !== 'number' || !isFinite(n)) throw new Error('Número inválido: ' + n);
    const d = dec == null ? 2 : dec, p = Math.pow(10, d);
    let r = Math.round(n * p) / p; if (Object.is(r, -0) || r === 0) r = 0;
    const neg = r < 0; const partes = Math.abs(r).toFixed(d).split('.');
    const fr = partes[1] ? partes[1].replace(/0+$/, '') : '';
    return (neg ? '-' : '') + miles(partes[0]) + (fr ? ',' + fr : '');
  }
  const fp = (n, d) => (n < 0 ? '(' + fmt(n, d) + ')' : fmt(n, d));
  const pesos = (n) => '$ ' + fmt(Math.round(n), 0);
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; }
  const mcm = (a, b) => Math.abs(a * b) / mcd(a, b);
  function simp(n, d) { if (d < 0) { n = -n; d = -d; } const g = mcd(n, d); return [n / g, d / g]; }
  function fracTxt(n, d) {
    const s = simp(n, d); if (s[1] === 1) return fmt(s[0], 0);
    return s[0] + '/' + s[1];
  }
  function fracMixta(n, d) {
    const s = simp(n, d); const base = fracTxt(n, d);
    if (s[1] !== 1 && Math.abs(s[0]) > s[1]) {
      const e = Math.trunc(s[0] / s[1]), r = Math.abs(s[0] % s[1]);
      return base + ' (= ' + e + ' ' + r + '/' + s[1] + ')';
    }
    return base;
  }
  // Expresión lineal a·x + b con signos limpios
  function lin(a, b, v) {
    v = v || 'x'; let s = '';
    if (a !== 0) s = (a === 1 ? '' : a === -1 ? '-' : fmt(a, 2)) + v;
    if (b !== 0) s += s ? (b > 0 ? ' + ' : ' - ') + fmt(Math.abs(b), 2) : fmt(b, 2);
    return s || '0';
  }

  /* ---------- SVG ---------- */
  const r1 = (x) => Math.round(x * 10) / 10;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(w, h, cuerpo, titulo) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + r1(w) + ' ' + r1(h) + '" width="' + r1(w) + '" height="' + r1(h) +
      '" role="img" aria-label="' + esc(titulo || 'Figura') + '" font-family="Arial, Helvetica, sans-serif">' + cuerpo + '</svg>';
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + (o.size || 14) + '" fill="' + (o.fill || AZUL) +
      '" text-anchor="' + (o.anchor || 'middle') + '" dominant-baseline="middle"' + (o.bold ? ' font-weight="bold"' : '') + '>' + esc(s) + '</text>';
  }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + (o.stroke || AZUL) +
      '" stroke-width="' + (o.w || 2) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' stroke-linecap="round"/>';
  }
  function Rc(x, y, w, h, fill, o) {
    o = o || {};
    return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + (fill || 'none') +
      '" stroke="' + (o.stroke || AZUL) + '" stroke-width="' + (o.w == null ? 2 : o.w) + '"' + (o.rx ? ' rx="' + o.rx + '"' : '') + '/>';
  }
  function C(cx, cy, r, fill, o) {
    o = o || {};
    return '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '" fill="' + (fill || 'none') + '" stroke="' + (o.stroke || AZUL) + '" stroke-width="' + (o.w == null ? 2 : o.w) + '"/>';
  }
  function P(pts, fill, o) {
    o = o || {};
    return '<polygon points="' + pts.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ') + '" fill="' + (fill || 'none') + '" stroke="' + (o.stroke || AZUL) + '" stroke-width="' + (o.w == null ? 2 : o.w) + '" stroke-linejoin="round"/>';
  }
  function Pa(d, fill, o) {
    o = o || {};
    return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (o.stroke || AZUL) + '" stroke-width="' + (o.w == null ? 2 : o.w) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' stroke-linejoin="round"/>';
  }

  // Objetos dibujados para conteo (Transición y primeros grados)
  const OBJETOS = {
    mango: { s: 'mango', p: 'mangos' }, lulo: { s: 'lulo', p: 'lulos' }, balon: { s: 'balón', p: 'balones' },
    estrella: { s: 'estrella', p: 'estrellas', f: true }, bus: { s: 'bus del MIO', p: 'buses del MIO' }, vela: { s: 'vela', p: 'velas', f: true }
  };
  function icono(tipo, x, y, s) {
    const k = s / 40, cx = x + s / 2, cy = y + s / 2;
    switch (tipo) {
      case 'mango':
        return '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy + 2 * k) + '" rx="' + r1(13 * k) + '" ry="' + r1(16 * k) + '" fill="' + NAR + '" stroke="' + AZUL + '" stroke-width="2" transform="rotate(-25 ' + r1(cx) + ' ' + r1(cy) + ')"/>' +
          '<ellipse cx="' + r1(cx + 7 * k) + '" cy="' + r1(cy - 15 * k) + '" rx="' + r1(6 * k) + '" ry="' + r1(3 * k) + '" fill="' + AMA + '" stroke="' + AZUL + '" stroke-width="1.5"/>';
      case 'lulo':
        return C(cx, cy + 2 * k, 14 * k, AMA) + P([[cx - 6 * k, cy - 12 * k], [cx, cy - 18 * k], [cx + 6 * k, cy - 12 * k]], NAR, { w: 1.5 });
      case 'balon':
        return C(cx, cy, 16 * k, BLANCO) + P([[cx, cy - 6 * k], [cx + 6 * k, cy - 2 * k], [cx + 4 * k, cy + 5 * k], [cx - 4 * k, cy + 5 * k], [cx - 6 * k, cy - 2 * k]], AZUL, { w: 1 });
      case 'estrella': {
        const pts = []; for (let i = 0; i < 10; i++) { const r = (i % 2 ? 7 : 17) * k, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
        return P(pts, AMA);
      }
      case 'bus':
        return Rc(x + 3 * k, cy - 11 * k, 34 * k, 20 * k, NAR, { rx: 3 }) + Rc(x + 7 * k, cy - 7 * k, 8 * k, 6 * k, BLANCO, { w: 1 }) + Rc(x + 18 * k, cy - 7 * k, 8 * k, 6 * k, BLANCO, { w: 1 }) +
          C(x + 11 * k, cy + 10 * k, 4 * k, AZUL, { w: 1 }) + C(x + 29 * k, cy + 10 * k, 4 * k, AZUL, { w: 1 });
      default: // vela
        return Rc(cx - 4 * k, cy - 6 * k, 8 * k, 22 * k, AMA) + '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy - 12 * k) + '" rx="' + r1(4 * k) + '" ry="' + r1(6 * k) + '" fill="' + NAR + '" stroke="' + AZUL + '" stroke-width="1"/>';
    }
  }
  // Fila/cuadrícula de objetos; tachados: últimos n objetos marcados con X
  function grupoObjetos(n, tipo, x0, y0, cols, s, tachados) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + (i % cols) * (s + 6), y = y0 + Math.floor(i / cols) * (s + 6);
      out += icono(tipo, x, y, s);
      if (tachados && i >= n - tachados) out += L(x + 2, y + 2, x + s - 2, y + s - 2, { w: 3 }) + L(x + s - 2, y + 2, x + 2, y + s - 2, { w: 3 });
    }
    return out;
  }
  function svgObjetos(n, tipo, titulo, tachados) {
    const cols = Math.min(n, 5) || 1, s = 40, filas = Math.max(1, Math.ceil(n / cols));
    return svg(cols * (s + 6) + 14, filas * (s + 6) + 14, grupoObjetos(n, tipo, 10, 10, cols, s, tachados), titulo);
  }

  const nombreGrado = (g) => (g === 0 ? 'Transición' : 'Grado ' + g + '°');
  const banda = (g) => (g <= 0 ? 0 : g <= 2 ? 1 : g <= 5 ? 2 : g <= 8 ? 3 : 4);
  const NOMBRES = ['Valentina', 'Santiago', 'Isabella', 'Samuel', 'Mariana', 'Matías', 'Salomé', 'Juan José', 'Sara', 'Emmanuel', 'Luciana', 'Jerónimo', 'Antonella', 'Thiago', 'María José', 'Alejandro'];
  const FRUTAS = [['mango', 'mangos'], ['lulo', 'lulos'], ['guanábana', 'guanábanas'], ['chontaduro', 'chontaduros']];

  /* ---------- Catálogo de tipos y opciones ---------- */
  const TIPOS = [
    { id: 'calculo', nombre: 'Fichas de cálculo a medida', descripcion: 'Operaciones elegidas por el docente (suma, resta, multiplicación, división, fracciones, decimales, potencias, ecuaciones...) con el rango y la dificultad del grado.' },
    { id: 'problemas', nombre: 'Problemas cotidianos', descripcion: 'Situaciones de Cali para leer, decidir la operación y resolver: tienda de barrio, MIO, mercado de Santa Elena, cancha, cumpleaños, salsa y frutas del Valle.' },
    { id: 'series', nombre: 'Series y patrones', descripcion: 'Secuencias numéricas y de figuras: encontrar el siguiente término, descubrir la regla y, desde 8°, el término general.' },
    { id: 'geometria', nombre: 'Geometría visual', descripcion: 'Figuras dibujadas con sus medidas: perímetro, área, fracciones sombreadas, ángulos, simetría, cuerpos y triángulos rectángulos.' },
    { id: 'dinero', nombre: 'Dinero y cambio', descripcion: 'Monedas y billetes colombianos: contar, pagar, dar vueltas, presupuestos, comparar precios, descuentos, IVA e interés.' },
    { id: 'error', nombre: 'Encuentra el error', descripcion: 'Ejercicios resueltos paso a paso con exactamente un paso equivocado: encontrarlo, explicar por qué está mal y corregirlo.' }
  ];
  const ETQ_OP = {
    variada: 'Variada (según el grado)', conteo: 'Conteo y comparación', suma: 'Suma', resta: 'Resta', multiplicacion: 'Multiplicación', division: 'División',
    mixta: 'Operaciones combinadas', fracciones: 'Fracciones', decimales: 'Decimales', potencias: 'Potencias y raíces', enteros: 'Números enteros', ecuaciones: 'Ecuaciones'
  };
  function opsCalculo(g) {
    if (g <= 0) return ['conteo', 'suma', 'resta'];
    const o = ['suma', 'resta'];
    if (g >= 2) o.push('multiplicacion');
    if (g >= 3) o.push('division', 'fracciones');
    if (g >= 4) o.push('decimales', 'mixta');
    if (g >= 5) o.push('potencias');
    if (g >= 6) o.push('enteros', 'ecuaciones');
    if (g >= 9) return ['mixta', 'fracciones', 'decimales', 'potencias', 'enteros', 'ecuaciones'];
    if (g >= 7) return o.filter((x) => x !== 'suma' && x !== 'resta');
    return o;
  }
  const MAX_DEF = [10, 99, 999, 9999, 99999, 999999, 9999, 9999, 9999, 9999, 9999, 9999];
  const TEMAS = {
    problemas: (g) => ['variado', 'tienda', 'mio', 'mercado', 'cancha', 'fiesta'],
    series: (g) => ['variada', 'numericas', 'figuras'].concat(g >= 8 ? ['termino_general'] : []),
    geometria: (g) => {
      const t = ['variada'];
      if (g <= 2) t.push('figuras');
      if (g >= 1) t.push('perimetro', 'simetria');
      if (g >= 2) t.push('area', 'fracciones');
      if (g >= 3) t.push('angulos');
      if (g >= 6) t.push('cuerpos');
      if (g >= 8) t.push('pitagoras');
      if (g >= 9) t.push('trigonometria');
      return t;
    },
    dinero: (g) => {
      const t = ['variada', 'contar', 'pagar'];
      if (g >= 1) t.push('vueltas');
      if (g >= 2) t.push('presupuesto', 'comparar');
      if (g >= 6) t.push('descuento', 'iva', 'interes');
      return t;
    },
    error: (g) => {
      if (g <= 0) return ['variada', 'conteo', 'suma'];
      const t = ['variada', 'llevar'];
      if (g >= 2) t.push('prestar');
      if (g >= 4) t.push('orden', 'fracciones');
      if (g >= 6) t.push('signos', 'porcentaje');
      if (g >= 7) t.push('despeje');
      if (g >= 8) t.push('potencias');
      return t;
    }
  };
  const ETQ_TEMA = {
    variado: 'Variado', variada: 'Variada', tienda: 'Tienda de barrio', mio: 'MIO (transporte)', mercado: 'Mercado de Santa Elena', cancha: 'Cancha y deporte', fiesta: 'Cumpleaños y salsa',
    numericas: 'Numéricas', figuras: 'Figuras', termino_general: 'Término general', perimetro: 'Perímetro', simetria: 'Simetría', area: 'Área', fracciones: 'Fracciones',
    angulos: 'Ángulos', cuerpos: 'Cuerpos y volumen', pitagoras: 'Teorema de Pitágoras', trigonometria: 'Trigonometría', contar: 'Contar dinero', pagar: 'Pagar',
    vueltas: 'Vueltas o cambio', presupuesto: 'Presupuesto', comparar: 'Comparar precios', descuento: 'Descuentos', iva: 'IVA 19 %', interes: 'Interés',
    conteo: 'Conteo', suma: 'Suma', llevar: 'Suma llevando', prestar: 'Resta prestando', orden: 'Orden de operaciones', signos: 'Signos', porcentaje: 'Porcentajes',
    despeje: 'Despeje de ecuaciones', potencias: 'Potencias'
  };
  function gradoValido(g) { g = Math.round(Number(g)); return isFinite(g) ? Math.min(11, Math.max(0, g)) : 0; }

  function opciones(tipo, grado) {
    const g = gradoValido(grado);
    const cant = { id: 'cantidad', etiqueta: 'Número de ejercicios', valor: 10, min: 4, max: 30 };
    if (tipo === 'calculo') {
      const ops = ['variada'].concat(opsCalculo(g));
      const out = [
        { id: 'operacion', etiqueta: 'Operación', valores: ops.map((v) => ({ valor: v, etiqueta: ETQ_OP[v] })), valor: 'variada' },
        { id: 'maximo', etiqueta: 'Números hasta', valor: MAX_DEF[g], min: g === 0 ? 5 : 10, max: g === 0 ? 20 : 9999999 }
      ];
      if (g >= 1 && g <= 5) out.push({ id: 'llevar', etiqueta: 'Suma y resta', valores: [{ valor: 'mezcla', etiqueta: 'Con y sin llevar' }, { valor: 'si', etiqueta: 'Con llevar o prestar' }, { valor: 'no', etiqueta: 'Sin llevar ni prestar' }], valor: 'mezcla' });
      out.push(cant);
      return out;
    }
    if (TEMAS[tipo]) {
      const t = TEMAS[tipo](g);
      return [{ id: 'tema', etiqueta: tipo === 'problemas' ? 'Contexto' : 'Tema', valores: t.map((v) => ({ valor: v, etiqueta: ETQ_TEMA[v] || v })), valor: t[0] }, cant];
    }
    return [cant];
  }

  /* ---------- Generador: CÁLCULO ---------- */
  const POS = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil', 'unidades de millón', 'decenas de millón'];
  const digRev = (n) => String(n).split('').reverse().map(Number);
  function hayLlevada(a, b) { const x = digRev(a), y = digRev(b); let l = 0; for (let i = 0; i < Math.max(x.length, y.length); i++) { const s = (x[i] || 0) + (y[i] || 0) + l; if (s >= 10) return true; l = 0; } return false; }
  function hayPrestamo(a, b) { const x = digRev(a), y = digRev(b); for (let i = 0; i < y.length; i++) if ((x[i] || 0) < y[i]) return true; return false; }
  function explicaSuma(a, b) {
    const x = digRev(a), y = digRev(b), n = Math.max(x.length, y.length), partes = []; let l = 0;
    for (let i = 0; i < n; i++) {
      const s = (x[i] || 0) + (y[i] || 0) + l;
      partes.push(POS[i] + ': ' + (x[i] || 0) + ' + ' + (y[i] || 0) + (l ? ' + 1 que llevamos' : '') + ' = ' + s + (s >= 10 ? ', escribimos ' + (s % 10) + ' y llevamos 1' : ''));
      l = s >= 10 ? 1 : 0;
    }
    if (l) partes.push('el 1 que llevamos queda adelante');
    return 'Sumamos por columnas de derecha a izquierda. ' + partes.join('; ') + '. Total: ' + fmt(a + b, 0) + '.';
  }
  function explicaResta(a, b) {
    const x = digRev(a), y = digRev(b), partes = []; let pr = 0;
    for (let i = 0; i < x.length; i++) {
      const arriba = x[i] - pr, abajo = y[i] || 0;
      if (i >= y.length && pr === 0) break;
      if (arriba < abajo) { partes.push(POS[i] + ': ' + (pr ? x[i] + ' menos 1 prestado = ' + arriba : arriba) + ' no alcanza para quitar ' + abajo + ', pedimos 1 a la posición siguiente: ' + (arriba + 10) + ' - ' + abajo + ' = ' + (arriba + 10 - abajo)); pr = 1; }
      else { partes.push(POS[i] + ': ' + (pr ? x[i] + ' - 1 prestado = ' + arriba + '; ' : '') + arriba + ' - ' + abajo + ' = ' + (arriba - abajo)); pr = 0; }
    }
    return 'Restamos por columnas de derecha a izquierda. ' + partes.join('; ') + '. Comprobación: ' + fmt(a - b, 0) + ' + ' + fmt(b, 0) + ' = ' + fmt(a, 0) + '.';
  }
  function parCond(R, lo, max, quiere, prueba, esResta) {
    for (let t = 0; t < 600; t++) {
      let a, b;
      if (esResta) { a = R.ent(Math.max(lo, 2), max); b = R.ent(Math.max(1, Math.min(lo, a - 1)), a - 1); }
      else { a = R.ent(lo, Math.max(lo, max - 1)); if (max - a < 1) continue; b = R.ent(Math.min(lo, max - a), max - a); }
      if (b < 1 || a < 1) continue;
      if (quiere === null || prueba(a, b) === quiere) return [a, b];
    }
    return esResta ? [Math.max(2, max), 1] : [1, Math.max(1, max - 1)];
  }
  function quiereLlevar(R, op) { const m = op.llevar || 'mezcla'; return m === 'mezcla' ? R.prob(0.6) : m === 'si'; }
  function svgSumaObj(a, b, tipo) {
    const s = 30, cols = 5, wa = Math.min(a, cols) * (s + 6), wb = Math.min(b, cols) * (s + 6), filas = Math.max(Math.ceil(a / cols), Math.ceil(b / cols));
    const h = filas * (s + 6) + 14;
    return svg(wa + wb + 60, h, grupoObjetos(a, tipo, 8, 8, cols, s) + T(wa + 30, h / 2, '+', { size: 28, bold: true }) + grupoObjetos(b, tipo, wa + 52, 8, cols, s), 'Suma con dibujos');
  }

  function calcSuma(R, g, op) {
    const max = Math.max(4, Number(op.maximo) || MAX_DEF[g]);
    const lo = g <= 0 ? 1 : Math.max(1, Math.floor(max / 10));
    const q = g <= 0 ? null : quiereLlevar(R, op);
    const [a, b] = parCond(R, lo, max, q, hayLlevada, false);
    if (g <= 0) {
      const t = R.elegir(['mango', 'lulo', 'balon', 'estrella']);
      return { enunciado: 'Cuenta y suma: ' + a + ' ' + (a === 1 ? OBJETOS[t].s : OBJETOS[t].p) + ' y ' + b + ' más. ' + a + ' + ' + b + ' = ___', svg: svgSumaObj(a, b, t), respuesta: String(a + b), explicacion: 'Contamos todos juntos: empezamos en ' + a + ' y seguimos contando ' + b + ' más hasta llegar a ' + (a + b) + '.' };
    }
    return { enunciado: fmt(a, 0) + ' + ' + fmt(b, 0) + ' = ___', respuesta: fmt(a + b, 0), explicacion: explicaSuma(a, b) };
  }
  function calcResta(R, g, op) {
    const max = Math.max(4, Number(op.maximo) || MAX_DEF[g]);
    const lo = g <= 0 ? 1 : Math.max(1, Math.floor(max / 10));
    const q = g <= 0 ? null : quiereLlevar(R, op);
    const [a, b] = parCond(R, lo, max, q, hayPrestamo, true);
    if (g <= 0) {
      const t = R.elegir(['mango', 'lulo', 'balon', 'vela']);
      return { enunciado: 'Había ' + a + ' ' + OBJETOS[t].p + ' y se ' + (b === 1 ? 'tachó 1' : 'tacharon ' + b) + '. ' + a + ' - ' + b + ' = ___', svg: svgObjetos(a, t, 'Resta con dibujos tachados', b), respuesta: String(a - b), explicacion: 'Contamos solo los que no están tachados: quedan ' + (a - b) + '.' };
    }
    return { enunciado: fmt(a, 0) + ' - ' + fmt(b, 0) + ' = ___', respuesta: fmt(a - b, 0), explicacion: explicaResta(a, b) };
  }
  function calcConteo(R, g, op) {
    const max = Math.min(20, Math.max(5, Number(op.maximo) || 10));
    const t = R.elegir(Object.keys(OBJETOS));
    if (R.prob(0.55)) {
      const n = R.ent(2, max);
      return { enunciado: '¿' + (OBJETOS[t].f ? 'Cuántas ' : 'Cuántos ') + OBJETOS[t].p + ' hay? Cuenta tocando cada dibujo.', svg: svgObjetos(n, t, n + ' objetos para contar'), respuesta: String(n), explicacion: 'Al contar uno por uno sin repetir, el último número que decimos es ' + n + '.' };
    }
    const m = Math.min(max, 10); let a = R.ent(1, m), b = R.ent(1, m); while (b === a) b = R.ent(1, m);
    const s = 30, cols = 10, w = 40 + cols * (s + 6);
    const cuerpo = T(16, 25, 'A', { bold: true, size: 18 }) + grupoObjetos(a, t, 34, 10, cols, s) + T(16, 71, 'B', { bold: true, size: 18 }) + grupoObjetos(b, t, 34, 56, cols, s);
    const mas = R.prob(0.5);
    const resp = mas ? (a > b ? 'A' : 'B') : (a < b ? 'A' : 'B');
    return { enunciado: '¿En qué grupo hay ' + (mas ? 'MÁS' : 'MENOS') + ' ' + OBJETOS[t].p + ', en el A o en el B?', svg: svg(w, 100, cuerpo, 'Comparar dos grupos'), respuesta: resp + ' (A tiene ' + a + ' y B tiene ' + b + ')', explicacion: 'Contamos cada fila: A tiene ' + a + ' y B tiene ' + b + '. ' + Math.max(a, b) + ' es más que ' + Math.min(a, b) + '.' };
  }
  function calcMult(R, g) {
    let a, b;
    if (g <= 2) { a = R.ent(2, 5); b = R.ent(1, 10); }
    else if (g === 3) { a = R.ent(2, 10); b = R.ent(2, 10); }
    else if (g === 4) { a = R.prob(0.5) ? R.ent(12, 99) : R.ent(102, 999); b = R.ent(2, 9); }
    else { a = R.ent(102, 999); b = R.ent(12, 99); }
    const p = a * b; let ex;
    if (a <= 10 && b <= 10) ex = b <= 5 ? fmt(a, 0) + ' × ' + b + ' es sumar ' + a + ', ' + b + ' veces: ' + Array(b).fill(a).join(' + ') + ' = ' + p + '.' : 'Es la tabla del ' + a + ': ' + a + ' × ' + b + ' = ' + p + '. Truco: ' + a + ' × ' + (b - 1) + ' = ' + a * (b - 1) + ', y sumamos ' + a + ' más.';
    else if (b < 10) { const d = a - (a % 10); ex = 'Descomponemos ' + fmt(a, 0) + ' = ' + fmt(d, 0) + ' + ' + (a % 10) + ': ' + fmt(d, 0) + ' × ' + b + ' = ' + fmt(d * b, 0) + ' y ' + (a % 10) + ' × ' + b + ' = ' + (a % 10) * b + '; total ' + fmt(p, 0) + '.'; }
    else { const d = b - (b % 10), u = b % 10; ex = 'Multiplicamos por partes: ' + fmt(a, 0) + ' × ' + d + ' = ' + fmt(a * d, 0) + ' y ' + fmt(a, 0) + ' × ' + u + ' = ' + fmt(a * u, 0) + '; sumamos: ' + fmt(p, 0) + '.'; }
    return { enunciado: fmt(a, 0) + ' × ' + fmt(b, 0) + ' = ___', respuesta: fmt(p, 0), explicacion: ex };
  }
  function calcDiv(R, g) {
    let d, q, r = 0;
    if (g <= 2) { d = R.ent(2, 5); q = R.ent(1, 10); }
    else if (g === 3) { d = R.ent(2, 9); q = R.ent(2, 10); }
    else if (g === 4) { d = R.ent(2, 9); q = R.ent(11, 99); }
    else if (g === 5) { d = R.ent(2, 9); q = R.ent(101, 999); r = R.prob(0.5) ? R.ent(1, d - 1) : 0; }
    else { d = R.ent(11, 25); q = R.ent(12, 99); r = R.prob(0.5) ? R.ent(1, d - 1) : 0; }
    const D = d * q + r;
    return {
      enunciado: fmt(D, 0) + ' ÷ ' + d + ' = ___' + (g >= 5 ? ' (si no es exacta, indica cociente y residuo)' : ''),
      respuesta: fmt(q, 0) + (r ? ', residuo ' + r : (g >= 5 ? ' (exacta)' : '')),
      explicacion: 'Buscamos cuántas veces cabe ' + d + ' en ' + fmt(D, 0) + ': ' + d + ' × ' + fmt(q, 0) + ' = ' + fmt(d * q, 0) + (r ? ' y sobran ' + r + ' (' + fmt(d * q, 0) + ' + ' + r + ' = ' + fmt(D, 0) + ')' : ', exacto') + '.'
    };
  }
  function calcMixta(R, g) {
    const pl = [];
    pl.push(() => { const a = R.ent(2, 30), b = R.ent(2, 10), c = R.ent(2, 10); return { e: a + ' + ' + b + ' × ' + c, v: a + b * c, p: [b + ' × ' + c + ' = ' + b * c, a + ' + ' + b * c + ' = ' + (a + b * c)] }; });
    if (g >= 4) {
      pl.push(() => { const a = R.ent(3, 12), b = R.ent(3, 12), c = R.ent(1, a * b - 1); return { e: a + ' × ' + b + ' - ' + c, v: a * b - c, p: [a + ' × ' + b + ' = ' + a * b, a * b + ' - ' + c + ' = ' + (a * b - c)] }; });
      pl.push(() => { const a = R.ent(2, 15), b = R.ent(2, 15), c = R.ent(2, 9); return { e: '(' + a + ' + ' + b + ') × ' + c, v: (a + b) * c, p: ['Primero el paréntesis: ' + a + ' + ' + b + ' = ' + (a + b), (a + b) + ' × ' + c + ' = ' + (a + b) * c] }; });
      pl.push(() => { const c = R.ent(2, 9), k = R.ent(2, 10), a = R.ent(k + 1, k + 40); return { e: a + ' - ' + c * k + ' ÷ ' + c, v: a - k, p: [c * k + ' ÷ ' + c + ' = ' + k, a + ' - ' + k + ' = ' + (a - k)] }; });
    }
    if (g >= 6) {
      pl.push(() => { const a = R.ent(-20, 20), b = R.ent(2, 9), c = R.ent(-9, 9), d = R.ent(-9, 9); const m = c - d; return { e: fmt(a, 0) + ' - ' + b + ' × (' + fmt(c, 0) + ' - ' + fp(d, 0) + ')', v: a - b * m, p: ['Paréntesis: ' + fmt(c, 0) + ' - ' + fp(d, 0) + ' = ' + fmt(m, 0), b + ' × ' + fp(m, 0) + ' = ' + fmt(b * m, 0), fmt(a, 0) + ' - ' + fp(b * m, 0) + ' = ' + fmt(a - b * m, 0)] }; });
      pl.push(() => { const a = R.ent(-12, 12), b = R.ent(-12, 12), c = R.ent(-6, 6), d = R.ent(-6, 6); return { e: '(' + fmt(a, 0) + ' - ' + fp(b, 0) + ') × (' + fmt(c, 0) + ' + ' + fp(d, 0) + ')', v: (a - b) * (c + d), p: ['Primer paréntesis: ' + fmt(a - b, 0), 'Segundo paréntesis: ' + fmt(c + d, 0), fp(a - b, 0) + ' × ' + fp(c + d, 0) + ' = ' + fmt((a - b) * (c + d), 0)] }; });
    }
    if (g >= 7) pl.push(() => { const a = R.ent(-15, 15), b = R.ent(2, 6), c = R.ent(-5, 5); return { e: fmt(a, 0) + ' + ' + b + ' × ' + fp(c, 0) + '²', v: a + b * c * c, p: ['Potencia primero: ' + fp(c, 0) + '² = ' + c * c, b + ' × ' + c * c + ' = ' + b * c * c, fmt(a, 0) + ' + ' + b * c * c + ' = ' + fmt(a + b * c * c, 0)] }; });
    const x = R.elegir(pl)();
    return { enunciado: 'Resuelve respetando el orden de las operaciones: ' + x.e + ' = ___', respuesta: fmt(x.v, 0), explicacion: 'Orden: paréntesis, potencias, multiplicaciones y divisiones, sumas y restas. ' + x.p.join('; ') + '.' };
  }
  function calcFrac(R, g) {
    const tipo = g <= 3 ? R.elegir(['igual', 'igual', 'de']) : g <= 5 ? R.elegir(['igual', 'distinto', 'distinto', 'de']) : R.elegir(['distinto', 'mult', 'div', 'de']);
    if (tipo === 'de') {
      const d = R.ent(2, g <= 3 ? 5 : 10), n = R.ent(1, d - 1), k = R.ent(2, g <= 3 ? 6 : 15), N = d * k;
      return { enunciado: '¿Cuánto es ' + n + '/' + d + ' de ' + N + '?', respuesta: fmt(n * k, 0), explicacion: 'Dividimos ' + N + ' en ' + d + ' partes iguales: ' + N + ' ÷ ' + d + ' = ' + k + '; tomamos ' + n + ' partes: ' + n + ' × ' + k + ' = ' + n * k + '.' };
    }
    if (tipo === 'igual') {
      const d = R.ent(3, 12), a = R.ent(1, d - 1), b = R.ent(1, d - 1), suma = R.prob(0.6) || a === b;
      const [x, y] = a >= b ? [a, b] : [b, a];
      const res = suma ? a + b : x - y, e = suma ? a + '/' + d + ' + ' + b + '/' + d : x + '/' + d + ' - ' + y + '/' + d;
      return { enunciado: e + ' = ___', respuesta: fracMixta(res, d), explicacion: 'Igual denominador: se ' + (suma ? 'suman' : 'restan') + ' los numeradores y el denominador se conserva: ' + res + '/' + d + (mcd(res, d) > 1 && res ? ', que se simplifica a ' + fracTxt(res, d) : '') + '.' };
    }
    if (tipo === 'distinto') {
      let b = R.ent(2, 9), d = R.ent(2, 9); while (d === b) d = R.ent(2, 10);
      const a = R.ent(1, b + (g >= 6 ? b : -1)), c = R.ent(1, d + (g >= 6 ? d : -1));
      const m = mcm(b, d), A = a * (m / b), Cc = c * (m / d); let suma = R.prob(0.6);
      if (!suma && g < 6 && A < Cc) suma = true;
      const res = suma ? A + Cc : A - Cc;
      return { enunciado: a + '/' + b + (suma ? ' + ' : ' - ') + c + '/' + d + ' = ___', respuesta: fracMixta(res, m), explicacion: 'm.c.m.(' + b + ', ' + d + ') = ' + m + '. Fracciones equivalentes: ' + a + '/' + b + ' = ' + A + '/' + m + ' y ' + c + '/' + d + ' = ' + Cc + '/' + m + '. ' + A + (suma ? ' + ' : ' - ') + Cc + ' = ' + res + ', resultado ' + fracTxt(res, m) + '.' };
    }
    const a = R.ent(1, 9), b = R.ent(2, 9), c = R.ent(1, 9), d = R.ent(2, 9);
    if (tipo === 'mult') return { enunciado: a + '/' + b + ' × ' + c + '/' + d + ' = ___', respuesta: fracMixta(a * c, b * d), explicacion: 'Numerador por numerador y denominador por denominador: ' + a * c + '/' + b * d + (mcd(a * c, b * d) > 1 ? ' = ' + fracTxt(a * c, b * d) + ' simplificado' : '') + '.' };
    return { enunciado: a + '/' + b + ' ÷ ' + c + '/' + d + ' = ___', respuesta: fracMixta(a * d, b * c), explicacion: 'Dividir es multiplicar por el inverso: ' + a + '/' + b + ' × ' + d + '/' + c + ' = ' + a * d + '/' + b * c + (mcd(a * d, b * c) > 1 ? ' = ' + fracTxt(a * d, b * c) : '') + '.' };
  }
  function calcDec(R, g) {
    const D = (n, k) => fmt(n / Math.pow(10, k), k);
    const tipo = g <= 4 ? 'sr1' : g === 5 ? R.elegir(['sr2', 'pot10', 'xent']) : R.elegir(['sr2', 'xdec', 'divent', 'pot10']);
    if (tipo === 'sr1' || tipo === 'sr2') {
      const k = tipo === 'sr1' ? 1 : 2, top = tipo === 'sr1' ? 999 : 9999;
      let A = R.ent(11, top), B = R.ent(11, top); if (A % 10 === 0) A++; if (B % 10 === 0) B++;
      const suma = R.prob(0.5); if (!suma && A < B) { const t = A; A = B; B = t; }
      const res = suma ? A + B : A - B;
      return { enunciado: D(A, k) + (suma ? ' + ' : ' - ') + D(B, k) + ' = ___', respuesta: D(res, k), explicacion: 'Alineamos la coma y operamos como enteros (' + A + (suma ? ' + ' : ' - ') + B + ' = ' + res + '); el resultado conserva ' + k + ' cifra' + (k > 1 ? 's' : '') + ' decimal' + (k > 1 ? 'es' : '') + ': ' + D(res, k) + '.' };
    }
    if (tipo === 'pot10') {
      const A = R.ent(101, 9999), e = R.ent(1, 3), p = Math.pow(10, e), mult = R.prob(0.5);
      const res = mult ? D(A * p, 2) : fmt(A / 100 / p, 2 + e);
      return { enunciado: D(A, 2) + (mult ? ' × ' : ' ÷ ') + fmt(p, 0) + ' = ___', respuesta: res, explicacion: (mult ? 'Multiplicar' : 'Dividir') + ' por ' + fmt(p, 0) + ' corre la coma ' + e + ' lugar' + (e > 1 ? 'es' : '') + ' a la ' + (mult ? 'derecha' : 'izquierda') + '.' };
    }
    if (tipo === 'xent') {
      const A = R.ent(11, 999), k = R.ent(2, 9);
      return { enunciado: D(A, 2) + ' × ' + k + ' = ___', respuesta: D(A * k, 2), explicacion: 'Multiplicamos sin coma: ' + A + ' × ' + k + ' = ' + A * k + '; como el factor tenía 2 decimales, el producto también: ' + D(A * k, 2) + '.' };
    }
    if (tipo === 'xdec') {
      const A = R.ent(11, 99), B = R.ent(11, 99);
      return { enunciado: D(A, 1) + ' × ' + D(B, 1) + ' = ___', respuesta: D(A * B, 2), explicacion: 'Multiplicamos sin coma: ' + A + ' × ' + B + ' = ' + A * B + '; contamos 1 + 1 = 2 decimales: ' + D(A * B, 2) + '.' };
    }
    const k = R.ent(2, 9), Q = R.ent(11, 999), A = k * Q;
    return { enunciado: D(A, 2) + ' ÷ ' + k + ' = ___', respuesta: D(Q, 2), explicacion: 'Dividimos como enteros: ' + A + ' ÷ ' + k + ' = ' + Q + ', y colocamos la coma en el mismo lugar: ' + D(Q, 2) + '. Comprobación: ' + D(Q, 2) + ' × ' + k + ' = ' + D(A, 2) + '.' };
  }
  function calcPot(R, g) {
    const t = g <= 5 ? R.elegir(['pot', 'pot', 'raiz', 'diez']) : g <= 7 ? R.elegir(['pot', 'raiz', 'prod', 'cero']) : R.elegir(['neg', 'negexp', 'prod', 'potpot', 'raiz3', 'cero']);
    if (t === 'pot') { const a = R.ent(2, g <= 5 ? 10 : 12), n = a <= 5 ? R.ent(2, 4) : 2; const v = Math.pow(a, n); return { enunciado: a + sup(n) + ' = ___', respuesta: fmt(v, 0), explicacion: a + sup(n) + ' significa multiplicar ' + a + ' por sí mismo ' + n + ' veces: ' + Array(n).fill(a).join(' × ') + ' = ' + fmt(v, 0) + '.' }; }
    if (t === 'diez') { const n = R.ent(2, 6); return { enunciado: '10' + sup(n) + ' = ___', respuesta: fmt(Math.pow(10, n), 0), explicacion: 'Una potencia de 10 es un 1 seguido de tantos ceros como indica el exponente: ' + n + ' ceros.' }; }
    if (t === 'raiz') { const a = R.ent(2, g <= 5 ? 12 : 20); return { enunciado: '√' + a * a + ' = ___', respuesta: String(a), explicacion: 'Buscamos el número que multiplicado por sí mismo da ' + a * a + ': ' + a + ' × ' + a + ' = ' + a * a + '.' }; }
    if (t === 'raiz3') { const a = R.ent(2, 10) * R.signo(); return { enunciado: '∛(' + fmt(a * a * a, 0) + ') = ___', respuesta: fmt(a, 0), explicacion: fp(a, 0) + ' × ' + fp(a, 0) + ' × ' + fp(a, 0) + ' = ' + fmt(a * a * a, 0) + '.' }; }
    if (t === 'cero') { const a = R.ent(2, 999); return { enunciado: fmt(a, 0) + '⁰ = ___', respuesta: '1', explicacion: 'Todo número distinto de cero elevado a 0 es 1, porque ' + a + sup(3) + ' ÷ ' + a + sup(3) + ' = ' + a + sup(0) + ' y también es 1.' }; }
    if (t === 'prod') { const a = R.ent(2, 3), m = R.ent(1, 4), n = R.ent(1, 4); const v = Math.pow(a, m + n); return { enunciado: a + sup(m) + ' × ' + a + sup(n) + ' = ' + a + '^___ = ___ (escribe el exponente y el valor)', respuesta: a + sup(m + n) + ' = ' + fmt(v, 0), explicacion: 'Misma base: se conserva la base y se suman los exponentes, ' + m + ' + ' + n + ' = ' + (m + n) + '. ' + a + sup(m + n) + ' = ' + fmt(v, 0) + '.' }; }
    if (t === 'potpot') { const a = 2, m = R.ent(2, 3), n = R.ent(2, 3); return { enunciado: '(' + a + sup(m) + ')' + sup(n) + ' = ___', respuesta: a + sup(m * n) + ' = ' + fmt(Math.pow(a, m * n), 0), explicacion: 'Potencia de una potencia: se multiplican los exponentes, ' + m + ' × ' + n + ' = ' + m * n + '.' }; }
    if (t === 'neg') { const a = R.ent(2, 6), n = R.ent(2, 4); const v = Math.pow(-a, n); return { enunciado: '(-' + a + ')' + sup(n) + ' = ___', respuesta: fmt(v, 0), explicacion: 'Base negativa: con exponente ' + (n % 2 ? 'impar el resultado es negativo' : 'par el resultado es positivo') + '. ' + a + sup(n) + ' = ' + fmt(Math.pow(a, n), 0) + ', así que el resultado es ' + fmt(v, 0) + '.' }; }
    const a = R.ent(2, 5), n = R.ent(1, 3);
    return { enunciado: a + sup(-n) + ' = ___ (escríbelo como fracción)', respuesta: '1/' + Math.pow(a, n), explicacion: 'Un exponente negativo indica el inverso: ' + a + sup(-n) + ' = 1/' + a + sup(n) + ' = 1/' + Math.pow(a, n) + '.' };
  }
  function calcEnteros(R, g) {
    const m = g >= 8 ? 100 : 50, op = R.elegir(['+', '-', '×', '÷']);
    let a = R.noCero(-m, m), b = R.noCero(-m, m), v, ex;
    if (op === '+') { v = a + b; ex = (Math.sign(a) === Math.sign(b) ? 'Signos iguales: se suman los valores absolutos y se deja el signo común.' : 'Signos distintos: se restan los valores absolutos y queda el signo del de mayor valor absoluto.'); }
    else if (op === '-') { v = a - b; ex = 'Restar es sumar el opuesto: ' + fmt(a, 0) + ' + ' + fp(-b, 0) + ' = ' + fmt(v, 0) + '.'; }
    else if (op === '×') { a = R.noCero(-15, 15); b = R.noCero(-15, 15); v = a * b; ex = 'Ley de signos: ' + (v > 0 ? 'signos iguales dan positivo' : 'signos distintos dan negativo') + '; ' + Math.abs(a) + ' × ' + Math.abs(b) + ' = ' + Math.abs(v) + '.'; }
    else { b = R.noCero(-12, 12); v = R.noCero(-15, 15); a = b * v; ex = 'Ley de signos en la división: ' + (v > 0 ? 'signos iguales, cociente positivo' : 'signos distintos, cociente negativo') + '; ' + Math.abs(a) + ' ÷ ' + Math.abs(b) + ' = ' + Math.abs(v) + '.'; }
    return { enunciado: fmt(a, 0) + ' ' + op + ' ' + fp(b, 0) + ' = ___', respuesta: fmt(v, 0), explicacion: ex };
  }
  function calcEc(R, g) {
    if (g <= 5) {
      if (R.prob(0.5)) { const a = R.ent(5, 90), x = R.ent(3, 90); return { enunciado: '___ + ' + a + ' = ' + (x + a), respuesta: String(x), explicacion: 'El número que falta es ' + (x + a) + ' - ' + a + ' = ' + x + ', porque la resta deshace la suma.' }; }
      const a = R.ent(2, 9), x = R.ent(2, 12); return { enunciado: '___ × ' + a + ' = ' + a * x, respuesta: String(x), explicacion: 'La división deshace la multiplicación: ' + a * x + ' ÷ ' + a + ' = ' + x + '.' };
    }
    if (g >= 9 && R.prob(0.5)) {
      for (let t = 0; t < 50; t++) {
        const x = R.ent(-6, 8), y = R.ent(-6, 8), a1 = R.noCero(-5, 5), b1 = R.noCero(-5, 5), a2 = R.noCero(-5, 5), b2 = R.noCero(-5, 5);
        const det = a1 * b2 - a2 * b1; if (det === 0) continue;
        const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
        const ec = (a, b, c) => lin(a, 0, 'x') + (b > 0 ? ' + ' : ' - ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'y = ' + fmt(c, 0);
        return { enunciado: 'Resuelve el sistema: { ' + ec(a1, b1, c1) + ' ; ' + ec(a2, b2, c2) + ' }', respuesta: 'x = ' + x + ', y = ' + y, explicacion: 'Por determinantes: D = (' + a1 + ')(' + b2 + ') - (' + a2 + ')(' + b1 + ') = ' + det + '; x = ' + (c1 * b2 - c2 * b1) + '/' + det + ' = ' + x + ', y = ' + (a1 * c2 - a2 * c1) + '/' + det + ' = ' + y + '. Comprobación en la primera: ' + a1 * x + ' + ' + fp(b1 * y, 0) + ' = ' + c1 + '.' };
      }
    }
    if (g >= 8) {
      let a = R.noCero(-9, 9), c = R.noCero(-9, 9); while (c === a) c = R.noCero(-9, 9);
      const x = R.ent(-10, 10), b = R.ent(-20, 20), d = (a - c) * x + b;
      return { enunciado: 'Resuelve: ' + lin(a, b) + ' = ' + lin(c, d), respuesta: 'x = ' + x, explicacion: 'Pasamos los términos en x a la izquierda y los números a la derecha: ' + lin(a - c, 0) + ' = ' + fmt(d - b, 0) + '; x = ' + fmt(d - b, 0) + ' ÷ ' + fp(a - c, 0) + ' = ' + x + '.' };
    }
    const a = R.ent(2, 9), x = g >= 7 ? R.noCero(-10, 12) : R.ent(1, 12), b = g >= 7 ? R.noCero(-20, 20) : R.ent(1, 30), c = a * x + b;
    return { enunciado: 'Resuelve: ' + lin(a, b) + ' = ' + fmt(c, 0), respuesta: 'x = ' + x, explicacion: (b > 0 ? 'Restamos ' + b : 'Sumamos ' + -b) + ' a ambos lados: ' + a + 'x = ' + fmt(c - b, 0) + '; dividimos entre ' + a + ': x = ' + x + '. Comprobación: ' + a + ' × ' + fp(x, 0) + (b > 0 ? ' + ' : ' - ') + Math.abs(b) + ' = ' + fmt(c, 0) + '.' };
  }
  const CALC = { conteo: calcConteo, suma: calcSuma, resta: calcResta, multiplicacion: calcMult, division: calcDiv, mixta: calcMixta, fracciones: calcFrac, decimales: calcDec, potencias: calcPot, enteros: calcEnteros, ecuaciones: calcEc };
  function genCalculo(R, g, op) {
    let o = op.operacion || 'variada';
    if (!CALC[o]) o = R.elegir(opsCalculo(g));
    const it = CALC[o](R, g, op);
    return it;
  }

  /* ---------- Generador: PROBLEMAS COTIDIANOS ---------- */
  const PROB = [[], [], [], [], []];
  function pr(b, ctx, f) { PROB[b].push({ ctx, f }); }

  // Transición
  pr(0, 'tienda', (R) => { const a = R.ent(1, 6), b = R.ent(1, 4); return { enunciado: 'En la tienda de barrio hay ' + a + ' lulos en la canasta y Don Jairo trae ' + b + ' más. ¿Cuántos lulos hay ahora?', svg: svgSumaObj(a, b, 'lulo'), respuesta: String(a + b), explicacion: 'Juntamos los dos grupos y contamos todo: ' + a + ' y ' + b + ' son ' + (a + b) + '.' }; });
  pr(0, 'mio', (R) => { const a = R.ent(3, 8), b = R.ent(1, a - 1); return { enunciado: 'En la estación del MIO había ' + a + ' buses y salieron ' + b + ' (están tachados). ¿Cuántos buses quedan?', svg: svgObjetos(a, 'bus', 'Buses del MIO, algunos tachados', b), respuesta: String(a - b), explicacion: 'Contamos los buses que no están tachados: quedan ' + (a - b) + '.' }; });
  pr(0, 'cancha', (R) => { const n = R.ent(3, 12); return { enunciado: 'El profe sacó los balones a la cancha. ¿Cuántos balones hay?', svg: svgObjetos(n, 'balon', n + ' balones'), respuesta: String(n), explicacion: 'Contamos uno por uno, sin saltar ni repetir: hay ' + n + '.' }; });
  pr(0, 'fiesta', (R) => { const n = R.ent(3, 9); return { enunciado: 'La torta de cumpleaños de ' + R.elegir(NOMBRES) + ' tiene una vela por cada año. ¿Cuántos años cumple?', svg: svgObjetos(n, 'vela', n + ' velas'), respuesta: n + ' años', explicacion: 'Cada vela es un año; al contar las velas obtenemos ' + n + '.' }; });
  pr(0, 'mercado', (R) => { const a = R.ent(1, 8); let b = R.ent(1, 8); while (b === a) b = R.ent(1, 8); const n1 = R.elegir(NOMBRES), n2 = R.elegir(NOMBRES.filter((x) => x !== n1)); return { enunciado: 'En el mercado de Santa Elena, ' + n1 + ' compró ' + a + ' mangos (fila A) y ' + n2 + ' compró ' + b + ' (fila B). ¿Quién compró más?', svg: svg(46 * 8 + 40, 100, T(16, 25, 'A', { bold: true, size: 18 }) + grupoObjetos(a, 'mango', 34, 8, 8, 40) + T(16, 73, 'B', { bold: true, size: 18 }) + grupoObjetos(b, 'mango', 34, 54, 8, 40), 'Dos filas de mangos'), respuesta: (a > b ? n1 : n2) + ' (' + Math.max(a, b) + ' es más que ' + Math.min(a, b) + ')', explicacion: 'Contamos cada fila: A tiene ' + a + ' y B tiene ' + b + '.' }; });

  // 1° y 2°
  pr(1, 'tienda', (R, g) => { const a = R.ent(1, g === 1 ? 4 : 9) * 100, b = R.ent(1, g === 1 ? 5 : 9) * 100; return { enunciado: 'En la tienda de barrio un bombón cuesta ' + pesos(a) + ' y una galleta ' + pesos(b) + '. ¿Cuánto se paga por los dos?', respuesta: pesos(a + b), explicacion: 'Sumamos los precios: ' + fmt(a, 0) + ' + ' + fmt(b, 0) + ' = ' + fmt(a + b, 0) + ' pesos.' }; });
  pr(1, 'mio', (R, g) => { const a = R.ent(20, g === 1 ? 50 : 90), s = R.ent(5, 30), b = R.ent(5, a); return { enunciado: 'Un bus del MIO sale con ' + a + ' pasajeros. En la estación Universidades suben ' + s + ' y bajan ' + b + '. ¿Cuántos pasajeros siguen en el bus?', respuesta: String(a + s - b), explicacion: 'Primero sumamos los que suben: ' + a + ' + ' + s + ' = ' + (a + s) + '. Luego restamos los que bajan: ' + (a + s) + ' - ' + b + ' = ' + (a + s - b) + '.' }; });
  pr(1, 'mercado', (R, g) => { const a = g === 1 ? R.ent(30, 99) : R.ent(120, 900), b = R.ent(10, a - 5); return { enunciado: 'Doña Rosa llevó ' + a + ' guanábanas al mercado de Santa Elena y vendió ' + b + '. ¿Cuántas le quedaron?', respuesta: String(a - b), explicacion: 'Quitamos las vendidas: ' + a + ' - ' + b + ' = ' + (a - b) + '. Comprobamos: ' + (a - b) + ' + ' + b + ' = ' + a + '.' }; });
  pr(1, 'cancha', (R) => { const a = R.ent(15, 40), b = R.ent(5, a - 3); return { enunciado: 'En el torneo del colegio, el equipo naranja marcó ' + a + ' goles y el equipo azul ' + b + '. ¿Cuántos goles más marcó el naranja?', respuesta: String(a - b), explicacion: 'Comparar "cuántos más" es restar: ' + a + ' - ' + b + ' = ' + (a - b) + '.' }; });
  pr(1, 'fiesta', (R, g) => {
    if (g === 1) { const d = R.ent(2, 7), u = R.ent(1, 9); return { enunciado: 'Para el cumpleaños compraron ' + d + ' bolsas de 10 dulces y ' + u + ' dulces sueltos. ¿Cuántos dulces hay?', respuesta: String(d * 10 + u), explicacion: d + ' bolsas de 10 son ' + d + ' decenas = ' + d * 10 + '; más ' + u + ' unidades: ' + (d * 10 + u) + '.' }; }
    const m = R.ent(3, 9), s = R.ent(2, 5); return { enunciado: 'En el cumpleaños hay ' + m + ' mesas y en cada mesa ' + s + ' sillas. ¿Cuántas sillas hay?', respuesta: String(m * s), explicacion: 'Son ' + m + ' grupos iguales de ' + s + ': ' + m + ' × ' + s + ' = ' + m * s + '.' };
  });
  pr(1, 'fiesta', (R) => { const p = R.ent(5, 20), c = R.ent(1, 9); return { enunciado: 'En la clase de salsa hay ' + p + ' parejas bailando y llegan ' + c + ' personas más sin pareja. ¿Cuántas personas hay en total?', respuesta: String(2 * p + c), explicacion: 'Cada pareja son 2 personas: ' + p + ' + ' + p + ' = ' + 2 * p + '; más ' + c + ' = ' + (2 * p + c) + '.' }; });

  // 3° a 5°
  pr(2, 'mercado', (R) => { const c = R.ent(4, 15), b = R.ent(6, 24); return { enunciado: 'Al mercado de Santa Elena llegan ' + c + ' canastas con ' + b + ' guanábanas cada una. ¿Cuántas guanábanas llegan?', respuesta: String(c * b), explicacion: 'Grupos iguales se multiplican: ' + c + ' × ' + b + ' = ' + c * b + '.' }; });
  pr(2, 'tienda', (R) => { const k = R.ent(3, 9), q = R.ent(5, 30), r = R.ent(0, k - 1), N = k * q + r; return { enunciado: 'En la tienda empacan ' + N + ' chontaduros en bolsas de ' + k + '. ¿Cuántas bolsas completas salen y cuántos chontaduros sobran?', respuesta: q + ' bolsas y sobran ' + r, explicacion: N + ' ÷ ' + k + ' = ' + q + ' con residuo ' + r + ', porque ' + k + ' × ' + q + ' = ' + k * q + ' y ' + k * q + ' + ' + r + ' = ' + N + '.' }; });
  pr(2, 'fiesta', (R) => { const d = R.elegir([4, 6, 8, 10, 12]), n = R.ent(1, d - 1); return { enunciado: 'La torta del cumpleaños se partió en ' + d + ' porciones iguales y ya se comieron ' + n + ' (las sombreadas). ¿Qué fracción de la torta queda?', svg: svgFraccionCirculo(n, d), respuesta: fracTxt(d - n, d) + (mcd(d - n, d) > 1 ? ' (= ' + (d - n) + '/' + d + ')' : ''), explicacion: 'La torta entera es ' + d + '/' + d + '. Quitamos ' + n + '/' + d + ': ' + d + '/' + d + ' - ' + n + '/' + d + ' = ' + (d - n) + '/' + d + '.' }; });
  pr(2, 'cancha', (R) => { const L = R.ent(4, 12) * 5, A = R.ent(3, Math.max(3, L / 5 - 1)) * 5, k = R.ent(2, 6); const P = 2 * (L + A); return { enunciado: 'La cancha del barrio mide ' + L + ' m de largo y ' + A + ' m de ancho. Si Samuel le da ' + k + ' vueltas completas por el borde, ¿cuántos metros recorre?', svg: svgRectangulo(L, A, 'm'), respuesta: fmt(P * k, 0) + ' m', explicacion: 'Una vuelta es el perímetro: 2 × (' + L + ' + ' + A + ') = ' + P + ' m. Por ' + k + ' vueltas: ' + P + ' × ' + k + ' = ' + fmt(P * k, 0) + ' m.' }; });
  pr(2, 'mio', (R, g) => { if (g >= 4) { const km = R.ent(25, 189), v = R.ent(2, 4); return { enunciado: 'Un bus del MIO recorre ' + fmt(km / 10, 1) + ' km en cada viaje de su ruta. ¿Cuántos kilómetros recorre en ' + v + ' viajes?', respuesta: fmt(km * v / 10, 1) + ' km', explicacion: 'Multiplicamos ' + fmt(km / 10, 1) + ' × ' + v + ': como enteros ' + km + ' × ' + v + ' = ' + km * v + ', con una cifra decimal: ' + fmt(km * v / 10, 1) + '.' }; }
    const b = R.ent(3, 8), p = R.ent(40, 160); return { enunciado: 'Cada bus articulado del MIO lleva ' + p + ' pasajeros en hora pico. ¿Cuántos pasajeros llevan ' + b + ' buses?', respuesta: String(b * p), explicacion: b + ' × ' + p + ' = ' + b * p + '.' }; });
  pr(2, 'mercado', (R, g) => { if (g < 5) { const kg = R.ent(2, 6), pre = R.ent(15, 60) * 100; return { enunciado: 'El kilo de lulo cuesta ' + pesos(pre) + '. ¿Cuánto se paga por ' + kg + ' kilos?', respuesta: pesos(kg * pre), explicacion: fmt(pre, 0) + ' × ' + kg + ' = ' + fmt(kg * pre, 0) + '.' }; }
    const pre = R.ent(10, 40) * 200, kg = R.elegir([1.5, 2.5, 3.5, 0.5]); const t = pre * kg; return { enunciado: 'El kilo de lulo cuesta ' + pesos(pre) + '. ¿Cuánto se paga por ' + fmt(kg, 1) + ' kilos?', respuesta: pesos(t), explicacion: fmt(kg, 1) + ' kg = ' + Math.floor(kg) + ' kg + medio kilo: ' + fmt(pre * Math.floor(kg), 0) + ' + ' + fmt(pre / 2, 0) + ' = ' + fmt(t, 0) + '.' }; });
  pr(2, 'fiesta', (R) => { const d = R.elegir([3, 4, 5, 8]), n = R.ent(1, d - 1), N = d * R.ent(4, 10); return { enunciado: 'En la academia de salsa hay ' + N + ' estudiantes y ' + n + '/' + d + ' de ellos bailan en el festival de Cali. ¿Cuántos estudiantes bailan?', respuesta: String(N / d * n), explicacion: N + ' ÷ ' + d + ' = ' + N / d + ' (un ' + d + '-avo); por ' + n + ': ' + N / d * n + '.' }; });

  // 6° a 8°
  pr(3, 'mercado', (R) => { const u = R.ent(20, 90) * 100, a = R.ent(2, 5); let b = R.ent(2, 9); while (b === a) b = R.ent(2, 9); return { enunciado: 'En el mercado de Santa Elena, ' + a + ' kg de mango cuestan ' + pesos(u * a) + '. ¿Cuánto cuestan ' + b + ' kg al mismo precio?', respuesta: pesos(u * b), explicacion: 'Proporción directa: 1 kg cuesta ' + fmt(u * a, 0) + ' ÷ ' + a + ' = ' + fmt(u, 0) + '; entonces ' + b + ' kg cuestan ' + fmt(u, 0) + ' × ' + b + ' = ' + fmt(u * b, 0) + '.' }; });
  pr(3, 'fiesta', (R) => { const N = 20 * R.ent(2, 8), p = 5 * R.ent(1, 19); return { enunciado: 'En la academia de salsa hay ' + N + ' estudiantes y el ' + p + ' % se presenta en la Feria de Cali. ¿Cuántos estudiantes se presentan?', respuesta: String(N * p / 100), explicacion: p + ' % de ' + N + ' = ' + N + ' × ' + p + ' ÷ 100 = ' + N * p / 100 + '.' }; });
  pr(3, 'mio', (R) => { const v = R.ent(3, 8) * 1, t = R.ent(2, 6) * 5, T2 = R.ent(2, 8) * 5; const d = v * t; return { enunciado: 'A velocidad constante, un bus del MIO recorre ' + fmt(d / 10, 1) + ' km en ' + t + ' minutos. ¿Cuántos km recorre en ' + T2 + ' minutos?', respuesta: fmt(v * T2 / 10, 1) + ' km', explicacion: 'Por minuto recorre ' + fmt(d / 10, 1) + ' ÷ ' + t + ' = ' + fmt(v / 10, 1) + ' km; en ' + T2 + ' minutos: ' + fmt(v / 10, 1) + ' × ' + T2 + ' = ' + fmt(v * T2 / 10, 1) + ' km.' }; });
  pr(3, 'cancha', (R) => { const L = R.ent(15, 40), A = R.ent(8, 20), c = R.ent(20, 60) * 1000; return { enunciado: 'Una cancha sintética rectangular mide ' + L + ' m por ' + A + ' m. Si el césped cuesta ' + pesos(c) + ' por metro cuadrado, ¿cuánto cuesta cubrirla?', svg: svgRectangulo(L, A, 'm'), respuesta: pesos(L * A * c), explicacion: 'Área = ' + L + ' × ' + A + ' = ' + L * A + ' m². Costo = ' + L * A + ' × ' + fmt(c, 0) + ' = ' + fmt(L * A * c, 0) + '.' }; });
  pr(3, 'tienda', (R) => { const a = R.ent(2, 9), x = R.ent(3, 40), b = R.ent(5, 60); return { enunciado: 'Don Jairo, el de la tienda, dice: "Pensé un número, lo multipliqué por ' + a + ' y le sumé ' + b + '. Me dio ' + (a * x + b) + '." ¿Qué número pensó?', respuesta: String(x), explicacion: 'Ecuación: ' + a + 'x + ' + b + ' = ' + (a * x + b) + '. Restamos ' + b + ': ' + a + 'x = ' + a * x + '. Dividimos entre ' + a + ': x = ' + x + '.' }; });
  pr(3, 'fiesta', (R) => { for (;;) { const p1 = R.ent(2, 8), h1 = R.ent(2, 9), tot = p1 * h1, cand = []; for (let p = 2; p <= 12; p++) if (p !== p1 && tot % p === 0) cand.push(p); if (!cand.length) continue; const p2 = R.elegir(cand); return { enunciado: 'Para decorar el salón del cumpleaños, ' + p1 + ' personas tardan ' + h1 + ' horas. Trabajando al mismo ritmo, ¿cuánto tardan ' + p2 + ' personas?', respuesta: fmt(tot / p2, 2) + ' horas', explicacion: 'Proporción inversa: el trabajo total es ' + p1 + ' × ' + h1 + ' = ' + tot + ' horas-persona; ' + tot + ' ÷ ' + p2 + ' = ' + fmt(tot / p2, 2) + ' horas.' }; } });
  pr(3, 'tienda', (R) => { const d = R.ent(5, 40) * 1000, ab = R.ent(2, 60) * 1000; return { enunciado: 'En el cuaderno del fiado, la cuenta de una vecina marca ' + pesos(d) + ' de deuda (saldo -' + fmt(d, 0) + '). Si abona ' + pesos(ab) + ', ¿cuál es el nuevo saldo?', respuesta: fmt(ab - d, 0) + ' pesos' + (ab - d < 0 ? ' (todavía debe ' + pesos(d - ab) + ')' : ab - d > 0 ? ' (queda a favor)' : ''), explicacion: 'Con enteros: -' + fmt(d, 0) + ' + ' + fmt(ab, 0) + ' = ' + fmt(ab - d, 0) + '.' }; });

  // 9° a 11°
  pr(4, 'fiesta', (R) => { const M = R.ent(4, 12) * 10000, P = R.ent(15, 40) * 1000, n = R.ent(4, 12), k = R.ent(8, 24); const B = M + P * k; return { enunciado: 'Una academia de salsa cobra una matrícula de ' + pesos(M) + ' más ' + pesos(P) + ' por clase. a) Escribe la función de costo C(n). b) ¿Cuánto cuestan ' + n + ' clases? c) ¿Cuántas clases se pueden tomar con ' + pesos(B) + '?', respuesta: 'a) C(n) = ' + fmt(P, 0) + 'n + ' + fmt(M, 0) + '; b) ' + pesos(M + P * n) + '; c) ' + k + ' clases', explicacion: 'Función lineal: pendiente ' + fmt(P, 0) + ' (costo por clase) e intercepto ' + fmt(M, 0) + '. C(' + n + ') = ' + fmt(P, 0) + ' × ' + n + ' + ' + fmt(M, 0) + ' = ' + fmt(M + P * n, 0) + '. Para c): ' + fmt(P, 0) + 'n + ' + fmt(M, 0) + ' = ' + fmt(B, 0) + ', n = ' + fmt(B - M, 0) + ' ÷ ' + fmt(P, 0) + ' = ' + k + '.' }; });
  pr(4, 'cancha', (R) => { const v = R.ent(8, 25); return { enunciado: 'En la cancha, un balón se patea hacia arriba y su altura es h(t) = -5t² + ' + v + 't (metros, t en segundos). ¿En qué instante alcanza la altura máxima, cuál es esa altura y cuándo vuelve al piso?', svg: svgParabola(v), respuesta: 't = ' + fmt(v / 10, 2) + ' s; h máx = ' + fmt(v * v / 20, 2) + ' m; vuelve al piso en t = ' + fmt(v / 5, 2) + ' s', explicacion: 'Vértice: t = -b/(2a) = -' + v + '/(2 × -5) = ' + fmt(v / 10, 2) + '. h(' + fmt(v / 10, 2) + ') = -5 × ' + fmt(v * v / 100, 4) + ' + ' + v + ' × ' + fmt(v / 10, 2) + ' = ' + fmt(v * v / 20, 2) + '. Piso: -5t² + ' + v + 't = 0 => t(-5t + ' + v + ') = 0 => t = ' + fmt(v / 5, 2) + '.' }; });
  pr(4, 'tienda', (R) => { for (;;) { const m = R.ent(5, 30) * 100, l = R.ent(3, 20) * 100, a1 = R.ent(1, 4), b1 = R.ent(1, 4), a2 = R.ent(1, 4), b2 = R.ent(1, 4); const det = a1 * b2 - a2 * b1; if (!det) continue; return { enunciado: 'En la tienda de barrio, ' + a1 + ' mango' + (a1 > 1 ? 's' : '') + ' y ' + b1 + ' lulo' + (b1 > 1 ? 's' : '') + ' cuestan ' + pesos(a1 * m + b1 * l) + '; ' + a2 + ' mango' + (a2 > 1 ? 's' : '') + ' y ' + b2 + ' lulo' + (b2 > 1 ? 's' : '') + ' cuestan ' + pesos(a2 * m + b2 * l) + '. ¿Cuánto cuesta cada fruta?', respuesta: 'Mango: ' + pesos(m) + '; lulo: ' + pesos(l), explicacion: 'Sistema ' + a1 + 'm + ' + b1 + 'l = ' + fmt(a1 * m + b1 * l, 0) + ' y ' + a2 + 'm + ' + b2 + 'l = ' + fmt(a2 * m + b2 * l, 0) + '. Determinante = ' + det + '; m = ' + fmt((a1 * m + b1 * l) * b2 - (a2 * m + b2 * l) * b1, 0) + ' ÷ ' + det + ' = ' + fmt(m, 0) + ', l = ' + fmt(l, 0) + '. Comprobación: ' + a1 + ' × ' + fmt(m, 0) + ' + ' + b1 + ' × ' + fmt(l, 0) + ' = ' + fmt(a1 * m + b1 * l, 0) + '.' }; } });
  pr(4, 'mercado', (R) => { const C0 = R.ent(10, 100) * 100000, i = R.elegir([1, 1.5, 2, 2.5, 3]), n = R.ent(3, 12); const F = Math.round(C0 * Math.pow(1 + i / 100, n)), S = Math.round(C0 * (1 + i / 100 * n)); return { enunciado: 'Una vendedora del mercado de Santa Elena ahorra ' + pesos(C0) + ' al ' + fmt(i, 1) + ' % mensual durante ' + n + ' meses. ¿Cuánto tendrá con interés simple y cuánto con interés compuesto? ¿Cuál conviene?', respuesta: 'Simple: ' + pesos(S) + '; compuesto: ' + pesos(F) + ' (redondeado al peso); conviene el compuesto, ' + pesos(F - S) + ' más', explicacion: 'Simple: C(1 + i·n) = ' + fmt(C0, 0) + ' × (1 + ' + fmt(i / 100, 3) + ' × ' + n + '). Compuesto: C(1 + i)^n = ' + fmt(C0, 0) + ' × ' + fmt(1 + i / 100, 3) + sup(n) + '. El compuesto gana intereses sobre los intereses.' }; });
  pr(4, 'fiesta', (R) => { const a = R.ent(2, 9), b = R.ent(2, 9), c = R.ent(2, 9), T0 = a + b + c; return { enunciado: 'En la piñata del cumpleaños hay ' + a + ' bombones de mango, ' + b + ' de lulo y ' + c + ' de guanábana. Si sacas uno al azar, ¿cuál es la probabilidad de que sea de lulo? ¿Y de que NO sea de mango?', respuesta: 'P(lulo) = ' + fracTxt(b, T0) + ' (' + fmt(100 * b / T0, 1) + ' %); P(no mango) = ' + fracTxt(b + c, T0) + ' (' + fmt(100 * (b + c) / T0, 1) + ' %)', explicacion: 'Casos favorables ÷ casos posibles. Total: ' + T0 + '. P(lulo) = ' + b + '/' + T0 + '. P(no mango) = 1 - ' + a + '/' + T0 + ' = ' + (b + c) + '/' + T0 + '.' }; });
  pr(4, 'mio', (R) => { const P = R.ent(28, 36) * 100, S = R.ent(10, 60) * 1000, k = Math.floor(S / P); return { enunciado: 'Supón que cada pasaje del MIO cuesta ' + pesos(P) + ' y tu tarjeta tiene ' + pesos(S) + '. a) Escribe el saldo después de n viajes. b) ¿Cuántos viajes completos puedes hacer y cuánto sobra?', respuesta: 'a) S(n) = ' + fmt(S, 0) + ' - ' + fmt(P, 0) + 'n; b) ' + k + ' viajes y sobran ' + pesos(S - k * P), explicacion: 'Función lineal decreciente con pendiente -' + fmt(P, 0) + '. Necesitamos S(n) ≥ 0: n ≤ ' + fmt(S, 0) + ' ÷ ' + fmt(P, 0) + ' = ' + fmt(S / P, 2) + ', entonces ' + k + ' viajes; sobran ' + fmt(S, 0) + ' - ' + fmt(k * P, 0) + ' = ' + fmt(S - k * P, 0) + '.' }; });

  function genProblemas(R, g, op) {
    const b = banda(g), tema = op.tema || 'variado';
    let lista = PROB[b].filter((t) => tema === 'variado' || t.ctx === tema);
    if (!lista.length) lista = PROB[b];
    return R.elegir(lista).f(R, g);
  }

  /* ---------- Generador: SERIES Y PATRONES ---------- */
  const FORMAS = ['círculo', 'cuadrado', 'triángulo'], COLORES = [[NAR, 'naranja'], [AMA, 'amarillo']];
  function forma(f, color, x, y, s) {
    if (f === 'círculo') return C(x + s / 2, y + s / 2, s / 2 - 2, color);
    if (f === 'cuadrado') return Rc(x + 2, y + 2, s - 4, s - 4, color);
    return P([[x + s / 2, y + 2], [x + s - 2, y + s - 2], [x + 2, y + s - 2]], color);
  }
  function serieFiguras(R, g) {
    if (g >= 3 && R.prob(0.6)) return serieCreciente(R, g);
    const patrones = g <= 0 ? ['AB', 'AAB', 'ABB'] : ['AB', 'ABC', 'AAB', 'ABB', 'ABCC', 'AABB'];
    const pat = R.elegir(patrones), letras = Array.from(new Set(pat.split('')));
    const pool = []; FORMAS.forEach((f) => COLORES.forEach((c) => pool.push([f, c[1], c[0]])));
    const elem = {}; R.mezclar(pool).slice(0, letras.length).forEach((e, i) => { elem[letras[i]] = e; });
    const n = Math.max(6, pat.length * 2 + R.ent(0, pat.length));
    const seq = []; for (let i = 0; i <= n; i++) seq.push(elem[pat[i % pat.length]]);
    const s = 38; let cuerpo = '';
    for (let i = 0; i < n; i++) cuerpo += forma(seq[i][0], seq[i][2], 8 + i * (s + 6), 8, s);
    cuerpo += Rc(8 + n * (s + 6) + 2, 10, s - 4, s - 4, BLANCO, { dash: '4 3' }) + T(8 + n * (s + 6) + s / 2, 8 + s / 2, '?', { size: 22, bold: true });
    const sig = seq[n];
    const desc = letras.map((l) => elem[l][0] + ' ' + elem[l][1]);
    return {
      enunciado: 'Observa la serie de figuras. ¿Qué figura va en el lugar del signo de pregunta? ¿Cuál es el núcleo que se repite?',
      svg: svg(16 + (n + 1) * (s + 6), s + 16, cuerpo, 'Serie de figuras'),
      respuesta: sig[0] + ' ' + sig[1] + '. Núcleo que se repite: ' + pat.split('').map((l) => elem[l][0] + ' ' + elem[l][1]).join(', '),
      explicacion: 'El patrón tiene ' + pat.length + ' figuras que se repiten en el mismo orden (' + desc.join(', ') + '). La posición ' + (n + 1) + ' corresponde a la figura número ' + ((n % pat.length) + 1) + ' del núcleo.'
    };
  }
  function serieCreciente(R, g) {
    const tipo = R.elegir(g >= 6 ? ['lin', 'cuad', 'esc'] : ['lin', 'cuad', 'esc']);
    const k = tipo === 'lin' ? R.ent(2, 3) : 0, c0 = tipo === 'lin' ? R.ent(0, 2) : 0;
    const f = (n) => (tipo === 'lin' ? k * n + c0 : tipo === 'cuad' ? n * n : n * (n + 1) / 2);
    const s = 13; let x = 10, cuerpo = '', H = 0;
    const celdas = (n) => {
      const out = [];
      if (tipo === 'cuad') for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out.push([c, r]);
      else if (tipo === 'esc') for (let c = 0; c < n; c++) for (let r = 0; r <= c; r++) out.push([c, n - 1 - r]);
      else { for (let r = 0; r < k; r++) for (let c = 0; c < n; c++) out.push([c, r]); for (let i = 0; i < c0; i++) out.push([n + i, 0]); }
      return out;
    };
    for (let n = 1; n <= 3; n++) {
      const cs = celdas(n), maxR = Math.max(...cs.map((p) => p[1])), maxC = Math.max(...cs.map((p) => p[0]));
      H = Math.max(H, (maxR + 1) * s);
      cs.forEach((p) => { cuerpo += Rc(x + p[0] * s, 30 + p[1] * s, s, s, n % 2 ? NAR : AMA, { w: 1.5 }); });
      cuerpo += T(x + ((maxC + 1) * s) / 2, 16, 'Figura ' + n, { size: 13, bold: true });
      x += (maxC + 1) * s + 30;
    }
    const regla = tipo === 'lin' ? 'cada figura tiene ' + k + ' cuadros más que la anterior: ' + lin(k, c0, 'n') : tipo === 'cuad' ? 'la figura n es un cuadrado de n × n: n²' : 'la figura n tiene 1 + 2 + ... + n cuadros: n(n + 1)/2';
    const pideGeneral = g >= 8;
    return {
      enunciado: 'Observa cómo crecen las figuras hechas con cuadros. ¿Cuántos cuadros tendrá la figura 4? ¿Y la figura 10?' + (pideGeneral ? ' Escribe la expresión para la figura n.' : ''),
      svg: svg(x, H + 44, cuerpo, 'Patrón de figuras que crece'),
      respuesta: 'Figura 4: ' + f(4) + ' cuadros; figura 10: ' + f(10) + ' cuadros' + (pideGeneral ? '; figura n: ' + (tipo === 'lin' ? lin(k, c0, 'n') : tipo === 'cuad' ? 'n²' : 'n(n + 1)/2') : ''),
      explicacion: 'Las figuras tienen ' + f(1) + ', ' + f(2) + ', ' + f(3) + ' cuadros. Regla: ' + regla + '.'
    };
  }
  function serieNumerica(R, g) {
    const b = banda(g); let t, regla, m = 5;
    const arit = (a0, d) => { t = []; for (let i = 0; i <= m; i++) t.push(a0 + i * d); regla = d > 0 ? 'sumar ' + fmt(d, 0) + ' cada vez' : 'restar ' + fmt(-d, 0) + ' cada vez'; };
    const opts = [];
    if (b === 0) { opts.push(() => arit(R.ent(1, 10), 1), () => arit(R.ent(10, 20), -1), () => arit(R.ent(0, 6), 2)); }
    if (b === 1) { opts.push(() => arit(R.ent(1, 50), R.elegir([2, 3, 5, 10])), () => arit(R.ent(60, 99), -R.elegir([2, 5, 10])), () => arit(R.ent(1, 9) * (g === 2 ? 100 : 10), g === 2 ? 100 : 10)); }
    if (b === 2) {
      opts.push(() => arit(R.ent(5, 200), R.ent(4, 25)), () => arit(R.ent(300, 900), -R.ent(6, 40)));
      opts.push(() => { const a0 = R.ent(1, 5), r = R.elegir([2, 3]); t = []; for (let i = 0; i <= m; i++) t.push(a0 * Math.pow(r, i)); regla = 'multiplicar por ' + r; });
      opts.push(() => { const p = R.ent(4, 12), q = R.ent(1, p - 1), a0 = R.ent(1, 30); m = 6; t = [a0]; for (let i = 1; i <= m; i++) t.push(t[i - 1] + (i % 2 ? p : -q)); regla = 'alternar: sumar ' + p + ' y restar ' + q; });
      opts.push(() => { const s0 = R.ent(1, 5); t = []; for (let i = 0; i <= m; i++) t.push((s0 + i) * (s0 + i)); regla = 'cuadrados perfectos: ' + s0 + '², ' + (s0 + 1) + '², ' + (s0 + 2) + '²...'; });
      if (g >= 5) opts.push(() => { const a = R.ent(1, 3), c = R.ent(1, 4); m = 6; t = [a, c]; for (let i = 2; i <= m; i++) t.push(t[i - 1] + t[i - 2]); regla = 'cada término es la suma de los dos anteriores (tipo Fibonacci)'; });
    }
    if (b >= 3) {
      opts.push(() => arit(R.ent(-30, 30), R.noCero(-12, 12)));
      opts.push(() => { const a0 = R.noCero(-4, 4), r = R.elegir([-2, 2, 3, -3]); t = []; for (let i = 0; i <= m; i++) t.push(a0 * Math.pow(r, i)); regla = 'multiplicar por ' + fp(r, 0); });
      opts.push(() => { const a = R.ent(1, 5), c = R.ent(1, 5); m = 6; t = [a, c]; for (let i = 2; i <= m; i++) t.push(t[i - 1] + t[i - 2]); regla = 'cada término es la suma de los dos anteriores (tipo Fibonacci)'; });
      opts.push(() => { const c = R.ent(-5, 5); t = []; for (let i = 1; i <= m + 1; i++) t.push(i * i + c); regla = 'n² ' + (c >= 0 ? '+ ' + c : '- ' + -c) + ' (las diferencias crecen de 2 en 2)'; });
      opts.push(() => { t = []; for (let i = 1; i <= m + 1; i++) t.push(i * (i + 1) / 2); regla = 'números triangulares: se suma 2, 3, 4, 5... (n(n + 1)/2)'; });
    }
    R.elegir(opts)();
    return { enunciado: 'Escribe el número que sigue y la regla: ' + t.slice(0, m).map((x) => fmt(x, 0)).join(', ') + ', ___', respuesta: fmt(t[m], 0) + '. Regla: ' + regla, explicacion: 'Comparamos cada término con el anterior (diferencias: ' + t.slice(1, m).map((x, i) => fp(x - t[i], 0)).join(', ') + ') y aplicamos la regla: ' + regla + '.' };
  }
  function serieGeneral(R, g) {
    const tipo = g >= 9 ? R.elegir(['arit', 'geo', 'cuad']) : R.elegir(['arit', 'arit', 'cuad']);
    if (tipo === 'arit') {
      const a1 = R.ent(-20, 30), d = R.noCero(-9, 9), N = R.ent(15, 60), t = [1, 2, 3, 4, 5].map((n) => a1 + (n - 1) * d);
      return { enunciado: 'Progresión: ' + t.map((x) => fmt(x, 0)).join(', ') + ', ... Escribe el término general aₙ y calcula a' + N + '.', respuesta: 'aₙ = ' + lin(d, a1 - d, 'n') + '; a' + N + ' = ' + fmt(a1 + (N - 1) * d, 0), explicacion: 'Es aritmética con diferencia d = ' + d + ': aₙ = a₁ + (n - 1)d = ' + a1 + ' + (n - 1)(' + d + ') = ' + lin(d, a1 - d, 'n') + '. Para n = ' + N + ': ' + d + ' × ' + N + (a1 - d >= 0 ? ' + ' : ' - ') + Math.abs(a1 - d) + ' = ' + fmt(a1 + (N - 1) * d, 0) + '.' };
    }
    if (tipo === 'geo') {
      const a1 = R.noCero(-3, 5), r = R.elegir([2, 3, -2]), N = R.ent(7, 10), t = [1, 2, 3, 4, 5].map((n) => a1 * Math.pow(r, n - 1));
      return { enunciado: 'Progresión: ' + t.map((x) => fmt(x, 0)).join(', ') + ', ... Escribe el término general aₙ y calcula a' + N + '.', respuesta: 'aₙ = ' + fp(a1, 0) + ' · ' + fp(r, 0) + '^(n - 1); a' + N + ' = ' + fmt(a1 * Math.pow(r, N - 1), 0), explicacion: 'Es geométrica con razón r = ' + r + ' (cada término ÷ anterior). aₙ = a₁ · r^(n - 1); a' + N + ' = ' + a1 + ' × ' + fp(r, 0) + sup(N - 1) + ' = ' + fmt(a1 * Math.pow(r, N - 1), 0) + '.' };
    }
    const c = R.ent(-6, 6), k = R.elegir([1, 2, 3]), N = R.ent(10, 30), f = (n) => k * n * n + c, t = [1, 2, 3, 4, 5].map(f);
    const ex = (k === 1 ? '' : k) + 'n²' + (c ? (c > 0 ? ' + ' + c : ' - ' + -c) : '');
    return { enunciado: 'Sucesión: ' + t.map((x) => fmt(x, 0)).join(', ') + ', ... Encuentra el término general aₙ y calcula a' + N + '.', respuesta: 'aₙ = ' + ex + '; a' + N + ' = ' + fmt(f(N), 0), explicacion: 'Las primeras diferencias (' + t.slice(1).map((x, i) => x - t[i]).join(', ') + ') no son constantes, pero las segundas sí (' + 2 * k + '): la regla es cuadrática con coeficiente ' + 2 * k + '/2 = ' + k + '. Probando n = 1: ' + k + ' + ' + fp(c, 0) + ' = ' + t[0] + '. a' + N + ' = ' + fmt(f(N), 0) + '.' };
  }
  function genSeries(R, g, op) {
    let tema = op.tema || 'variada';
    if (tema === 'termino_general' && g < 8) tema = 'numericas';
    if (tema === 'variada') tema = R.elegir(['numericas', 'numericas', 'figuras'].concat(g >= 8 ? ['termino_general', 'termino_general'] : []));
    if (tema === 'figuras') return serieFiguras(R, g);
    if (tema === 'termino_general') return serieGeneral(R, g);
    return serieNumerica(R, g);
  }

  /* ---------- Dibujos de geometría (medidas coherentes con las respuestas) ---------- */
  // Escala puntos (unidades reales) dentro de un lienzo W×H conservando proporciones
  function ajustar(pts, W, H, pad) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / Math.max(Mx - mx, 1e-9), (H - 2 * pad) / Math.max(My - my, 1e-9));
    const ox = (W - (Mx - mx) * s) / 2, oy = (H - (My - my) * s) / 2;
    return { pts: pts.map((p) => [ox + (p[0] - mx) * s, oy + (p[1] - my) * s]), s, map: (p) => [ox + (p[0] - mx) * s, oy + (p[1] - my) * s] };
  }
  function areaFirmada(p) { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; }
  // Polígono con una etiqueta por lado (null = sin etiqueta), colocada hacia afuera
  function poligonoEtiquetado(ptsU, etiquetas, W, H, fill, extra) {
    const A = ajustar(ptsU, W, H, 64), p = A.pts, sg = areaFirmada(p) > 0 ? 1 : -1;
    let out = P(p, fill || AMA);
    for (let i = 0; i < p.length; i++) {
      const e = etiquetas[i]; if (e == null) continue;
      const q = p[(i + 1) % p.length], mx = (p[i][0] + q[0]) / 2, my = (p[i][1] + q[1]) / 2;
      const dx = q[0] - p[i][0], dy = q[1] - p[i][1], len = Math.hypot(dx, dy) || 1;
      const nx = (dy / len) * sg, ny = (-dx / len) * sg;
      out += T(mx + nx * (Math.abs(nx) > 0.7 ? 34 : 18), my + ny * 16 + (Math.abs(nx) > 0.7 ? 5 : 0), e, { size: 14, bold: true });
    }
    return { cuerpo: out + (extra ? extra(A) : ''), A };
  }
  function svgRectangulo(L, A, u, titulo) {
    const r = poligonoEtiquetado([[0, 0], [L, 0], [L, A], [0, A]], [null, fmt(A, 2) + ' ' + u, fmt(L, 2) + ' ' + u, null], 320, 220, AMA);
    return svg(320, 220, r.cuerpo, titulo || 'Rectángulo de ' + fmt(L, 2) + ' por ' + fmt(A, 2) + ' ' + u);
  }
  function svgCuadricula(a, b) {
    const s = 26, x0 = 16, y0 = 16; let o = '';
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) o += Rc(x0 + i * s, y0 + j * s, s, s, AMA, { w: 1.5 });
    o += Rc(x0, y0, a * s, b * s, 'none', { w: 3 });
    o += T(x0, y0 + b * s + 18, 'Cada cuadro mide 1 cm de lado (1 cm²)', { size: 12, anchor: 'start' });
    return svg(Math.max(x0 * 2 + a * s, 260), y0 + b * s + 34, o, 'Rectángulo en cuadrícula');
  }
  function svgL(W, H, w, h, u) {
    const pts = [[0, 0], [W - w, 0], [W - w, h], [W, h], [W, H], [0, H]];
    const r = poligonoEtiquetado(pts, [fmt(W - w, 2) + ' ' + u, fmt(h, 2) + ' ' + u, fmt(w, 2) + ' ' + u, fmt(H - h, 2) + ' ' + u, fmt(W, 2) + ' ' + u, fmt(H, 2) + ' ' + u], 340, 260, AMA);
    return svg(340, 260, r.cuerpo, 'Figura compuesta en forma de L');
  }
  function puntosTriangulo(a, b, c) { const x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x)); return [[0, 0], [c, 0], [x, -y]]; }
  function svgTrianguloLados(a, b, c, u) {
    const r = poligonoEtiquetado(puntosTriangulo(a, b, c), [fmt(c, 2) + ' ' + u, fmt(a, 2) + ' ' + u, fmt(b, 2) + ' ' + u], 320, 230, NAR);
    return svg(320, 230, r.cuerpo, 'Triángulo con sus tres lados');
  }
  function svgTrianguloAltura(base, h, px, u) {
    const pts = [[0, 0], [base, 0], [px, -h]];
    const r = poligonoEtiquetado(pts, ['b = ' + fmt(base, 2) + ' ' + u, null, null], 320, 230, AMA, (A) => {
      const top = A.map([px, -h]), pie = A.map([px, 0]);
      let e = L(top[0], top[1], pie[0], pie[1], { dash: '6 4' }) + Rc(pie[0], pie[1] - 10, 10, 10, 'none', { w: 1.5 });
      if (px < 0 || px > base) { const ext = A.map([px < 0 ? 0 : base, 0]); e += L(pie[0], pie[1], ext[0], ext[1], { dash: '3 3', w: 1.5 }); }
      return e + T(pie[0] + 12, (top[1] + pie[1]) / 2, 'h = ' + fmt(h, 2) + ' ' + u, { size: 13, anchor: 'start', bold: true });
    });
    return svg(320, 230, r.cuerpo, 'Triángulo con base y altura');
  }
  function svgTrapecio(B, b, h, o, u) {
    const pts = [[0, 0], [B, 0], [o + b, -h], [o, -h]];
    const r = poligonoEtiquetado(pts, ['B = ' + fmt(B, 2) + ' ' + u, null, 'b = ' + fmt(b, 2) + ' ' + u, null], 330, 230, AMA, (A) => {
      const top = A.map([o, -h]), pie = A.map([o, 0]);
      return L(top[0], top[1], pie[0], pie[1], { dash: '6 4' }) + T(pie[0] + 8, (top[1] + pie[1]) / 2, 'h = ' + fmt(h, 2) + ' ' + u, { size: 13, anchor: 'start', bold: true });
    });
    return svg(330, 230, r.cuerpo, 'Trapecio con bases y altura');
  }
  function svgCirculo(r, u, usarDiametro) {
    const cx = 130, cy = 110, R0 = 85;
    let o = C(cx, cy, R0, AMA) + C(cx, cy, 3, AZUL);
    if (usarDiametro) o += L(cx - R0, cy, cx + R0, cy, { w: 2.5 }) + T(cx, cy - 14, 'd = ' + fmt(2 * r, 2) + ' ' + u, { size: 14, bold: true });
    else o += L(cx, cy, cx + R0, cy, { w: 2.5 }) + T(cx + R0 / 2, cy - 14, 'r = ' + fmt(r, 2) + ' ' + u, { size: 14, bold: true });
    return svg(260, 220, o, 'Círculo');
  }
  function sector(cx, cy, r, a0, a1, fill) {
    const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    return Pa('M ' + r1(cx) + ' ' + r1(cy) + ' L ' + r1(p0[0]) + ' ' + r1(p0[1]) + ' A ' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + r1(p1[0]) + ' ' + r1(p1[1]) + ' Z', fill);
  }
  function svgFraccionCirculo(n, d, sombreados) {
    const cx = 110, cy = 110, R0 = 90, set = new Set(sombreados || Array.from({ length: n }, (_, i) => i)); let o = '';
    if (d === 1) o = C(cx, cy, R0, n ? NAR : BLANCO);
    else for (let i = 0; i < d; i++) { const a0 = -Math.PI / 2 + (2 * Math.PI * i) / d, a1 = a0 + (2 * Math.PI) / d; o += sector(cx, cy, R0, a0, a1, set.has(i) ? NAR : BLANCO); }
    return svg(220, 220, o, 'Círculo dividido en ' + d + ' partes iguales');
  }
  function svgFraccionRect(d, sombreados) {
    const filas = d > 6 && d % 2 === 0 ? 2 : 1, cols = d / filas, W = 300, H = filas === 2 ? 140 : 80, cw = W / cols, ch = H / filas, set = new Set(sombreados); let o = '';
    for (let i = 0; i < d; i++) o += Rc(10 + (i % cols) * cw, 10 + Math.floor(i / cols) * ch, cw, ch, set.has(i) ? NAR : BLANCO);
    return svg(W + 20, H + 20, o, 'Rectángulo dividido en ' + d + ' partes iguales');
  }
  function arco(cx, cy, r, aIni, aFin) { // ángulos en grados, sentido antihorario visual
    const a0 = (aIni * Math.PI) / 180, a1 = (aFin * Math.PI) / 180;
    const p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
    return Pa('M ' + r1(p0[0]) + ' ' + r1(p0[1]) + ' A ' + r + ' ' + r + ' 0 ' + (aFin - aIni > 180 ? 1 : 0) + ' 0 ' + r1(p1[0]) + ' ' + r1(p1[1]), 'none', { w: 2.5, stroke: NAR });
  }
  function marcaRecta(cx, cy, aBase, s) { // cuadradito de ángulo recto entre aBase y aBase+90
    const u = [Math.cos((aBase * Math.PI) / 180), -Math.sin((aBase * Math.PI) / 180)], v = [Math.cos(((aBase + 90) * Math.PI) / 180), -Math.sin(((aBase + 90) * Math.PI) / 180)];
    return P([[cx, cy], [cx + u[0] * s, cy + u[1] * s], [cx + (u[0] + v[0]) * s, cy + (u[1] + v[1]) * s], [cx + v[0] * s, cy + v[1] * s]], 'none', { w: 1.5 });
  }
  function rayo(cx, cy, ang, len) { const a = (ang * Math.PI) / 180; return L(cx, cy, cx + len * Math.cos(a), cy - len * Math.sin(a), { w: 3 }); }
  function etiquetaAng(cx, cy, a0, a1, r, txt) { const m = (((a0 + a1) / 2) * Math.PI) / 180; return T(cx + r * Math.cos(m), cy - r * Math.sin(m), txt, { size: 14, bold: true }); }
  function svgAngulo(theta, etq) {
    const cx = 150, cy = 150; let o = rayo(cx, cy, 0, 125) + rayo(cx, cy, theta, 125) + C(cx, cy, 3, AZUL);
    o += theta === 90 ? marcaRecta(cx, cy, 0, 18) : arco(cx, cy, 34, 0, theta);
    o += etiquetaAng(cx, cy, 0, theta, theta < 40 ? 70 : 56, etq);
    return svg(300, 175, o, 'Ángulo');
  }
  // Ángulos adyacentes: total 180 (sobre una recta) o 90 (dentro de un ángulo recto)
  function svgAdyacentes(a, total, etqA, etqB) {
    const cx = 150, cy = 150; let o = '';
    if (total === 180) o += L(cx - 130, cy, cx + 130, cy, { w: 3 });
    else o += rayo(cx, cy, 0, 125) + rayo(cx, cy, 90, 125) + marcaRecta(cx, cy, 0, 12);
    o += rayo(cx, cy, a, 125) + arco(cx, cy, 34, 0, a) + arco(cx, cy, 46, a, total);
    o += etiquetaAng(cx, cy, 0, a, a < 30 ? 82 : 66, etqA) + etiquetaAng(cx, cy, a, total, (total - a) < 30 ? 92 : 74, etqB);
    return svg(300, 175 - (total === 90 ? 0 : 0), o, total === 180 ? 'Ángulos suplementarios sobre una recta' : 'Ángulos complementarios');
  }
  function svgTrianguloAngulos(A, B, eA, eB, eC) {
    const ra = (A * Math.PI) / 180, rb = (B * Math.PI) / 180, b = (10 * Math.sin(rb)) / Math.sin(ra + rb);
    const pts = [[0, 0], [10, 0], [b * Math.cos(ra), -b * Math.sin(ra)]];
    const Aj = ajustar(pts, 320, 220, 34), p = Aj.pts, g0 = [(p[0][0] + p[1][0] + p[2][0]) / 3, (p[0][1] + p[1][1] + p[2][1]) / 3];
    let o = P(p, AMA);
    [eA, eB, eC].forEach((e, i) => { const dx = g0[0] - p[i][0], dy = g0[1] - p[i][1], l = Math.hypot(dx, dy) || 1, k = Math.min(30, l * 0.45); o += T(p[i][0] + (dx / l) * k, p[i][1] + (dy / l) * k, e, { size: 13, bold: true }); });
    return svg(320, 220, o, 'Triángulo con sus ángulos');
  }
  function svgSimetria(celdas, marca) {
    const s = 30, x0 = 14, y0 = 34, cols = 8, filas = 6; let o = '';
    for (let c = 0; c < cols; c++) { o += T(x0 + c * s + s / 2, 18, String(c + 1), { size: 12 }); for (let f = 0; f < filas; f++) o += Rc(x0 + c * s, y0 + f * s, s, s, 'none', { w: 1 }); }
    celdas.forEach((p) => { o += Rc(x0 + p[0] * s, y0 + p[1] * s, s, s, NAR, { w: 1 }); });
    if (marca) o += T(x0 + marca[0] * s + s / 2, y0 + marca[1] * s + s / 2, 'X', { size: 18, bold: true });
    o += L(x0 + 4 * s, y0 - 8, x0 + 4 * s, y0 + filas * s + 8, { w: 3, dash: '8 5', stroke: AZUL });
    o += T(x0 + 4 * s, y0 + filas * s + 22, 'eje de simetría', { size: 12 });
    return svg(x0 * 2 + cols * s, y0 + filas * s + 34, o, 'Cuadrícula de simetría');
  }
  function svgPrisma(l, w, h, u, etq) {
    etq = etq || {};
    const s = Math.min(170 / (l + 0.5 * w), 130 / (h + 0.5 * w)), dx = w * s * 0.5, dy = w * s * 0.5, x0 = 40, y0 = 20 + dy, L0 = l * s, H0 = h * s;
    let o = P([[x0, y0], [x0 + dx, y0 - dy], [x0 + dx + L0, y0 - dy], [x0 + L0, y0]], AMA) + P([[x0 + L0, y0], [x0 + L0 + dx, y0 - dy], [x0 + L0 + dx, y0 - dy + H0], [x0 + L0, y0 + H0]], NAR) + Rc(x0, y0, L0, H0, AMA);
    o += L(x0 + dx, y0 - dy + H0, x0 + dx, y0 - dy, { dash: '4 4', w: 1.2 }) + L(x0 + dx, y0 - dy + H0, x0, y0 + H0, { dash: '4 4', w: 1.2 }) + L(x0 + dx, y0 - dy + H0, x0 + dx + L0, y0 - dy + H0, { dash: '4 4', w: 1.2 });
    o += T(x0 + L0 / 2, y0 + H0 + 16, etq.l || fmt(l, 2) + ' ' + u, { size: 13, bold: true }) + T(x0 - 6, y0 + H0 / 2, etq.h || fmt(h, 2) + ' ' + u, { size: 13, bold: true, anchor: 'end' }) + T(x0 + L0 + dx / 2 + 8, y0 + H0 - dy / 2 + 8, etq.w || fmt(w, 2) + ' ' + u, { size: 13, bold: true, anchor: 'start' });
    return svg(x0 + L0 + dx + 70, y0 + H0 + 30, o, 'Prisma rectangular en perspectiva');
  }
  function svgCilindro(r, h, u) {
    const s = Math.min(70 / r, 150 / h), rx = r * s, ry = rx * 0.3, cx = 110, top = 20 + ry, H0 = h * s;
    let o = Rc(cx - rx, top, 2 * rx, H0, AMA, { w: 0 }) + L(cx - rx, top, cx - rx, top + H0) + L(cx + rx, top, cx + rx, top + H0);
    o += '<path d="M ' + r1(cx - rx) + ' ' + r1(top + H0) + ' A ' + r1(rx) + ' ' + r1(ry) + ' 0 0 0 ' + r1(cx + rx) + ' ' + r1(top + H0) + '" fill="' + AMA + '" stroke="' + AZUL + '" stroke-width="2"/>';
    o += '<path d="M ' + r1(cx - rx) + ' ' + r1(top + H0) + ' A ' + r1(rx) + ' ' + r1(ry) + ' 0 0 1 ' + r1(cx + rx) + ' ' + r1(top + H0) + '" fill="none" stroke="' + AZUL + '" stroke-width="1.2" stroke-dasharray="4 4"/>';
    o += '<ellipse cx="' + cx + '" cy="' + r1(top) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="' + NAR + '" stroke="' + AZUL + '" stroke-width="2"/>';
    o += L(cx, top, cx + rx, top, { w: 2 }) + T(cx + rx / 2, top - ry - 8, 'r = ' + fmt(r, 2) + ' ' + u, { size: 13, bold: true }) + T(cx + rx + 8, top + H0 / 2, 'h = ' + fmt(h, 2) + ' ' + u, { size: 13, bold: true, anchor: 'start' });
    return svg(cx + rx + 110, top + H0 + ry + 16, o, 'Cilindro');
  }
  // Triángulo rectángulo: cateto horizontal a, cateto vertical b, ángulo θ en el vértice izquierdo
  function svgTrianguloRect(a, b, eA, eB, eC, eAng) {
    const pts = [[0, 0], [a, 0], [a, -b]];
    const r = poligonoEtiquetado(pts, [eA, eB, eC], 330, 240, AMA, (A) => {
      const p = A.pts, th = (Math.atan2(b, a) * 180) / Math.PI;
      let e = marcaRecta(p[1][0], p[1][1], 90, 14);
      if (eAng) e += arco(p[0][0], p[0][1], 32, 0, th) + etiquetaAng(p[0][0], p[0][1], 0, th, th < 25 ? 66 : 52, eAng);
      return e;
    });
    return svg(330, 240, r.cuerpo, 'Triángulo rectángulo');
  }
  function svgParabola(v) {
    const Tt = v / 5, hm = (v * v) / 20, W = 300, H = 190, x0 = 40, y0 = 160, sx = 230 / Tt, sy = 130 / hm;
    let pts = []; for (let i = 0; i <= 40; i++) { const t = (Tt * i) / 40; pts.push(r1(x0 + t * sx) + ',' + r1(y0 - (-5 * t * t + v * t) * sy)); }
    let o = L(x0, y0, x0 + 245, y0, { w: 1.5 }) + L(x0, y0, x0, 14, { w: 1.5 }) + T(x0 + 250, y0 + 14, 't (s)', { size: 12, anchor: 'end' }) + T(x0 + 6, 12, 'h (m)', { size: 12, anchor: 'start' });
    o += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + NAR + '" stroke-width="3"/>';
    o += C(x0 + (v / 10) * sx, y0 - hm * sy, 4, AMA) + L(x0 + (v / 10) * sx, y0 - hm * sy, x0 + (v / 10) * sx, y0, { dash: '4 4', w: 1 }) + T(x0 + (v / 10) * sx, y0 - hm * sy - 12, 'altura máxima', { size: 12 });
    return svg(W, H, o, 'Trayectoria del balón');
  }

  /* ---------- Generador: GEOMETRÍA VISUAL ---------- */
  const PI = 3.14;
  function geoFiguras(R, g) {
    const cols = 5, filas = 3, s = 46; let o = ''; const cuenta = { 'círculo': 0, 'cuadrado': 0, 'triángulo': 0 };
    for (let i = 0; i < cols * filas; i++) {
      if (R.prob(0.2)) continue;
      const f = R.elegir(FORMAS), c = R.elegir(COLORES)[0]; cuenta[f]++;
      o += forma(f, c, 10 + (i % cols) * (s + 10), 10 + Math.floor(i / cols) * (s + 10), s);
    }
    const objetivo = g >= 1 ? R.elegir(['cuadrado', 'triángulo']) : R.elegir(FORMAS);
    const plural = { 'círculo': 'círculos', 'cuadrado': 'cuadrados', 'triángulo': 'triángulos' }[objetivo];
    const lados = objetivo === 'cuadrado' ? 4 : 3, n = cuenta[objetivo];
    const dib = svg(20 + cols * (s + 10), 20 + filas * (s + 10), o, 'Figuras geométricas mezcladas');
    if (g === 0) return { enunciado: '¿Cuántos ' + plural + ' hay en el dibujo? Colorea solo los ' + plural + '.', svg: dib, respuesta: String(n), explicacion: 'Buscamos la forma: ' + (objetivo === 'círculo' ? 'el círculo es redondo y no tiene esquinas' : 'el ' + objetivo + ' tiene ' + lados + ' lados y ' + lados + ' esquinas') + '. Hay ' + n + '.' };
    return { enunciado: '¿Cuántos ' + plural + ' hay? Si cuentas los lados de todos ellos, ¿cuántos lados son en total?', svg: dib, respuesta: n + ' ' + plural + ' y ' + n * lados + ' lados', explicacion: 'Cada ' + objetivo + ' tiene ' + lados + ' lados: ' + n + ' × ' + lados + ' = ' + n * lados + '.' };
  }
  function trianguloValido(R, lo, hi) { const a = R.ent(lo, hi), b = R.ent(lo, hi); const cmin = Math.abs(a - b) + 1, cmax = Math.min(hi, a + b - 1); const c = R.ent(Math.min(cmin, cmax), Math.max(cmin, cmax)); return [a, b, c]; }
  function geoPerimetro(R, g) {
    const u = g <= 5 ? 'cm' : R.elegir(['cm', 'm']), hi = g <= 2 ? 9 : 20;
    const opts = ['rect', 'tri'];
    if (g >= 3) opts.push('cuad'); if (g >= 4) opts.push('L'); if (g >= 6) opts.push('circ');
    const t = R.elegir(opts);
    if (t === 'rect' || t === 'cuad') {
      const L0 = R.ent(2, hi), A0 = t === 'cuad' ? L0 : R.ent(2, hi); const P0 = 2 * (L0 + A0);
      return { enunciado: '¿Cuál es el perímetro de este ' + (t === 'cuad' ? 'cuadrado' : 'rectángulo') + '?', svg: svgRectangulo(L0, A0, u), respuesta: P0 + ' ' + u, explicacion: 'El perímetro es la suma de todos los lados: ' + [L0, A0, L0, A0].join(' + ') + ' = ' + P0 + ' ' + u + (t === 'cuad' ? ' (o 4 × ' + L0 + ')' : '') + '.' };
    }
    if (t === 'tri') { const [a, b, c] = trianguloValido(R, 3, hi); return { enunciado: '¿Cuál es el perímetro del triángulo?', svg: svgTrianguloLados(a, b, c, u), respuesta: a + b + c + ' ' + u, explicacion: 'Sumamos los tres lados: ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + ' ' + u + '.' }; }
    if (t === 'L') { const W = R.ent(6, 16), H = R.ent(6, 16), w = R.ent(2, W - 3), h = R.ent(2, H - 3); return { enunciado: 'Calcula el perímetro de la figura en forma de L.', svg: svgL(W, H, w, h, u), respuesta: 2 * (W + H) + ' ' + u, explicacion: 'Sumamos los seis lados: ' + [W - w, h, w, H - h, W, H].join(' + ') + ' = ' + 2 * (W + H) + ' ' + u + '. Observa que es igual al perímetro del rectángulo de ' + W + ' por ' + H + '.' }; }
    const r = R.ent(2, 15), dia = R.prob(0.4), C0 = 2 * PI * r;
    return { enunciado: 'Calcula la longitud de la circunferencia (usa π ≈ 3,14).', svg: svgCirculo(r, u, dia), respuesta: fmt(C0, 2) + ' ' + u, explicacion: 'Longitud = 2 × π × r' + (dia ? ' = π × d' : '') + ' = 2 × 3,14 × ' + r + ' = ' + fmt(C0, 2) + ' ' + u + '.' };
  }
  function geoArea(R, g) {
    if (g <= 2) { const a = R.ent(2, 8), b = R.ent(2, 5); return { enunciado: 'Cuenta los cuadros: ¿cuál es el área del rectángulo?', svg: svgCuadricula(a, b), respuesta: a * b + ' cm²', explicacion: 'Hay ' + b + ' filas de ' + a + ' cuadros: ' + b + ' × ' + a + ' = ' + a * b + ' cuadros de 1 cm².' }; }
    const u = R.elegir(['cm', 'm']);
    const opts = ['rect', 'cuad']; if (g >= 4) opts.push('L'); if (g >= 5) opts.push('tri'); if (g >= 6) opts.push('tri', 'trap', 'circ');
    const t = R.elegir(opts);
    if (t === 'rect' || t === 'cuad') { const L0 = R.ent(3, 20), A0 = t === 'cuad' ? L0 : R.ent(2, 15); return { enunciado: 'Calcula el área del ' + (t === 'cuad' ? 'cuadrado' : 'rectángulo') + '.', svg: svgRectangulo(L0, A0, u), respuesta: L0 * A0 + ' ' + u + '²', explicacion: 'Área = largo × ancho = ' + L0 + ' × ' + A0 + ' = ' + L0 * A0 + ' ' + u + '².' }; }
    if (t === 'L') { const W = R.ent(6, 16), H = R.ent(6, 16), w = R.ent(2, W - 3), h = R.ent(2, H - 3), Ar = W * H - w * h; return { enunciado: 'Calcula el área de la figura en forma de L.', svg: svgL(W, H, w, h, u), respuesta: Ar + ' ' + u + '²', explicacion: 'Rectángulo completo menos la esquina que falta: ' + W + ' × ' + H + ' - ' + w + ' × ' + h + ' = ' + W * H + ' - ' + w * h + ' = ' + Ar + ' ' + u + '².' }; }
    if (t === 'tri') { const b = R.ent(4, 20), h = R.ent(3, 15), px = b * (0.2 + R.f() * 0.6); return { enunciado: 'Calcula el área del triángulo.', svg: svgTrianguloAltura(b, h, px, u), respuesta: fmt((b * h) / 2, 2) + ' ' + u + '²', explicacion: 'Área = base × altura ÷ 2 = ' + b + ' × ' + h + ' ÷ 2 = ' + fmt((b * h) / 2, 2) + ' ' + u + '². El triángulo es la mitad de un rectángulo de ' + b + ' por ' + h + '.' }; }
    if (t === 'trap') { const B = R.ent(8, 20), b = R.ent(3, B - 2), h = R.ent(3, 12), o = R.ent(0, B - b); return { enunciado: 'Calcula el área del trapecio.', svg: svgTrapecio(B, b, h, o, u), respuesta: fmt(((B + b) * h) / 2, 2) + ' ' + u + '²', explicacion: 'Área = (B + b) × h ÷ 2 = (' + B + ' + ' + b + ') × ' + h + ' ÷ 2 = ' + fmt(((B + b) * h) / 2, 2) + ' ' + u + '².' }; }
    const r = R.ent(2, 12), dia = R.prob(0.35);
    return { enunciado: 'Calcula el área del círculo (usa π ≈ 3,14).', svg: svgCirculo(r, u, dia), respuesta: fmt(PI * r * r, 2) + ' ' + u + '²', explicacion: (dia ? 'El radio es la mitad del diámetro: r = ' + r + '. ' : '') + 'Área = π × r² = 3,14 × ' + r + '² = 3,14 × ' + r * r + ' = ' + fmt(PI * r * r, 2) + ' ' + u + '².' };
  }
  function geoFracciones(R, g) {
    const d = R.ent(2, g <= 3 ? 8 : 12), n = R.ent(1, d - 1), circ = R.prob(0.5);
    const sombra = R.mezclar(Array.from({ length: d }, (_, i) => i)).slice(0, n);
    const dib = circ ? svgFraccionCirculo(n, d, sombra) : svgFraccionRect(d, sombra);
    const s = simp(n, d), pct = g >= 6;
    let resp = n + '/' + d; if (g >= 4 && s[1] !== d) resp += ' = ' + fracTxt(n, d) + ' simplificada'; if (pct) resp += ' (' + fmt((100 * n) / d, 2) + ' %)';
    return { enunciado: '¿Qué fracción de la figura está sombreada?' + (g >= 4 ? ' Escríbela simplificada.' : '') + (pct ? ' ¿Qué porcentaje representa?' : ''), svg: dib, respuesta: resp, explicacion: 'La figura tiene ' + d + ' partes iguales (denominador) y ' + n + ' están sombreadas (numerador).' + (s[1] !== d ? ' Dividimos ambos entre ' + mcd(n, d) + ' para simplificar.' : '') + (pct ? ' Porcentaje: ' + n + ' ÷ ' + d + ' × 100.' : '') };
  }
  function clasificaAng(t) { return t < 90 ? 'agudo (menor que 90°)' : t === 90 ? 'recto (exactamente 90°)' : t < 180 ? 'obtuso (entre 90° y 180°)' : 'llano (180°)'; }
  function geoAngulos(R, g) {
    const opts = g <= 5 ? ['clase', 'clase', 'falta'] : ['sup', 'comp', 'tri', 'tri', 'poli'];
    const t = R.elegir(opts);
    if (t === 'clase') { const th = R.elegir([R.ent(2, 8) * 10, 90, R.ent(10, 17) * 10, R.ent(3, 8) * 10 + 5, 180]); return { enunciado: 'El ángulo marcado mide ' + th + '°. ¿Cómo se clasifica?', svg: svgAngulo(th, th + '°'), respuesta: 'Ángulo ' + clasificaAng(th), explicacion: 'Comparamos con el ángulo recto (la esquina de una hoja, 90°): ' + (th < 90 ? 'es más cerrado.' : th === 90 ? 'coincide.' : th < 180 ? 'es más abierto, pero no llega a una línea recta.' : 'forma una línea recta.') };
    }
    if (t === 'falta') { const th = R.ent(2, 8) * 10, total = R.elegir([90, 180]); return { enunciado: 'El ángulo mide ' + th + '°. ¿Cuántos grados le faltan para formar un ángulo ' + (total === 90 ? 'recto (90°)' : 'llano (180°)') + '?', svg: svgAngulo(th, th + '°'), respuesta: total - th + '°', explicacion: total + ' - ' + th + ' = ' + (total - th) + '°.' }; }
    if (t === 'sup') { const a = R.ent(25, 155); return { enunciado: 'Los dos ángulos están sobre una línea recta. Si uno mide ' + a + '°, ¿cuánto mide x?', svg: svgAdyacentes(a, 180, a + '°', 'x'), respuesta: 'x = ' + (180 - a) + '°', explicacion: 'Ángulos suplementarios suman 180°: x = 180 - ' + a + ' = ' + (180 - a) + '°.' }; }
    if (t === 'comp') { const a = R.ent(15, 75); return { enunciado: 'Los dos ángulos forman un ángulo recto. Si uno mide ' + a + '°, ¿cuánto mide x?', svg: svgAdyacentes(a, 90, a + '°', 'x'), respuesta: 'x = ' + (90 - a) + '°', explicacion: 'Ángulos complementarios suman 90°: x = 90 - ' + a + ' = ' + (90 - a) + '°.' }; }
    if (t === 'tri') { const A = R.ent(25, 100), B = R.ent(20, Math.min(120, 160 - A)), Cc = 180 - A - B; return { enunciado: 'En el triángulo, dos ángulos miden ' + A + '° y ' + B + '°. ¿Cuánto mide el ángulo x?', svg: svgTrianguloAngulos(A, B, A + '°', B + '°', 'x'), respuesta: 'x = ' + Cc + '°', explicacion: 'Los ángulos interiores de un triángulo suman 180°: x = 180 - ' + A + ' - ' + B + ' = ' + Cc + '°.' }; }
    const n = R.elegir([5, 6, 8, 9, 10, 12]), S = (n - 2) * 180;
    const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; pts.push([Math.cos(a), Math.sin(a)]); }
    const Aj = ajustar(pts, 220, 220, 20);
    return { enunciado: 'Este polígono regular tiene ' + n + ' lados. ¿Cuánto suman sus ángulos interiores y cuánto mide cada uno?', svg: svg(220, 220, P(Aj.pts, AMA), 'Polígono regular de ' + n + ' lados'), respuesta: 'Suma: ' + fmt(S, 0) + '°; cada ángulo: ' + fmt(S / n, 2) + '°', explicacion: 'Desde un vértice se forman ' + (n - 2) + ' triángulos: (' + n + ' - 2) × 180 = ' + fmt(S, 0) + '°. Como es regular, cada ángulo mide ' + fmt(S, 0) + ' ÷ ' + n + ' = ' + fmt(S / n, 2) + '°.' };
  }
  function geoSimetria(R, g) {
    const k = R.ent(3, g <= 2 ? 5 : 8), libres = []; for (let c = 0; c < 4; c++) for (let f = 0; f < 6; f++) libres.push([c, f]);
    const cel = R.mezclar(libres).slice(0, k), m = R.elegir(cel);
    return { enunciado: 'Dibuja el reflejo de la figura al otro lado del eje de simetría. ¿Cuántos cuadros sombreados tendrá la figura completa? ¿En qué columna quedará el reflejo del cuadro marcado con X?', svg: svgSimetria(cel, m), respuesta: 2 * k + ' cuadros; el reflejo de X queda en la columna ' + (8 - m[0]) + ' (misma fila)', explicacion: 'Cada cuadro se refleja a la misma distancia del eje y en la misma fila. La X está en la columna ' + (m[0] + 1) + ', a ' + (4 - m[0]) + ' cuadro(s) del eje; su reflejo queda a ' + (4 - m[0]) + ' cuadro(s) del otro lado: columna ' + (8 - m[0]) + '. La figura duplica sus ' + k + ' cuadros.' };
  }
  function geoCuerpos(R, g) {
    const u = R.elegir(['cm', 'm']);
    if (g >= 8 && R.prob(0.35)) { const r = R.ent(2, 9), h = R.ent(3, 15); return { enunciado: 'Calcula el volumen del cilindro (usa π ≈ 3,14).', svg: svgCilindro(r, h, u), respuesta: fmt(PI * r * r * h, 2) + ' ' + u + '³', explicacion: 'V = área de la base × altura = π × r² × h = 3,14 × ' + r * r + ' × ' + h + ' = ' + fmt(PI * r * r * h, 2) + ' ' + u + '³.' }; }
    const cubo = R.prob(0.25), l = R.ent(2, 12), w = cubo ? l : R.ent(2, 10), h = cubo ? l : R.ent(2, 10), V = l * w * h, A0 = 2 * (l * w + l * h + w * h);
    const conArea = g >= 7;
    return { enunciado: 'Calcula el volumen' + (conArea ? ' y el área total' : '') + ' del ' + (cubo ? 'cubo' : 'prisma rectangular') + '.', svg: svgPrisma(l, w, h, u), respuesta: 'Volumen: ' + V + ' ' + u + '³' + (conArea ? '; área total: ' + A0 + ' ' + u + '²' : ''), explicacion: 'V = largo × ancho × alto = ' + l + ' × ' + w + ' × ' + h + ' = ' + V + ' ' + u + '³ (caben ' + V + ' cubitos de 1 ' + u + '³).' + (conArea ? ' Área total = 2(' + l * w + ' + ' + l * h + ' + ' + w * h + ') = ' + A0 + ' ' + u + '².' : '') };
  }
  const TERNAS = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
  function geoPitagoras(R, g) {
    const u = R.elegir(['cm', 'm']);
    if (g >= 9 && R.prob(0.3)) { const a = R.ent(2, 12), b = R.ent(2, 12), c = Math.sqrt(a * a + b * b); return { enunciado: 'Calcula la hipotenusa del triángulo rectángulo (redondea a centésimas).', svg: svgTrianguloRect(a, b, a + ' ' + u, b + ' ' + u, 'c = ?'), respuesta: 'c ' + (Number.isInteger(c) ? '= ' : '≈ ') + fmt(c, 2) + ' ' + u, explicacion: 'c² = ' + a + '² + ' + b + '² = ' + (a * a + b * b) + '; c = √' + (a * a + b * b) + (Number.isInteger(c) ? ' = ' : ' ≈ ') + fmt(c, 2) + ' ' + u + '.' }; }
    const t = R.elegir(TERNAS), k = t[2] > 20 ? 1 : R.ent(1, 3), sw = R.prob(0.5), a = (sw ? t[1] : t[0]) * k, b = (sw ? t[0] : t[1]) * k, c = t[2] * k;
    if (R.prob(0.5)) return { enunciado: 'Calcula la hipotenusa c del triángulo rectángulo.', svg: svgTrianguloRect(a, b, a + ' ' + u, b + ' ' + u, 'c = ?'), respuesta: 'c = ' + c + ' ' + u, explicacion: 'Teorema de Pitágoras: c² = a² + b² = ' + a * a + ' + ' + b * b + ' = ' + c * c + '; c = √' + c * c + ' = ' + c + ' ' + u + '.' };
    return { enunciado: 'Calcula el cateto que falta en el triángulo rectángulo.', svg: svgTrianguloRect(a, b, a + ' ' + u, '?', c + ' ' + u), respuesta: b + ' ' + u, explicacion: 'Cateto² = hipotenusa² - otro cateto² = ' + c * c + ' - ' + a * a + ' = ' + b * b + '; cateto = √' + b * b + ' = ' + b + ' ' + u + '.' };
  }
  function geoTrig(R, g) {
    const u = 'm', t = R.elegir(['razones', 'lado', 'angulo', 'altura']);
    if (t === 'razones') { const tr = R.elegir(TERNAS.slice(0, 4)), a = tr[0], b = tr[1], c = tr[2]; return { enunciado: 'En el triángulo rectángulo, calcula sen θ, cos θ y tan θ (como fracción y con 4 decimales).', svg: svgTrianguloRect(a, b, String(a), String(b), String(c), 'θ'), respuesta: 'sen θ = ' + b + '/' + c + ' ≈ ' + fmt(b / c, 4) + '; cos θ = ' + a + '/' + c + ' ≈ ' + fmt(a / c, 4) + '; tan θ = ' + fracTxt(b, a) + ' ≈ ' + fmt(b / a, 4), explicacion: 'Desde θ: cateto opuesto = ' + b + ', cateto adyacente = ' + a + ', hipotenusa = ' + c + '. sen = opuesto/hipotenusa, cos = adyacente/hipotenusa, tan = opuesto/adyacente.' }; }
    if (t === 'lado') { const th = R.ent(20, 70), c = R.ent(5, 30), rad = (th * Math.PI) / 180, a = c * Math.cos(rad), b = c * Math.sin(rad); return { enunciado: 'La hipotenusa mide ' + c + ' ' + u + ' y θ = ' + th + '°. Calcula el cateto opuesto x (redondea a centésimas).', svg: svgTrianguloRect(a, b, null, 'x', c + ' ' + u, th + '°'), respuesta: 'x ≈ ' + fmt(b, 2) + ' ' + u, explicacion: 'sen θ = opuesto/hipotenusa, entonces x = ' + c + ' × sen ' + th + '° ≈ ' + c + ' × ' + fmt(Math.sin(rad), 4) + ' ≈ ' + fmt(b, 2) + ' ' + u + '.' }; }
    if (t === 'angulo') { const a = R.ent(3, 15), b = R.ent(3, 15), th = (Math.atan2(b, a) * 180) / Math.PI; return { enunciado: 'Los catetos miden ' + a + ' ' + u + ' (adyacente) y ' + b + ' ' + u + ' (opuesto). Halla el ángulo θ (redondea a décimas de grado).', svg: svgTrianguloRect(a, b, a + ' ' + u, b + ' ' + u, null, 'θ'), respuesta: 'θ ≈ ' + fmt(th, 1) + '°', explicacion: 'tan θ = ' + b + '/' + a + ' ≈ ' + fmt(b / a, 4) + '; θ = tan⁻¹(' + fmt(b / a, 4) + ') ≈ ' + fmt(th, 1) + '°.' }; }
    const th = R.ent(25, 65), d = R.ent(8, 40), rad = (th * Math.PI) / 180, h = d * Math.tan(rad);
    return { enunciado: 'Desde el borde de la cancha, a ' + d + ' m de la base de una torre de iluminación, se ve la parte alta con un ángulo de elevación de ' + th + '°. ¿Qué altura tiene la torre? (ignora la estatura del observador; redondea a centésimas)', svg: svgTrianguloRect(d, h, d + ' m', 'h', null, th + '°'), respuesta: 'h ≈ ' + fmt(h, 2) + ' m', explicacion: 'tan ' + th + '° = h / ' + d + ', entonces h = ' + d + ' × tan ' + th + '° ≈ ' + d + ' × ' + fmt(Math.tan(rad), 4) + ' ≈ ' + fmt(h, 2) + ' m.' };
  }
  const GEO = { figuras: geoFiguras, perimetro: geoPerimetro, area: geoArea, fracciones: geoFracciones, angulos: geoAngulos, simetria: geoSimetria, cuerpos: geoCuerpos, pitagoras: geoPitagoras, trigonometria: geoTrig };
  function genGeometria(R, g, op) {
    let t = op.tema || 'variada';
    if (!GEO[t]) t = R.elegir(TEMAS.geometria(g).filter((x) => x !== 'variada'));
    if (g === 0 && t !== 'figuras') t = 'figuras';
    return GEO[t](R, g);
  }

  /* ---------- Generador: DINERO Y CAMBIO ---------- */
  const DENOM = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];
  const esMoneda = (v) => v <= 1000;
  function descomponer(monto) { const out = []; let r = monto; DENOM.forEach((d) => { while (r >= d) { out.push(d); r -= d; } }); return out; }
  function resumenPiezas(lista) {
    const c = {}; lista.forEach((v) => { c[v] = (c[v] || 0) + 1; });
    return Object.keys(c).map(Number).sort((a, b) => b - a).map((v) => c[v] + ' ' + (esMoneda(v) ? 'moneda' : 'billete') + (c[v] > 1 ? 's' : '') + ' de ' + pesos(v)).join(', ');
  }
  function svgDinero(lista) {
    const W = 540; let x = 10, y = 10, alto = 0, o = '';
    lista.slice().sort((a, b) => b - a).forEach((v, i) => {
      if (esMoneda(v)) {
        const r = 20 + (v >= 500 ? 6 : v >= 200 ? 3 : 0), w = 2 * r;
        if (x + w > W - 10) { x = 10; y += alto + 10; alto = 0; }
        o += C(x + r, y + r, r, v === 1000 ? NAR : AMA) + C(x + r, y + r, r - 5, 'none', { w: 1 }) + T(x + r, y + r, pesos(v), { size: r >= 26 ? 12 : 11, bold: true });
        x += w + 8; alto = Math.max(alto, w);
      } else {
        const w = 118, h = 56;
        if (x + w > W - 10) { x = 10; y += alto + 10; alto = 0; }
        o += Rc(x, y, w, h, i % 2 ? AMA : NAR, { rx: 6 }) + Rc(x + 6, y + 6, w - 12, h - 12, 'none', { w: 1 }) + T(x + w / 2, y + h / 2, pesos(v), { size: 15, bold: true });
        x += w + 8; alto = Math.max(alto, h);
      }
    });
    return svg(W, y + alto + 10, o, 'Monedas y billetes colombianos');
  }
  function juntarDinero(R, g) {
    const pool = g <= 1 ? [50, 100, 200, 500, 1000] : g === 2 ? [100, 200, 500, 1000, 2000, 5000] : [500, 1000, 2000, 5000, 10000, 20000, 50000];
    const n = R.ent(3, g <= 1 ? 6 : 8), l = []; for (let i = 0; i < n; i++) l.push(R.elegir(pool));
    return l;
  }
  const PRODUCTOS = [['un buñuelo', 1000, 2500], ['un jugo de lulo', 2500, 6000], ['una libra de arroz', 2500, 4500], ['un pandebono', 1200, 2500], ['un kilo de mango', 3000, 7000], ['una guanábana', 5000, 12000], ['una bolsa de chontaduro', 4000, 9000], ['un cuaderno', 3500, 9000], ['una empanada', 1000, 2500], ['un helado', 2000, 5000], ['una gaseosa', 2500, 4500], ['una camiseta del equipo', 35000, 70000], ['unos tenis para la cancha', 90000, 180000], ['una entrada a un festival de salsa', 25000, 60000]];
  function precio(R, p, g) { const paso = p[1] >= 20000 ? 1000 : 100; return R.ent(Math.ceil(p[1] / paso), Math.floor(p[2] / paso)) * paso; }
  function prodPorGrado(R, g) { return R.elegir(g <= 2 ? PRODUCTOS.slice(0, 11) : PRODUCTOS); }
  function dinContar(R, g) {
    if (g === 0) { const n = R.ent(2, 10), l = Array(n).fill(100); return { enunciado: '¿Cuántas monedas de ' + pesos(100) + ' hay en la alcancía de ' + R.elegir(NOMBRES) + '?', svg: svgDinero(l), respuesta: String(n), explicacion: 'Contamos las monedas una por una: hay ' + n + '.' }; }
    const l = juntarDinero(R, g), tot = l.reduce((a, b) => a + b, 0);
    return { enunciado: '¿Cuánto dinero hay en total?', svg: svgDinero(l), respuesta: pesos(tot), explicacion: 'Empezamos por lo de mayor valor y vamos sumando: ' + l.slice().sort((a, b) => b - a).map((v) => fmt(v, 0)).join(' + ') + ' = ' + fmt(tot, 0) + '.' };
  }
  function dinPagar(R, g) {
    if (g === 0) { const n = R.ent(2, 9); return { enunciado: 'En la tienda de barrio un bombón cuesta ' + pesos(n * 100) + '. ¿Cuántas monedas de ' + pesos(100) + ' necesitas para pagarlo?', svg: svgDinero([100]), respuesta: n + ' monedas', explicacion: 'Cada moneda vale 100; contamos de 100 en 100 hasta ' + n * 100 + ': son ' + n + ' monedas.' }; }
    const p = prodPorGrado(R, g), P0 = precio(R, p, g), d = descomponer(P0);
    return { enunciado: 'Quieres comprar ' + p[0] + (p[0].startsWith('unos ') ? ' que cuestan ' : ' que cuesta ') + pesos(P0) + '. ¿Con qué monedas y billetes pagas exacto usando la menor cantidad de piezas?', respuesta: resumenPiezas(d) + ' (' + d.length + ' piezas)', explicacion: 'Tomamos primero la pieza de mayor valor que no se pase y repetimos con lo que falta: ' + d.map((v) => fmt(v, 0)).join(' + ') + ' = ' + fmt(P0, 0) + '.' };
  }
  function dinVueltas(R, g) {
    const p = R.elegir((g <= 2 ? PRODUCTOS.slice(0, 11) : PRODUCTOS).filter((x) => x[2] < 100000)), P0 = g <= 1 ? R.ent(1, 9) * 100 : precio(R, p, g);
    const billetes = [1000, 2000, 5000, 10000, 20000, 50000, 100000].filter((b) => b > P0);
    const B = g <= 1 ? 1000 : R.elegir(billetes.slice(0, 3)), V = B - P0, d = descomponer(V);
    const prod = g <= 1 ? 'un bombón' : p[0];
    return { enunciado: 'Compras ' + prod + ' de ' + pesos(P0) + ' y pagas con ' + (esMoneda(B) ? 'una moneda' : 'un billete') + ' de ' + pesos(B) + '. ¿Cuánto te deben devolver?' + (g >= 3 ? ' ¿Con qué piezas, usando la menor cantidad?' : ''), svg: svgDinero([B]), respuesta: pesos(V) + (g >= 3 && V > 0 ? ': ' + resumenPiezas(d) : ''), explicacion: 'Vueltas = lo que pagas - lo que cuesta: ' + fmt(B, 0) + ' - ' + fmt(P0, 0) + ' = ' + fmt(V, 0) + '. También se puede completar contando desde ' + fmt(P0, 0) + ' hasta ' + fmt(B, 0) + '.' };
  }
  function dinPresupuesto(R, g) {
    const n = R.ent(2, g <= 3 ? 3 : 5), items = R.mezclar(PRODUCTOS.slice(0, 11)).slice(0, n).map((p) => [p[0], precio(R, p, g), g >= 4 ? R.ent(1, 3) : 1]);
    const tot = items.reduce((a, it) => a + it[1] * it[2], 0), alcanza = R.prob(0.5);
    const B = alcanza ? Math.ceil((tot + R.ent(0, 8) * 500) / 1000) * 1000 : Math.max(1000, Math.floor((tot - R.ent(1, 6) * 500) / 1000) * 1000);
    const lista = items.map((it) => (it[2] > 1 ? it[2] + ' × ' + it[0].replace(/^(un|una|unos|unas) /, '') : it[0]) + ' (' + pesos(it[1]) + (it[2] > 1 ? ' c/u' : '') + ')').join('; ');
    return { enunciado: 'Para el cumpleaños tienes un presupuesto de ' + pesos(B) + '. Quieres comprar: ' + lista + '. ¿Te alcanza? ¿Cuánto te sobra o te falta?', respuesta: 'Total ' + pesos(tot) + '. ' + (B >= tot ? 'Sí alcanza y sobran ' + pesos(B - tot) : 'No alcanza: faltan ' + pesos(tot - B)), explicacion: 'Sumamos el costo de cada compra: ' + items.map((it) => (it[2] > 1 ? it[2] + ' × ' + fmt(it[1], 0) : fmt(it[1], 0))).join(' + ') + ' = ' + fmt(tot, 0) + '. Comparamos con ' + fmt(B, 0) + ' y restamos.' };
  }
  function dinComparar(R, g) {
    const f = R.elegir(FRUTAS);
    if (g <= 3) { const a = R.ent(10, 60) * 100; let b = R.ent(10, 60) * 100; while (b === a) b = R.ent(10, 60) * 100; return { enunciado: 'En la tienda de barrio una bolsa de ' + f[1] + ' cuesta ' + pesos(a) + ' y en el mercado de Santa Elena la misma bolsa cuesta ' + pesos(b) + '. ¿Dónde es más barata y cuánto te ahorras?', respuesta: (a < b ? 'En la tienda' : 'En el mercado') + ', ahorras ' + pesos(Math.abs(a - b)), explicacion: 'Restamos el precio mayor menos el menor: ' + fmt(Math.max(a, b), 0) + ' - ' + fmt(Math.min(a, b), 0) + ' = ' + fmt(Math.abs(a - b), 0) + '.' }; }
    const n1 = R.ent(2, 6); let n2 = R.ent(3, 12); while (n2 === n1) n2 = R.ent(3, 12);
    const u1 = R.ent(6, 30) * 50; let u2 = R.ent(6, 30) * 50; while (u2 === u1) u2 = R.ent(6, 30) * 50;
    return { enunciado: 'Oferta A: ' + n1 + ' ' + f[1] + ' por ' + pesos(n1 * u1) + '. Oferta B: ' + n2 + ' ' + f[1] + ' por ' + pesos(n2 * u2) + '. ¿Cuál oferta tiene el mejor precio por unidad?', respuesta: 'Oferta ' + (u1 < u2 ? 'A' : 'B') + ' (' + pesos(Math.min(u1, u2)) + ' por unidad contra ' + pesos(Math.max(u1, u2)) + ')', explicacion: 'Precio unitario = precio ÷ cantidad. A: ' + fmt(n1 * u1, 0) + ' ÷ ' + n1 + ' = ' + fmt(u1, 0) + '. B: ' + fmt(n2 * u2, 0) + ' ÷ ' + n2 + ' = ' + fmt(u2, 0) + '. El más bajo es el mejor precio.' };
  }
  function dinDescuento(R, g) {
    const p = R.elegir(PRODUCTOS.slice(7)), P0 = R.ent(Math.ceil(p[1] / 1000), Math.floor(p[2] / 1000)) * 1000, d = R.ent(1, 10) * 5, D0 = (P0 * d) / 100;
    if (g >= 8 && R.prob(0.4)) return { enunciado: 'En una promoción, ' + p[0] + ' pasó de ' + pesos(P0) + ' a ' + pesos(P0 - D0) + '. ¿Qué porcentaje de descuento le hicieron?', respuesta: d + ' %', explicacion: 'Descuento en pesos: ' + fmt(P0, 0) + ' - ' + fmt(P0 - D0, 0) + ' = ' + fmt(D0, 0) + '. Porcentaje: ' + fmt(D0, 0) + ' ÷ ' + fmt(P0, 0) + ' × 100 = ' + d + ' %.' };
    return { enunciado: p[0].charAt(0).toUpperCase() + p[0].slice(1) + ' cuesta ' + pesos(P0) + ' y tiene ' + d + ' % de descuento. ¿Cuánto es el descuento y cuánto pagas?', respuesta: 'Descuento: ' + pesos(D0) + '; pagas ' + pesos(P0 - D0), explicacion: d + ' % de ' + fmt(P0, 0) + ' = ' + fmt(P0, 0) + ' × ' + d + ' ÷ 100 = ' + fmt(D0, 0) + '. Pagas ' + fmt(P0, 0) + ' - ' + fmt(D0, 0) + ' = ' + fmt(P0 - D0, 0) + ' (o directamente ' + fmt(P0, 0) + ' × ' + fmt((100 - d) / 100, 2) + ').' };
  }
  function dinIva(R, g) {
    const B = R.ent(20, 900) * 100, I = (B * 19) / 100, Tt = B + I;
    if (R.prob(0.5)) return { enunciado: 'Un artículo cuesta ' + pesos(B) + ' antes de IVA. Si el IVA es del 19 %, ¿cuánto es el IVA y cuál es el precio final?', respuesta: 'IVA: ' + pesos(I) + '; precio final: ' + pesos(Tt), explicacion: '19 % de ' + fmt(B, 0) + ' = ' + fmt(B, 0) + ' × 0,19 = ' + fmt(I, 0) + '. Total = ' + fmt(B, 0) + ' + ' + fmt(I, 0) + ' = ' + fmt(Tt, 0) + ' (o ' + fmt(B, 0) + ' × 1,19).' };
    return { enunciado: 'Pagaste ' + pesos(Tt) + ' por un artículo y ese valor ya incluye IVA del 19 %. ¿Cuál era el precio sin IVA y cuánto pagaste de IVA?', respuesta: 'Sin IVA: ' + pesos(B) + '; IVA: ' + pesos(I), explicacion: 'El total es el 119 % del precio base: base = ' + fmt(Tt, 0) + ' ÷ 1,19 = ' + fmt(B, 0) + '. Error común: restar el 19 % del total (daría ' + pesos(Math.round(Tt * 0.81)) + ', que no es correcto).' };
  }
  function dinInteres(R, g) {
    const C0 = R.ent(1, 50) * 100000, i = R.ent(2, 12), t = R.ent(1, 5);
    if (g >= 9 && R.prob(0.6)) { const F = Math.round(C0 * Math.pow(1 + i / 100, t)); return { enunciado: 'Se invierten ' + pesos(C0) + ' al ' + i + ' % anual con interés compuesto durante ' + t + ' año' + (t > 1 ? 's' : '') + '. ¿Cuál es el monto final y cuánto se ganó? (redondea al peso)', respuesta: 'Monto: ' + pesos(F) + '; ganancia: ' + pesos(F - C0), explicacion: 'M = C(1 + i)^t = ' + fmt(C0, 0) + ' × ' + fmt(1 + i / 100, 2) + sup(t) + ' ≈ ' + fmt(F, 0) + '. Ganancia = ' + fmt(F, 0) + ' - ' + fmt(C0, 0) + ' = ' + fmt(F - C0, 0) + '.' }; }
    const I = (C0 * i * t) / 100;
    return { enunciado: 'Un préstamo de ' + pesos(C0) + ' cobra ' + i + ' % de interés simple anual durante ' + t + ' año' + (t > 1 ? 's' : '') + '. ¿Cuánto se paga de interés y cuánto en total?', respuesta: 'Interés: ' + pesos(I) + '; total: ' + pesos(C0 + I), explicacion: 'I = C × i × t = ' + fmt(C0, 0) + ' × ' + fmt(i / 100, 2) + ' × ' + t + ' = ' + fmt(I, 0) + '. Total = ' + fmt(C0, 0) + ' + ' + fmt(I, 0) + ' = ' + fmt(C0 + I, 0) + '.' };
  }
  const DIN = { contar: dinContar, pagar: dinPagar, vueltas: dinVueltas, presupuesto: dinPresupuesto, comparar: dinComparar, descuento: dinDescuento, iva: dinIva, interes: dinInteres };
  function genDinero(R, g, op) {
    let t = op.tema || 'variada';
    if (!DIN[t]) t = R.elegir(TEMAS.dinero(g).filter((x) => x !== 'variada'));
    return DIN[t](R, g);
  }

  /* ---------- Generador: ENCUENTRA EL ERROR ---------- */
  function fichaError(problema, pasos, k, porque, correccion, correcto, principio, dib) {
    const ps = pasos.map((t, i) => ({ n: i + 1, texto: t, error: i === k }));
    const it = {
      enunciado: problema + ' Revisa la solución y encuentra el ÚNICO paso con error:\n' + ps.map((p) => 'Paso ' + p.n + ': ' + p.texto).join('\n'),
      pasos: ps, paso_error: k + 1,
      respuesta: 'El error está en el paso ' + (k + 1) + '. ' + porque + ' Corrección: ' + correccion + '. Resultado correcto: ' + correcto + '.',
      explicacion: principio
    };
    if (dib) it.svg = dib;
    return it;
  }
  function errConteo(R) {
    const t = R.elegir(['mango', 'lulo', 'balon', 'estrella']), n = R.ent(4, 8), j = R.ent(2, n - 1), quien = R.elegir(NOMBRES);
    const pasos = []; for (let i = 1; i <= n; i++) pasos.push('toca el dibujo ' + (i === 1 ? 'primero' : 'siguiente') + ' y dice "' + (i < j ? i : i + 1) + '"');
    pasos.push('dice que hay ' + (n + 1) + ' ' + OBJETOS[t].p);
    return fichaError(quien + ' contó los ' + OBJETOS[t].p + ' del dibujo.', pasos, j - 1, 'Después de "' + (j - 1) + '" se saltó el ' + j + ' y dijo "' + (j + 1) + '".', 'después de ' + (j - 1) + ' sigue ' + j, 'hay ' + n + ' ' + OBJETOS[t].p, 'Al contar decimos los números en orden, sin saltar ninguno, uno por cada dibujo.', svgObjetos(n, t, n + ' objetos'));
  }
  function errSumaDibujo(R) {
    const t = R.elegir(['mango', 'lulo', 'balon']), a = R.ent(1, 5), b = R.ent(1, 4), k = R.ent(0, 2), quien = R.elegir(NOMBRES);
    const a2 = k === 0 ? a + 1 : a, b2 = k === 1 ? b + 1 : b, tot = k === 2 ? a + b + 1 : a2 + b2;
    const pasos = ['cuenta el primer grupo: ' + a2, 'cuenta el segundo grupo: ' + b2, 'junta los dos grupos y dice que son ' + tot];
    const porque = k === 0 ? 'En el primer grupo hay ' + a + ', no ' + a2 + '.' : k === 1 ? 'En el segundo grupo hay ' + b + ', no ' + b2 + '.' : a + ' y ' + b + ' juntos no son ' + tot + '.';
    return fichaError(quien + ' resolvió ' + a + ' + ' + b + ' con dibujos.', pasos, k, porque, 'contar con cuidado, tocando cada dibujo una vez', String(a + b), 'Para sumar juntamos los dos grupos y contamos todos los dibujos, sin repetir ninguno.', svgSumaObj(a, b, t));
  }
  function errLlevar(R, g) {
    const max = g <= 1 ? 99 : g <= 3 ? 999 : 9999, lo = Math.floor((max + 1) / 10);
    for (;;) {
      const a = R.ent(lo, max), b = R.ent(lo, max), x = digRev(a), y = digRev(b), n = Math.max(x.length, y.length);
      const cand = []; let l = 0;
      for (let i = 0; i < n; i++) { if (l && i > 0) cand.push(i); const s = (x[i] || 0) + (y[i] || 0) + l; l = s >= 10 ? 1 : 0; }
      if (!cand.length) continue;
      const k = R.elegir(cand), pasos = [], dig = []; l = 0;
      for (let i = 0; i < n; i++) {
        if (i === k) l = 0;
        const s = (x[i] || 0) + (y[i] || 0) + l;
        pasos.push(POS[i] + ': ' + (x[i] || 0) + ' + ' + (y[i] || 0) + (l ? ' + 1 que lleva' : '') + ' = ' + s + (s >= 10 ? '; escribe ' + (s % 10) + ' y lleva 1' : '; escribe ' + s));
        dig.push(s % 10); l = s >= 10 ? 1 : 0;
      }
      if (l) { pasos.push('escribe adelante el 1 que lleva'); dig.push(1); }
      const W = Number(dig.reverse().join(''));
      pasos.push('resultado: ' + fmt(W, 0));
      return fichaError('Resolver ' + fmt(a, 0) + ' + ' + fmt(b, 0) + ' en columnas.', pasos, k, 'En las ' + POS[k - 1] + ' se llevó 1, pero en las ' + POS[k] + ' se olvidó sumarlo.', POS[k] + ': ' + (x[k] || 0) + ' + ' + (y[k] || 0) + ' + 1 = ' + ((x[k] || 0) + (y[k] || 0) + 1), fmt(a + b, 0), 'Cuando una columna suma 10 o más, la decena que se lleva debe sumarse en la columna siguiente.');
    }
  }
  function errPrestar(R, g) {
    const max = g <= 3 ? 999 : 9999, lo = Math.floor((max + 1) / 10);
    for (;;) {
      let a = R.ent(lo, max), b = R.ent(lo, max); if (a === b) continue; if (a < b) { const t = a; a = b; b = t; }
      const x = digRev(a), y = digRev(b); let k = -1;
      for (let i = 0; i < y.length; i++) if (x[i] < y[i]) { k = i; break; }
      if (k < 0) continue;
      const pasos = [], dig = []; let pr = 0;
      for (let i = 0; i < x.length; i++) {
        const arriba = x[i] - pr, abajo = y[i] || 0;
        if (i === k) { pasos.push(POS[i] + ': como ' + arriba + ' es menor que ' + abajo + ', resta ' + abajo + ' - ' + arriba + ' = ' + (abajo - arriba)); dig.push(abajo - arriba); pr = 0; continue; }
        if (arriba < abajo) { pasos.push(POS[i] + ': ' + (pr ? x[i] + ' - 1 prestado = ' + arriba + ', ' : '') + 'pide prestado: ' + (arriba + 10) + ' - ' + abajo + ' = ' + (arriba + 10 - abajo)); dig.push(arriba + 10 - abajo); pr = 1; }
        else { pasos.push(POS[i] + ': ' + (pr ? x[i] + ' - 1 prestado = ' + arriba + ', ' : '') + arriba + ' - ' + abajo + ' = ' + (arriba - abajo)); dig.push(arriba - abajo); pr = 0; }
      }
      const W = Number(dig.reverse().join(''));
      if (W === a - b) continue;
      pasos.push('resultado: ' + fmt(W, 0));
      return fichaError('Resolver ' + fmt(a, 0) + ' - ' + fmt(b, 0) + ' en columnas.', pasos, k, 'En las ' + POS[k] + ' se restó al revés (el número de abajo menos el de arriba) en lugar de pedir prestado.', 'pedir 1 a la posición siguiente: ' + (x[k] + 10) + ' - ' + y[k] + ' = ' + (x[k] + 10 - y[k]) + ', y descontar ese 1 en las ' + POS[k + 1], fmt(a - b, 0), 'En la resta siempre se quita el número de abajo al de arriba; si no alcanza, se pide prestada una unidad a la posición siguiente.');
    }
  }
  function errOrden(R, g) {
    if (R.prob(0.5)) {
      const a = R.ent(2, 20), b = R.ent(2, 9), c = R.ent(2, 9), s = a + b;
      return fichaError('Calcular ' + a + ' + ' + b + ' × ' + c + '.', ['primero suma ' + a + ' + ' + b + ' = ' + s, 'luego multiplica ' + s + ' × ' + c + ' = ' + s * c, 'resultado: ' + s * c], 0, 'Sin paréntesis, la multiplicación se hace antes que la suma.', b + ' × ' + c + ' = ' + b * c + ' y luego ' + a + ' + ' + b * c, String(a + b * c), 'Orden de las operaciones: paréntesis, potencias, multiplicaciones y divisiones, y al final sumas y restas.');
    }
    for (;;) {
      const b = R.ent(2, 15), c = R.ent(2, 15), a = R.ent(b + c + 1, b + c + 40);
      return fichaError('Calcular ' + a + ' - ' + b + ' + ' + c + '.', ['primero suma ' + b + ' + ' + c + ' = ' + (b + c), 'luego resta ' + a + ' - ' + (b + c) + ' = ' + (a - b - c), 'resultado: ' + (a - b - c)], 0, 'Sumas y restas del mismo nivel se hacen de izquierda a derecha; sumar primero cambia el signo del ' + c + '.', a + ' - ' + b + ' = ' + (a - b) + ' y luego ' + (a - b) + ' + ' + c, String(a - b + c), 'Las operaciones del mismo nivel (sumas y restas) se resuelven de izquierda a derecha.');
    }
  }
  function errFracciones(R) {
    let b = R.ent(2, 9), d = R.ent(2, 9); while (d === b) d = R.ent(2, 9);
    const a = R.ent(1, b - 1), c = R.ent(1, d - 1), m = mcm(b, d), A = (a * m) / b, Cc = (c * m) / d, ok = fracTxt(A + Cc, m);
    if (R.prob(0.5)) {
      const pasos = ['suma los numeradores: ' + a + ' + ' + c + ' = ' + (a + c), 'suma los denominadores: ' + b + ' + ' + d + ' = ' + (b + d), 'resultado: ' + fracTxt(a + c, b + d)];
      return fichaError('Sumar ' + a + '/' + b + ' + ' + c + '/' + d + '.', pasos, 0, 'Con denominadores distintos no se pueden sumar los numeradores directamente: primero hay que llevar las fracciones a un denominador común.', 'm.c.m.(' + b + ', ' + d + ') = ' + m + '; ' + A + '/' + m + ' + ' + Cc + '/' + m, ok, 'Solo se suman numeradores cuando los denominadores son iguales (partes del mismo tamaño); los denominadores no se suman.');
    }
    const malo = a + '/' + m, Wn = a + Cc;
    if (a === A) return errFracciones(R);
    const pasos = ['denominador común: m.c.m.(' + b + ', ' + d + ') = ' + m, 'convierte: ' + a + '/' + b + ' = ' + malo + ' y ' + c + '/' + d + ' = ' + Cc + '/' + m, 'suma: ' + a + ' + ' + Cc + ' = ' + Wn + ', resultado ' + fracTxt(Wn, m)];
    return fichaError('Sumar ' + a + '/' + b + ' + ' + c + '/' + d + '.', pasos, 1, 'Al cambiar ' + a + '/' + b + ' a denominador ' + m + ' se multiplicó solo el denominador; el numerador también debe multiplicarse por ' + m / b + '.', a + '/' + b + ' = ' + A + '/' + m, ok, 'Una fracción equivalente se obtiene multiplicando numerador y denominador por el mismo número.');
  }
  function errSignos(R) {
    if (R.prob(0.5)) {
      const a = R.ent(5, 30), b = R.ent(2, 20), c = R.ent(2, 20);
      return fichaError('Calcular ' + a + ' - (' + b + ' - ' + c + ').', ['quita el paréntesis: ' + a + ' - ' + b + ' - ' + c, a + ' - ' + b + ' = ' + (a - b), fmt(a - b, 0) + ' - ' + c + ' = ' + fmt(a - b - c, 0)], 0, 'El signo menos delante del paréntesis cambia el signo de TODOS los términos de adentro: -(-' + c + ') = +' + c + '.', a + ' - ' + b + ' + ' + c, fmt(a - b + c, 0), 'Un signo menos antes de un paréntesis multiplica por -1 cada término que está dentro.');
    }
    const a = R.ent(2, 9), b = R.ent(2, 9), c = R.ent(1, 30);
    return fichaError('Calcular (-' + a + ') × (-' + b + ') + ' + c + '.', ['multiplica: (-' + a + ') × (-' + b + ') = -' + a * b, 'suma: -' + a * b + ' + ' + c + ' = ' + fmt(c - a * b, 0), 'resultado: ' + fmt(c - a * b, 0)], 0, 'Negativo por negativo da positivo.', '(-' + a + ') × (-' + b + ') = ' + a * b + '; ' + a * b + ' + ' + c, String(a * b + c), 'Ley de signos: signos iguales dan positivo y signos distintos dan negativo.');
  }
  function errPorcentaje(R) {
    const v = R.elegir(['sucesivos', 'iva', 'decimal']);
    if (v === 'sucesivos') {
      const P0 = R.ent(4, 30) * 10000, d1 = R.elegir([10, 20, 30]), d2 = R.elegir([10, 20]);
      const malo = (P0 * (d1 + d2)) / 100, bien = (P0 * (100 - d1) * (100 - d2)) / 10000;
      return fichaError('Unos tenis de ' + pesos(P0) + ' tienen ' + d1 + ' % de descuento y, sobre ese nuevo precio, otro ' + d2 + ' % adicional. ¿Cuánto se paga?', ['los descuentos se suman: ' + d1 + ' % + ' + d2 + ' % = ' + (d1 + d2) + ' %', (d1 + d2) + ' % de ' + fmt(P0, 0) + ' = ' + fmt(malo, 0), 'se paga ' + fmt(P0, 0) + ' - ' + fmt(malo, 0) + ' = ' + pesos(P0 - malo)], 0, 'El segundo descuento se aplica sobre el precio ya rebajado, no sobre el original, así que los porcentajes no se suman.', fmt(P0, 0) + ' × ' + fmt((100 - d1) / 100, 2) + ' × ' + fmt((100 - d2) / 100, 2), pesos(bien), 'Descuentos sucesivos se multiplican: (1 - d₁)(1 - d₂).');
    }
    if (v === 'iva') {
      const B = R.ent(50, 900) * 100, Tt = (B * 119) / 100, malo = Math.round((Tt * 19) / 100);
      return fichaError('Una factura de ' + pesos(Tt) + ' incluye IVA del 19 %. ¿Cuál es el precio sin IVA?', ['el IVA es el 19 % del total: ' + fmt(Tt, 0) + ' × 0,19 = ' + fmt(malo, 0) + ' (redondeado)', 'precio sin IVA: ' + fmt(Tt, 0) + ' - ' + fmt(malo, 0) + ' = ' + pesos(Tt - malo)], 0, 'El 19 % se calcula sobre el precio base, no sobre el total; el total es el 119 % de la base.', 'base = ' + fmt(Tt, 0) + ' ÷ 1,19', pesos(B), 'Si un valor ya incluye un aumento del p %, se divide entre (1 + p/100) para recuperar la base.');
    }
    const P0 = R.ent(2, 40) * 1000, d = R.ent(2, 9), malo = (P0 * d) / 10;
    if (malo >= P0) return errPorcentaje(R);
    return fichaError('Un cuaderno de ' + pesos(P0) + ' tiene ' + d + ' % de descuento. ¿Cuánto se paga?', ['convierte el porcentaje: ' + d + ' % = 0,' + d, 'descuento: ' + fmt(P0, 0) + ' × 0,' + d + ' = ' + fmt(malo, 0), 'se paga ' + fmt(P0, 0) + ' - ' + fmt(malo, 0) + ' = ' + pesos(P0 - malo)], 0, d + ' % significa ' + d + ' de cada 100, es decir 0,0' + d + ', no 0,' + d + ' (que sería ' + d * 10 + ' %).', d + ' % = 0,0' + d + '; descuento ' + fmt((P0 * d) / 100, 0), pesos(P0 - (P0 * d) / 100), 'Para pasar de porcentaje a decimal se divide entre 100: se corre la coma dos lugares a la izquierda.');
  }
  function errDespeje(R, g) {
    const a = R.ent(2, 9), x = R.ent(-6, 12), b = R.noCero(-15, 20), c = a * x + b;
    const v = R.elegir(g >= 8 ? ['signo', 'resta', 'distribuir'] : ['signo', 'resta']);
    if (v === 'signo') {
      const mal = c + b;
      return fichaError('Resolver ' + lin(a, b) + ' = ' + fmt(c, 0) + '.', ['pasa el ' + fmt(b, 0) + ' al otro lado: ' + a + 'x = ' + fmt(c, 0) + (b > 0 ? ' + ' : ' - ') + Math.abs(b) + ' = ' + fmt(mal, 0), 'divide entre ' + a + ': x = ' + fmt(mal, 0) + '/' + a + ' = ' + fracTxt(mal, a)], 0, 'Un término que pasa al otro lado cambia de signo (se aplica la operación inversa a ambos lados).', a + 'x = ' + fmt(c, 0) + (b > 0 ? ' - ' : ' + ') + Math.abs(b) + ' = ' + fmt(c - b, 0), 'x = ' + x, 'Para despejar se aplica la operación inversa en ambos lados de la igualdad: lo que suma pasa restando y viceversa.');
    }
    if (v === 'resta') {
      return fichaError('Resolver ' + lin(a, b) + ' = ' + fmt(c, 0) + '.', ['pasa el ' + fmt(b, 0) + ' al otro lado: ' + a + 'x = ' + fmt(c - b, 0), 'despeja x restando ' + a + ': x = ' + fmt(c - b, 0) + ' - ' + a + ' = ' + fmt(c - b - a, 0)], 1, 'El ' + a + ' está multiplicando a x, así que pasa dividiendo, no restando.', 'x = ' + fmt(c - b, 0) + ' ÷ ' + a, 'x = ' + x, 'La operación inversa de multiplicar es dividir.');
    }
    const d = a * (x + b);
    return fichaError('Resolver ' + a + '(x ' + (b > 0 ? '+ ' : '- ') + Math.abs(b) + ') = ' + fmt(d, 0) + '.', ['quita el paréntesis: ' + lin(a, b) + ' = ' + fmt(d, 0), 'pasa el ' + fmt(b, 0) + ': ' + a + 'x = ' + fmt(d - b, 0), 'divide entre ' + a + ': x = ' + fracTxt(d - b, a)], 0, 'La propiedad distributiva multiplica el ' + a + ' por cada término del paréntesis.', a + '(x ' + (b > 0 ? '+ ' : '- ') + Math.abs(b) + ') = ' + lin(a, a * b), 'x = ' + x, 'Propiedad distributiva: a(x + b) = ax + ab.');
  }
  function errPotencias(R) {
    const v = R.elegir(['prod', 'potpot', 'neg']);
    if (v === 'prod') { const a = R.ent(2, 3), m = R.ent(2, 3), n = R.ent(2, 3); return fichaError('Calcular ' + a + sup(m) + ' × ' + a + sup(n) + '.', ['misma base: se multiplican los exponentes, ' + a + sup(m * n), 'valor: ' + fmt(Math.pow(a, m * n), 0)], 0, 'En un producto de potencias de igual base los exponentes se SUMAN.', a + sup(m + n), fmt(Math.pow(a, m + n), 0), 'aᵐ × aⁿ = aᵐ⁺ⁿ, porque se juntan m factores y n factores.'); }
    if (v === 'potpot') { const a = 2, m = R.ent(2, 4), n = R.ent(2, 3); if (m + n === m * n) return errPotencias(R); return fichaError('Calcular (' + a + sup(m) + ')' + sup(n) + '.', ['se suman los exponentes: ' + a + sup(m + n), 'valor: ' + fmt(Math.pow(a, m + n), 0)], 0, 'En una potencia de potencia los exponentes se MULTIPLICAN.', a + sup(m * n), fmt(Math.pow(a, m * n), 0), '(aᵐ)ⁿ = aᵐ·ⁿ.'); }
    const a = R.ent(2, 9), c = R.ent(1, 40);
    return fichaError('Calcular (-' + a + ')² + ' + c + '.', ['(-' + a + ')² = -' + a * a, '-' + a * a + ' + ' + c + ' = ' + fmt(c - a * a, 0)], 0, 'Al elevar al cuadrado un número negativo dentro del paréntesis, el resultado es positivo: (-' + a + ') × (-' + a + ') = ' + a * a + '.', '(-' + a + ')² = ' + a * a, String(a * a + c), 'No es lo mismo (-a)² = a² que -a² = -(a²).');
  }
  const ERR = { conteo: errConteo, suma: errSumaDibujo, llevar: errLlevar, prestar: errPrestar, orden: errOrden, fracciones: errFracciones, signos: errSignos, porcentaje: errPorcentaje, despeje: errDespeje, potencias: errPotencias };
  function genError(R, g, op) {
    let t = op.tema || 'variada';
    const validos = TEMAS.error(g).filter((x) => x !== 'variada');
    if (!ERR[t] || validos.indexOf(t) < 0) t = R.elegir(validos);
    return ERR[t](R, g);
  }

  /* ---------- La buena idea, el reto final y el ensamblaje de la ficha ---------- */
  const IDEAS = {
    calculo: [
      (R, g) => 'Don Jairo va a cerrar la tienda de barrio y la calculadora se quedó sin batería. Hoy tú eres la calculadora oficial del barrio Ciudad Córdoba: cada cuenta bien hecha es un cliente feliz.',
      (R, g) => 'Entrenamiento de cálculo mental como el de los bailarines de salsa: primero los pasos básicos, despacio y con precisión; luego, velocidad. ¿Cuántos resuelves sin borrar?',
      (R, g) => 'Misión MIO: cada ejercicio resuelto es una estación más del recorrido. Si llegas a la última estación sin errores, completas la ruta.'
    ],
    problemas: [
      (R, g) => 'Las matemáticas viven en la calle: en la tienda, en el MIO, en la cancha y en el mercado de Santa Elena. Antes de calcular, pregúntate: ¿qué me piden?, ¿qué datos tengo?, ¿qué operación tiene sentido?',
      (R, g) => R.elegir(NOMBRES) + ' quiere organizar el mejor día del barrio: mercado por la mañana, partido en la cancha y fiesta con salsa en la noche. Para lograrlo necesita tu ayuda con estos problemas.',
      (R, g) => 'Hoy eres detective de números: cada historia esconde una pregunta. Subraya los datos, encierra la pregunta y explica tu plan antes de operar.'
    ],
    series: [
      (R, g) => 'Los músicos de salsa repiten patrones: clave, campana, tumbadora. Los matemáticos también. Descubre la regla secreta de cada serie y nunca más te sorprenderá lo que viene.',
      (R, g) => 'Un patrón es una promesa: si descubres la regla, puedes predecir el futuro de la serie. ¿Hasta qué término puedes adivinar sin escribirlos todos?'
    ],
    geometria: [
      (R, g) => 'El colegio va a renovar la cancha, el salón de baile y la huerta. Los arquitectos necesitan medidas exactas: observa cada dibujo, lee sus medidas y calcula como un profesional.',
      (R, g) => 'La geometría está en todas partes de Cali: en las baldosas del Bulevar del Río, en los techos de las estaciones del MIO y en los cuadros de la cancha. Mira con ojos de geómetra.'
    ],
    dinero: [
      (R, g) => 'Hoy administras tu propia tienda de barrio. Un buen comerciante cuenta bien, da las vueltas exactas y sabe cuándo una oferta de verdad conviene.',
      (R, g) => 'Con ' + pesos(R.elegir([20000, 50000, 100000])) + ' en el bolsillo tienes que decidir bien: ¿qué compras, cuánto ahorras y cómo evitas que te cobren de más? Las finanzas empiezan con estas cuentas.'
    ],
    error: [
      (R, g) => 'Los mejores estudiantes no son los que nunca se equivocan, sino los que saben encontrar el error. Hoy eres profesor por un día: revisa cada solución y corrígela con argumentos.',
      (R, g) => 'Un ingeniero revisa los planos antes de construir; un médico confirma antes de recetar. Tú vas a auditar estas soluciones: cada una tiene exactamente un paso equivocado.'
    ]
  };
  const INSTRUCCION = {
    calculo: 'Resuelve cada ejercicio en tu cuaderno mostrando el procedimiento. Al final, comprueba al menos tres resultados con la operación inversa.',
    problemas: 'Lee cada situación dos veces. Escribe los datos, la operación que eliges y una frase con la respuesta completa (con unidades).',
    series: 'Observa con calma, encuentra lo que cambia de un término a otro y escribe el siguiente término y la regla con tus palabras.',
    geometria: 'Observa el dibujo y sus medidas. Escribe la fórmula que usas, reemplaza los valores y no olvides las unidades.',
    dinero: 'Resuelve con pesos colombianos. Escribe la operación y la respuesta con el signo $ y punto de miles.',
    error: 'Lee la solución paso a paso. Señala el ÚNICO paso con error, explica por qué está mal y escribe la corrección completa.'
  };
  function retoFinal(R, tipo, g) {
    if (tipo === 'calculo') {
      if (g <= 0) { const N = R.ent(5, 10), f = []; for (let a = 1; a < N; a++) f.push(a + ' + ' + (N - a)); return { enunciado: 'Inventa: dibuja dos grupos de mangos que juntos sumen ' + N + '. ¿Puedes encontrar otra forma distinta?', respuesta: 'Respuesta abierta. Formas posibles: ' + f.join(', ') + '.', explicacion: 'Un mismo número se puede formar de muchas maneras; descomponer números ayuda a sumar mentalmente.' }; }
      if (g <= 5) { const d = R.mezclar([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), s = d.slice().sort((a, b) => b - a); const max = (s[0] + s[1]) * 10 + s[2] + s[3]; return { enunciado: 'Usa los dígitos ' + d.join(', ') + ' una sola vez cada uno para formar dos números de dos cifras cuya suma sea la MAYOR posible. Justifica por qué no se puede obtener una suma mayor.', respuesta: 'Suma máxima: ' + max + ' (por ejemplo ' + s[0] + s[2] + ' + ' + s[1] + s[3] + ')', explicacion: 'Los dígitos en la posición de las decenas valen 10 veces más, así que allí van los dos mayores (' + s[0] + ' y ' + s[1] + ') y en las unidades los menores.' }; }
      const n = R.ent(5, 60); return { enunciado: 'Generaliza: ¿por qué la suma de tres números enteros consecutivos siempre es múltiplo de 3? Compruébalo con ' + n + ', ' + (n + 1) + ' y ' + (n + 2) + ' e intenta demostrarlo con álgebra.', respuesta: n + ' + ' + (n + 1) + ' + ' + (n + 2) + ' = ' + (3 * n + 3) + ' = 3 × ' + (n + 1) + '. En general n + (n + 1) + (n + 2) = 3n + 3 = 3(n + 1).', explicacion: 'Un ejemplo no demuestra; la expresión algebraica 3(n + 1) muestra que se cumple para todo entero n.' };
    }
    if (tipo === 'problemas') {
      const ctx = R.elegir(['la tienda de barrio', 'el MIO', 'el mercado de Santa Elena', 'la cancha', 'un cumpleaños', 'una clase de salsa']);
      const N = g <= 0 ? R.ent(3, 10) : g <= 2 ? R.ent(20, 99) : g <= 5 ? R.ent(100, 999) : R.ent(10, 90) * 100;
      return { enunciado: 'Inventa un problema propio sobre ' + ctx + ' cuya respuesta sea ' + fmt(N, 0) + (g >= 3 ? ' y que necesite DOS operaciones distintas' : '') + '. Escribe la pregunta, resuélvelo y pídele a un compañero que lo resuelva.', respuesta: 'Respuesta abierta. Debe tener datos claros, una sola pregunta y dar ' + fmt(N, 0) + '. Ejemplo: ' + (g >= 3 ? 'compro 2 artículos de ' + fmt(Math.floor(N / 2) + 10, 0) + ' y me descuentan ' + (2 * (Math.floor(N / 2) + 10) - N) + ': 2 × ' + fmt(Math.floor(N / 2) + 10, 0) + ' - ' + (2 * (Math.floor(N / 2) + 10) - N) + ' = ' + fmt(N, 0) : 'tenía ' + (N + 2) + ' y regalé 2: ' + (N + 2) + ' - 2 = ' + N) + '.', explicacion: 'Inventar problemas obliga a pensar al revés: desde la respuesta hacia la pregunta, y muestra si entendiste qué hace cada operación.' };
    }
    if (tipo === 'series') {
      if (g >= 6) { const k = R.ent(5, 20); return { enunciado: 'Suma los primeros números impares: 1, 1 + 3, 1 + 3 + 5... ¿Qué observas? ¿Cuánto da la suma de los primeros ' + k + ' impares? Generaliza y explica con un dibujo de cuadrados.', respuesta: 'Las sumas son 1, 4, 9, 16... (cuadrados perfectos). La suma de los primeros ' + k + ' impares es ' + k + '² = ' + k * k + '; en general, n².', explicacion: 'Cada impar agrega una "L" de cuadros que convierte un cuadrado de lado n en uno de lado n + 1.' }; }
      return { enunciado: 'Inventa tu propia serie de ' + (g <= 1 ? 'figuras' : 'números') + ' con una regla secreta. Escribe los primeros 5 términos y reta a un compañero a descubrir la regla. ¿Qué pista le darías si no la encuentra?', respuesta: 'Respuesta abierta. La serie debe seguir una regla constante (repetir un núcleo, sumar o multiplicar siempre lo mismo).', explicacion: 'Crear patrones exige conocer la regla mejor que quien solo la descubre.' };
    }
    if (tipo === 'geometria') {
      if (g >= 3) { const s = R.ent(3, 12), P0 = 4 * s; const ej = [[s - 1, s + 1], [s - 2, s + 2]].filter((p) => p[0] > 0); return { enunciado: 'Todos los rectángulos de este reto tienen perímetro ' + P0 + ' cm y lados enteros. ¿Cuál tiene la MAYOR área? Haz una tabla con varios casos y justifica.', respuesta: 'El cuadrado de ' + s + ' cm de lado: área ' + s * s + ' cm². Por ejemplo, ' + ej.map((p) => p[0] + ' × ' + p[1] + ' = ' + p[0] * p[1]).join(' y ') + ' cm² son menores.', explicacion: 'Con el mismo perímetro, cuanto más parecidos son el largo y el ancho, mayor es el área; el máximo se alcanza cuando son iguales.' }; }
      return { enunciado: 'Con palitos de paleta arma una figura de ' + R.ent(3, 6) + ' lados. Dibújala, cuenta sus lados y sus esquinas y explica en qué se parece y en qué se diferencia de un cuadrado.', respuesta: 'Respuesta abierta. Debe tener el número de lados pedido y el mismo número de esquinas (vértices).', explicacion: 'En todo polígono el número de lados es igual al número de vértices.' };
    }
    if (tipo === 'dinero') {
      if (g >= 6) { const P0 = R.ent(10, 90) * 1000, d = R.ent(1, 6) * 5, a = (P0 * 119 / 100) * (100 - d) / 100, b = (P0 * (100 - d) / 100) * 119 / 100; return { enunciado: 'Un artículo de ' + pesos(P0) + ' tiene ' + d + ' % de descuento y se le cobra IVA del 19 %. ¿Pagas lo mismo si primero aplican el IVA y luego el descuento que al revés? Justifica.', respuesta: 'Sí: en ambos casos se paga ' + pesos(a) + (Math.abs(a - b) < 0.5 ? '' : ' / ' + pesos(b)) + '.', explicacion: 'Ambos procedimientos multiplican el precio por 1,19 y por ' + fmt((100 - d) / 100, 2) + '; la multiplicación es conmutativa, así que el orden no cambia el resultado.' }; }
      const M = g <= 0 ? 500 : R.elegir([500, 1000]); let formas = 0; const lst = []; for (let d = 0; d * 200 <= M; d++) { const r = M - d * 200; if (r % 100 === 0) { formas++; if (lst.length < 6) lst.push(d + ' de 200 y ' + r / 100 + ' de 100'); } }
      return { enunciado: '¿De cuántas formas distintas puedes reunir ' + pesos(M) + ' usando solo monedas de ' + pesos(100) + ' y de ' + pesos(200) + '? Organiza tus respuestas en una tabla para no repetir ni olvidar ninguna.', respuesta: formas + ' formas: ' + lst.join('; ') + (formas > lst.length ? '; ...' : '') + '.', explicacion: 'Se fija el número de monedas de 200 (desde 0 hasta el máximo posible) y se completa con monedas de 100: así se cuentan todas sin repetir.' };
    }
    return { enunciado: 'Ahora inventa tú un ejercicio resuelto con UN error típico escondido (como los de esta ficha). Intercámbialo con un compañero: él debe encontrar el error y tú debes explicar por qué la corrección es la correcta.', respuesta: 'Respuesta abierta. El ejercicio debe tener pasos numerados, un solo paso con error y una corrección justificada con una regla matemática.', explicacion: 'Para esconder bien un error hay que dominar la regla que se rompe: es la mejor prueba de que la entendiste.' };
  }
  const GEN = { calculo: genCalculo, problemas: genProblemas, series: genSeries, geometria: genGeometria, dinero: genDinero, error: genError };
  function generar(cfg) {
    cfg = cfg || {};
    const tipo = GEN[cfg.tipo] ? cfg.tipo : 'calculo', g = gradoValido(cfg.grado);
    const semilla = normalizarSemilla(cfg.semilla), R = crearAzar(semilla);
    const op = {}; opciones(tipo, g).forEach((o) => { op[o.id] = o.valor; });
    Object.keys(cfg).forEach((k) => { if (cfg[k] !== undefined && cfg[k] !== null && cfg[k] !== '') op[k] = cfg[k]; });
    let cantidad = Math.round(Number(cfg.cantidad == null ? 10 : cfg.cantidad)); if (!isFinite(cantidad) || cantidad < 1) cantidad = 10; cantidad = Math.min(cantidad, 50);
    const items = [], vistos = new Set();
    for (let i = 0; i < cantidad; i++) {
      let it;
      for (let t = 0; t < 30; t++) { it = GEN[tipo](R, g, op); const clave = it.enunciado + '|' + (it.svg || ''); if (!vistos.has(clave)) { vistos.add(clave); break; } }
      items.push(Object.assign({ n: i + 1 }, it));
    }
    const nombre = TIPOS.find((t) => t.id === tipo).nombre;
    const temaTxt = op.operacion && op.operacion !== 'variada' ? ' · ' + ETQ_OP[op.operacion] : op.tema && op.tema !== 'variada' && op.tema !== 'variado' ? ' · ' + (ETQ_TEMA[op.tema] || op.tema) : '';
    return {
      titulo: nombre + temaTxt + ' · ' + nombreGrado(g),
      instruccion: INSTRUCCION[tipo],
      idea: R.elegir(IDEAS[tipo])(R, g),
      items,
      reto_final: retoFinal(R, tipo, g),
      tipo, grado: g, semilla
    };
  }

  const TallerMate = { tipos: TIPOS.map((t) => Object.assign({}, t)), opciones, generar, version: '1.0.0' };
  if (typeof module !== 'undefined' && module && module.exports) module.exports = TallerMate;
  if (raiz) raiz.TallerMate = TallerMate;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
