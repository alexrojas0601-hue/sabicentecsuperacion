/*
  SABI · Bot de acceso (v2) — la puerta al tutor SABI desde cualquier aplicación SABI CENTEC
  -----------------------------------------------------------------------------------------
  Una sola línea antes de </body>:
    <script src="https://superacion.sabicentec.com/sabi-puerta.js" defer></script>
  Atributos opcionales:
    data-materia="Matemáticas"  materia preseleccionada (la de la app)
    data-rol="estudiante|docente|padre"   rol por defecto
    data-mision="DETECTIVE|INVENTOR|CALI 2040|ENSÉÑALE A SABI|MI TAREA"
    data-texto="Aprender con SABI"        texto del botón
    data-lado="izquierda"                 si la app ya tiene algo en la esquina derecha
    data-abajo="96"                       distancia al borde inferior en px (si la app usa esa franja)
    data-boton="no"                       sin botón: solo la función SABI.abrir()
  Desde el código de un simulador (por ejemplo, al fallar una pregunta):
    SABI.abrir({ materia: 'Matemáticas', tema: 'No entendí la pregunta 12', cmd: '/paso_a_paso' });
  Todo pasa en el navegador: no envía datos a ningún servidor; solo recuerda en este equipo
  el último rol y materia elegidos.
*/
(function () {
  'use strict';
  if (window.SABI && window.SABI._v2) return;
  var BASE = 'https://superacion.sabicentec.com/';
  var script = document.currentScript || {};
  var cfg = (script.dataset) || {};
  var MATERIAS = ['Matemáticas', 'Lenguaje', 'Ciencias Naturales', 'Química', 'Física', 'Ciencias Sociales', 'Inglés',
    'Tecnología e Informática', 'Ética y Valores', 'Artes', 'Educación Física', 'Emprendimiento', 'Matemáticas Financieras', 'Sorpréndeme'];
  var ACCIONES = [
    ['Resolver mi tarea', '', 'MI TAREA', 'Te guío paso a paso sin darte la respuesta'],
    ['Lección completa', '/leccion', 'MI TAREA', 'De lo fácil a lo profundo, con dibujos'],
    ['Hacer un experimento', '/experimento', 'DETECTIVE', '600 experimentos seguros'],
    ['Leer y comprender', '/lectura', 'MI TAREA', 'Texto con preguntas que se corrigen'],
    ['Ficha de práctica', '/worksheet', 'MI TAREA', 'Ejercicios a tu medida'],
    ['Escape room', '/escape', 'MI TAREA', 'Abre candados pensando'],
    ['Juego de tablero', '/boardgame', 'MI TAREA', 'Dado, casillas y preguntas'],
    ['Pensar a fondo', '/ultrathink', 'MI TAREA', 'Razonamiento profundo'],
  ];
  var APPS = [
    ['Portal SABI CENTEC', 'https://sabicentec.com'], ['Tutor SABI', BASE + 'tutor.html'], ['Experimentos', BASE + 'experimentos.html'],
    ['Laboratorio de retos', BASE + 'recursos.html'], ['PreICFES', 'https://preicfes.sabicentec.com'], ['Familia de Maestros', 'https://familiamaestros.sabicentec.com'],
    ['Escuela de Padres', 'https://escueladepadres.sabicentec.com'], ['Pedagogía', 'https://pedagogia.sabicentec.com'], ['AI CENTEC', 'https://ai.sabicentec.com'],
  ];
  var ROLES = [['estudiante', 'Estudiante'], ['docente', 'Docente'], ['padre', 'Familia']];
  function leer(k, d) { try { return localStorage.getItem('sabi_puerta_' + k) || d; } catch (e) { return d; } }
  function guardar(k, v) { try { localStorage.setItem('sabi_puerta_' + k, v); } catch (e) {} }

  function enlace(op) {
    op = op || {};
    var p = new URLSearchParams();
    p.set('rol', op.rol || cfg.rol || leer('rol', 'estudiante'));
    var m = op.materia || cfg.materia || ''; if (m) p.set('materia', m);
    var mi = op.mision || cfg.mision || ''; if (mi) p.set('mision', mi);
    if (op.tema) p.set('tema', String(op.tema).slice(0, 300));
    if (op.cmd && /^\/[\w-]{2,30}$/.test(op.cmd)) p.set('cmd', op.cmd);
    return BASE + 'tutor.html?' + p.toString();
  }
  function abrir(op) { window.open(enlace(op), '_blank', 'noopener'); }
  window.SABI = { enlace: enlace, abrir: abrir, _v2: true };
  if (cfg.boton === 'no') return;

  var CSS = ':host{all:initial}*{box-sizing:border-box;margin:0;padding:0;font-family:"Public Sans",system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.fab{position:fixed;bottom:ABAJOpx;LADO:18px;z-index:2147483000;display:flex;align-items:center;gap:10px;background:#0B1F3F;color:#FBF8F1;border:2px solid #F5A623;border-radius:999px;padding:6px 18px 6px 6px;cursor:pointer;box-shadow:0 8px 24px rgba(11,31,63,.35);font-weight:700;font-size:15px;transition:transform .15s}' +
    '.fab:hover{transform:translateY(-2px)}.fab img{width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:top;background:#fff}' +
    '.fab .pulso{position:absolute;inset:-4px;border-radius:999px;border:2px solid #F5A623;animation:p 2.4s ease-out 3;pointer-events:none}@keyframes p{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(1.15)}}' +
    '.panel{position:fixed;bottom:PANELpx;LADO:18px;z-index:2147483001;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - MAXpx);overflow:auto;background:#F7F3E9;color:#1F1D1A;border-radius:18px;box-shadow:0 18px 50px rgba(11,31,63,.35);border:1px solid #D9D2C3}' +
    '.cab{display:flex;gap:12px;align-items:center;background:#0B1F3F;color:#FBF8F1;padding:14px 16px;border-radius:18px 18px 0 0}.cab img{width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:top;background:#fff;border:2px solid #F5A623}' +
    '.cab b{display:block;font-size:16px}.cab small{color:#E9D9B4;font-size:12.5px}.x{margin-left:auto;background:none;border:none;color:#FBF8F1;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px}' +
    '.cuerpo{padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px}.lbl{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#B8862B}' +
    '.roles{display:flex;gap:6px}.roles button{flex:1;padding:8px;border-radius:999px;border:1.5px solid #0B1F3F;background:#fff;color:#0B1F3F;font-weight:600;font-size:13px;cursor:pointer}.roles button[aria-pressed=true]{background:#0B1F3F;color:#FBF8F1}' +
    'select,input{width:100%;padding:9px 12px;border:1.5px solid #D9D2C3;border-radius:10px;font-size:14px;background:#fff;color:#1F1D1A}' +
    '.acc{display:grid;grid-template-columns:1fr 1fr;gap:7px}.acc button{text-align:left;padding:9px 10px;border-radius:12px;border:1.5px solid #D9D2C3;background:#fff;cursor:pointer;color:#0B1F3F}' +
    '.acc button b{display:block;font-size:13.5px}.acc button small{display:block;font-size:11.5px;color:#6B655B;margin-top:2px;line-height:1.25}.acc button[aria-pressed=true]{border-color:#F5A623;box-shadow:0 0 0 2px #F5A623;background:#FFF6E3}' +
    '.ir{width:100%;padding:12px;border-radius:999px;border:none;background:#0B1F3F;color:#FBF8F1;font-weight:700;font-size:15px;cursor:pointer}.ir:hover{background:#14315C}' +
    'details{border-top:1px solid #D9D2C3;padding-top:10px}summary{cursor:pointer;font-size:13px;font-weight:600;color:#0B1F3F}.apps{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}' +
    '.apps a{font-size:12.5px;color:#0B1F3F;text-decoration:none;border:1px solid #D9D2C3;background:#fff;border-radius:999px;padding:5px 10px}.apps a:hover{border-color:#0B1F3F}' +
    '.pie{font-size:11px;color:#8A857B;text-align:center}@media(max-width:480px){.fab span{display:none}.fab{padding:6px}}' +
    'button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #F5A623;outline-offset:2px}';

  function montar() {
    var host = document.createElement('div');
    host.id = 'sabi-puerta';
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var lado = cfg.lado === 'izquierda' ? 'left' : 'right';
    var abajo = Math.max(8, Math.min(400, parseInt(cfg.abajo, 10) || 18));
    var estado = { rol: cfg.rol || leer('rol', 'estudiante'), materia: cfg.materia || leer('materia', ''), accion: 0 };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var mats = MATERIAS.slice(); if (estado.materia && mats.indexOf(estado.materia) < 0) mats.unshift(estado.materia);
    var aqui = location.hostname;
    root.innerHTML = '<style>' + CSS.replace(/LADO/g, lado).replace('ABAJOpx', abajo + 'px').replace('PANELpx', (abajo + 62) + 'px').replace('MAXpx', (abajo + 82) + 'px') + '</style>' +
      '<button class="fab" type="button" aria-haspopup="dialog" aria-expanded="false"><i class="pulso"></i><img src="' + BASE + 'sabi-avatar-mini.png" alt="" loading="lazy"><span>' + esc(cfg.texto || 'Aprender con SABI') + '</span></button>' +
      '<section class="panel" role="dialog" aria-label="SABI, tu tutor" hidden>' +
      '<div class="cab"><img src="' + BASE + 'sabi-avatar-mini.png" alt="SABI"><div><b>Hola, soy SABI</b><small>Tu tutor de CENTEC. ¿Qué quieres aprender hoy?</small></div><button class="x" type="button" aria-label="Cerrar">×</button></div>' +
      '<div class="cuerpo">' +
      '<div><p class="lbl">Soy</p><div class="roles">' + ROLES.map(function (r) { return '<button type="button" data-rol="' + r[0] + '" aria-pressed="' + (r[0] === estado.rol) + '">' + r[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="solo-est"><p class="lbl">Materia</p><select aria-label="Materia"><option value="">Elige la materia…</option>' + mats.map(function (m) { return '<option' + (m === estado.materia ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
      '<div class="solo-est"><p class="lbl">Quiero</p><div class="acc">' + ACCIONES.map(function (a, i) { return '<button type="button" data-a="' + i + '" aria-pressed="' + (i === 0) + '"><b>' + a[0] + '</b><small>' + a[3] + '</small></button>'; }).join('') + '</div></div>' +
      '<div><p class="lbl">¿Sobre qué tema?</p><input type="text" maxlength="280" placeholder="Ej.: fracciones, la célula, el Grito de Independencia…" aria-label="Tema"></div>' +
      '<button class="ir" type="button">Abrir SABI</button>' +
      '<details><summary>Más aplicaciones SABI CENTEC</summary><div class="apps">' + APPS.filter(function (a) { return a[1].indexOf(aqui) < 0 || aqui === ''; }).map(function (a) { return '<a href="' + a[1] + '" target="_blank" rel="noopener">' + esc(a[0]) + '</a>'; }).join('') + '</div></details>' +
      '<p class="pie">El error no nos detiene: nos enseña.</p></div></section>';
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return root.querySelectorAll(s); };
    var fab = $('.fab'), panel = $('.panel');
    function abrirPanel(si) { panel.hidden = !si; fab.setAttribute('aria-expanded', si); if (si) { var p = $('.pulso'); if (p) p.remove(); setTimeout(function () { $('input').focus(); }, 30); } else fab.focus(); }
    function pintarRol() {
      $$('.roles button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.rol === estado.rol); });
      $$('.solo-est').forEach(function (d) { d.style.display = estado.rol === 'padre' ? 'none' : ''; });
      $('input').placeholder = estado.rol === 'padre' ? '¿Cómo puedo acompañar a mi hijo en…?' : estado.rol === 'docente' ? 'Ej.: planear una clase de fracciones para 4°' : 'Ej.: fracciones, la célula, el Grito de Independencia…';
    }
    fab.addEventListener('click', function () { abrirPanel(panel.hidden); });
    $('.x').addEventListener('click', function () { abrirPanel(false); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) abrirPanel(false); if (e.key === 'Enter' && e.target.tagName === 'INPUT') ir(); });
    $$('.roles button').forEach(function (b) { b.addEventListener('click', function () { estado.rol = b.dataset.rol; guardar('rol', estado.rol); pintarRol(); }); });
    $$('.acc button').forEach(function (b) { b.addEventListener('click', function () { estado.accion = +b.dataset.a; $$('.acc button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
    $('select').addEventListener('change', function (e) { estado.materia = e.target.value; guardar('materia', estado.materia); });
    function ir() {
      var a = ACCIONES[estado.accion], tema = $('input').value.trim();
      var op = { rol: estado.rol, materia: estado.rol === 'padre' ? '' : estado.materia, tema: tema };
      if (estado.rol !== 'padre') { op.mision = cfg.mision || a[2]; if (a[1]) op.cmd = a[1]; }
      abrir(op); abrirPanel(false);
    }
    $('.ir').addEventListener('click', ir);
    pintarRol();
  }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
