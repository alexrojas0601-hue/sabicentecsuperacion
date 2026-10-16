/*
  SABI · Dots — herramientas didácticas visuales e interactivas del tutor
  -----------------------------------------------------------------------
  Implementa los comandos del Prompt Maestro SABICENTEC. SABI escribe una etiqueta sola en su
  propia línea y la app la convierte en un recurso que el estudiante puede ver y usar:

    [[sopa Título|PALABRA;;PALABRA;;...]]                      /sopa_de_letras
    [[crucigrama Título|PALABRA::pista;;PALABRA::pista]]       /crucigrama  /crossword
    [[flashcards Título|frente::reverso;;frente::reverso]]     /flashcards (repetición espaciada)
    [[linea_tiempo Título|fecha::hecho;;fecha::hecho]]          /timeline
    [[flujo Título|paso;;¿decisión?;;paso]]                    /fluxograma  /matflow
    [[5w1h Tema|Quién::texto;;Qué::?;;...]]                     /5w1h  ("?" = lo completa el estudiante)
    [[mapa Centro|Rama::idea, idea;;Rama::idea]]                /mathmaps /mapmaps /sketchnotes
    [[pasos Título|paso;;paso;;paso]]                           /paso_a_paso /step-by-step
    [[grafica Título|x^2-4;;2x+1|-5..5|-10..10]]                /mathvisual (rango y opcional)
    [[comic Título|Narrador::texto;;Personaje::diálogo]]        /comics
    [[detectaerror Título|línea;;línea;;línea]]                 /detectaerror
    [[tabla Título|Col::Col::Col;;dato::dato::dato]]            /matematicas_formulas, finanzas
    [[atlas Título|corazon, pulmones]]                          /human_atlas

  Uso desde la página: SabiDots.dibujar(tipo, args) devuelve HTML (o '' si no aplica) y
  SabiDots.enviar = función que manda texto a SABI. Todo es local: no usa servicios externos.
*/
(function () {
  'use strict';
  const AZUL = '#0B1F3F', ORO = '#B8862B', TINTA = '#1F1D1A', PAPEL = '#FBF8F1', SUAVE = '#D9D2C3';
  const PALETA = ['#0B1F3F', '#B8862B', '#2E6B4F', '#8A3B2E', '#3E5C9A', '#6B4C8A'];
  const estados = new Map();
  let contador = 0;
  const nuevoId = (p) => `dots-${p}-${Date.now().toString(36)}-${++contador}`;

  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const limpio = (t) => String(t ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();
  const txt = (t) => esc(limpio(t));

  // "Título|item;;item" → { titulo, items, extra[] }
  function partir(args) {
    const partes = String(args || '').split('|');
    const titulo = partes.length > 1 ? partes.shift().trim() : '';
    const cuerpo = partes.shift() || '';
    const items = cuerpo.split(/;;|\n/).map((s) => s.trim()).filter(Boolean);
    return { titulo, items, extra: partes.map((s) => s.trim()) };
  }
  const par = (item, sep = '::') => {
    const i = item.indexOf(sep);
    return i < 0 ? [item.trim(), ''] : [item.slice(0, i).trim(), item.slice(i + sep.length).trim()];
  };
  const cabecera = (tipo, titulo) => `<div class="dots-cab"><span class="dots-tipo">${esc(tipo)}</span>${titulo ? `<span class="dots-titulo">${txt(titulo)}</span>` : ''}</div>`;
  const caja = (clase, id, tipo, titulo, cuerpo) => `<section class="herramienta dots ${clase}" ${id ? `id="${id}"` : ''}>${cabecera(tipo, titulo)}${cuerpo}</section>`;

  // Generador pseudoaleatorio con semilla: el mismo contenido produce el mismo tablero.
  function semilla(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function azar(seed) { let a = seed || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Mayúsculas sin tildes (conserva la Ñ), solo letras.
  function normal(p) {
    return String(p).toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');
  }

  // =================================================================== SOPA DE LETRAS
  function sopa(args) {
    const { titulo, items } = partir(args);
    const lista = items.length === 1 && items[0].includes(',') ? items[0].split(',') : items;
    let palabras = [...new Set(lista.map((w) => [w.trim(), normal(w)]).filter(([, n]) => n.length >= 3 && n.length <= 13).map(JSON.stringify))].map(JSON.parse).slice(0, 12);
    if (palabras.length < 2) return '';
    const N = Math.min(15, Math.max(10, Math.max(...palabras.map(([, n]) => n.length)) + 2));
    const rnd = azar(semilla(titulo + palabras.map((p) => p[1]).join()));
    const G = Array.from({ length: N }, () => Array(N).fill(''));
    const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [1, -1]];
    const colocadas = [];
    palabras.sort((a, b) => b[1].length - a[1].length);
    for (const [vista, w] of palabras) {
      let ok = false;
      for (let intento = 0; intento < 300 && !ok; intento++) {
        const [dr, dc] = dirs[Math.floor(rnd() * (intento < 150 ? 4 : dirs.length))];
        const r0 = Math.floor(rnd() * N), c0 = Math.floor(rnd() * N);
        const rf = r0 + dr * (w.length - 1), cf = c0 + dc * (w.length - 1);
        if (rf < 0 || rf >= N || cf < 0 || cf >= N) continue;
        let cabe = true;
        for (let k = 0; k < w.length; k++) { const ch = G[r0 + dr * k][c0 + dc * k]; if (ch && ch !== w[k]) { cabe = false; break; } }
        if (!cabe) continue;
        for (let k = 0; k < w.length; k++) G[r0 + dr * k][c0 + dc * k] = w[k];
        colocadas.push({ vista, w, r0, c0, rf, cf }); ok = true;
      }
    }
    if (colocadas.length < 2) return '';
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!G[r][c]) G[r][c] = ABC[Math.floor(rnd() * ABC.length)];
    const id = nuevoId('sopa');
    estados.set(id, { tipo: 'sopa', G, N, colocadas, halladas: new Set(), inicio: null, titulo });
    const celdas = G.map((fila, r) => fila.map((ch, c) => `<button type="button" class="sopa-c" data-r="${r}" data-c="${c}">${ch}</button>`).join('')).join('');
    const lis = colocadas.map((p, i) => `<li data-i="${i}">${txt(p.vista)}</li>`).sort().join('');
    return caja('sopa', id, 'Sopa de letras', titulo,
      `<p class="dots-ayuda">Toca la primera letra y luego la última de cada palabra. Pueden ir en horizontal, vertical o diagonal.</p>
       <div class="sopa-wrap"><div class="sopa-grid" style="--n:${N}">${celdas}</div>
       <ul class="sopa-lista">${lis}</ul></div>
       <p class="dots-estado" aria-live="polite">0 de ${colocadas.length} encontradas</p>`);
  }
  function clicSopa(sec, btn) {
    const st = estados.get(sec.id); if (!st) return;
    const r = +btn.dataset.r, c = +btn.dataset.c;
    if (!st.inicio) { st.inicio = [r, c]; btn.classList.add('marca'); return; }
    const [r0, c0] = st.inicio; st.inicio = null;
    sec.querySelectorAll('.sopa-c.marca').forEach((b) => b.classList.remove('marca'));
    const i = st.colocadas.findIndex((p, k) => !st.halladas.has(k) &&
      ((p.r0 === r0 && p.c0 === c0 && p.rf === r && p.cf === c) || (p.rf === r0 && p.cf === c0 && p.r0 === r && p.c0 === c)));
    if (i < 0) { btn.classList.add('fallo'); setTimeout(() => btn.classList.remove('fallo'), 450); return; }
    st.halladas.add(i);
    const p = st.colocadas[i], n = p.w.length, dr = Math.sign(p.rf - p.r0), dc = Math.sign(p.cf - p.c0);
    for (let k = 0; k < n; k++) sec.querySelector(`.sopa-c[data-r="${p.r0 + dr * k}"][data-c="${p.c0 + dc * k}"]`)?.classList.add('hallada', 'h' + (i % 6));
    sec.querySelector(`.sopa-lista li[data-i="${i}"]`)?.classList.add('hecha');
    const est = sec.querySelector('.dots-estado');
    est.textContent = `${st.halladas.size} de ${st.colocadas.length} encontradas`;
    if (st.halladas.size === st.colocadas.length) {
      est.innerHTML = `Las encontraste todas. <button type="button" class="dots-btn" data-dots-enviar="Encontré todas las palabras de la sopa de letras${st.titulo ? ' sobre ' + esc(st.titulo) : ''}. ¿Me retas a explicar qué significa cada una?">Contarle a SABI</button>`;
    }
  }

  // =================================================================== CRUCIGRAMA
  function crucigrama(args) {
    const { titulo, items } = partir(args);
    const entradas = items.map((it) => { const [w, pista] = par(it); return { w: normal(w), vista: w, pista }; })
      .filter((e) => e.w.length >= 2 && e.w.length <= 14 && e.pista).slice(0, 12);
    if (entradas.length < 2) return '';
    entradas.sort((a, b) => b.w.length - a.w.length);
    const celdas = new Map(); const key = (r, c) => r + ',' + c;
    const puestas = [];
    const puede = (w, r, c, dir) => {
      const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
      if (celdas.has(key(r - dr, c - dc)) || celdas.has(key(r + dr * w.length, c + dc * w.length))) return -1;
      let cruces = 0;
      for (let k = 0; k < w.length; k++) {
        const rr = r + dr * k, cc = c + dc * k, ch = celdas.get(key(rr, cc));
        if (ch) { if (ch.l !== w[k] || ch[dir]) return -1; cruces++; continue; }
        // vecinos laterales vacíos (para no formar palabras falsas)
        if (celdas.has(key(rr + dc, cc + dr)) || celdas.has(key(rr - dc, cc - dr))) return -1;
      }
      return cruces;
    };
    const poner = (e, r, c, dir) => {
      const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
      for (let k = 0; k < e.w.length; k++) {
        const kk = key(r + dr * k, c + dc * k); const ch = celdas.get(kk) || { l: e.w[k] };
        ch[dir] = true; celdas.set(kk, ch);
      }
      puestas.push({ ...e, r, c, dir });
    };
    poner(entradas[0], 0, 0, 'H');
    const sueltas = [];
    for (const e of entradas.slice(1)) {
      let mejor = null;
      for (const p of puestas) for (let i = 0; i < p.w.length; i++) for (let j = 0; j < e.w.length; j++) {
        if (p.w[i] !== e.w[j]) continue;
        const dir = p.dir === 'H' ? 'V' : 'H';
        const r = p.dir === 'H' ? p.r - j : p.r + i, c = p.dir === 'H' ? p.c + i : p.c - j;
        const s = puede(e.w, r, c, dir);
        if (s > 0 && (!mejor || s > mejor.s)) mejor = { r, c, dir, s };
      }
      if (mejor) poner(e, mejor.r, mejor.c, mejor.dir); else sueltas.push(e);
    }
    // Las que no cruzan: debajo, en filas propias
    for (const e of sueltas) {
      const filas = [...celdas.keys()].map((k) => +k.split(',')[0]);
      const r = Math.max(...filas) + 2, c = Math.min(...[...celdas.keys()].map((k) => +k.split(',')[1]));
      poner(e, r, c, 'H');
    }
    const ks = [...celdas.keys()].map((k) => k.split(',').map(Number));
    const minR = Math.min(...ks.map((k) => k[0])), minC = Math.min(...ks.map((k) => k[1]));
    const R = Math.max(...ks.map((k) => k[0])) - minR + 1, C = Math.max(...ks.map((k) => k[1])) - minC + 1;
    if (R > 24 || C > 24) return '';
    // numeración
    const inicios = new Map(); let num = 0;
    puestas.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC })).sort((a, b) => a.r - b.r || a.c - b.c).forEach((p) => {
      const k = key(p.r, p.c); if (!inicios.has(k)) inicios.set(k, ++num); p.n = inicios.get(k);
      puestas.find((q) => q.w === p.w && q.dir === p.dir).n = p.n;
    });
    const id = nuevoId('cruci');
    const sol = {}; celdas.forEach((v, k) => { const [r, c] = k.split(',').map(Number); sol[key(r - minR, c - minC)] = v.l; });
    estados.set(id, { tipo: 'crucigrama', sol, puestas: puestas.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC })), titulo });
    let grid = '';
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const k = key(r, c);
      grid += sol[k] ? `<label class="cru-c">${inicios.has(k) ? `<span>${inicios.get(k)}</span>` : ''}<input maxlength="1" data-k="${k}" aria-label="Casilla ${r + 1},${c + 1}" autocomplete="off" autocapitalize="characters"></label>` : '<i class="cru-v"></i>';
    }
    const pistas = (dir) => puestas.filter((p) => p.dir === dir).sort((a, b) => a.n - b.n).map((p) => `<li><b>${p.n}.</b> ${txt(p.pista)} <small>(${p.w.length})</small></li>`).join('');
    return caja('crucigrama', id, 'Crucigrama', titulo,
      `<div class="cru-wrap"><div class="cru-grid" style="--c:${C}">${grid}</div>
       <div class="cru-pistas"><h4>Horizontales</h4><ol>${pistas('H')}</ol><h4>Verticales</h4><ol>${pistas('V')}</ol></div></div>
       <div class="dots-acciones"><button type="button" class="dots-btn" data-cru="revisar">Revisar</button><button type="button" class="dots-btn sec" data-cru="pista">Dame una letra</button></div>
       <p class="dots-estado" aria-live="polite"></p>`);
  }
  function accionCruci(sec, accion) {
    const st = estados.get(sec.id); if (!st) return;
    const inputs = [...sec.querySelectorAll('input[data-k]')];
    if (accion === 'pista') {
      const vacia = inputs.find((i) => normal(i.value) !== st.sol[i.dataset.k]);
      if (vacia) { vacia.value = st.sol[vacia.dataset.k]; vacia.classList.add('regalo'); }
      return;
    }
    let bien = 0;
    inputs.forEach((i) => { const ok = normal(i.value) === st.sol[i.dataset.k]; i.classList.toggle('ok', ok); i.classList.toggle('mal', !!i.value && !ok); });
    st.puestas.forEach((p) => {
      const [dr, dc] = p.dir === 'H' ? [0, 1] : [1, 0];
      let ok = true; for (let k = 0; k < p.w.length; k++) { const i = sec.querySelector(`input[data-k="${p.r + dr * k},${p.c + dc * k}"]`); if (!i || normal(i.value) !== p.w[k]) ok = false; }
      if (ok) bien++;
    });
    const est = sec.querySelector('.dots-estado');
    est.innerHTML = `Tienes ${bien} de ${st.puestas.length} palabras completas. ` +
      `<button type="button" class="dots-btn" data-dots-enviar="Hice el crucigrama${st.titulo ? ' de ' + esc(st.titulo) : ''}: ${bien} de ${st.puestas.length} palabras correctas.${bien < st.puestas.length ? ' Ayúdame con las que me faltan sin darme la respuesta.' : ''}">Contarle a SABI</button>`;
  }

  // =================================================================== FLASHCARDS (Leitner)
  const MAZO = 'sabi_flashcards_mazo';
  const DIAS = [0, 1, 2, 4, 8, 16, 32];
  const leerMazo = () => { try { return JSON.parse(localStorage.getItem(MAZO)) || []; } catch { return []; } };
  const guardarMazo = (m) => { try { localStorage.setItem(MAZO, JSON.stringify(m.slice(-300))); } catch {} };
  const hoy = () => new Date().toISOString().slice(0, 10);
  const masDias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  function flashcards(args) {
    const { titulo, items } = partir(args);
    const cartas = items.map((it) => par(it)).filter(([f, r]) => f && r).slice(0, 16).map(([f, r]) => ({ f, r }));
    if (!cartas.length) return '';
    const id = nuevoId('flash');
    estados.set(id, { tipo: 'flash', cartas, i: 0, sabidas: 0, titulo });
    return caja('flash', id, 'Tarjetas de repaso', titulo, cuerpoFlash(cartas, 0) +
      `<div class="dots-acciones"><button type="button" class="dots-btn sec" data-flash="guardar">Guardar en mi mazo de repaso</button></div><p class="dots-estado" aria-live="polite"></p>`);
  }
  function cuerpoFlash(cartas, i) {
    const c = cartas[i];
    return `<div class="flash-zona"><p class="flash-num">Tarjeta ${i + 1} de ${cartas.length}</p>
      <button type="button" class="flash-carta" data-flash="voltear"><span class="cara frente">${txt(c.f)}</span><span class="cara reverso">${txt(c.r)}</span></button>
      <p class="dots-ayuda">Primero intenta recordar la respuesta en voz alta. Después toca la tarjeta para voltearla.</p>
      <div class="flash-botones" hidden><button type="button" class="dots-btn" data-flash="si">La sabía</button><button type="button" class="dots-btn sec" data-flash="no">Repasar otra vez</button></div></div>`;
  }
  function accionFlash(sec, a) {
    const st = estados.get(sec.id); if (!st) return;
    const zona = sec.querySelector('.flash-zona');
    if (a === 'voltear') { zona.querySelector('.flash-carta').classList.toggle('volteada'); zona.querySelector('.flash-botones').hidden = false; refrescarMath(zona); return; }
    if (a === 'guardar') {
      const mazo = leerMazo(); let n = 0;
      st.cartas.forEach((c) => { if (!mazo.some((m) => m.f === c.f)) { mazo.push({ f: c.f, r: c.r, tema: st.titulo, caja: 1, toca: hoy() }); n++; } });
      guardarMazo(mazo); sec.querySelector('.dots-estado').textContent = n ? `Guardé ${n} tarjetas. Te las mostraré cuando toque repasarlas (repetición espaciada).` : 'Ya estaban en tu mazo.';
      pintarRepaso(); return;
    }
    if (st.repaso) { // repaso del mazo guardado
      const mazo = leerMazo(); const m = mazo.find((x) => x.f === st.cartas[st.i].f);
      if (m) { m.caja = a === 'si' ? Math.min(6, (m.caja || 1) + 1) : 1; m.toca = masDias(DIAS[m.caja]); guardarMazo(mazo); }
    }
    if (a === 'si') st.sabidas++;
    else st.cartas.push(st.cartas[st.i]); // vuelve al final de esta sesión
    st.i++;
    if (st.i >= st.cartas.length || st.i > 40) {
      zona.outerHTML = `<div class="flash-zona"><p>Terminaste el repaso: recordaste ${st.sabidas} tarjetas sin ayuda.</p>
        <button type="button" class="dots-btn" data-dots-enviar="Terminé mis tarjetas${st.titulo ? ' de ' + esc(st.titulo) : ''}: recordé ${st.sabidas}. Hazme una pregunta para aplicar lo que repasé.">Contarle a SABI</button></div>`;
      pintarRepaso(); return;
    }
    zona.outerHTML = cuerpoFlash(st.cartas, st.i);
    refrescarMath(sec);
  }
  function repasarMazo(hilo) {
    const toca = leerMazo().filter((m) => m.toca <= hoy()).slice(0, 20);
    if (!toca.length) return false;
    const id = nuevoId('flash');
    estados.set(id, { tipo: 'flash', cartas: toca.map((m) => ({ f: m.f, r: m.r })), i: 0, sabidas: 0, titulo: 'Mi mazo de hoy', repaso: true });
    const div = document.createElement('div'); div.className = 'msg sabi';
    div.innerHTML = caja('flash', id, 'Repaso espaciado', 'Mi mazo de hoy', cuerpoFlash(estados.get(id).cartas, 0));
    hilo.appendChild(div); refrescarMath(div); hilo.scrollTop = hilo.scrollHeight; return true;
  }
  function pintarRepaso() {
    const b = document.querySelector('[data-dots-repasar]'); if (!b) return;
    const n = leerMazo().filter((m) => m.toca <= hoy()).length;
    b.textContent = n ? `Repasar mis tarjetas (${n})` : 'Repasar mis tarjetas';
  }

  // =================================================================== LÍNEA DE TIEMPO
  function lineaTiempo(args) {
    const { titulo, items } = partir(args);
    const hitos = items.map((it) => par(it)).filter(([a, b]) => a && b).slice(0, 14);
    if (hitos.length < 2) return '';
    return caja('dots-tiempo', '', 'Línea de tiempo', titulo,
      `<ol class="tiempo">${hitos.map(([f, h], i) => `<li style="--k:${i}"><span class="t-fecha">${txt(f)}</span><span class="t-hecho" data-seg>${txt(h)}</span></li>`).join('')}</ol>`);
  }

  // =================================================================== DIAGRAMA DE FLUJO
  function flujo(args) {
    const { titulo, items } = partir(args);
    const pasos = items.slice(0, 14); if (pasos.length < 2) return '';
    const forma = (p, i) => {
      if (/^¿|\?(\s*=>|$)/.test(p)) { const [q, ramas] = par(p, '=>'); return `<div class="f-decision"><span>${txt(q)}</span></div>${ramas ? `<div class="f-ramas">${txt(ramas)}</div>` : ''}`; }
      const extremo = i === 0 || i === pasos.length - 1 || /^(inicio|fin)\b/i.test(p);
      return `<div class="f-nodo ${extremo ? 'f-extremo' : ''}"><span>${txt(p)}</span></div>`;
    };
    return caja('flujo', '', 'Diagrama de flujo', titulo,
      `<div class="flujo-col">${pasos.map((p, i) => forma(p, i) + (i < pasos.length - 1 ? '<div class="f-flecha" aria-hidden="true"></div>' : '')).join('')}</div>
       <p class="dots-ayuda">Óvalos: inicio y fin. Rectángulos: acciones. Rombos: decisiones (pregunta con dos caminos).</p>`);
  }

  // =================================================================== 5W1H
  const W6 = ['Quién', 'Qué', 'Cuándo', 'Dónde', 'Por qué', 'Cómo'];
  function cincoW(args) {
    const { titulo, items } = partir(args);
    const mapa = new Map(items.map((it) => par(it)).map(([k, v]) => [normal(k), v]));
    const id = nuevoId('5w');
    estados.set(id, { tipo: '5w', titulo });
    let hayCampos = false;
    const cards = W6.map((w) => {
      const v = mapa.get(normal(w)) ?? '?';
      const campo = !v || v === '?';
      if (campo) hayCampos = true;
      return `<div class="w-card"><h4>¿${w}?</h4>${campo ? `<textarea data-w="${w}" placeholder="Escribe tu respuesta…"></textarea>` : `<p data-seg>${txt(v)}</p>`}</div>`;
    }).join('');
    return caja('cincow', id, 'Análisis 5W1H', titulo, `<div class="w-grid">${cards}</div>` +
      (hayCampos ? `<div class="dots-acciones"><button type="button" class="dots-btn" data-5w="enviar">Enviar mis respuestas a SABI</button></div>` : ''));
  }
  function enviar5w(sec) {
    const st = estados.get(sec.id) || {};
    const r = [...sec.querySelectorAll('textarea[data-w]')].map((t) => `¿${t.dataset.w}? ${t.value.trim() || '(no lo sé todavía)'}`);
    sec.querySelectorAll('textarea, button').forEach((x) => (x.disabled = true));
    enviarA(`Mis respuestas del análisis 5W1H${st.titulo ? ' sobre ' + st.titulo : ''}:\n${r.join('\n')}`);
  }

  // =================================================================== MAPA MENTAL
  function partirLinea(t, max) { const pal = String(t).split(/\s+/); const l = ['']; pal.forEach((w) => { if ((l[l.length - 1] + ' ' + w).trim().length > max && l[l.length - 1]) l.push(w); else l[l.length - 1] = (l[l.length - 1] + ' ' + w).trim(); }); return l.slice(0, 3); }
  function svgTexto(x, y, t, max, attrs) {
    const ls = partirLinea(limpio(t), max); const dy = 15;
    return `<text x="${x}" y="${y - ((ls.length - 1) * dy) / 2}" ${attrs}>${ls.map((l, i) => `<tspan x="${x}" dy="${i ? dy : 0}">${esc(l)}</tspan>`).join('')}</text>`;
  }
  function mapaMental(args) {
    const { titulo, items } = partir(args);
    const ramas = items.map((it) => { const [r, h] = par(it); return { r, h: h ? h.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean).slice(0, 4) : [] }; }).filter((x) => x.r).slice(0, 8);
    if (!ramas.length) return '';
    const W = 900, H = 640, cx = W / 2, cy = H / 2, R1 = 200, R2 = 285;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa mental: ${esc(titulo)}" class="dots-svg">`;
    let nodos = '';
    ramas.forEach((b, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / ramas.length, col = PALETA[i % PALETA.length];
      const x = cx + R1 * Math.cos(a), y = cy + R1 * 0.82 * Math.sin(a);
      s += `<path d="M${cx},${cy} Q${(cx + x) / 2 + 20 * Math.sin(a)},${(cy + y) / 2} ${x},${y}" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      b.h.forEach((h, j) => {
        const da = (j - (b.h.length - 1) / 2) * (0.62 / Math.max(1, ramas.length / 4));
        const x2 = cx + R2 * 1.18 * Math.cos(a + da), y2 = cy + R2 * 0.92 * Math.sin(a + da);
        s += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2"/>`;
        nodos += `<circle cx="${x2}" cy="${y2}" r="4" fill="${col}"/>` + svgTexto(x2 + (Math.cos(a + da) >= 0 ? 8 : -8), y2, h, 18,
          `font-size="17" fill="${TINTA}" font-family="Public Sans,sans-serif" text-anchor="${Math.cos(a + da) >= 0 ? 'start' : 'end'}" dominant-baseline="middle"`);
      });
      nodos += `<rect x="${x - 84}" y="${y - 28}" width="168" height="56" rx="28" fill="${PAPEL}" stroke="${col}" stroke-width="2.5"/>` +
        svgTexto(x, y, b.r, 16, `font-size="17" font-weight="700" fill="${col}" font-family="Public Sans,sans-serif" text-anchor="middle" dominant-baseline="middle"`);
    });
    s += nodos + `<ellipse cx="${cx}" cy="${cy}" rx="118" ry="52" fill="${AZUL}"/>` +
      svgTexto(cx, cy, titulo || 'Tema', 16, `font-size="20" font-weight="700" fill="${PAPEL}" font-family="Fraunces,Georgia,serif" text-anchor="middle" dominant-baseline="middle"`) + '</svg>';
    return caja('mentemapa', '', 'Mapa mental', '', `<div class="dots-scroll">${s}</div><p class="dots-ayuda">Lee del centro hacia afuera: el tema, sus ideas principales (ramas de color) y los detalles de cada una.</p>`);
  }

  // =================================================================== PASO A PASO
  function pasos(args) {
    const { titulo, items } = partir(args);
    const ps = items.slice(0, 14); if (ps.length < 2) return '';
    const id = nuevoId('pasos');
    estados.set(id, { tipo: 'pasos', n: ps.length, titulo });
    return caja('revelar', id, 'Paso a paso', titulo,
      `<ol class="pasos-lista">${ps.map((p, i) => `<li ${i ? 'hidden' : ''} data-seg>${txt(p)}</li>`).join('')}</ol>
       <p class="dots-ayuda">Antes de ver el siguiente paso, intenta adivinar qué viene.</p>
       <div class="dots-acciones"><button type="button" class="dots-btn" data-pasos="sig">Ver el paso 2 de ${ps.length}</button><button type="button" class="dots-btn sec" data-pasos="todos">Ver todos</button></div>`);
  }
  function accionPasos(sec, a) {
    const st = estados.get(sec.id); const ocultos = [...sec.querySelectorAll('.pasos-lista li[hidden]')];
    (a === 'todos' ? ocultos : ocultos.slice(0, 1)).forEach((li) => { li.hidden = false; li.classList.add('nuevo'); });
    refrescarMath(sec);
    const quedan = sec.querySelectorAll('.pasos-lista li[hidden]').length;
    const acc = sec.querySelector('.dots-acciones');
    if (!quedan) {
      acc.innerHTML = `<button type="button" class="dots-btn" data-dots-enviar="Ya vi todos los pasos${st?.titulo ? ' de ' + esc(st.titulo) : ''}. Ponme un ejercicio parecido para hacerlo yo solo.">Ponme un ejercicio parecido</button>
        <button type="button" class="dots-btn sec" data-dots-preguntar-paso="${st?.n || 0}">Tengo una duda en un paso</button>`;
    } else sec.querySelector('[data-pasos="sig"]').textContent = `Ver el paso ${st.n - quedan + 1} de ${st.n}`;
  }

  // =================================================================== GRÁFICA DE FUNCIONES
  const FUN = { sin: 'Math.sin', sen: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', sqrt: 'Math.sqrt', raiz: 'Math.sqrt', abs: 'Math.abs', ln: 'Math.log', log: 'Math.log10', exp: 'Math.exp' };
  const CONST = { pi: 'Math.PI', e: 'Math.E', x: 'x' };
  const TOK = /\s*(sqrt|raiz|sin|sen|cos|tan|abs|exp|log|ln|pi|x|e|\d+(?:\.\d+)?|\.\d+|[-+*/^()])/y;
  function compilar(expr) {
    const s = String(expr).toLowerCase().replace(/^\s*[a-z]\s*\(\s*x\s*\)\s*=|^\s*y\s*=/, '').replace(/π/g, 'pi').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/(\d),(\d)/g, '$1.$2').trim();
    if (!s || s.length > 120) return null;
    const toks = []; TOK.lastIndex = 0;
    while (TOK.lastIndex < s.length) { const m = TOK.exec(s); if (!m) return null; toks.push(m[1]); if (/^\s*$/.test(s.slice(TOK.lastIndex))) break; }
    const valor = (t) => /^[\d.]/.test(t) || t in CONST || t === ')';
    const inicia = (t) => /^[\d.]/.test(t) || t in CONST || t in FUN || t === '(';
    let out = '';
    toks.forEach((t, i) => {
      if (i && valor(toks[i - 1]) && inicia(t)) out += '*';
      out += t in FUN ? FUN[t] : t in CONST ? CONST[t] : t === '^' ? '**' : t;
      if (t in FUN && toks[i + 1] !== '(') out += '(NaN)'; // función sin paréntesis: inválida
    });
    if (/\(NaN\)/.test(out)) return null;
    try { const f = new Function('x', '"use strict"; return (' + out + ');'); const y = f(1.234); if (typeof y !== 'number') return null; return f; } catch { return null; }
  }
  function rango(t, def) { const m = String(t || '').match(/(-?\d+(?:\.\d+)?)\s*\.\.\s*(-?\d+(?:\.\d+)?)/); return m && +m[2] > +m[1] ? [+m[1], +m[2]] : def; }
  function grafica(args) {
    const { titulo, items, extra } = partir(args);
    const exprs = items.slice(0, 3).map((e) => ({ e, f: compilar(e) })).filter((x) => x.f);
    if (!exprs.length) return '';
    const [x0, x1] = rango(extra[0], [-10, 10]);
    const N = 480, W = 640, H = 400, m = 40;
    const muestras = exprs.map(({ f }) => Array.from({ length: N + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / N; let y; try { y = f(x); } catch { y = NaN; } return [x, Number.isFinite(y) ? y : NaN]; }));
    let ys = muestras.flat().map((p) => p[1]).filter(Number.isFinite).sort((a, b) => a - b);
    let [y0, y1] = rango(extra[1], ys.length ? [ys[Math.floor(ys.length * 0.02)], ys[Math.floor(ys.length * 0.98)]] : [-10, 10]);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.08; if (!extra[1]) { y0 -= pad; y1 += pad; }
    const X = (x) => m + ((x - x0) / (x1 - x0)) * (W - 2 * m), Y = (y) => H - m - ((y - y0) / (y1 - y0)) * (H - 2 * m);
    const paso = (a, b) => { const r = (b - a) / 8, p = Math.pow(10, Math.floor(Math.log10(r))); return [1, 2, 5, 10].map((k) => k * p).find((k) => k >= r) || r; };
    const px = paso(x0, x1), py = paso(y0, y1);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="dots-svg" role="img" aria-label="Gráfica de ${esc(exprs.map((x) => x.e).join(', '))}">`;
    for (let v = Math.ceil(x0 / px) * px; v <= x1 + 1e-9; v += px) s += `<line x1="${X(v)}" y1="${m}" x2="${X(v)}" y2="${H - m}" stroke="#EEE8DC"/><text x="${X(v)}" y="${H - m + 16}" font-size="11" text-anchor="middle" fill="#6B655B">${+v.toFixed(6)}</text>`;
    for (let v = Math.ceil(y0 / py) * py; v <= y1 + 1e-9; v += py) s += `<line x1="${m}" y1="${Y(v)}" x2="${W - m}" y2="${Y(v)}" stroke="#EEE8DC"/><text x="${m - 6}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="#6B655B">${+v.toFixed(6)}</text>`;
    if (x0 <= 0 && x1 >= 0) s += `<line x1="${X(0)}" y1="${m}" x2="${X(0)}" y2="${H - m}" stroke="${TINTA}" stroke-width="1.5"/>`;
    if (y0 <= 0 && y1 >= 0) s += `<line x1="${m}" y1="${Y(0)}" x2="${W - m}" y2="${Y(0)}" stroke="${TINTA}" stroke-width="1.5"/>`;
    s += `<text x="${W - m}" y="${(y0 <= 0 && y1 >= 0 ? Y(0) : H - m) - 6}" font-size="13" font-style="italic" text-anchor="end" fill="${TINTA}">x</text>`;
    muestras.forEach((pts, k) => {
      let d = '', abierto = false;
      pts.forEach(([x, y], i) => {
        const fuera = !Number.isFinite(y) || y < y0 - (y1 - y0) * 2 || y > y1 + (y1 - y0) * 2;
        const salto = i && Number.isFinite(pts[i - 1][1]) && Math.abs(y - pts[i - 1][1]) > (y1 - y0) * 1.5;
        if (fuera || salto) { abierto = false; if (fuera) return; }
        d += `${abierto ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y))).toFixed(1)}`; abierto = true;
      });
      s += `<path d="${d}" fill="none" stroke="${PALETA[k]}" stroke-width="3" clip-path="url(#dots-clip)"/>`;
    });
    const clip = nuevoId('clip');
    s = s.replace(/dots-clip/g, clip) + `<defs><clipPath id="${clip}"><rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}"/></clipPath></defs></svg>`;
    const id = nuevoId('graf');
    estados.set(id, { tipo: 'grafica', fs: exprs.map((x) => x.f), es: exprs.map((x) => x.e) });
    const ley = exprs.map((x, k) => `<span><i style="background:${PALETA[k]}"></i>y = ${esc(x.e)}</span>`).join('');
    return caja('grafica', id, 'Gráfica', titulo, `<div class="dots-scroll">${s}</div><div class="g-ley">${ley}</div>
      <form class="g-eval"><label>Prueba un valor de x: <input name="x" inputmode="decimal" size="6" placeholder="2"></label><button type="submit" class="dots-btn sec">Calcular</button><output></output></form>`);
  }
  function evaluarGrafica(sec, form) {
    const st = estados.get(sec.id); if (!st) return;
    const x = parseFloat(String(form.x.value).replace(',', '.'));
    const out = form.querySelector('output');
    if (!Number.isFinite(x)) { out.textContent = 'Escribe un número.'; return; }
    out.textContent = st.fs.map((f, k) => { let y; try { y = f(x); } catch { y = NaN; } return `${st.es[k]}: y = ${Number.isFinite(y) ? +y.toFixed(4) : 'no existe'}`; }).join('   ·   ');
  }

  // =================================================================== CÓMIC
  function personaje(nombre, col) {
    if (/^sabi$/i.test(nombre)) return `<img src="sabi-avatar.png" alt="SABI" class="c-sabi">`;
    const h = semilla(nombre), pelo = ['#2B1D14', '#5A3A22', '#1B1B18', '#8A5A2B', '#3B2A20'][h % 5], piel = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#6B4226'][(h >> 3) % 5];
    return `<svg viewBox="0 0 80 100" class="c-pj" aria-hidden="true"><rect x="18" y="58" width="44" height="42" rx="14" fill="${col}"/><circle cx="40" cy="36" r="22" fill="${piel}"/>` +
      `<path d="M18 34 Q20 ${10 + (h % 6)} 40 12 Q60 ${10 + ((h >> 2) % 6)} 62 34 Q54 22 40 22 Q26 22 18 34Z" fill="${pelo}"/>` +
      `<circle cx="32" cy="38" r="2.6" fill="#1B1B18"/><circle cx="48" cy="38" r="2.6" fill="#1B1B18"/><path d="M33 47 Q40 ${51 + (h % 3)} 47 47" stroke="#1B1B18" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  }
  function comic(args) {
    const { titulo, items } = partir(args);
    const vinetas = items.map((it) => par(it)).filter(([a, b]) => a && b).slice(0, 8);
    if (!vinetas.length) return '';
    const colores = new Map();
    const html = vinetas.map(([quien, dice], i) => {
      if (/^narrador|^narraci/i.test(quien)) return `<div class="c-vin c-narr"><p data-seg>${txt(dice)}</p><small>${i + 1}</small></div>`;
      if (!colores.has(quien)) colores.set(quien, PALETA[colores.size % PALETA.length]);
      return `<div class="c-vin"><div class="c-globo" data-seg>${txt(dice)}</div>${personaje(quien, colores.get(quien))}<p class="c-nombre">${txt(quien)}</p><small>${i + 1}</small></div>`;
    }).join('');
    return caja('comic', '', 'Historieta', titulo, `<div class="c-tira">${html}</div><p class="dots-ayuda">Lee las viñetas en orden. ¿Qué harías tú en lugar del personaje?</p>`);
  }

  // =================================================================== DETECTA EL ERROR
  function detectaError(args) {
    const { titulo, items } = partir(args);
    const lineas = items.slice(0, 12); if (lineas.length < 2) return '';
    const id = nuevoId('error');
    estados.set(id, { tipo: 'error', lineas, titulo });
    return caja('detecta', id, 'Detecta el error', titulo,
      `<p class="dots-ayuda">Esta solución tiene un error. Toca la línea donde está.</p>
       <ol class="err-lineas">${lineas.map((l, i) => `<li><button type="button" data-err="${i}">${txt(l)}</button></li>`).join('')}</ol>
       <form class="err-form" hidden><label>¿Cuál es el error y cómo lo corriges?</label><textarea name="arreglo" placeholder="El error es… porque… La línea correcta sería…"></textarea><button type="submit" class="dots-btn">Enviar a SABI</button></form>`);
  }

  // =================================================================== TABLA
  function tabla(args) {
    const { titulo, items } = partir(args);
    const filas = items.map((f) => f.split('::').map((c) => c.trim())).slice(0, 25);
    if (filas.length < 2) return '';
    const n = Math.min(8, Math.max(...filas.map((f) => f.length)));
    return caja('tabla', '', 'Tabla', titulo, `<div class="dots-scroll"><table><thead><tr>${filas[0].slice(0, n).map((c) => `<th>${txt(c)}</th>`).join('')}</tr></thead><tbody>${filas.slice(1).map((f) => `<tr>${Array.from({ length: n }, (_, i) => `<td>${txt(f[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  }

  // =================================================================== ATLAS HUMANO (esquema)
  const ORG = {
    cerebro: ['Cerebro', '<path d="M88 30 Q100 12 120 14 Q140 12 152 30 Q158 46 144 54 L96 54 Q82 46 88 30Z"/>', 120, 34],
    pulmones: ['Pulmones', '<path d="M92 128 Q84 160 88 200 Q100 206 112 196 L112 132 Q102 118 92 128Z"/><path d="M148 128 Q156 160 152 200 Q140 206 128 196 L128 132 Q138 118 148 128Z"/>', 100, 165],
    corazon: ['Corazón', '<path d="M118 160 Q110 150 116 144 Q122 140 126 148 Q130 140 136 144 Q142 150 134 162 L126 172Z"/>', 128, 158],
    higado: ['Hígado', '<path d="M90 214 Q120 204 142 212 Q138 232 112 236 Q92 234 90 214Z"/>', 106, 222],
    estomago: ['Estómago', '<path d="M138 214 Q156 212 156 228 Q154 248 136 250 Q126 246 132 236 Q140 230 138 214Z"/>', 146, 232],
    rinones: ['Riñones', '<ellipse cx="102" cy="258" rx="8" ry="13"/><ellipse cx="138" cy="258" rx="8" ry="13"/>', 120, 258],
    intestinos: ['Intestinos', '<path d="M96 268 Q120 260 144 268 Q150 290 140 306 Q120 314 100 306 Q90 290 96 268Z"/>', 120, 288],
    vejiga: ['Vejiga', '<ellipse cx="120" cy="326" rx="11" ry="8"/>', 120, 326],
    huesos: ['Huesos (columna)', '<rect x="117" y="70" width="6" height="250" rx="3"/>', 120, 90],
  };
  function atlas(args) {
    const { titulo, items } = partir(args);
    const pedidos = new Set((items.join(',').split(',')).map((s) => normal(s).toLowerCase()).map((s) => s.replace('rinon', 'rinones').replace('pulmon', 'pulmones').replace('intestino', 'intestinos').replace(/s+$/, (m) => m)).filter(Boolean));
    const clave = (k) => [...pedidos].some((p) => k.startsWith(p.slice(0, 5)) || p.startsWith(k.slice(0, 5)));
    let figs = '', etiquetas = '';
    let lado = 0;
    Object.entries(ORG).forEach(([k, [nom, forma, lx, ly]]) => {
      const on = clave(k);
      const col = { corazon: '#C0392B', pulmones: '#E58E8E', cerebro: '#B98AC9', higado: '#8A4B2E', estomago: '#E2A85A', rinones: '#9C4A3C', intestinos: '#D9A07A', vejiga: '#E6C35C', huesos: '#BDB6A6' }[k];
      figs += `<g fill="${on ? col : '#D9D2C3'}" fill-opacity="${on ? 0.95 : 0.55}" stroke="${on ? '#5A2018' : '#B9B09C'}" stroke-width="1.2">${forma}</g>`;
      if (on) { const der = lado++ % 2 === 0; const tx = der ? 214 : 26; etiquetas += `<line x1="${lx}" y1="${ly}" x2="${der ? 206 : 34}" y2="${ly}" stroke="${AZUL}" stroke-width="1.2"/><circle cx="${lx}" cy="${ly}" r="2.5" fill="${AZUL}"/><text x="${tx}" y="${ly + 4}" font-size="12" font-weight="700" fill="${AZUL}" text-anchor="${der ? 'start' : 'end'}" font-family="Public Sans,sans-serif">${nom}</text>`; }
    });
    if (!etiquetas) return '';
    const silueta = `<g fill="#FBF8F1" stroke="#8A857B" stroke-width="2"><circle cx="120" cy="38" r="30"/><path d="M104 66 L136 66 L140 80 Q182 86 190 110 L204 230 Q206 244 196 246 Q188 246 186 234 L170 130 L166 340 L150 500 L128 500 L124 352 L116 352 L112 500 L90 500 L74 340 L70 130 L54 234 Q52 246 44 246 Q34 244 36 230 L50 110 Q58 86 100 80Z"/></g>`;
    return caja('atlas', '', 'Atlas humano', titulo, `<div class="dots-scroll atlas-wrap"><svg viewBox="-60 0 360 510" class="dots-svg atlas-svg" role="img" aria-label="Esquema del cuerpo humano">${silueta}${figs}${etiquetas}</svg></div>
      <p class="dots-ayuda">Esquema simplificado, no a escala: muestra dónde está cada órgano, no su forma exacta.</p>`);
  }

  // =================================================================== REGISTRO Y EVENTOS
  // Nota: pasos, ciclo, mapa, tabla y funcion los dibuja tutor.html (capa visual); aquí van
  // sus versiones interactivas con otro nombre: revelar, mapamental, grafica, tablad.
  const TIPOS = {
    sopa, sopa_de_letras: sopa, crucigrama, crossword: crucigrama, flashcards, tarjetas: flashcards,
    linea_tiempo: lineaTiempo, timeline: lineaTiempo, flujo, fluxograma: flujo, matflow: flujo,
    '5w1h': cincoW, mapamental: mapaMental, mapa_mental: mapaMental, revelar: pasos, paso_a_paso: pasos,
    grafica: grafica, comic, historieta: comic, detectaerror: detectaError, tablad: tabla,
    atlas, human_atlas: atlas,
  };
  // Bloques de varias líneas:  [[lectura Título]] … [[/lectura]]  → una sola línea [[lectura @k]]
  const bloques = new Map();
  function preprocesar(texto) {
    return String(texto || '').replace(/^\s*\[\[\s*(\w+)([^\]\n]*)\]\]\s*\n([\s\S]*?)\n\s*\[\[\s*\/\s*\1\s*\]\]\s*$/gm, (m, tipo, cab, cuerpo) => {
      const k = 'b' + (++contador); bloques.set(k, { cab: cab.trim(), cuerpo });
      return `[[${tipo} @${k}]]`;
    });
  }
  function bloque(args) { const m = String(args).match(/^@(b\d+)$/); return m ? bloques.get(m[1]) : null; }
  function dibujar(tipo, args) {
    const f = TIPOS[String(tipo || '').toLowerCase()];
    if (!f) return '';
    try { return f(args) || ''; } catch (e) { console.error('SabiDots: herramienta no válida', tipo, e); return ''; }
  }
  function refrescarMath(el) {
    if (window.renderMathInElement) try { renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch {}
  }
  function enviarA(texto) { if (typeof api.enviar === 'function') api.enviar(texto); }

  document.addEventListener('click', (e) => {
    const t = e.target;
    const sec = t.closest && t.closest('section.dots');
    const env = t.closest('[data-dots-enviar]');
    if (env && !env.disabled) { env.disabled = true; enviarA(env.dataset.dotsEnviar); return; }
    const dud = t.closest('[data-dots-preguntar-paso]');
    if (dud) { const inp = document.getElementById('input'); if (inp) { inp.value = 'Tengo una duda en el paso '; inp.focus(); } return; }
    const rep = t.closest('[data-dots-repasar]');
    if (rep) { const hilo = document.getElementById('hilo'); if (hilo && !repasarMazo(hilo)) { rep.textContent = 'No tienes tarjetas para hoy'; setTimeout(pintarRepaso, 2500); } return; }
    if (!sec) return;
    const b = t.closest('button'); if (!b) return;
    if (b.classList.contains('sopa-c')) return clicSopa(sec, b);
    if (b.dataset.cru) return accionCruci(sec, b.dataset.cru);
    if (b.dataset.flash) return accionFlash(sec, b.dataset.flash);
    if (b.dataset.pasos) return accionPasos(sec, b.dataset.pasos);
    if (b.dataset['5w']) return enviar5w(sec);
    if (b.dataset.err !== undefined) {
      sec.querySelectorAll('[data-err]').forEach((x) => x.classList.toggle('elegida', x === b));
      const f = sec.querySelector('.err-form'); f.hidden = false; f.dataset.linea = b.dataset.err; f.arreglo.focus();
    }
  });
  document.addEventListener('submit', (e) => {
    const sec = e.target.closest && e.target.closest('section.dots'); if (!sec) return;
    if (e.target.classList.contains('g-eval')) { e.preventDefault(); evaluarGrafica(sec, e.target); return; }
    if (e.target.classList.contains('err-form')) {
      e.preventDefault(); const st = estados.get(sec.id); const i = +e.target.dataset.linea;
      e.target.querySelectorAll('textarea,button').forEach((x) => (x.disabled = true)); sec.querySelectorAll('[data-err]').forEach((x) => (x.disabled = true));
      enviarA(`Creo que el error está en la línea ${i + 1} («${st ? limpio(st.lineas[i]) : ''}»). Mi corrección: ${e.target.arreglo.value.trim() || '(todavía no sé cómo corregirlo)'}`);
    }
  });
  document.addEventListener('input', (e) => {
    const i = e.target; if (!i.matches || !i.matches('.cru-c input')) return;
    i.value = normal(i.value).slice(-1); i.classList.remove('ok', 'mal');
    if (i.value) { const todos = [...i.closest('.cru-grid').querySelectorAll('input')]; const sig = todos[todos.indexOf(i) + 1]; if (sig) sig.focus(); }
  });

  const api = { dibujar, preprocesar, tipos: () => Object.keys(TIPOS), enviar: null, repasarMazo, pintarRepaso, _compilar: compilar,
    registrar: (nombres, fn) => [].concat(nombres).forEach((n) => (TIPOS[n] = fn)),
    util: { esc, txt, limpio, partir, par, caja, nuevoId, estados, normal, semilla, azar, enviarA, refrescarMath, bloque, PALETA } };
  window.SabiDots = api;
  document.addEventListener('DOMContentLoaded', pintarRepaso);
})();
