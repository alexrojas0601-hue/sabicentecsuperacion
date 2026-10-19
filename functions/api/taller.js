// ============================================================================
// Cloudflare Pages Function: /api/taller
// TALLER DE APRENDIZAJE SABI · didácticas por comando, lecturas de 7 niveles y modos de pensamiento
//
// Cada recurso pasa por tres filtros antes de llegar al niño o al docente:
//   1. Dot tutor del área (Maestro): PRODUCE el recurso como JSON imprimible (no lo describe).
//   2. Auditor de código: valida la estructura (campos, cantidades, evidencias literales en el texto).
//   3. Dot_Auditor_Riguroso (Claude): resuelve por su cuenta, revisa veracidad, edad, seguridad,
//      aprendizaje significativo y sello SABI; si falla, entrega la versión corregida.
//
// POST { modo: "didactica"|"lectura"|"pensar", comando, grado, area, tema, texto, audiencia }
// GET  → catálogo de comandos (lo usa taller.html y el Dot Vigía).
// Variables: ANTHROPIC_API_KEY · MODELO_TALLER · MODELO_AUDITOR · AUDITOR="no" para apagarlo.
// ============================================================================

const VERSION = "1.0.0 (2026-10-16)";
const ORIGENES = [
  "https://superacion.sabicentec.com", "https://sabicentec.com", "https://www.sabicentec.com",
  "https://ai.sabicentec.com", "https://familiamaestros.sabicentec.com", "https://areas.sabicentec.com",
  "https://pedagogia.sabicentec.com", "https://sabicentecsuperacion.pages.dev",
];
const origenValido = (o) => ORIGENES.includes(o) || /^https:\/\/[a-z0-9-]+\.sabicentecsuperacion\.pages\.dev$/.test(o);
function cors(request) {
  const o = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": origenValido(o) ? o : ORIGENES[0],
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  };
}
const json = (request, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", ...cors(request) } });
export async function onRequestOptions({ request }) { return new Response(null, { status: 204, headers: cors(request) }); }

const limpiar = (x, n) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const sinTildes = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// ---------------------------------------------------------------------------
// 1. DIDÁCTICAS (ayudas para un aprendizaje divertido y significativo)
// ---------------------------------------------------------------------------
export const DIDACTICAS = {
  worksheet: {
    nombre: "Ficha de trabajo", para: "Practicar con variedad y retroalimentación inmediata",
    esquema: '{"titulo":"","objetivo":"desempeño observable","idea":"situación motivadora que abre la ficha (una buena ficha empieza con una buena idea)","instrucciones":"","secciones":[{"titulo":"","tipo":"completar|unir|verdadero_falso|respuesta_corta|seleccion|problema|dibujar","items":[{"enunciado":"","opciones":["solo si es seleccion o unir"],"respuesta":"","explicacion":"el porqué"}]}],"reto_final":"pregunta de nivel alto","autoevaluacion":["3 frases: Puedo..."]}',
    reglas: "3 a 4 secciones de tipos distintos, 3 a 6 ítems cada una, dificultad creciente (recordar, comprender, aplicar, analizar). Variación, nunca ítems idénticos.",
    validar: (r) => arr(r.secciones, 2) && r.secciones.every((s) => arr(s.items, 2) && s.items.every((i) => txt(i.enunciado) && txt(i.respuesta))),
  },
  escape: {
    nombre: "Escape room de aula", para: "Resolver retos encadenados con trabajo en equipo",
    esquema: '{"titulo":"","historia":"narrativa de 3-5 frases que engancha","mision":"","tiempo_min":30,"equipos":"cómo se organizan y roles","materiales":[""],"candados":[{"n":1,"reto":"reto del tema que exige pensar","pista":"pista que no regala la respuesta","respuesta":"","clave":"un dígito o letra que entrega este candado"}],"codigo_final":"unión de las claves en orden","cierre":"pregunta de metacognición: qué estrategia les funcionó"}',
    reglas: "4 a 6 candados del tema, de dificultad creciente; cada candado entrega una clave; codigo_final es exactamente la concatenación de las claves en orden.",
    validar: (r) => arr(r.candados, 3) && r.candados.every((c) => txt(c.reto) && txt(c.respuesta) && txt(c.clave)) && sinTildes(String(r.codigo_final).replace(/[\s-]/g, "")) === sinTildes(r.candados.map((c) => String(c.clave).trim()).join("")),
  },
  detective: {
    nombre: "Caso para detectives", para: "Razonar con evidencia: deducir, inferir y descartar hipótesis",
    esquema: '{"titulo":"","caso":"el misterio en 4-6 frases, situado en Cali o el colegio","pregunta_del_caso":"","hipotesis":["3 o 4 explicaciones posibles"],"pistas":[{"n":1,"tipo":"dato|testimonio|evidencia|experimento","pista":""}],"preguntas_guia":["3 preguntas que llevan a usar el concepto"],"solucion":"hipótesis correcta","razonamiento":["cadena lógica paso a paso: pista → inferencia → descarte"],"concepto":"el contenido del tema que resolvió el caso"}',
    reglas: "6 a 9 pistas; al menos una pista engañosa que se descarta con el concepto; la solución solo se alcanza aplicando el contenido del tema, no por adivinanza.",
    validar: (r) => arr(r.pistas, 5) && arr(r.hipotesis, 2) && arr(r.razonamiento, 2) && txt(r.solucion),
  },
  boardgame: {
    nombre: "Juego de mesa", para: "Repasar y aplicar jugando, con reglas que obligan a pensar",
    esquema: '{"titulo":"","objetivo":"","jugadores":"2 a 4","materiales":["dado, fichas, tarjetas recortables"],"casillas":30,"especiales":[{"casilla":5,"tipo":"reto|avanza|retrocede|comodin","efecto":""}],"reglas":[""],"tarjetas":[{"nivel":1,"pregunta":"","respuesta":""}],"como_gana":"","reflexion":"pregunta al terminar"}',
    reglas: "20 a 36 casillas; 6 a 10 casillas especiales; 15 a 24 tarjetas en 3 niveles. Nada de azar puro: para avanzar en casillas de reto hay que responder bien. Sin rankings que humillen.",
    validar: (r) => Number(r.casillas) >= 12 && Number(r.casillas) <= 60 && arr(r.tarjetas, 10) && arr(r.reglas, 3) && arr(r.especiales, 3),
  },
  stations: {
    nombre: "Estaciones de aprendizaje", para: "Rotar por experiencias distintas del mismo tema (ver, hacer, crear, explicar)",
    esquema: '{"titulo":"","tiempo_por_estacion":12,"rotacion":"cómo rotan los grupos","estaciones":[{"n":1,"nombre":"","modalidad":"manipular|leer|crear|digital|juego|experimento|explicar","proposito":"","materiales":[""],"instrucciones":[""],"producto":"evidencia que deja el grupo","pregunta":"pregunta de comprensión"}],"cierre":"plenaria: cómo se conectan las estaciones"}',
    reglas: "4 a 6 estaciones con modalidades distintas (al menos una de manipular y una de explicar a otros). Cada estación deja un producto visible.",
    validar: (r) => arr(r.estaciones, 3) && r.estaciones.every((e) => arr(e.instrucciones, 1) && txt(e.producto)),
  },
  manipulative: {
    nombre: "Material manipulativo", para: "Ir de lo concreto a lo pictórico y a lo abstracto (CPA)",
    esquema: '{"titulo":"","concepto":"","material":"qué se construye","materiales":["papel, cartón, tapas, palitos..."],"plantilla":"cómo dibujar o recortar las piezas, con medidas en cm","construccion":[""],"actividades":[{"n":1,"consigna":"","que_observar":"","pregunta":""}],"concreto_pictorico_abstracto":{"concreto":"","pictorico":"","abstracto":"notación o regla a la que se llega"}}',
    reglas: "Materiales de bajo costo; 3 a 5 actividades progresivas; medidas coherentes; seguridad con tijeras para los pequeños (adulto corta).",
    validar: (r) => arr(r.construccion, 2) && arr(r.actividades, 2) && r.concreto_pictorico_abstracto && txt(r.concreto_pictorico_abstracto.abstracto),
  },
  comic: {
    nombre: "Historieta", para: "Enseñar el concepto o un dilema de valores con una historia",
    esquema: '{"titulo":"","personajes":[{"nombre":"","rasgo":""}],"vinetas":[{"escena":"lo que se ve, en una frase","dialogos":[{"personaje":"","texto":"máximo 18 palabras"}]}],"pregunta_final":"","concepto":""}',
    reglas: "5 a 8 viñetas. El concepto del tema se explica DENTRO de la historia (no al margen) y es científicamente correcto. Un personaje se equivoca y otro le ayuda a corregir.",
    validar: (r) => arr(r.vinetas, 4) && r.vinetas.every((v) => txt(v.escena) && arr(v.dialogos, 1)),
  },
  lapbook: {
    nombre: "Lapbook", para: "Organizar un tema en una carpeta con solapas, bolsillos y minilibros",
    esquema: '{"titulo":"","tema_central":"","piezas":[{"tipo":"solapa|bolsillo|acordeon|rueda|minilibro|tarjetas|sobre","titulo":"","frente":"lo que se ve por fuera (pregunta o palabra)","dentro":"lo que se descubre al abrir (respuesta, dibujo, ejemplo)"}],"armado":[""],"evaluacion":"cómo se presenta y qué se valora"}',
    reglas: "8 a 12 piezas de al menos 4 tipos distintos; cubren definición, partes, ejemplos, contraejemplo, vocabulario, aplicación en la vida y una pregunta propia del estudiante.",
    validar: (r) => arr(r.piezas, 6) && new Set(r.piezas.map((p) => p.tipo)).size >= 3,
  },
  puzzle: {
    nombre: "Acertijos y rompecabezas", para: "Fijar vocabulario y conceptos con sopa de letras, parejas, criptograma y anagramas",
    esquema: '{"titulo":"","palabras":[{"palabra":"UNA SOLA PALABRA, MAYÚSCULAS, SIN TILDES, 3 A 12 LETRAS","pista":"definición o pista de razonamiento"}],"frase_secreta":"frase corta del tema, sin tildes, para el criptograma","parejas":[{"a":"concepto","b":"definición, ejemplo o resultado"}],"acertijo":{"enunciado":"un acertijo lógico del tema","respuesta":"","explicacion":""}}',
    reglas: "8 a 12 palabras; 6 a 8 parejas; la app arma la sopa, el criptograma y los anagramas.",
    validar: (r) => arr(r.palabras, 6) && r.palabras.every((p) => /^[A-ZÑ]{3,12}$/.test(String(p.palabra))) && arr(r.parejas, 4) && txt(r.frase_secreta),
  },
  minibook: {
    nombre: "Minilibro de una hoja", para: "Escribir y dibujar un libro de 8 páginas que se dobla de una sola hoja",
    esquema: '{"titulo":"","autor":"Escrito por: ________","paginas":[{"n":1,"titulo":"","texto":"máximo 35 palabras","dibujo":"qué debe dibujar el estudiante"}]}',
    reglas: "Exactamente 8 páginas: 1 portada, 2 a 7 contenido con secuencia lógica (qué es, partes, cómo funciona, ejemplo, error común, para qué me sirve), 8 contraportada con una pregunta para el lector.",
    validar: (r) => Array.isArray(r.paginas) && r.paginas.length === 8 && r.paginas.every((p) => txt(p.titulo)),
  },
};
const ALIAS_DID = { ficha: "worksheet", hoja: "worksheet", escaperoom: "escape", detectives: "detective", juego: "boardgame", tablero: "boardgame", estaciones: "stations", manipulativo: "manipulative", comics: "comic", historieta: "comic", rompecabezas: "puzzle", acertijo: "puzzle", minilibro: "minibook" };

// ---------------------------------------------------------------------------
// 2. MODOS DE PENSAMIENTO (para docentes, directivos y estudiantes de 9° a 11°)
// Son instrucciones de trabajo para el modelo: cambian CÓMO razona y entrega, no lo que es verdad.
// ---------------------------------------------------------------------------
export const PENSAR = {
  // Razona con mayor agudeza
  ultrathink: ["Razonar con agudeza", "Piensa a fondo antes de responder: define el problema, separa lo conocido de lo supuesto, explora al menos tres enfoques, elige uno con razones y verifica el resultado con una prueba independiente. Muestra el razonamiento resumido y la conclusión."],
  stepback: ["Razonar con agudeza", "Da un paso atrás: antes del detalle, formula la pregunta más general que hay detrás, los principios que la gobiernan y luego vuelve al caso concreto con esa perspectiva."],
  firstprinciples: ["Razonar con agudeza", "Pensamiento desde primeros principios: descompón el asunto en verdades básicas comprobables, descarta las suposiciones heredadas y reconstruye la solución desde cero."],
  chainofthought: ["Razonar con agudeza", "Cadena de razonamiento explícita: numera cada paso lógico, justifica por qué se sigue del anterior y marca dónde podría fallar."],
  // Aprende cualquier cosa rápido
  eli5: ["Aprender rápido", "Explícalo como a un niño de 5 años (o de Transición): palabras sencillas, una imagen mental cotidiana de Cali, una sola idea por frase, sin perder la verdad científica."],
  technicaldeepdive: ["Aprender rápido", "Inmersión técnica: definiciones formales, mecanismo, fórmulas con unidades, casos límite, errores típicos y referencias de dónde profundizar."],
  analogy: ["Aprender rápido", "Explica con dos analogías distintas, señala hasta dónde sirve cada una y dónde se rompe (todo modelo tiene límites)."],
  socratic: ["Aprender rápido", "Método socrático: no des la respuesta; guía con preguntas cortas, una a la vez, que lleven a la persona a construirla. Termina pidiendo que la formule con sus palabras."],
  // Escríbelo una vez y bien
  rewrite: ["Escribir bien", "Reescribe el texto más claro, correcto y con mejor estructura, conservando la intención. Entrega la versión final y una lista breve de los cambios importantes."],
  shorten: ["Escribir bien", "Acorta el texto a la mitad o menos sin perder ninguna idea esencial."],
  expand: ["Escribir bien", "Amplía el texto con explicación, ejemplos y transiciones, sin relleno."],
  outline: ["Escribir bien", "Entrega un esquema jerárquico (títulos, subtítulos e ideas clave) listo para desarrollar."],
  // Código con confianza
  codereview: ["Código con confianza", "Revisión de código: correctitud, seguridad, legibilidad, rendimiento y pruebas; prioriza los hallazgos de mayor a menor gravedad con la corrección sugerida."],
  debug: ["Código con confianza", "Depuración: reproduce mentalmente el fallo, plantea hipótesis de causa ordenadas por probabilidad, propone cómo comprobar cada una y la corrección mínima."],
  refactor: ["Código con confianza", "Refactoriza sin cambiar el comportamiento: nombres claros, funciones pequeñas, sin duplicación; explica cada cambio."],
  testcases: ["Código con confianza", "Diseña casos de prueba: normales, de borde, de error y de regresión, con entrada y salida esperada."],
  // Decide con datos
  procons: ["Decidir con datos", "Pros y contras ponderados: tabla con peso de 1 a 5 por criterio, evidencia de cada punto y recomendación razonada."],
  swot: ["Decidir con datos", "Análisis DOFA (fortalezas, oportunidades, debilidades, amenazas) con acciones concretas que crucen los cuadrantes (FO, DO, FA, DA)."],
  riskcheck: ["Decidir con datos", "Matriz de riesgos: probabilidad, impacto, señal temprana y mitigación de cada riesgo."],
  premortem: ["Decidir con datos", "Premortem: imagina que dentro de un año el plan fracasó; enumera las causas más probables y cómo prevenir cada una hoy."],
  // Nunca te quedes sin ideas
  brainstorm: ["Generar ideas", "Lluvia de ideas: 15 ideas variadas (seguras, audaces y locas), agrúpalas y destaca las 3 más prometedoras con por qué."],
  remix: ["Generar ideas", "Remezcla: combina la idea con otras áreas, formatos o públicos para obtener 5 variantes nuevas."],
  whatif: ["Generar ideas", "¿Y si...?: plantea 5 escenarios alternativos y sus consecuencias en cadena."],
  metaphor: ["Generar ideas", "Crea 3 metáforas potentes que hagan memorable la idea y explica qué ilumina cada una."],
  // Dilo correctamente siempre
  formalize: ["Comunicar bien", "Pásalo a registro formal institucional, cortés y preciso."],
  casualize: ["Comunicar bien", "Pásalo a registro cercano y sencillo, respetuoso, para familias o estudiantes."],
  persuade: ["Comunicar bien", "Persuasión ética: argumentos con evidencia, beneficio para quien escucha y respuesta a objeciones. Nunca manipulación, presión ni datos falsos."],
  deescalate: ["Comunicar bien", "Desescalar un conflicto: valida la emoción, describe hechos sin culpar, propone un siguiente paso concreto y un acuerdo. Tono sereno."],
  // Convierte metas en planes reales
  prd: ["Metas a planes", "Documento de requerimientos (PRD): problema, usuarios, objetivos, alcance y fuera de alcance, requisitos, métricas de éxito, riesgos y cronograma."],
  okrs: ["Metas a planes", "OKR: 1 a 3 objetivos inspiradores con 3 resultados clave medibles cada uno (número, plazo, responsable)."],
  timeline: ["Metas a planes", "Cronograma: fases, hitos, fechas relativas, dependencias y responsables, en tabla."],
  delegate: ["Metas a planes", "Plan de delegación: tareas, quién (perfil), qué entrega, para cuándo, con qué autonomía y cómo se revisa."],
  // Confía en lo que compartes
  factcheck: ["Verificar", "Verifica cada afirmación: clasifícala como comprobada, probable, dudosa o falsa, con la razón y qué fuente oficial la confirmaría. Nunca inventes fuentes."],
  citesources: ["Verificar", "Indica qué tipo de fuente respalda cada dato (MEN, ICFES, DANE, artículo científico revisado por pares, libro de texto) y cómo citarla en APA 7. Si no tienes certeza de una fuente exacta, dilo; no inventes URL ni autores."],
  summarizeresearch: ["Verificar", "Resume la investigación: pregunta, método, muestra, hallazgos, limitaciones y qué significa para el aula."],
  trendcheck: ["Verificar", "Revisa si una tendencia es sólida o moda: evidencia, quién la impulsa, intereses, horizonte de tiempo y recomendación prudente."],
  // Autoevaluación del modelo
  godmode: ["Autoevaluarse", "Máxima exigencia: planifica, ejecuta, critica tu propia respuesta con 5 criterios (veracidad, profundidad, claridad, utilidad, seguridad), corrige y entrega solo la versión mejorada."],
  critique: ["Autoevaluarse", "Crítica honesta: fortalezas, debilidades, errores y cómo mejorar, sin halagos vacíos."],
  iterate: ["Autoevaluarse", "Itera: produce una versión 1, evalúala, y entrega versión 2 y versión 3 mejoradas explicando qué cambió."],
  selfcheck: ["Autoevaluarse", "Autocomprobación: antes de entregar, verifica cálculos, datos, coherencia y que respondiste exactamente lo pedido; reporta qué comprobaste."],
};
const ALIAS_PENSAR = { tecchnicaldeepdive: "technicaldeepdive", firstprincipies: "firstprinciples", codereviwe: "codereview", brinstorm: "brainstorm", casualiza: "casualize", tredcheck: "trendcheck", summarizereseearrch: "summarizeresearch", "7prd": "prd", outine: "outline" };

// ---------------------------------------------------------------------------
// 3. LECTURA: "Leer es comprender, relacionar y pensar" (7 secciones)
// ---------------------------------------------------------------------------
const ESQUEMA_LECTURA = `{"titulo":"","tipologia":"","parrafos":["2 a 7 párrafos"],
"literal":[{"pregunta":"","evidencia":"copia EXACTA de la oración o frase del texto que la responde","parrafo":1}],
"entre_lineas":[{"pregunta":"inferencia","pista":"","respuesta_modelo":""}],
"palabras_contexto":[{"palabra":"tal como aparece en el texto","pregunta":"","opciones":["","",""],"correcta":0,"explicacion":""}],
"donde_lo_pone":[{"pregunta":"¿En qué párrafo se dice...?","parrafo":1,"explicacion":""}],
"orden_causas":{"secuencia":["hechos en orden"],"causa_efecto":[{"causa":"","efecto":""}]},
"piensa_argumenta":[{"pregunta":"","criterios":""}],"valor":""}`;
const REGLAS_LECTURA = `Secciones: (1) LO QUE DICE EL TEXTO: exactamente 4 preguntas literales cuya respuesta está escrita en el texto; "evidencia" es la oración o frase copiada carácter por carácter. (2) LEER ENTRE LÍNEAS: 2 o 3 inferencias. (3) PALABRAS EN CONTEXTO: 2 a 4 palabras del texto con 3 opciones. (4) ¿DÓNDE LO PONE?: 2 o 3 preguntas de localizar el párrafo. (5) ORDEN Y CAUSAS: secuencia de 3 a 5 hechos y 1 a 3 relaciones causa-efecto. (6) PIENSA Y ARGUMENTA: 2 preguntas críticas con criterios de una buena respuesta. (7) valor para conversar.
Longitud del texto por grado: Transición-1° 60-110 palabras; 2°-3° 120-200; 4°-5° 200-320; 6°-8° 320-480; 9°-11° 450-650. Si se entrega un texto, úsalo tal cual (no lo cambies) y divídelo en párrafos; si se entrega un tema, escribe un texto ORIGINAL.`;

function validarLectura(r) {
  const f = [];
  if (!arr(r.parrafos, 1)) return ["sin párrafos"];
  const todo = r.parrafos.join(" ");
  if (!Array.isArray(r.literal) || r.literal.length !== 4) f.push("deben ser exactamente 4 preguntas literales");
  (r.literal || []).forEach((q, i) => {
    const p = r.parrafos[(Number(q.parrafo) || 0) - 1] || "";
    if (!txt(q.evidencia) || !(p.includes(q.evidencia) || todo.includes(q.evidencia))) f.push(`la evidencia literal ${i + 1} no está copiada exactamente del texto`);
  });
  (r.palabras_contexto || []).forEach((w, i) => {
    if (!sinTildes(todo).includes(sinTildes(w.palabra))) f.push(`la palabra en contexto ${i + 1} ("${w.palabra}") no aparece en el texto`);
    if (!Array.isArray(w.opciones) || !(w.correcta >= 0 && w.correcta < w.opciones.length)) f.push(`opciones inválidas en palabra ${i + 1}`);
  });
  (r.donde_lo_pone || []).forEach((d, i) => { if (!(d.parrafo >= 1 && d.parrafo <= r.parrafos.length)) f.push(`párrafo fuera de rango en ¿dónde lo pone? ${i + 1}`); });
  if (!arr(r.entre_lineas, 2)) f.push("faltan inferencias");
  if (!r.orden_causas || !arr(r.orden_causas.secuencia, 3)) f.push("falta la secuencia");
  if (!arr(r.piensa_argumenta, 2)) f.push("faltan preguntas críticas");
  return f;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function arr(x, min = 1) { return Array.isArray(x) && x.length >= min; }
function txt(x) { return typeof x === "string" ? x.trim().length > 0 : typeof x === "number"; }
function extraerJSON(t) {
  const s = String(t || "");
  const i = s.indexOf("{"), j = s.lastIndexOf("}");
  if (i < 0 || j < i) throw new Error("sin JSON");
  return JSON.parse(s.slice(i, j + 1));
}
async function claude(env, { model, system, content, max_tokens }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens, system, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return { texto: (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim(), cortado: d.stop_reason === "max_tokens" };
}
function gradoTexto(g) { const n = Number(g); return n === 0 ? "Transición (5 años)" : Number.isFinite(n) && n >= 1 && n <= 11 ? `grado ${n}°` : "grado no indicado"; }

const SELLO = `Eres un Dot tutor de SABI, el ecosistema educativo del Colegio CENTEC (Ciudad Córdoba, Cali, Colombia).
Produces recursos didácticos REALES y listos para imprimir o jugar, no descripciones de recursos.
Sello SABI: pedagógico (aprendizaje significativo, neuroeducación, niveles de pensamiento de Bloom, de lo
concreto a lo abstracto), científico (nada inventado: ni datos, ni citas, ni códigos de DBA), alineado con
los DBA y Estándares Básicos de Competencias del MEN para el grado, contexto de Cali y Colombia (pesos
colombianos, barrio, frutas del Valle, el MIO, el río Cauca), cero sesgo político, seguro para menores,
lenguaje adecuado a la edad, español de Colombia sin emojis. Divertido con propósito: el juego siempre sirve
al aprendizaje y cierra con reflexión. Formación en valores con naturalidad, sin sermones.`;

const PROMPT_AUDITOR = `Eres el Dot_Auditor_Riguroso del Taller SABI (Colegio CENTEC, Cali). Recibes un recurso didáctico en JSON.
Primero resuelve tú mismo cada reto, pregunta y respuesta. Luego revisa: (1) veracidad y respuestas correctas,
(2) adecuación a la edad y al grado, (3) alineación con lo que pide el MEN para ese grado, (4) que obligue a
pensar y no solo a memorizar, (5) seguridad de menores (materiales, tijeras, calor, nada riesgoso), (6) que
cumpla la estructura y las reglas indicadas, (7) estilo: claro, sin emojis, español correcto.
Responde SOLO un JSON: {"aprobado":true|false,"fallas":["breves"],"recurso":null o el recurso COMPLETO corregido con la misma estructura}.
Si todo está bien, "recurso": null. Si hay cualquier error de contenido o respuesta, corrige y entrega el recurso completo.`;

async function producir(env, { system, content, validar, max_tokens = 6000 }) {
  const model = env.MODELO_TALLER || "claude-haiku-4-5-20251001";
  let ultimoError = "";
  for (let intento = 0; intento < 2; intento++) {
    const pedido = intento === 0 ? content : `${content}\n\nTU INTENTO ANTERIOR FALLÓ LA VALIDACIÓN AUTOMÁTICA: ${ultimoError}. Corrige y entrega el JSON completo.`;
    const { texto, cortado } = await claude(env, { model, system, content: pedido, max_tokens });
    try {
      const r = extraerJSON(texto);
      const fallas = validar(r);
      if (!fallas.length) return { recurso: r, intentos: intento + 1 };
      ultimoError = fallas.join("; ");
    } catch (e) { ultimoError = cortado ? "la respuesta quedó cortada: sé más conciso" : "el JSON no es válido"; }
  }
  throw new Error("validación: " + ultimoError);
}

async function auditar(env, contexto, recurso, validar) {
  if (env.AUDITOR === "no") return { recurso, auditoria: { revisada: false } };
  try {
    const { texto, cortado } = await claude(env, {
      model: env.MODELO_AUDITOR || "claude-haiku-4-5-20251001",
      system: [{ type: "text", text: PROMPT_AUDITOR }], max_tokens: 8000,
      content: `${contexto}\n\nRECURSO A AUDITAR:\n${JSON.stringify(recurso)}`,
    });
    const v = extraerJSON(texto);
    const fallas = Array.isArray(v.fallas) ? v.fallas.slice(0, 6) : [];
    if (v.aprobado === false && v.recurso && !cortado && !validar(v.recurso).length) {
      return { recurso: v.recurso, auditoria: { revisada: true, aprobado: false, corregida: true, fallas } };
    }
    return { recurso, auditoria: { revisada: true, aprobado: v.aprobado !== false, corregida: false, fallas } };
  } catch (e) {
    return { recurso, auditoria: { revisada: false, nota: "auditor no disponible" } };
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
export async function onRequestGet({ request }) {
  return json(request, {
    ok: true, servicio: "Taller de Aprendizaje SABI", version: VERSION,
    didacticas: Object.fromEntries(Object.entries(DIDACTICAS).map(([k, v]) => [k, { nombre: v.nombre, para: v.para }])),
    pensar: Object.fromEntries(Object.entries(PENSAR).map(([k, v]) => [k, { grupo: v[0], que_hace: v[1] }])),
    lectura: ["literal", "entre_lineas", "palabras_contexto", "donde_lo_pone", "orden_causas", "piensa_argumenta", "valor"],
  });
}

export async function onRequestPost({ request, env }) {
  const origen = request.headers.get("origin") || "";
  if (!origenValido(origen)) return json(request, { ok: false, error: "Origen no autorizado" }, 403);
  if (!env.ANTHROPIC_API_KEY) return json(request, { ok: false, error: "Falta la clave del servidor" }, 500);
  let b;
  try { b = await request.json(); } catch { return json(request, { ok: false, error: "Solicitud inválida" }, 400); }

  const modo = ["didactica", "lectura", "pensar"].includes(b.modo) ? b.modo : "didactica";
  const grado = limpiar(b.grado, 6);
  const area = limpiar(b.area, 60) || "general";
  const tema = limpiar(b.tema, 300);
  const texto = String(b.texto || "").trim().slice(0, 6000);
  const audiencia = ["estudiante", "docente", "familia", "directivo"].includes(b.audiencia) ? b.audiencia : "docente";
  const base = `Grado: ${gradoTexto(grado)}. Área: ${area}. Tema: ${tema || "(ver texto)"}. Quién lo usará: ${audiencia}.`;

  try {
    if (modo === "didactica") {
      let c = sinTildes(b.comando || "").replace(/^\//, "").trim();
      c = ALIAS_DID[c] || c;
      const d = DIDACTICAS[c];
      if (!d) return json(request, { ok: false, error: "Comando no reconocido", comandos: Object.keys(DIDACTICAS) }, 400);
      if (tema.length < 3) return json(request, { ok: false, error: "Escribe el tema" }, 400);
      const contexto = `${base}\nCOMANDO /${c} · ${d.nombre}: ${d.para}.\nREGLAS: ${d.reglas}\nESTRUCTURA JSON EXACTA: ${d.esquema}`;
      const validar = (r) => (d.validar(r) ? [] : ["no cumple la estructura o las cantidades de las reglas"]);
      const { recurso } = await producir(env, {
        system: [{ type: "text", text: SELLO }],
        content: `${contexto}\n\nProduce el recurso. Responde SOLO el JSON.`, validar,
      });
      const out = await auditar(env, contexto, recurso, validar);
      return json(request, { ok: true, version: VERSION, modo, comando: c, ...out });
    }

    if (modo === "lectura") {
      if (tema.length < 3 && texto.length < 60) return json(request, { ok: false, error: "Escribe un tema o pega un texto" }, 400);
      const contexto = `${base}\n${REGLAS_LECTURA}\nESTRUCTURA JSON EXACTA: ${ESQUEMA_LECTURA}` + (texto ? `\n\nTEXTO ENTREGADO (úsalo tal cual):\n${texto}` : "");
      const { recurso } = await producir(env, {
        system: [{ type: "text", text: SELLO + "\nEres el Dot_LecturaCritica_Lenguaje: leer es comprender, relacionar y pensar." }],
        content: `${contexto}\n\nProduce la lección de lectura. Responde SOLO el JSON.`, validar: validarLectura, max_tokens: 7000,
      });
      const out = await auditar(env, contexto, recurso, validarLectura);
      return json(request, { ok: true, version: VERSION, modo, ...out });
    }

    // modo pensar
    let c = sinTildes(b.comando || "").replace(/^\//, "").trim();
    c = ALIAS_PENSAR[c] || c;
    const p = PENSAR[c];
    if (!p) return json(request, { ok: false, error: "Modo de pensamiento no reconocido", comandos: Object.keys(PENSAR) }, 400);
    const entrada = texto || tema;
    if (entrada.length < 3) return json(request, { ok: false, error: "Escribe la situación, el texto o la pregunta" }, 400);
    const { texto: respuesta } = await claude(env, {
      model: env.MODELO_PENSAR || env.MODELO_TALLER || "claude-haiku-4-5-20251001",
      system: [{ type: "text", text: SELLO + "\nEn este modo atiendes a docentes y directivos (y a estudiantes de 9° a 11°). Formato: markdown con títulos ###, tablas cuando ayuden, sin emojis." }],
      content: `${base}\nMODO /${c} (${p[0]}): ${p[1]}\n\nENTRADA:\n${entrada}`, max_tokens: 4000,
    });
    return json(request, { ok: true, version: VERSION, modo, comando: c, respuesta });
  } catch (err) {
    return json(request, { ok: false, error: "No pude producir el recurso ahora. Intenta de nuevo.", detalle: String(err).slice(0, 240) }, 502);
  }
}
