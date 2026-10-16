// ============================================================================
// Comandos SABI — fuente única para el tutor (/api/chat) y AI CENTEC (/api/institucional)
// ----------------------------------------------------------------------------
// Un comando es un protocolo concreto: obliga a PRODUCIR algo con una estructura probada,
// no es una palabra mágica. Se escribe al inicio del mensaje (hasta dos seguidos):
//   "/escape fracciones equivalentes 4°"   "/ultrathink /premortem feria de ciencias"
// Esta carpeta (_shared) no crea rutas públicas: solo la importan las funciones.
// ============================================================================

const GENERADOR_FICHAS = "https://sabicentecsuperacion.pages.dev/fichas.html";

// ---------- 1. Ayudas didácticas (aprendizaje divertido y significativo) ----------
const DIDACTICA = {
  worksheet: {
    titulo: "Ficha de trabajo imprimible",
    spec: `FICHA DE TRABAJO. Empieza por una buena idea: un título con una historia o situación gancho
cercana a Cali que dé sentido a todas las actividades. Luego: propósito en una frase; de 6 a 10
actividades en dificultad progresiva (recordar, comprender, aplicar, analizar y una de crear);
espacio de respuesta; autoevaluación final (lo hice solo / con ayuda / necesito repasar) y, solo
para docentes, la clave de respuestas al final.
En Matemáticas existe un generador infinito y verificado por código: tipos calculo, problemas,
series, geometria, dinero y error, grado 0 (Transición) a 11. Ofrécelo siempre junto con 3
ejercicios de muestra.`,
    tutor: "Para Matemáticas escribe la herramienta [[ficha tipo grado]], por ejemplo [[ficha dinero 3]].",
    institucional: `Para Matemáticas incluye el enlace ${GENERADOR_FICHAS}?tipo=TIPO&grado=GRADO (tipo: calculo, problemas, series, geometria, dinero o error).`,
  },
  escape: {
    titulo: "Escape room educativo",
    spec: `ESCAPE ROOM. Historia gancho con una misión y un tiempo (por ejemplo, 30 minutos). De 4 a 6
candados en orden de dificultad; cada candado es un reto del tema cuya solución da un código
(número o palabra) y el código abre el siguiente. Para cada candado: reto, tres pistas
escalonadas (empujón, pista fuerte, casi la respuesta) y el código. Un candado final integra
todo lo aprendido. Cierra con una reflexión: qué estrategia te sirvió.
Con estudiantes: juega un candado por turno; el estudiante escribe el código y tú lo verificas;
nunca reveles el código antes de que lo intente.
Con docentes: guion completo imprimible, materiales caseros, roles de equipo y solucionario.`,
  },
  detective: {
    titulo: "Caso de detectives",
    spec: `CASO DE DETECTIVES. Un misterio cuya solución exige usar el concepto del tema. Escena del caso;
tres hipótesis o sospechosos; de 5 a 7 pistas (al menos una engañosa) que el estudiante analiza;
una tabla de evidencias (pista, qué dice, qué podemos inferir, ¿es dato o es suposición?). El
estudiante resuelve el caso justificando con evidencias. Entrena distinguir dato de inferencia y
razonar desde la mejor explicación. Con estudiantes: entrega las pistas de a una y pregunta qué
concluye de cada una. Con docentes: dossier imprimible y la solución razonada.`,
  },
  boardgame: {
    titulo: "Juego de mesa imprimible",
    spec: `JUEGO DE MESA. Tablero de 24 a 30 casillas en camino (muéstralo como tabla), con casillas
especiales (avanza, retrocede, reto doble, ayuda a un compañero). De 20 a 30 tarjetas de pregunta
en tres niveles de dificultad con su respuesta. Reglas en máximo 8 líneas, materiales caseros
(dado, tapas como fichas), número de jugadores y duración. Incluye una variante cooperativa (todos
contra el reloj) para que nadie quede humillado. Las preguntas deben exigir pensar, no solo memorizar.`,
  },
  stations: {
    titulo: "Estaciones de aprendizaje",
    spec: `ESTACIONES. De 4 a 6 estaciones con actividades diferentes del mismo tema (manipular, leer,
calcular, crear, conversar, investigar). Para cada estación: propósito, materiales, tarjeta de
instrucciones para estudiantes (máximo 5 pasos), tiempo, producto o evidencia, versión de apoyo y
versión de reto. Indica la rotación y el tiempo total. La última estación es de metacognición:
¿qué aprendí, qué me costó, qué haría distinto?`,
  },
  manipulative: {
    titulo: "Material manipulativo",
    spec: `MATERIAL MANIPULATIVO (Concreto, Pictórico, Abstracto). Qué material es y qué idea hace visible;
materiales reciclables o baratos; cómo construirlo paso a paso; tres actividades graduadas: con el
objeto en la mano, dibujándolo y con símbolos; qué errores del estudiante permite ver el docente;
cuidados de seguridad. Nada de piezas pequeñas para menores de 6 años.`,
  },
  comic: {
    titulo: "Historieta",
    spec: `HISTORIETA de 4 a 6 viñetas que enseña el concepto o plantea un dilema de valor. Personajes con
nombre, escena y diálogos de máximo 18 palabras por globo; la explicación del concepto ocurre
dentro de la historia, no en un recuadro aparte. Cierra con una pregunta para el lector.`,
    tutor: "Escribe el guion viñeta por viñeta (Viñeta 1: escena; Nombre: diálogo).",
    institucional: "Usa el bloque sabi de tipo comic.",
  },
  lapbook: {
    titulo: "Lapbook",
    spec: `LAPBOOK (carpeta plegable con solapas). De 6 a 8 elementos: minilibros, solapas, bolsillo con
tarjetas, rueda giratoria, línea de tiempo plegable. Para cada uno: qué forma tiene, qué escribe o
dibuja el estudiante dentro y qué idea del tema consolida. Plano de distribución en la carpeta,
instrucciones de plegado y una rúbrica corta de 4 criterios.`,
  },
  puzzle: {
    titulo: "Rompecabezas de conceptos",
    spec: `ROMPECABEZAS. Elige el formato más útil para el tema: sopa de letras o crucigrama (la app los
arma por código, tú das las palabras y las pistas), acertijo lógico, criptograma con operaciones,
o dominó de pregunta y respuesta. Las pistas del crucigrama piden pensar (definición, ejemplo,
relación), no copiar. Al final, una pregunta que use las palabras encontradas.`,
    tutor: "Sopa: [[sopa Título | palabra1, palabra2, ...]] con 6 a 12 palabras. Crucigrama: [[crucigrama Título | PALABRA: pista ; PALABRA: pista]] con 5 a 10 entradas. Palabras sin espacios.",
    institucional: "Usa los bloques sabi de tipo sopa o crucigrama.",
  },
  minibook: {
    titulo: "Minilibro de 8 páginas",
    spec: `MINILIBRO de una sola hoja doblada (8 páginas). Página por página: portada con título y autor
(el estudiante), 6 páginas de contenido (idea clave, ejemplo, dibujo sugerido, dato curioso,
práctica, error frecuente) y contraportada con autoevaluación. Texto breve y adecuado a la edad.
Incluye las instrucciones de plegado y corte (doblar en 8, cortar el centro, plegar en libro).`,
  },
};

