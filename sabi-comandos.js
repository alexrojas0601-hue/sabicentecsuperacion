/*
  SABI · Catálogo de comandos — barra de herramientas y paleta que aparece al escribir "/"
  (Prompt Maestro SABICENTEC + ayudas didácticas + comandos de pensamiento profundo).
  El servidor (functions/api/chat.js) reconoce los mismos nombres y sus alias.
*/
(function () {
  'use strict';
  const G = [
    ['Aprender jugando', [
      ['/worksheet', 'Ficha de trabajo', 'ejercicios a tu medida que se corrigen solos'],
      ['/escape', 'Escape room', 'abre candados resolviendo retos'],
      ['/detective', 'Detective', 'resuelve un caso con pistas'],
      ['/boardgame', 'Juego de tablero', 'dado, casillas y preguntas'],
      ['/stations', 'Estaciones', 'rotación de actividades con reloj'],
      ['/manipulative', 'Manipulativo', 'bloques base 10, marco de diez, monedas'],
      ['/puzzle', 'Parejas', 'une conceptos con su pareja'],
      ['/lapbook', 'Lapbook', 'solapas que se abren con lo esencial'],
      ['/minibook', 'Minilibro', 'un librito de 8 páginas para imprimir'],
      ['/comics', 'Cómic', 'historieta con dilemas y valores'],
      ['/sopa_de_letras', 'Sopa de letras', 'vocabulario clave'],
      ['/crucigrama', 'Crucigrama', 'pistas de razonamiento'],
      ['/flashcards', 'Tarjetas', 'repaso con repetición espaciada'],
    ]],
    ['Ciencias, matemáticas y lectura', [
      ['/experimento', 'Experimento', 'del banco de 50 por grado, con predicción'],
      ['/calculo', 'Ficha de cálculo', 'operaciones a tu medida'],
      ['/problemas', 'Problemas cotidianos', 'matemáticas de la vida real en Cali'],
      ['/series', 'Series y patrones', 'descubre la regla'],
      ['/geometria', 'Geometría visual', 'figuras, medidas y espacio'],
      ['/dinero', 'Dinero y cambio', 'paga y da vueltas con pesos colombianos'],
      ['/encuentraelerror', 'Encuentra el error', 'detecta y corrige'],
      ['/lectura', 'Lectura comprensiva', 'lo que dice, entre líneas, palabras, orden, argumenta'],
    ]],
    ['Ver y organizar', [
      ['/leccion', 'Lección completa', 'de lo intuitivo a la síntesis'],
      ['/paso_a_paso', 'Paso a paso', 'sin saltarse ninguna deducción'],
      ['/mathvisual', 'Ver la gráfica', 'ecuaciones y funciones en dibujo'],
      ['/mapmaps', 'Mapa mental', 'ideas conectadas'],
      ['/mathmaps', 'Mapa de fórmulas', 'teoremas y propiedades'],
      ['/sketchnotes', 'Sketchnotes', 'apuntes visuales'],
      ['/fluxograma', 'Diagrama de flujo', 'procesos y decisiones'],
      ['/matflow', 'Algoritmo', 'flujo para resolver problemas'],
      ['/timeline', 'Línea de tiempo', 'hechos en orden o cronograma de un plan'],
      ['/5w1h', '5W1H', 'quién, qué, cuándo, dónde, por qué, cómo'],
      ['/matematicas_formulas', 'Fórmulas y finanzas', 'modelar con fórmulas'],
      ['/human_atlas', 'Atlas humano', 'órganos y funciones'],
      ['/proyecto', 'Formular proyecto', 'ODS, objetivos SMART, presupuesto, SENA'],
    ]],
    ['Razonar con más agudeza', [
      ['/ultrathink', 'Pensamiento profundo', 'razonamiento extendido antes de responder'],
      ['/stepback', 'Paso atrás', 'mira el problema desde arriba'],
      ['/firstprinciples', 'Primeros principios', 'desde las verdades básicas'],
      ['/chainofthought', 'Cadena de razonamiento', 'cada paso a la vista'],
    ]],
    ['Aprender cualquier cosa rápido', [
      ['/eli5', 'Explícamelo fácil', 'como para un niño de 5 años'],
      ['/technicaldeepdive', 'A fondo', 'explicación técnica completa'],
      ['/analogy', 'Analogía', 'compáralo con algo conocido'],
      ['/socratic', 'Socrático', 'aprende respondiendo preguntas'],
    ]],
    ['Escribir una vez y bien', [
      ['/rewrite', 'Reescribir', 'mejor redacción'], ['/shorten', 'Acortar', 'lo esencial'],
      ['/expand', 'Ampliar', 'más detalle y ejemplos'], ['/outline', 'Esquema', 'estructura antes de escribir'],
    ]],
    ['Código con confianza', [
      ['/codereview', 'Revisar código', 'errores y mejoras'], ['/debug', 'Depurar', 'encontrar la falla'],
      ['/refactor', 'Refactorizar', 'código más claro'], ['/testcases', 'Casos de prueba', 'probar que funciona'],
    ]],
    ['Decidir con datos', [
      ['/procons', 'Pros y contras', ''], ['/swot', 'DOFA', 'debilidades, oportunidades, fortalezas, amenazas'],
      ['/riskcheck', 'Riesgos', 'qué puede salir mal'], ['/premortem', 'Premortem', 'imagina que falló: ¿por qué?'],
    ]],
    ['Nunca sin ideas', [
      ['/brainstorm', 'Lluvia de ideas', ''], ['/remix', 'Remezclar', 'combinar ideas'],
      ['/whatif', '¿Y si…?', 'escenarios'], ['/metaphor', 'Metáfora', 'imagen que explica'],
    ]],
    ['Decirlo correctamente', [
      ['/formalize', 'Formal', ''], ['/casualize', 'Cercano', ''],
      ['/persuade', 'Persuadir', 'con razones y evidencia'], ['/deescalate', 'Calmar un conflicto', 'comunicación no violenta'],
    ]],
    ['Metas en planes reales', [
      ['/prd', 'Documento de producto', 'qué, para quién, cómo'], ['/okrs', 'OKR', 'objetivos y resultados clave'],
      ['/delegate', 'Delegar', 'quién hace qué y cuándo'],
    ]],
    ['Confiar en lo que compartes', [
      ['/factcheck', 'Verificar', 'con búsqueda en vivo'], ['/citesources', 'Citar fuentes', 'con búsqueda en vivo'],
      ['/summarizeresearch', 'Resumir investigación', ''], ['/trendcheck', 'Tendencias', 'lo más actual'],
    ]],
    ['Que SABI se autoevalúe', [
      ['/godmode', 'Máximo rigor', 'piensa, critica y mejora antes de responder'], ['/critique', 'Crítica', 'evalúa la respuesta'],
      ['/iterate', 'Iterar', 'versión mejorada'], ['/selfcheck', 'Autoverificación', 'revisa cálculos y datos'],
    ]],
  ];
  const TODOS = G.flatMap(([g, l]) => l.map(([c, n, d]) => ({ c, n, d, g })));
  window.SabiComandos = { grupos: G, todos: TODOS };

  // ---------- Paleta: aparece al escribir "/" al inicio del mensaje ----------
  function conectar(input, enviar) {
    if (!input || input._paleta) return; input._paleta = true;
    const form = input.closest('form'); if (getComputedStyle(form).position === 'static') form.style.position = 'relative';
    const pal = document.createElement('div'); pal.className = 'dots-paleta'; pal.hidden = true; pal.setAttribute('role', 'listbox'); form.appendChild(pal);
    let lista = [], k = 0;
    const plano = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    function pintar() {
      const v = input.value; const m = v.match(/^\/(\S*)$/);
      if (!m) { pal.hidden = true; return; }
      const q = plano(m[1]);
      lista = TODOS.filter((x) => !q || plano(x.c).includes(q) || plano(x.n).includes(q)).slice(0, 40);
      if (!lista.length) { pal.hidden = true; return; }
      k = Math.min(k, lista.length - 1); let g = '';
      pal.innerHTML = lista.map((x, i) => (x.g !== g ? `<h5>${(g = x.g)}</h5>` : '') + `<button type="button" data-i="${i}" class="${i === k ? 'activo' : ''}"><b>${x.c}</b><span>${x.n}${x.d ? ' — ' + x.d : ''}</span></button>`).join('');
      pal.hidden = false;
    }
    function elegir(i) { const x = lista[i]; if (!x) return; input.value = x.c + ' '; pal.hidden = true; input.placeholder = 'Escribe el tema y pulsa Enviar'; input.focus(); }
    input.addEventListener('input', () => { k = 0; pintar(); });
    input.addEventListener('keydown', (e) => {
      if (pal.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); k = (k + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length; pintar(); pal.querySelector('.activo')?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); elegir(k); }
      else if (e.key === 'Escape') pal.hidden = true;
    }, true);
    pal.addEventListener('mousedown', (e) => { const b = e.target.closest('button[data-i]'); if (b) { e.preventDefault(); elegir(+b.dataset.i); } });
    input.addEventListener('blur', () => setTimeout(() => (pal.hidden = true), 150));
  }
  window.SabiComandos.conectar = conectar;
})();
