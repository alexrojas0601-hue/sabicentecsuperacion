/*
  SABI · Ayudas didácticas — se suma a sabi-dots.js (cárgalo después)
  ------------------------------------------------------------------
  [[ficha Título|enunciado::respuesta;;enunciado::respuesta]]          /worksheet, fichas de matemáticas
  [[escape Título|Historia|reto::respuesta::pista;;reto::respuesta|Final]] /escape
  [[detective Caso|pista;;pista;;pista|Pregunta final]]                  /detective
  [[tablero Título|pregunta::respuesta;;pregunta::respuesta]]           /boardgame
  [[estaciones Título|Estación::actividad;;Estación::actividad]]         /stations
  [[manipulativo base10 347]] [[manipulativo marco 7]] [[manipulativo monedas 3500]]   /manipulative
  [[lapbook Tema|Solapa::contenido;;Solapa::contenido]]                 /lapbook
  [[parejas Título|término::pareja;;término::pareja]]                   /puzzle
  [[minilibro Título|página;;página;;…]]                                /minibook
  [[experimento g03-e017]]                                              banco de experimentos
  [[lectura Título]] … líneas TEXTO:/LITERAL:/DONDE:/… … [[/lectura]]     lectura comprensiva
  Respuestas: se aceptan varias separadas por " o " (ej. "12 o doce"). "?" = respuesta abierta.
*/
(function () {
  'use strict';
  if (!window.SabiDots) return;
  const D = window.SabiDots, U = D.util;
  const { esc, txt, limpio, partir, par, caja, nuevoId, estados, normal, semilla, azar, enviarA, refrescarMath } = U;

  // Compara respuestas: números (acepta 3,5 = 3.5 = 3½? no) y textos sin tildes ni mayúsculas.
  function numero(t) {
    // El modelo suele escribir el menos tipográfico (−); sin esto "5" y "−5" se daban por iguales.
    const s = String(t).replace(/[−–]/g, '-').replace(/^\s*[a-z]\s*=\s*/i, '').replace(/\$|cop|pesos|\s/gi, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const f = s.match(/^(-?\d+)\/(\d+)$/); if (f) return +f[1] / +f[2];
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  const plano = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[−–]/g, '-').replace(/[^a-z0-9ñ/.,-]+/g, ' ').trim();
  function correcta(dada, esperada) {
    if (!String(dada).trim()) return false;
    return String(esperada).split(/\s+o\s+|\s*\/\/\s*/).some((op) => {
      const a = numero(dada), b = numero(op);
      if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) < (Number.isInteger(b) ? 1e-9 : 1e-6 * Math.max(1, Math.abs(b)));
      return plano(dada) === plano(op);
    });
  }
  const abierta = (r) => !r || r.trim() === '?';
  const imprimir = (sec) => {
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(sec.querySelector('.dots-titulo')?.textContent || 'Ficha SABI')}</title>
      <link rel="stylesheet" href="${location.origin}/sabi-dots.css"><style>body{font-family:Public Sans,Arial,sans-serif;padding:24px;max-width:780px;margin:auto}
      button,.dots-acciones,.dots-estado{display:none!important} input{border:0;border-bottom:1.5px solid #333;min-width:90px} .herramienta{border:none}</style>
      <p style="font-size:12px;color:#555">Colegio CENTEC · SABI · Nombre: ____________________ Grado: ____ Fecha: ________</p>${sec.outerHTML}`);
    w.document.close(); setTimeout(() => w.print(), 400);
  };

  // ============================================================ GENERADOR DE FICHAS IMPRIMIBLES
  // [[generador dinero 3]] → fichas.html: infinitas fichas de matemáticas con respuestas calculadas por código
  const TIPOS_GEN = { calculo: 'Cálculo a medida', problemas: 'Problemas cotidianos', series: 'Series y patrones', geometria: 'Geometría visual', dinero: 'Dinero y cambio', error: 'Encuentra el error' };
  D.registrar(['generador', 'fichas'], (args) => {
    const [t = '', g = ''] = String(args).trim().split(/\s+/);
    const tipo = normal(t).toLowerCase().replace(/[^a-z]/g, '');
    if (!TIPOS_GEN[tipo]) return '';
    const grado = /transi/i.test(g) ? 0 : Math.min(11, Math.max(0, parseInt(g, 10) || 0));
    const base = /sabicentecsuperacion|superacion\.sabicentec|tutor\.sabicentec/.test(location.host) ? '' : 'https://sabicentecsuperacion.pages.dev/';
    return caja('generador', nuevoId('gen'), 'Fichas imprimibles', TIPOS_GEN[tipo],
      `<p>Cada ficha sale distinta, con una historia de Cali y su clave de respuestas calculada por código. ${grado ? grado + '°' : 'Transición'}.</p>
       <div class="dots-acciones"><a class="dots-btn" href="${base}fichas.html?tipo=${tipo}&grado=${grado}" target="_blank" rel="noopener">Abrir el generador de fichas</a></div>`);
  });

  // ============================================================ FICHA (worksheet)
  D.registrar(['ficha', 'worksheet'], (args) => {
    const { titulo, items, extra } = partir(args);
    const ej = items.map((it) => par(it)).filter(([q]) => q).slice(0, 20);
    if (!ej.length) return '';
    const id = nuevoId('ficha');
    estados.set(id, { ej, titulo });
    return caja('ficha', id, 'Ficha de trabajo', titulo,
      (extra[0] ? `<p class="ficha-idea">${txt(extra[0])}</p>` : '') +
      `<ol class="ficha-lista">${ej.map(([q, r], i) => `<li><span class="ficha-q" data-seg>${txt(q)}</span>
        ${abierta(r) ? `<textarea data-i="${i}" placeholder="Escribe cómo lo pensaste…"></textarea>` : `<input data-i="${i}" autocomplete="off" inputmode="${isNaN(numero(r)) ? 'text' : 'decimal'}" aria-label="Respuesta ${i + 1}"><span class="ficha-marca" aria-hidden="true"></span>`}</li>`).join('')}</ol>
       <div class="dots-acciones"><button type="button" class="dots-btn" data-ficha="revisar">Revisar mis respuestas</button><button type="button" class="dots-btn sec" data-ficha="imprimir">Imprimir ficha</button></div>
       <p class="dots-estado" aria-live="polite"></p>`);
  });
  function revisarFicha(sec) {
    const st = estados.get(sec.id); if (!st) return;
    let bien = 0, cerradas = 0; const malas = [], abiertas = [];
    st.ej.forEach(([q, r], i) => {
      const el = sec.querySelector(`[data-i="${i}"]`); if (!el) return;
      if (abierta(r)) { if (el.value.trim()) abiertas.push(`${i + 1}. ${limpio(q)} → ${el.value.trim()}`); return; }
      cerradas++; const ok = correcta(el.value, r);
      el.classList.toggle('ok', ok); el.classList.toggle('mal', !ok && !!el.value.trim());
      el.nextElementSibling.textContent = ok ? '✓' : el.value.trim() ? '✗' : '';
      if (ok) bien++; else malas.push(`${i + 1}. ${limpio(q)} (yo puse: ${el.value.trim() || 'nada'})`);
    });
    const est = sec.querySelector('.dots-estado');
    const msj = `Hice la ficha${st.titulo ? ' «' + limpio(st.titulo) + '»' : ''}: ${bien} de ${cerradas} correctas.` +
      (malas.length ? ` Me equivoqué en: ${malas.join('; ')}. Ayúdame a encontrar mi error sin darme la respuesta.` : ' ¡Las tengo todas! Súbeme la dificultad.') +
      (abiertas.length ? ` Mis respuestas abiertas: ${abiertas.join(' | ')}` : '');
    est.innerHTML = `${bien} de ${cerradas} correctas. ${malas.length ? 'Revisa las marcadas: el error es una pista. ' : ''}<button type="button" class="dots-btn" data-dots-enviar="${esc(msj)}">Contarle a SABI</button>`;
  }

  // ============================================================ ESCAPE ROOM
  D.registrar(['escape', 'escape_room'], (args) => {
    const { titulo, items, extra } = partir(args);
    // admite historia como primer segmento: [[escape Título|Historia|retos|Final]]
    let historia = '', retosTxt = items, final = '';
    const partes = String(args).split('|').map((x) => x.trim());
    if (partes.length >= 4) { historia = partes[1]; retosTxt = partes[2].split(';;').map((x) => x.trim()).filter(Boolean); final = partes[3]; }
    else if (partes.length === 3) { retosTxt = partes[1].split(';;').map((x) => x.trim()).filter(Boolean); final = partes[2]; }
    const retos = retosTxt.map((r) => r.split('::').map((x) => x.trim())).filter((r) => r[0] && r[1]).slice(0, 8);
    if (retos.length < 2) return '';
    const id = nuevoId('escape');
    estados.set(id, { retos, i: 0, final, titulo, fallos: 0 });
    return caja('escape', id, 'Escape room', titulo,
      (historia ? `<p class="esc-historia" data-seg>${txt(historia)}</p>` : '') +
      `<div class="esc-candados">${retos.map((_, i) => `<span class="esc-candado ${i ? '' : 'actual'}" title="Candado ${i + 1}">${i + 1}</span>`).join('')}</div>
       <div class="esc-reto"></div><p class="dots-estado" aria-live="polite"></p>`).replace('<div class="esc-reto"></div>', `<div class="esc-reto">${retoHTML(retos[0], 0, retos.length)}</div>`);
  });
  function retoHTML(r, i, n) {
    return `<p class="esc-num">Candado ${i + 1} de ${n}</p><p class="esc-q" data-seg>${txt(r[0])}</p>
      <form class="esc-form"><input name="r" autocomplete="off" placeholder="Código o respuesta" aria-label="Respuesta"><button type="submit" class="dots-btn">Abrir</button>
      ${r[2] ? '<button type="button" class="dots-btn sec" data-esc="pista">Pista</button>' : ''}</form><p class="esc-pista" hidden>${txt(r[2] || '')}</p>`;
  }
  function intentoEscape(sec, form) {
    const st = estados.get(sec.id); if (!st) return;
    const r = st.retos[st.i], est = sec.querySelector('.dots-estado');
    if (!correcta(form.r.value, r[1])) { st.fallos++; form.classList.add('sacude'); setTimeout(() => form.classList.remove('sacude'), 500); est.textContent = 'El candado no abre. Revisa tu razonamiento paso a paso.'; return; }
    const cs = sec.querySelectorAll('.esc-candado'); cs[st.i].classList.remove('actual'); cs[st.i].classList.add('abierto');
    st.i++; est.textContent = '';
    const zona = sec.querySelector('.esc-reto');
    if (st.i >= st.retos.length) {
      zona.innerHTML = `<p class="esc-final">${txt(st.final || '¡Escapaste! Abriste todos los candados.')}</p>
        <button type="button" class="dots-btn" data-dots-enviar="${esc(`Escapé del reto «${limpio(st.titulo)}» con ${st.fallos} intentos fallidos. ¿Qué estrategia usé para pensar?`)}">Contarle a SABI</button>`;
      return;
    }
    cs[st.i].classList.add('actual');
    zona.innerHTML = retoHTML(st.retos[st.i], st.i, st.retos.length); refrescarMath(zona); zona.querySelector('input')?.focus();
  }

  // ============================================================ DETECTIVE
  D.registrar(['detective', 'caso'], (args) => {
    const partes = String(args).split('|').map((x) => x.trim());
    const titulo = partes.length > 1 ? partes[0] : '';
    const pistas = (partes[1] || partes[0]).split(';;').map((x) => x.trim()).filter(Boolean).slice(0, 8);
    const pregunta = partes[2] || '¿Qué crees que pasó y qué pistas lo prueban?';
    if (pistas.length < 2) return '';
    const id = nuevoId('detective');
    estados.set(id, { pistas, pregunta, titulo, vistas: 1 });
    return caja('detective', id, 'Caso para detectives', titulo,
      `<div class="det-pistas">${pistas.map((p, i) => `<article class="det-pista" ${i ? 'hidden' : ''}><span>Pista ${i + 1}</span><p data-seg>${txt(p)}</p></article>`).join('')}</div>
       <div class="dots-acciones"><button type="button" class="dots-btn sec" data-det="pista">Ver la pista 2</button></div>
       <form class="det-form"><label>${txt(pregunta)}</label><textarea name="hipotesis" placeholder="Mi hipótesis es… porque la pista número … muestra que…"></textarea>
       <button type="submit" class="dots-btn">Resolver el caso</button></form>`);
  });

  // ============================================================ JUEGO DE TABLERO
  D.registrar(['tablero', 'boardgame', 'juego'], (args) => {
    const { titulo, items } = partir(args);
    const preguntas = items.map((it) => par(it)).filter(([q, r]) => q && r).slice(0, 24);
    if (preguntas.length < 4) return '';
    const N = 20, id = nuevoId('tablero');
    const rnd = azar(semilla(titulo + preguntas.length));
    const especiales = new Map([[4, ['avanza', 'Atajo: avanza 2']], [9, ['retro', 'Charco: retrocede 2']], [13, ['avanza', 'Bus MIO: avanza 3']], [17, ['retro', 'Lluvia: retrocede 1']]]);
    estados.set(id, { preguntas, N, pos: 0, k: Math.floor(rnd() * preguntas.length), aciertos: 0, turnos: 0, titulo, especiales, esperando: false });
    let casillas = '';
    for (let i = 0; i <= N; i++) {
      const e = especiales.get(i);
      casillas += `<div class="tab-c ${i === 0 ? 'inicio' : i === N ? 'meta' : e ? e[0] : ''}" data-c="${i}">${i === 0 ? 'Salida' : i === N ? 'Meta' : i}${e ? `<small>${e[1].split(':')[0]}</small>` : ''}${i === 0 ? '<i class="ficha-jug" aria-label="Tu ficha"></i>' : ''}</div>`;
    }
    return caja('tablero', id, 'Juego de tablero', titulo,
      `<div class="tab-grid">${casillas}</div>
       <div class="tab-panel"><button type="button" class="dots-btn" data-tab="dado">Lanzar el dado</button><span class="tab-dado" aria-live="polite"></span></div>
       <div class="tab-pregunta"></div><p class="dots-ayuda">Lanza el dado, responde la pregunta de la casilla y avanza si aciertas. Llega a la meta.</p>`);
  });
  function moverFicha(sec, st) {
    sec.querySelector('.ficha-jug')?.remove();
    sec.querySelector(`.tab-c[data-c="${st.pos}"]`).insertAdjacentHTML('beforeend', '<i class="ficha-jug" aria-label="Tu ficha"></i>');
  }
  function tirarDado(sec) {
    const st = estados.get(sec.id); if (!st || st.esperando || st.pos >= st.N) return;
    const d = 1 + Math.floor(Math.random() * 6); st.dado = d; st.esperando = true;
    sec.querySelector('.tab-dado').textContent = `Sacaste ${d}`;
    const [q] = st.preguntas[st.k % st.preguntas.length];
    sec.querySelector('.tab-pregunta').innerHTML = `<form class="tab-form"><p data-seg>${txt(q)}</p><input name="r" autocomplete="off" aria-label="Respuesta"><button type="submit" class="dots-btn">Responder</button></form>`;
    refrescarMath(sec); sec.querySelector('.tab-form input').focus();
  }
  function responderTablero(sec, form) {
    const st = estados.get(sec.id); if (!st) return;
    const [, r] = st.preguntas[st.k % st.preguntas.length]; st.k++; st.turnos++; st.esperando = false;
    const ok = abierta(r) ? !!form.r.value.trim() : correcta(form.r.value, r);
    let msg = ok ? `¡Bien! Avanzas ${st.dado}.` : `Casi. La respuesta era ${limpio(r)}. Te quedas donde estás.`;
    if (ok) { st.aciertos++; st.pos = Math.min(st.N, st.pos + st.dado); const e = st.especiales.get(st.pos); if (e) { const n = +e[1].match(/\d+/)[0]; st.pos = Math.max(0, Math.min(st.N, st.pos + (e[0] === 'avanza' ? n : -n))); msg += ' ' + e[1] + '.'; } }
    moverFicha(sec, st);
    const zona = sec.querySelector('.tab-pregunta');
    if (st.pos >= st.N) {
      zona.innerHTML = `<p class="esc-final">¡Llegaste a la meta en ${st.turnos} turnos con ${st.aciertos} aciertos!</p><button type="button" class="dots-btn" data-dots-enviar="${esc(`Gané el juego «${limpio(st.titulo)}»: ${st.aciertos} aciertos en ${st.turnos} turnos. Hazme la pregunta más difícil del tema.`)}">Contarle a SABI</button>`;
      sec.querySelector('[data-tab="dado"]').disabled = true; return;
    }
    zona.innerHTML = `<p class="tab-res ${ok ? 'ok' : 'mal'}">${esc(msg)}</p>`;
  }

  // ============================================================ ESTACIONES
  D.registrar(['estaciones', 'stations'], (args) => {
    const { titulo, items, extra } = partir(args);
    const est = items.map((it) => par(it)).filter(([a, b]) => a && b).slice(0, 8);
    if (est.length < 2) return '';
    const min = parseInt(extra[0]) || 8, id = nuevoId('est');
    estados.set(id, { n: est.length, titulo, min });
    return caja('estaciones', id, 'Estaciones de aprendizaje', titulo,
      `<p class="dots-ayuda">Rota por cada estación (${min} minutos cada una). Marca la estación cuando la termines.</p>
       <div class="est-grid">${est.map(([n, a], i) => `<article class="est-card"><div class="est-h"><b>${i + 1}</b> ${txt(n)}</div><p data-seg>${txt(a)}</p>
         <div class="est-pie"><button type="button" class="dots-btn sec" data-est="reloj" data-i="${i}">Iniciar ${min} min</button><label><input type="checkbox" data-est="hecha"> Terminada</label></div></article>`).join('')}</div>
       <p class="dots-estado" aria-live="polite"></p>`);
  });
  function relojEstacion(sec, b) {
    const st = estados.get(sec.id); let t = st.min * 60; clearInterval(b._t);
    b._t = setInterval(() => { t--; b.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; if (t <= 0) { clearInterval(b._t); b.textContent = '¡Tiempo! Rota'; b.classList.add('fin'); } }, 1000);
  }

  // ============================================================ MANIPULATIVOS
  const MONEDAS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  D.registrar(['manipulativo', 'manipulative'], (args) => {
    const [tipo, valor] = String(args).trim().split(/\s+/);
    const meta = parseInt(String(valor || '').replace(/\D/g, ''));
    const id = nuevoId('manip');
    const t = (tipo || '').toLowerCase();
    if (t === 'base10' && meta > 0 && meta < 10000) {
      estados.set(id, { tipo: 'base10', meta, v: { 1000: 0, 100: 0, 10: 0, 1: 0 } });
      return caja('manip', id, 'Bloques de base 10', `Construye el número ${meta.toLocaleString('es-CO')}`,
        `<div class="b10-ctrl">${[1000, 100, 10, 1].filter((u) => u <= Math.max(meta, 10)).map((u) => `<div><span>${{ 1000: 'Cubos (1000)', 100: 'Placas (100)', 10: 'Barras (10)', 1: 'Unidades (1)' }[u]}</span><button type="button" data-b10="-${u}" aria-label="Quitar">−</button><b data-cnt="${u}">0</b><button type="button" data-b10="${u}" aria-label="Agregar">+</button></div>`).join('')}</div>
         <div class="b10-zona" aria-hidden="true"></div><p class="dots-estado" aria-live="polite">Llevas 0.</p>`);
    }
    if (t === 'marco' && meta > 0 && meta <= 20) {
      estados.set(id, { tipo: 'marco', meta });
      const marcos = meta > 10 ? 2 : 1;
      return caja('manip', id, 'Marco de diez', `Llena ${meta} casillas`,
        `<div class="marco">${Array.from({ length: marcos * 10 }, (_, i) => `<button type="button" class="marco-c" data-marco="${i}" aria-label="Casilla ${i + 1}"></button>`).join('')}</div>
         <p class="dots-estado" aria-live="polite">Llevas 0. ¿Cuántas faltan para ${meta}?</p>`);
    }
    if ((t === 'monedas' || t === 'dinero') && meta > 0 && meta <= 200000) {
      estados.set(id, { tipo: 'monedas', meta, total: 0, usadas: [] });
      return caja('manip', id, 'Dinero y cambio', `Paga exactamente $${meta.toLocaleString('es-CO')}`,
        `<div class="din-caja">${MONEDAS.filter((m) => m <= meta * 2 || m <= 1000).map((m) => `<button type="button" class="din ${m >= 2000 ? 'billete' : 'moneda'}" data-din="${m}">$${m.toLocaleString('es-CO')}</button>`).join('')}</div>
         <div class="din-mesa" aria-live="polite"></div><div class="dots-acciones"><button type="button" class="dots-btn sec" data-din="0">Quitar todo</button></div>
         <p class="dots-estado" aria-live="polite">Llevas $0.</p><p class="dots-ayuda">Monedas y billetes de Colombia. Reto extra: págalo con la menor cantidad posible.</p>`);
    }
    return '';
  });
  function manip(sec, b) {
    const st = estados.get(sec.id); if (!st) return;
    const est = sec.querySelector('.dots-estado');
    if (st.tipo === 'base10') {
      const d = +b.dataset.b10, u = Math.abs(d); st.v[u] = Math.max(0, Math.min(9, st.v[u] + Math.sign(d)));
      sec.querySelector(`[data-cnt="${u}"]`).textContent = st.v[u];
      const total = Object.entries(st.v).reduce((a, [k, n]) => a + k * n, 0);
      sec.querySelector('.b10-zona').innerHTML = [1000, 100, 10, 1].map((k) => Array.from({ length: st.v[k] }, () => `<i class="b10 b${k}"></i>`).join('')).join('');
      est.textContent = total === st.meta ? `¡Lo construiste! ${st.v[1000] ? st.v[1000] + ' millares, ' : ''}${st.v[100]} centenas, ${st.v[10]} decenas y ${st.v[1]} unidades = ${st.meta}.` : `Llevas ${total}. ${total < st.meta ? 'Te faltan ' + (st.meta - total) : 'Te pasaste por ' + (total - st.meta)}.`;
      return;
    }
    if (st.tipo === 'marco') {
      b.classList.toggle('lleno'); const n = sec.querySelectorAll('.marco-c.lleno').length;
      est.textContent = n === st.meta ? `¡${st.meta}! ${st.meta > 10 ? `Un diez y ${st.meta - 10} más.` : `Faltan ${10 - st.meta} para llegar a 10.`}` : `Llevas ${n}. ${n < st.meta ? 'Faltan ' + (st.meta - n) : 'Sobran ' + (n - st.meta)} para ${st.meta}.`;
      return;
    }
    if (st.tipo === 'monedas') {
      const m = +b.dataset.din;
      if (!m) { st.total = 0; st.usadas = []; } else if (b.closest('.din-mesa')) { st.total -= m; st.usadas.splice(st.usadas.indexOf(m), 1); } else { st.total += m; st.usadas.push(m); }
      sec.querySelector('.din-mesa').innerHTML = st.usadas.map((x) => `<button type="button" class="din ${x >= 2000 ? 'billete' : 'moneda'}" data-din="${x}" title="Quitar">$${x.toLocaleString('es-CO')}</button>`).join('');
      // mínimo número de piezas (algoritmo voraz válido para esta denominación)
      let r = st.meta, minimo = 0; [...MONEDAS].reverse().forEach((x) => { minimo += Math.floor(r / x); r %= x; });
      est.textContent = st.total === st.meta ? `¡Exacto! Pagaste $${st.meta.toLocaleString('es-CO')} con ${st.usadas.length} piezas${st.usadas.length === minimo ? ', ¡el mínimo posible!' : `. ¿Puedes hacerlo con ${minimo}?`}`
        : st.total > st.meta ? `Pagaste $${st.total.toLocaleString('es-CO')}. ¿Cuánto te deben devolver de cambio?` : `Llevas $${st.total.toLocaleString('es-CO')}. Faltan $${(st.meta - st.total).toLocaleString('es-CO')}.`;
    }
  }

  // ============================================================ LAPBOOK
  D.registrar(['lapbook'], (args) => {
    const { titulo, items } = partir(args);
    const solapas = items.map((it) => par(it)).filter(([a, b]) => a && b).slice(0, 9);
    if (solapas.length < 2) return '';
    const id = nuevoId('lap');
    return caja('lapbook', id, 'Lapbook', titulo,
      `<div class="lap-grid">${solapas.map(([a, b], i) => `<details class="lap-solapa" style="--k:${i}"><summary>${txt(a)}</summary><p data-seg>${txt(b)}</p></details>`).join('')}</div>
       <p class="dots-ayuda">Abre cada solapa. Para hacerlo en papel: dobla una cartulina en tres, recorta solapas y escribe lo de adentro con tus palabras.</p>
       <div class="dots-acciones"><button type="button" class="dots-btn sec" data-imprimir>Imprimir plantilla</button></div>`);
  });

  // ============================================================ PAREJAS (puzzle)
  D.registrar(['parejas', 'puzzle', 'emparejar'], (args) => {
    const { titulo, items } = partir(args);
    const pares = items.map((it) => par(it)).filter(([a, b]) => a && b).slice(0, 8);
    if (pares.length < 3) return '';
    const id = nuevoId('par'), rnd = azar(semilla(titulo + pares.map((p) => p[0]).join()));
    const der = pares.map((p, i) => [p[1], i]).sort(() => rnd() - 0.5);
    estados.set(id, { pares, sel: null, ok: 0, titulo, intentos: 0 });
    return caja('parejas', id, 'Une las parejas', titulo,
      `<div class="par-cols"><div>${pares.map(([a], i) => `<button type="button" class="par-b" data-l="${i}">${txt(a)}</button>`).join('')}</div>
       <div>${der.map(([b, i]) => `<button type="button" class="par-b" data-r="${i}">${txt(b)}</button>`).join('')}</div></div>
       <p class="dots-estado" aria-live="polite">Toca un elemento de la izquierda y luego su pareja.</p>`);
  });
  function parejas(sec, b) {
    const st = estados.get(sec.id); if (!st || b.classList.contains('hecho')) return;
    if (b.dataset.l !== undefined) { sec.querySelectorAll('[data-l]').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); st.sel = +b.dataset.l; return; }
    if (st.sel === null) return;
    st.intentos++;
    const L = sec.querySelector(`[data-l="${st.sel}"]`);
    if (+b.dataset.r === st.sel) {
      const k = st.ok % 6; [L, b].forEach((x) => { x.classList.remove('sel'); x.classList.add('hecho', 'h' + k); x.disabled = true; }); st.ok++; st.sel = null;
      const est = sec.querySelector('.dots-estado');
      est.textContent = `${st.ok} de ${st.pares.length} parejas.`;
      if (st.ok === st.pares.length) est.innerHTML = `¡Completo en ${st.intentos} intentos! <button type="button" class="dots-btn" data-dots-enviar="${esc(`Uní todas las parejas de «${limpio(st.titulo)}» en ${st.intentos} intentos. Pregúntame por qué van juntas dos de ellas.`)}">Contarle a SABI</button>`;
    } else { b.classList.add('fallo'); setTimeout(() => b.classList.remove('fallo'), 450); }
  }

  // ============================================================ MINILIBRO
  D.registrar(['minilibro', 'minibook'], (args) => {
    const { titulo, items } = partir(args);
    const pags = items.slice(0, 8); if (pags.length < 2) return '';
    const id = nuevoId('mini');
    estados.set(id, { pags, i: 0, titulo });
    return caja('minilibro', id, 'Minilibro', titulo,
      `<div class="mini-libro"><div class="mini-pag" data-seg><span class="mini-n">Página 1 de ${pags.length}</span><p>${txt(pags[0])}</p></div></div>
       <div class="dots-acciones"><button type="button" class="dots-btn sec" data-mini="-1">Anterior</button><button type="button" class="dots-btn" data-mini="1">Siguiente</button><button type="button" class="dots-btn sec" data-imprimir>Imprimir para doblar</button></div>
       <div class="mini-print" hidden>${pags.map((p, i) => `<div><small>${i + 1}</small><p>${txt(p)}</p></div>`).join('')}</div>`);
  });

  // ============================================================ EXPERIMENTO (banco)
  const cacheExp = new Map();
  async function cargarGrado(g) {
    const k = String(g).padStart(2, '0');
    if (!cacheExp.has(k)) cacheExp.set(k, fetch(`/data/experimentos/grado-${k}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : [])).catch(() => []));
    return cacheExp.get(k);
  }
  const EJES = { 'materia-cambios': 'Materia y cambios', 'fuerza-movimiento': 'Fuerza y movimiento', 'luz-sonido-energia': 'Luz, sonido y energía', 'seres-vivos-cuerpo': 'Seres vivos y cuerpo humano', quimica: 'Química', 'tierra-universo': 'Tierra y universo' };
  function tarjetaExperimento(e) {
    const lista = (a) => (Array.isArray(a) ? a : []).map((x) => `<li>${txt(x)}</li>`).join('');
    return `<p class="exp-eje">${esc(EJES[e.eje] || e.eje || '')} · Grado ${e.grado === 0 ? 'Transición' : e.grado + '°'} · ${e.minutos || 15} min${e.adulto ? ' · Con un adulto' : ''}</p>
      <p class="exp-gancho" data-seg>${txt(e.gancho)}</p>
      <form class="exp-pred"><label>Antes de empezar, predice: ${txt(e.prediccion)}</label><textarea name="p" placeholder="Yo creo que… porque…"></textarea><button type="submit" class="dots-btn">Guardar mi predicción y empezar</button></form>
      <div class="exp-cuerpo" hidden>
        <div class="exp-cols"><div><h4>Materiales</h4><ul>${lista(e.materiales)}</ul></div><div><h4>Pasos</h4><ol>${lista(e.pasos)}</ol></div></div>
        <p class="exp-seg"><b>Seguridad:</b> ${txt(e.seguridad)}</p>
        <details class="exp-que"><summary>Ya lo hice: ¿qué pasó y por qué?</summary><p data-seg>${txt(e.que_pasa)}</p><p><b>Concepto:</b> ${txt(e.concepto)} · <b>Palabras clave:</b> ${(e.vocabulario || []).map(txt).join(', ')}</p></details>
        <h4>Piensa</h4><ol>${lista(e.preguntas)}</ol><p class="exp-reto"><b>Reto de científico:</b> ${txt(e.reto)}</p>
        <form class="exp-obs"><label>¿Qué observaste? ¿Se cumplió tu predicción?</label><textarea name="o" placeholder="Observé que… Mi predicción…"></textarea><button type="submit" class="dots-btn">Contarle a SABI</button></form>
      </div>`;
  }
  D.registrar(['experimento', 'experiment'], (args) => {
    const m = String(args).trim().match(/^g?(\d{1,2})-e(\d{1,3})$/i);
    if (!m) return '';
    const id = nuevoId('exp'), clave = `g${m[1].padStart(2, '0')}-e${m[2].padStart(3, '0')}`;
    estados.set(id, { clave });
    cargarGrado(+m[1]).then((lista) => {
      const sec = document.getElementById(id); if (!sec) return;
      const e = lista.find((x) => x.id === clave);
      sec.querySelector('.exp-carga').outerHTML = e ? tarjetaExperimento(e) : '<p>No encontré ese experimento en el banco.</p>';
      if (e) { estados.get(id).e = e; sec.querySelector('.dots-titulo').textContent = limpio(e.titulo); refrescarMath(sec); }
    });
    return caja('experimento', id, 'Experimento', 'Cargando…', '<p class="exp-carga">Abriendo el cuaderno de laboratorio…</p>');
  });

  // ============================================================ LECTURA COMPRENSIVA
  // Bloque: [[lectura Título]] / TEXTO: … / LITERAL: pregunta :: fragmento / DONDE: … :: fragmento /
  // INFERENCIA: … / PALABRA: palabra :: correcta :: distractor :: distractor / ORDEN: a ;; b ;; c /
  // CAUSA: causa :: consecuencia / ARGUMENTA: … / [[/lectura]]
  D.registrar(['lectura', 'reading'], (args) => {
    const b = U.bloque(args); if (!b) return '';
    const L = { TEXTO: [], LITERAL: [], DONDE: [], INFERENCIA: [], PALABRA: [], ORDEN: [], CAUSA: [], ARGUMENTA: [] };
    b.cuerpo.split('\n').forEach((l) => { const m = l.trim().match(/^([A-ZÁÉÍÓÚÑ]+)\s*:\s*(.+)$/); if (m) { const k = m[1].normalize('NFD').replace(/[̀-ͯ]/g, ''); if (L[k]) L[k].push(m[2].trim()); } });
    if (!L.TEXTO.length) return '';
    const id = nuevoId('lect');
    // texto en oraciones tocables
    let n = 0; const oraciones = [];
    const parrafos = L.TEXTO.map((p) => `<p>${p.split(/(?<=[.!?…]["»”)]?)\s+/).filter((o) => o.trim()).map((o) => { oraciones.push(o.trim()); return `<span class="lec-o" data-o="${n++}">${txt(o.trim())}</span>`; }).join(' ')}</p>`).join('');
    const ubicar = (frag) => { const f = plano(frag); let i = oraciones.findIndex((o) => plano(o).includes(f)); if (i < 0) i = oraciones.findIndex((o) => f.includes(plano(o)) && plano(o).length > 8); return i; };
    const literal = L.LITERAL.concat(L.DONDE).map((x) => par(x)).map(([q, f], k) => ({ q, o: ubicar(f), tipo: k < L.LITERAL.length ? 'LITERAL' : 'DONDE' })).filter((x) => x.o >= 0).slice(0, 6);
    const palabras = L.PALABRA.map((x) => x.split('::').map((y) => y.trim())).filter((x) => x.length >= 3).slice(0, 4);
    const orden = L.ORDEN.length ? L.ORDEN[0].split(';;').map((x) => x.trim()).filter(Boolean).slice(0, 6) : [];
    const causas = L.CAUSA.map((x) => par(x)).filter(([a, c]) => a && c).slice(0, 4);
    estados.set(id, { literal, oraciones, actual: 0, titulo: b.cab, orden, causas, palabras, aciertos: {} });
    const rnd = azar(semilla(b.cab));
    const mezcla = (arr) => arr.map((x, i) => [x, i]).sort(() => rnd() - 0.5);
    const sec = (num, t, sub, cuerpo) => `<section class="lec-sec"><h4><span>${num}</span>${t}</h4>${sub ? `<p class="dots-ayuda">${sub}</p>` : ''}${cuerpo}</section>`;
    let html = `<div class="lec-texto" data-seg>${parrafos}</div>`;
    if (literal.length) html += sec(1, 'Lo que dice el texto', 'Lee la pregunta y toca en el texto la oración exacta que la responde.',
      `<ol class="lec-lit">${literal.map((x, i) => `<li data-q="${i}" class="${i ? '' : 'actual'}">${x.tipo === 'DONDE' ? '<b>¿Dónde lo pone?</b> ' : ''}${txt(x.q)}<span class="lec-res"></span></li>`).join('')}</ol>`);
    if (L.INFERENCIA.length) html += sec(2, 'Leer entre líneas', 'Lo que el texto no dice directamente, pero se puede deducir con pistas.',
      L.INFERENCIA.slice(0, 3).map((q, i) => `<label class="lec-lab">${txt(q)}<textarea data-abierta="Leer entre líneas: ${esc(limpio(q))}" placeholder="Yo deduzco que… porque en el texto dice…"></textarea></label>`).join(''));
    if (palabras.length) html += sec(3, 'Palabras en contexto', 'Elige el significado que tiene la palabra en ESTE texto.',
      palabras.map(([w, ok, ...d], i) => `<div class="lec-pal"><b>${txt(w)}</b>${mezcla([ok, ...d]).map(([o, k]) => `<button type="button" class="lec-op" data-pal="${i}" data-ok="${k === 0 ? 1 : 0}">${txt(o)}</button>`).join('')}</div>`).join(''));
    if (orden.length > 2) html += sec(4, 'Orden y causas', 'Ordena los hechos como ocurren en el texto (usa las flechas).',
      `<ol class="lec-orden">${mezcla(orden).map(([o, k]) => `<li data-k="${k}"><span>${txt(o)}</span><button type="button" data-ord="-1" aria-label="Subir">▲</button><button type="button" data-ord="1" aria-label="Bajar">▼</button></li>`).join('')}</ol>
       <button type="button" class="dots-btn sec" data-lec="orden">Revisar el orden</button><span class="lec-ordres"></span>` +
      (causas.length ? `<div class="lec-causas">${causas.map(([c, e]) => `<div class="lec-ce"><span>${txt(c)}</span><i aria-hidden="true">→</i><span>${txt(e)}</span></div>`).join('')}</div><p class="dots-ayuda">Causa → consecuencia: ¿qué palabra del texto (porque, por eso, entonces) lo muestra?</p>` : ''));
    if (L.ARGUMENTA.length) html += sec(5, 'Piensa y argumenta', 'Da tu opinión con una razón y una prueba del texto.',
      L.ARGUMENTA.slice(0, 2).map((q) => `<label class="lec-lab">${txt(q)}<textarea data-abierta="Argumento: ${esc(limpio(q))}" placeholder="Pienso que… porque… y en el texto dice…"></textarea></label>`).join(''));
    html += `<div class="dots-acciones"><button type="button" class="dots-btn" data-lec="enviar">Enviar mi lectura a SABI</button></div><p class="lec-lema">Leer es comprender, relacionar y pensar.</p>`;
    return caja('lectura', id, 'Lectura comprensiva', b.cab, html);
  });
  function tocarOracion(sec, span) {
    const st = estados.get(sec.id); if (!st || st.actual >= st.literal.length) return;
    const q = st.literal[st.actual], li = sec.querySelector(`.lec-lit li[data-q="${st.actual}"]`);
    if (+span.dataset.o === q.o) {
      span.classList.add('lec-hallada'); li.classList.remove('actual'); li.classList.add('hecha');
      li.querySelector('.lec-res').textContent = ' ✓ Encontrada';
      st.aciertos['p' + st.actual] = st.aciertos['p' + st.actual] ?? true;
      st.actual++; sec.querySelector(`.lec-lit li[data-q="${st.actual}"]`)?.classList.add('actual');
    } else { span.classList.add('lec-fallo'); setTimeout(() => span.classList.remove('lec-fallo'), 600); st.aciertos['p' + st.actual] = false; li.querySelector('.lec-res').textContent = ' Esa no. Vuelve a leer la pregunta: ¿qué palabra clave buscas?'; }
  }
  function enviarLectura(sec) {
    const st = estados.get(sec.id) || {};
    const lit = Object.values(st.aciertos || {}).filter(Boolean).length;
    const pal = [...sec.querySelectorAll('.lec-pal')].map((d) => d.querySelector('.lec-op.elegida')).filter(Boolean);
    const abiertas = [...sec.querySelectorAll('textarea[data-abierta]')].map((t) => `${t.dataset.abierta} → ${t.value.trim() || '(sin responder)'}`);
    sec.querySelector('[data-lec="enviar"]').disabled = true;
    enviarA(`Terminé la lectura «${limpio(st.titulo || '')}». Literal: encontré ${lit} de ${(st.literal || []).length} a la primera. Palabras en contexto: ${pal.filter((b) => b.dataset.ok === '1').length} de ${(st.palabras || []).length}. ${(sec.querySelector('.lec-ordres')?.textContent || '').replace(/\s*Busca en el texto.*$/, '').trim()}\n${abiertas.join('\n')}\nRevisa mis respuestas abiertas con la evidencia del texto.`);
  }

  // ============================================================ EVENTOS
  document.addEventListener('click', (e) => {
    const t = e.target, sec = t.closest && t.closest('section.dots'); if (!sec) return;
    const b = t.closest('button');
    const span = t.closest('.lec-o'); if (span && sec.classList.contains('lectura')) return tocarOracion(sec, span);
    if (!b) return;
    if (b.dataset.ficha === 'revisar') return revisarFicha(sec);
    if (b.dataset.ficha === 'imprimir' || b.hasAttribute('data-imprimir')) { if (sec.classList.contains('minilibro')) sec.querySelector('.mini-print').hidden = false; imprimir(sec); if (sec.classList.contains('minilibro')) sec.querySelector('.mini-print').hidden = true; return; }
    if (b.dataset.esc === 'pista') { sec.querySelector('.esc-pista').hidden = false; return; }
    if (b.dataset.det === 'pista') {
      const ocultas = sec.querySelectorAll('.det-pista[hidden]'); if (ocultas[0]) { ocultas[0].hidden = false; refrescarMath(sec); }
      const quedan = sec.querySelectorAll('.det-pista[hidden]').length, st = estados.get(sec.id);
      b.textContent = quedan ? `Ver la pista ${st.pistas.length - quedan + 1}` : 'Ya viste todas las pistas'; b.disabled = !quedan; return;
    }
    if (b.dataset.tab === 'dado') return tirarDado(sec);
    if (b.dataset.est === 'reloj') return relojEstacion(sec, b);
    if (b.dataset.b10 || b.classList.contains('marco-c') || b.dataset.din !== undefined) return manip(sec, b);
    if (b.classList.contains('par-b')) return parejas(sec, b);
    if (b.dataset.mini) {
      const st = estados.get(sec.id); st.i = Math.max(0, Math.min(st.pags.length - 1, st.i + +b.dataset.mini));
      const pg = sec.querySelector('.mini-pag'); pg.innerHTML = `<span class="mini-n">Página ${st.i + 1} de ${st.pags.length}</span><p>${txt(st.pags[st.i])}</p>`;
      pg.classList.remove('voltea'); void pg.offsetWidth; pg.classList.add('voltea'); refrescarMath(pg); return;
    }
    if (b.classList.contains('lec-op')) {
      b.parentElement.querySelectorAll('.lec-op').forEach((x) => { x.disabled = true; x.classList.remove('elegida'); });
      b.classList.add('elegida', b.dataset.ok === '1' ? 'ok' : 'mal');
      if (b.dataset.ok !== '1') b.parentElement.querySelector('[data-ok="1"]').classList.add('ok');
      return;
    }
    if (b.dataset.ord) { const li = b.closest('li'); const sib = +b.dataset.ord < 0 ? li.previousElementSibling : li.nextElementSibling; if (sib) +b.dataset.ord < 0 ? sib.before(li) : sib.after(li); return; }
    if (b.dataset.lec === 'orden') {
      const ks = [...sec.querySelectorAll('.lec-orden li')].map((li) => +li.dataset.k);
      const bien = ks.filter((k, i) => k === i).length;
      sec.querySelector('.lec-ordres').textContent = bien === ks.length ? ` Orden correcto (${bien} de ${ks.length}).` : ` Orden: ${bien} de ${ks.length} en su lugar. Busca en el texto palabras como "primero", "después", "al final".`;
      return;
    }
    if (b.dataset.lec === 'enviar') return enviarLectura(sec);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target, sec = f.closest && f.closest('section.dots'); if (!sec) return;
    if (f.classList.contains('esc-form')) { e.preventDefault(); return intentoEscape(sec, f); }
    if (f.classList.contains('tab-form')) { e.preventDefault(); f.querySelector('button').disabled = true; return responderTablero(sec, f); }
    if (f.classList.contains('det-form')) {
      e.preventDefault(); const st = estados.get(sec.id); const v = f.hipotesis.value.trim(); if (!v) return f.hipotesis.focus();
      f.querySelectorAll('textarea,button').forEach((x) => (x.disabled = true));
      return enviarA(`Mi solución al caso «${limpio(st.titulo)}» (vi ${sec.querySelectorAll('.det-pista:not([hidden])').length} pistas): ${v}`);
    }
    if (f.classList.contains('exp-pred')) {
      e.preventDefault(); const st = estados.get(sec.id); st.pred = f.p.value.trim() || '(no escribí predicción)';
      f.querySelectorAll('textarea,button').forEach((x) => (x.disabled = true)); sec.querySelector('.exp-cuerpo').hidden = false; return;
    }
    if (f.classList.contains('exp-obs')) {
      e.preventDefault(); const st = estados.get(sec.id);
      f.querySelectorAll('textarea,button').forEach((x) => (x.disabled = true));
      return enviarA(`Hice el experimento «${limpio(st.e?.titulo || '')}». Mi predicción fue: ${st.pred}. Lo que observé: ${f.o.value.trim() || '(no lo escribí)'}. Ayúdame a explicar por qué pasó.`);
    }
  });
  document.addEventListener('change', (e) => {
    const c = e.target; if (c.dataset?.est !== 'hecha') return;
    const sec = c.closest('section.dots'), st = estados.get(sec.id);
    c.closest('.est-card').classList.toggle('hecha', c.checked);
    const n = sec.querySelectorAll('[data-est="hecha"]:checked').length;
    sec.querySelector('.dots-estado').innerHTML = n === st.n ? `¡Completaste las ${n} estaciones! <button type="button" class="dots-btn" data-dots-enviar="${esc(`Terminé las ${n} estaciones de «${limpio(st.titulo)}». ¿Cuál crees que me ayudó más a aprender? Hazme una pregunta que las conecte.`)}">Contarle a SABI</button>` : `${n} de ${st.n} estaciones terminadas.`;
  });

  D.ayudas = { correcta, numero, cargarGrado, tarjetaExperimento, EJES };
})();