// ---------- 2. Protocolos por área ----------
const AREAS = {
  experimento: {
    titulo: "Experimento guiado (Ciencias)",
    spec: `EXPERIMENTO GUIADO. Usa primero el banco oficial de experimentos de CENTEC (auditado en
seguridad y alineado a los DBA de Ciencias Naturales); elige el que mejor sirva al tema y al grado.
Secuencia: pregunta investigable, predicción del estudiante (antes de hacer nada), materiales,
procedimiento, qué observar o medir, explicación del porqué al nivel del grado, la concepción
errónea frecuente, y un reto: ¿qué variable cambiarías para investigar más?
Ejes: materia y sus cambios; fuerza y movimiento; luz, sonido y energía; seres vivos y cuerpo
humano; química; Tierra, universo y ambiente. Seguridad: si el banco marca supervisión adulta,
dilo siempre; nunca propongas fuego, cloro, ácidos fuertes, electricidad del tomacorriente,
pilas de botón ni imanes pequeños con niños.`,
    tutor: "Muestra la tarjeta oficial con [[experimento ID]] usando un ID de la lista del banco que recibes; no inventes IDs.",
    institucional: "Banco completo y fichas imprimibles en https://sabicentecsuperacion.pages.dev/experimentos.html",
  },
  lectura: {
    titulo: "Taller de lectura comprensiva",
    spec: `TALLER DE LECTURA (leer es comprender, relacionar y pensar). Texto adecuado al grado (o el que
traiga la persona) y seis partes:
1. Lo que dice el texto: 4 preguntas de comprensión literal cuya respuesta está escrita en el
   texto; para cada una, la frase u oración exacta que la responde.
2. Leer entre líneas: 2 preguntas inferenciales (lo que el texto da a entender sin decirlo) que
   se justifican con pistas del texto.
3. Palabras en contexto: 2 o 3 palabras del texto; el estudiante deduce su significado por las
   palabras que las rodean, antes de ir al diccionario.
4. ¿Dónde lo pone?: localizar el párrafo o la oración donde está una información.
5. Orden y causas: secuencia de los hechos y relaciones de causa y efecto.
6. Piensa y argumenta: una pregunta crítica; la respuesta es una postura con razón y evidencia.
Regla de oro de la parte 1 y 4: la evidencia se copia textual del texto, entre comillas « »,
sin cambiar ni una palabra; si no está escrita así en el texto, la pregunta no es literal.`,
    tutor: `Con estudiantes: una parte por turno. Para la parte 1 y la 4 muestra el texto con [[subrayar TEXTO COMPLETO]] para que toque la oración que responde. Con docentes: entrega el taller completo; escribe el texto entre una línea <<<TEXTO y una línea TEXTO>>>, y en la clave cada evidencia como Evidencia: «frase exacta».`,
    institucional: "Escribe el texto entre una línea <<<TEXTO y una línea TEXTO>>>, y en la clave cada evidencia como Evidencia: «frase exacta».",
  },
};

// ---------- 3. Pensamiento profundo y comunicación ----------
const PENSAMIENTO = {
  ultrathink: ["Razona con agudeza", "PENSAMIENTO PROFUNDO: antes de responder, considera al menos dos enfoques, anticipa errores y verifica cada cálculo o dato; entrega solo la conclusión mejor sustentada y el razonamiento clave."],
  stepback: ["Razona con agudeza", "PASO ATRÁS: antes de resolver, nombra el principio o la categoría general que está en juego y por qué; luego aplícalo al caso concreto."],
  firstprinciples: ["Razona con agudeza", "PRIMEROS PRINCIPIOS: descompón el problema hasta verdades básicas indiscutibles, señala los supuestos heredados que no se sostienen y reconstruye la solución desde la base."],
  chainofthought: ["Razona con agudeza", "CADENA DE RAZONAMIENTO VISIBLE: muestra el razonamiento en pasos numerados; cada paso dice qué haces y por qué es válido."],
  eli5: ["Aprende cualquier cosa rápido", "EXPLÍCAMELO SENCILLO: explica como a un niño de 5 años (o al nivel más simple del grado), con una situación cotidiana y una analogía, sin tecnicismos; termina con una sola frase en lenguaje técnico."],
  technicaldeepdive: ["Aprende cualquier cosa rápido", "PROFUNDIZACIÓN TÉCNICA: definiciones formales, mecanismo, fórmulas con unidades, casos límite, limitaciones y cómo se verifica; nivel experto pero ordenado."],
  analogy: ["Aprende cualquier cosa rápido", "ANALOGÍAS: dos analogías distintas con la vida en Cali; para cada una, en qué se parece y dónde se rompe (sus límites)."],
  socratic: ["Aprende cualquier cosa rápido", "MÉTODO SOCRÁTICO: no des la respuesta; guía con una pregunta a la vez que haga descubrir la idea, y valida cada paso del estudiante."],
  rewrite: ["Escríbelo una vez y bien", "REESCRIBIR: reescribe el texto de la persona más claro y correcto conservando su sentido y su voz; luego lista los 3 cambios más importantes y por qué."],
  shorten: ["Escríbelo una vez y bien", "ACORTAR: reduce el texto a la mitad o menos sin perder ninguna idea clave."],
  expand: ["Escríbelo una vez y bien", "AMPLIAR: desarrolla el texto con ejemplos, evidencias y conectores, sin relleno."],
  outline: ["Escríbelo una vez y bien", "ESQUEMA: organiza el tema o el texto en un esquema jerárquico (ideas principales, secundarias y detalles)."],
  codereview: ["Programa con confianza", "REVISIÓN DE CÓDIGO: errores, seguridad, legibilidad y buenas prácticas, ordenados por gravedad, cada uno con la corrección; explica al nivel de quien aprende."],
  debug: ["Programa con confianza", "DEPURAR: describe el síntoma, formula hipótesis de la causa, propone la prueba mínima que la confirma y explica la corrección."],
  refactor: ["Programa con confianza", "REFACTORIZAR: mejora la estructura y los nombres sin cambiar lo que hace el programa; muestra antes y después y explica la ganancia."],
  testcases: ["Programa con confianza", "CASOS DE PRUEBA: tabla con entrada, salida esperada y propósito: casos normales, casos límite y casos de error."],
  proscons: ["Decide con datos", "PROS Y CONTRAS: tabla ponderada (importancia de 1 a 3), datos que faltan y una recomendación condicional (si pasa X, conviene Y)."],
  swot: ["Decide con datos", "DOFA: debilidades, oportunidades, fortalezas y amenazas, y 4 estrategias cruzadas (FO, DO, FA, DA)."],
  riskcheck: ["Decide con datos", "REVISIÓN DE RIESGOS: cada riesgo con probabilidad, impacto, señal temprana y mitigación; ordénalos por prioridad."],
  premortem: ["Decide con datos", "PREMORTEM: imagina que dentro de seis meses esto fracasó; enumera las causas más probables y qué hacer hoy para evitar cada una."],
  brainstorm: ["Nunca te quedes sin ideas", "LLUVIA DE IDEAS: al menos 10 ideas variadas sin juzgar; luego agrúpalas y elige las 3 mejores con un criterio explícito."],
  remix: ["Nunca te quedes sin ideas", "REMEZCLA (SCAMPER): sustituye, combina, adapta, modifica, usa para otra cosa, elimina o invierte elementos para crear algo nuevo."],
  whatif: ["Nunca te quedes sin ideas", "¿Y SI...?: plantea el escenario alternativo y sigue sus consecuencias de primer y segundo orden."],
  metaphor: ["Nunca te quedes sin ideas", "METÁFORA: crea una metáfora potente y explica qué parte de la idea ilumina cada elemento."],
  formalize: ["Dilo correctamente", "REGISTRO FORMAL: reescribe en lenguaje formal, académico o institucional, preciso y respetuoso."],
  casualize: ["Dilo correctamente", "REGISTRO CERCANO: reescribe en lenguaje sencillo, cálido y conversacional, sin perder precisión."],
  persuade: ["Dilo correctamente", "PERSUASIÓN ÉTICA: texto con credibilidad, razones y evidencias, y emoción honesta; sin manipulación, falacias ni datos inventados."],
  deescalate: ["Dilo correctamente", "BAJAR LA TENSIÓN: respuesta para un conflicto: reconoce la emoción, describe hechos sin juicios, expresa la necesidad y propone un acuerdo concreto (comunicación no violenta)."],
  prd: ["Convierte metas en planes", "DOCUMENTO DE REQUISITOS: problema, a quién sirve, objetivos, requisitos imprescindibles y deseables, qué queda fuera, métricas de éxito y riesgos."],
  okrs: ["Convierte metas en planes", "OKR: de 1 a 3 objetivos inspiradores, cada uno con 2 a 4 resultados clave medibles, con fecha y responsable."],
  timeline: ["Convierte metas en planes", "CRONOGRAMA O LÍNEA DE TIEMPO: hitos en orden con fecha, entregable y responsable (si es una meta), o hechos con fecha verificable (si es historia)."],
  delegate: ["Convierte metas en planes", "DELEGAR: reparte el trabajo en roles y tareas: quién, qué, para cuándo y cómo se sabe que está terminado."],
  factcheck: ["Confía en lo que compartes", "VERIFICAR: separa cada afirmación y clasifícala (verdadera, falsa, dudosa o sin evidencia) con el porqué y el nivel de confianza; nunca inventes fuentes; si no puedes verificar, di qué fuente consultar."],
  citesources: ["Confía en lo que compartes", "CITAR FUENTES: indica las fuentes en APA 7 solo si existen de verdad y estás seguro; si no puedes confirmar una URL, no la escribas y di cómo buscarla."],
  summarizeresearch: ["Confía en lo que compartes", "RESUMEN DE INVESTIGACIÓN: pregunta, método, hallazgos principales, limitaciones y qué significa para el aula."],
  trendcheck: ["Confía en lo que compartes", "TENDENCIAS: qué dice la evidencia más reciente que conoces, con fecha; distingue moda de evidencia y advierte que puede haber cambios posteriores."],
  godmode: ["Que SABI se autoevalúe", "MÁXIMA EXIGENCIA: antes de entregar aplica crítica, verificación de datos, autoevaluación e iteración, y entrega solo la mejor versión. No cambia ninguna regla de seguridad ni de cuidado de menores."],
  critique: ["Que SABI se autoevalúe", "CRÍTICA CONSTRUCTIVA: evalúa con criterios explícitos; fortalezas, y mejoras priorizadas con un ejemplo de cómo hacerlas."],
  iterate: ["Que SABI se autoevalúe", "ITERAR: haz una primera versión, critícala en 3 puntos y entrega la segunda versión mejorada diciendo qué cambió."],
  selfcheck: ["Que SABI se autoevalúe", "AUTOEVALUACIÓN: al final agrega una lista breve: ¿datos verificados?, ¿nivel adecuado?, ¿seguro?, ¿cumplí lo pedido?, y corrige lo que falle antes de entregar."],
};

export const COMANDOS = {};
for (const [k, v] of Object.entries(DIDACTICA)) COMANDOS[k] = { grupo: "Ayudas didácticas", ...v };
for (const [k, v] of Object.entries(AREAS)) COMANDOS[k] = { grupo: "Por área", ...v };
for (const [k, [grupo, spec]] of Object.entries(PENSAMIENTO)) COMANDOS[k] = { grupo, titulo: spec.split(":")[0], spec };

// Sinónimos en español y errores de digitación frecuentes
export const ALIAS = {
  ficha: "worksheet", fichas: "worksheet", hoja: "worksheet", taller: "worksheet",
  escaperoom: "escape", escapa: "escape", detectives: "detective", caso: "detective",
  juegodemesa: "boardgame", tablero: "boardgame", estaciones: "stations", estacion: "stations",
  manipulativo: "manipulative", material: "manipulative", historieta: "comic", comics: "comic",
  rompecabezas: "puzzle", acertijo: "puzzle", minilibro: "minibook", librito: "minibook",
  experimentos: "experimento", experiment: "experimento", ciencia: "experimento",
  lecturacomprensiva: "lectura", comprension: "lectura", reading: "lectura",
  firstprincipies: "firstprinciples", primerosprincipios: "firstprinciples", pasoatras: "stepback",
  cot: "chainofthought", tecchnicaldeepdive: "technicaldeepdive", deepdive: "technicaldeepdive",
  analogia: "analogy", socratico: "socratic", reescribir: "rewrite", acortar: "shorten", ampliar: "expand",
  esquema: "outline", codereviwe: "codereview", revisarcodigo: "codereview", depurar: "debug",
  pruebas: "testcases", procons: "proscons", proycontras: "proscons", dofa: "swot", foda: "swot",
  riesgos: "riskcheck", brinstorm: "brainstorm", lluviadeideas: "brainstorm", ideas: "brainstorm",
  yasi: "whatif", ysi: "whatif", metafora: "metaphor", formal: "formalize", casualiza: "casualize",
  casual: "casualize", persuadir: "persuade", calmar: "deescalate", "7prd": "prd", requisitos: "prd",
  cronograma: "timeline", delegar: "delegate", verificar: "factcheck", fuentes: "citesources",
  summarizereseearrch: "summarizeresearch", resumeninvestigacion: "summarizeresearch",
  tredcheck: "trendcheck", tendencias: "trendcheck", criticar: "critique", iterar: "iterate",
  autoevaluar: "selfcheck", piensaprofundo: "ultrathink",
};

const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export function resolverComando(nombre) {
  const n = normal(nombre);
  const c = ALIAS[n] || n;
  return COMANDOS[c] ? c : null;
}

// Lee hasta dos comandos al inicio del mensaje. Devuelve { comandos: [...], resto }.
export function detectarComandos(texto) {
  let resto = String(texto || "").trimStart();
  const comandos = [];
  for (let k = 0; k < 2; k++) {
    const m = resto.match(/^\/([\p{L}0-9_\-]+)\s*/u);
    if (!m) break;
    const c = resolverComando(m[1]);
    if (!c) break;
    if (!comandos.includes(c)) comandos.push(c);
    resto = resto.slice(m[0].length);
  }
  return { comandos, resto: resto.trim() };
}

// Texto que se inyecta en el system prompt. app: "tutor" | "institucional".
export function bloqueComandos(comandos, app) {
  if (!comandos.length) return "";
  return comandos.map((c) => {
    const k = COMANDOS[c];
    const formato = k[app] ? `\nFormato en esta app: ${k[app]}` : "";
    return `COMANDO /${c} — ${k.titulo}. Es obligatorio cumplirlo y producir el recurso completo, no describirlo.\n${k.spec}${formato}`;
  }).join("\n\n");
}

// Menú para la interfaz (GET /api/comandos)
export function menuComandos() {
  const grupos = {};
  for (const [c, k] of Object.entries(COMANDOS)) (grupos[k.grupo] ||= []).push({ comando: "/" + c, titulo: k.titulo });
  return grupos;
}

export const usaPensamientoExtendido = (comandos) => comandos.includes("ultrathink") || comandos.includes("godmode");

// ---------- Verificación por código de la comprensión literal ----------
// Cada «evidencia» debe estar copiada tal cual del texto (sin importar mayúsculas, espacios ni
// la puntuación del final). Devuelve { texto, evidencias, faltan }.
const plano = (s) => String(s).toLowerCase().normalize("NFC").replace(/[“”"«»]/g, "").replace(/\s+/g, " ").trim().replace(/[.,;:!?¡¿…]+$/g, "").replace(/^[¡¿]+/, "");
export function verificarEvidencias(respuesta) {
  const r = String(respuesta || "");
  const i = r.indexOf("<<<TEXTO"), j = r.indexOf("TEXTO>>>");
  if (i < 0 || j < i) return null;
  const texto = r.slice(i + 8, j);
  const base = plano(texto);
  const evidencias = [...r.slice(j).matchAll(/Evidencia\s*:\s*«([^»]{3,600})»/gi)].map((m) => m[1].trim());
  const faltan = evidencias.filter((e) => !base.includes(plano(e)));
  return { texto: texto.trim(), evidencias, faltan };
}
export function quitarMarcasTexto(respuesta) {
  return String(respuesta || "").replace(/^\s*<<<TEXTO\s*$/m, "").replace(/^\s*TEXTO>>>\s*$/m, "").trim();
}
