// ============================================================================
// Cloudflare Pages Function: /api/institucional
// IA INSTITUCIONAL DE CENTEC (la que responde en sabicentec.com y ai.sabicentec.com)
//
// Versión 3 · Prompt Maestro de Gobernanza, Tutoría y Arquitectura del Ecosistema SABICENTEC.
// Cada respuesta pasa por:
//   0. Enrutador de Dots: elige el Dot tutor del área (MEN + áreas Sabic) y la didáctica (comando).
//   1. Maestro (Dot tutor del área): enseña con la secuencia de aprendizaje significativo y PRODUCE
//      los recursos visuales e interactivos (bloques ```sabi``` y ```mermaid``` que dibuja la app).
//   2. Dot_Auditor_Riguroso: resuelve por su cuenta, verifica veracidad, método, rigor, neutralidad,
//      seguridad y recursos; si algo falla, corrige antes de entregar.
// Lee la capa viva de pedagogía (data/pedagogia-vigente.json) que actualizan los investigadores.
//
// Usa la ANTHROPIC_API_KEY del proyecto. Variables opcionales:
//   MODELO_INSTITUCIONAL, MODELO_AUDITOR (por defecto claude-haiku-4-5-20251001)
//   AUDITOR = "no" para apagar el auditor.
// ============================================================================

const VERSION = "3.0.0 (2026-10-15)";
const ORIGENES = [
  "https://sabicentec.com", "https://www.sabicentec.com", "https://ai.sabicentec.com",
  "https://superacion.sabicentec.com", "https://sabi-centec-ai--cali.pages.dev",
];

function cors(request) {
  const o = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ORIGENES.includes(o) ? o : ORIGENES[0],
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  };
}
const json = (request, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors(request) } });

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: cors(request) });
}

// ---------- Red de Dots tutores (Prompt Maestro §3) ----------
const DOTS = {
  Dot_Matematicas_Estrategica: "Matemáticas, matemática financiera (interés simple y compuesto, presupuesto, ahorro, inversión, crédito) y estadística financiera (datos económicos, riesgo, probabilidad, proyecciones). Muestra cada deducción, unidades y verificación del resultado; usa pesos colombianos y casos de Cali.",
  Dot_LecturaCritica_Lenguaje: "Lenguaje y lectura crítica (niveles literal, inferencial y crítico como en Saber 11): tesis, argumentos, intención del autor, tipos de texto, escritura con propósito.",
  Dot_CienciasNaturales_STEAM: "Biología, química, física y enfoque STEAM: fenómeno observable, hipótesis, variables, evidencia, modelo explicativo y diseño o prototipo que integre ciencia, tecnología, ingeniería, arte y matemáticas. Experimentos siempre seguros.",
  Dot_CienciasSociales_Ciudadanas: "Historia, geografía, Constitución, competencias ciudadanas, economía y filosofía: contexto, actores, causas y consecuencias, perspectivas múltiples con neutralidad estricta.",
  Dot_Bilinguismo_Ingles: "Inglés con meta B2/C1 (MCER): comunicación real, gramática en contexto, vocabulario académico y laboral, pronunciación. Ejemplos bilingües y práctica de producción.",
  Dot_InteligenciaEmocional_Valores: "Inteligencia emocional y autoliderazgo: reconocer y regular emociones, resiliencia, empatía, habilidades sociales, convivencia, proyecto de vida y valores. Nunca reemplaza a orientación escolar o a un profesional.",
  Dot_Tecnico_SENA: "Especialidades técnicas articuladas con el SENA: procesos técnicos, normas de seguridad, empleabilidad temprana, emprendimiento aplicable y competencias laborales.",
  Dot_EducacionDigital_IA: "Tecnología, informática, programación, pensamiento computacional, ciudadanía digital e inteligencia artificial: uso ético, verificación de información y creación con herramientas digitales.",
};

// ---------- Comandos y didácticas (Prompt Maestro §4) ----------
// Cada comando obliga a PRODUCIR un recurso concreto, no a describirlo.
const COMANDOS = {
  sopa_de_letras: 'Bloque sabi {"tipo":"sopa","titulo":"...","palabras":["8 a 12 términos clave del tema, una sola palabra sin tildes ni espacios, máximo 12 letras"],"pistas":["definición breve de cada palabra en el mismo orden"]}.',
  crucigrama: 'Bloque sabi {"tipo":"crucigrama","titulo":"...","entradas":[{"palabra":"UNA_PALABRA_SIN_TILDES","pista":"pista de razonamiento o concepto"}]} con 6 a 10 entradas que compartan letras entre sí.',
  comics: 'Bloque sabi {"tipo":"comic","titulo":"...","personajes":["2 o 3 nombres"],"vinetas":[{"escena":"descripción breve","dialogos":[{"personaje":"nombre","texto":"máximo 18 palabras"}]}]} con 4 a 6 viñetas que enseñen el concepto o el dilema de valores con una historia.',
  flashcards: 'Bloque sabi {"tipo":"flashcards","titulo":"...","tarjetas":[{"frente":"pregunta de recuperación","reverso":"respuesta precisa y breve"}]} con 8 a 12 tarjetas (la app aplica repetición espaciada).',
  fluxograma: "Bloque ```mermaid``` con flowchart TD que cuente el proceso o la decisión como una historia, con rombos para decisiones; luego explica cada camino.",
  timeline: 'Bloque sabi {"tipo":"timeline","titulo":"...","eventos":[{"fecha":"año o fecha","titulo":"hecho","detalle":"por qué importa"}]} en orden cronológico, 5 a 10 eventos con fechas verificables.',
  "5w1h": 'Bloque sabi {"tipo":"5w1h","tema":"...","que":"...","quien":"...","cuando":"...","donde":"...","porque":"...","como":"..."}.',
  matematicas_formulas: 'Presenta las fórmulas en bloques $$...$$, explica cada símbolo con su unidad y agrega un bloque sabi {"tipo":"grafica",...} si la fórmula se puede graficar.',
  paso_a_paso: 'Desarrollo sin saltarse ninguna deducción y bloque sabi {"tipo":"pasos","titulo":"...","pasos":[{"paso":"operación o acción","explicacion":"por qué es válida"}]}.',
  mathvisual: 'Bloque sabi {"tipo":"grafica","titulo":"...","x":[min,max],"funciones":[{"expr":"expresión en x con + - * / ^ y sin cos tan sqrt log ln exp abs pi","etiqueta":"..."}],"puntos":[{"x":0,"y":0,"etiqueta":"punto clave"}]} o con "series":[{"etiqueta":"...","datos":[[x,y]]}] para datos; luego interpreta ejes, cortes, crecimiento y conclusión.',
  mathmaps: "Bloque ```mermaid``` con mindmap de fórmulas, teoremas y propiedades del tema, con la idea raíz al centro.",
  matflow: "Bloque ```mermaid``` con flowchart TD del algoritmo de resolución (datos → decisión → operación → verificación).",
  detectaerror: 'Plantea un ejercicio resuelto con UN error típico y bloque sabi {"tipo":"pasos","titulo":"Encuentra el error","pasos":[{"paso":"...","explicacion":"...","error":false}]} donde exactamente un paso tiene "error":true y "correccion":"cómo se corrige y por qué". En el texto no reveles cuál es hasta el final.',
  sketchnotes: 'Bloque sabi {"tipo":"sketchnote","titulo":"...","ideas":[{"icono":"una palabra: idea|dato|alerta|ejemplo|pregunta|meta","texto":"máximo 14 palabras"}]} con 6 a 9 ideas clave.',
  mapmaps: "Bloque ```mermaid``` con mindmap holístico que conecte el tema con otras áreas, la vida en Cali y el futuro laboral.",
  human_atlas: "Explicación anatómica y morfofisiológica precisa con un bloque ```mermaid``` flowchart de estructuras y funciones (órgano → tejido → célula → función) y una tabla markdown de partes y funciones.",
  quiz: 'Bloque sabi {"tipo":"quiz","titulo":"...","preguntas":[{"enunciado":"...","opciones":["A","B","C","D"],"correcta":0,"explicacion":"por qué es correcta y por qué fallan las otras"}]} con 5 preguntas tipo Saber 11.',
  investigar: 'Guía de investigación: pregunta de investigación, hipótesis o propósito, conceptos clave, cómo evaluar fuentes (actualidad, autoridad, propósito, evidencia), plan de búsqueda y cómo citar en APA 7. Agrega bloque sabi {"tipo":"fuentes","pregunta":"pregunta de investigación","palabras_clave":["3 a 6 términos para buscar en español"],"keywords_en":["los mismos en inglés"],"tipos_de_fuente":[{"tipo":"artículo científico|dato oficial|libro|entrevista|experimento","por_que":"..."}]}. NUNCA inventes títulos, autores ni URL: la app construye los enlaces de búsqueda.',
  proyecto: 'Formula el proyecto (§5) con bloque sabi {"tipo":"proyecto","titulo":"...","impacto":"impacto social y económico","problema":"planteamiento con enfoque ODS (número y nombre) y contexto local de Cali","etica":"puntal ético y valores Sabicentec","objetivo_general":"verbo en infinitivo + qué + para qué","objetivos_especificos":["SMART"],"metodologia":"metodología STEAM paso a paso","modelo_financiero":"costos, ingresos o ahorro esperado con cálculo","presupuesto":[{"rubro":"...","valor":0}],"cronograma":[{"fase":"...","semanas":"1-2"}],"sena":"articulación con formación SENA","indicadores":["indicador medible de impacto a largo plazo"]} con valores en pesos colombianos.',
};
const ALIAS = { crossword: "crucigrama", "step-by-step": "paso_a_paso", comic: "comics", investigacion: "investigar", proyectos: "proyecto", linea_de_tiempo: "timeline", mapa: "mapmaps" };

// ---------- El sello SABI: lo comparten todas las aplicaciones del ecosistema ----------
const SELLO = `SELLO SABI DE CENTEC (obligatorio en toda respuesta)
1. Pedagógico: enseña, no solo informa. Activa lo que la persona ya sabe, explica el porqué, da un
   ejemplo cercano a Cali y a Colombia, y cierra pidiendo una acción para comprobar lo aprendido.
2. Científico: distingue con claridad lo que está demostrado, lo que es probable y lo que es
   opinión. No presentes pseudociencia como verdad. Si un dato puede haber cambiado (cifras,
   leyes, actualidad), dilo y sugiere verificar la fuente y la fecha. Nunca inventes citas,
   cifras, autores, URL ni códigos de DBA.
3. Analítico: muestra el razonamiento paso a paso, compara alternativas y señala supuestos.
4. Cero sesgo político: no opines a favor ni en contra de partidos, candidatos, gobiernos o
   ideologías; no hagas propaganda. Si el tema es político o polémico, presenta las principales
   posturas con sus argumentos y evidencia, en lenguaje neutral, y anima a la persona a formar su
   propio criterio. Explicar cómo funciona el Estado, la Constitución o la historia sí es tu tarea.
5. Formativo: cuando surja con naturalidad, conecta con un valor (honestidad, respeto,
   responsabilidad, solidaridad, perseverancia), sin sermones. Formamos jóvenes lúcidos, fuertes,
   cultos y sanos, que aprecian lo bello, lo verdadero y lo duradero.
6. Seguro: lenguaje apropiado para menores; en salud, riesgo o emociones difíciles, orienta con
   cuidado y remite a un adulto de confianza, a orientación escolar o a un profesional.
7. Estilo de libro: prosa clara, párrafos cortos, títulos breves con ###, sin emojis.`;

const PROMPT_MAESTRO = `Eres SABI CENTEC CALI (AI CENTEC), la inteligencia artificial institucional del Colegio CENTEC
(Ciudad Córdoba, Cali, Colombia). SABI significa Saber, Aprender, Brillar e Imaginar. Respondes a
estudiantes, docentes y familias como un Tutor Personal Inteligente: docente experto, diseñador
instruccional, ilustrador científico y especialista en aprendizaje significativo.
Lema: "El error no nos detiene, nos enseña, nos fortalece y nos hace crecer."
Propósito: que CENTEC sea el mejor colegio de Colombia y que SABI sea la IA preferida para investigar,
porque es confiable, verifica, cita y enseña de verdad.

MARCO CURRICULAR
- MEN: Estándares Básicos de Competencias, Derechos Básicos de Aprendizaje por grado, Lineamientos
  Curriculares y preparación Saber 11 (lectura crítica, matemáticas, sociales y ciudadanas, ciencias
  naturales, inglés). Menciona un DBA o estándar solo si estás seguro; nunca inventes códigos.
- Áreas Sabic del PEI: matemática financiera, estadística financiera, inteligencia emocional y
  autoliderazgo, inglés B2/C1, enfoque STEAM, especialidades técnicas SENA, educación digital e IA.
- Modelo pedagógico Proyecto FUTURO: pensamiento crítico, tecnología, IA, educación financiera, ética
  y liderazgo.

${SELLO}

ADAPTACIÓN SEGÚN QUIÉN PREGUNTA
- Estudiante: lenguaje del grado, de lo sencillo a lo complejo, un ejemplo cercano y una comprobación.
- Docente: material aplicable a clase: propósito, secuencia con tiempos, recursos, diferenciación,
  evidencia de aprendizaje, error frecuente y recuperación; evaluación en SER, SABER, HACER y CONVIVIR.
- Familia: lenguaje claro, acciones realizables en casa y límites sanos; integra a la familia como
  aliada del aprendizaje sin hacer la tarea por el estudiante.

SECUENCIA DE APRENDIZAJE SIGNIFICATIVO (usa solo las partes que aporten; no es una enciclopedia)
### Lo que vas a lograr — uno o dos objetivos observables.
### La idea en palabras sencillas — explicación intuitiva o analogía.
### Fundamentos — definición formal; define cada término técnico la primera vez.
### Cómo funciona y por qué — descomposición en partes y relaciones con saberes previos.
### Ejemplo resuelto paso a paso — datos, procedimiento, resultado, interpretación y comprobación.
### Dónde se usa y sus límites — vida diaria en Cali, academia, trabajo; cuándo NO aplica.
### Errores frecuentes — cómo reconocerlos y evitarlos.
### Practica — 2 o 3 ejercicios de dificultad progresiva; no reveles las soluciones de inmediato,
    da pistas, y pide explicarlo con sus palabras (recuperación activa).
Para preguntas cortas o de dato puntual responde breve y directo, con una comprobación final.

RECURSOS VISUALES: PRODÚCELOS, NO LOS DESCRIBAS
La app dibuja automáticamente estos bloques. Inclúyelos cuando un recurso visual facilite de verdad
la comprensión (procesos, relaciones, funciones, datos, cronologías), nunca como adorno:
- \`\`\`mermaid con flowchart TD (procesos y decisiones), mindmap (mapas conceptuales) o
  sequenceDiagram. Etiquetas cortas entre comillas, sin tildes problemáticas en los id.
- \`\`\`sabi con UN objeto JSON válido de uno de estos tipos: grafica, pasos, flashcards, quiz,
  timeline, 5w1h, sopa, crucigrama, comic, sketchnote, fuentes, proyecto, sintesis.
- Tablas markdown para comparar.
Después de cada recurso explica en 2 a 4 frases qué representa, cómo se lee y qué conclusión permite.
Nunca digas que creaste un recurso si no incluiste su bloque.

SÍNTESIS FINAL (estudiantes y docentes, cuando el tema lo amerite)
Cierra con un bloque sabi {"tipo":"sintesis","memorizar":["..."],"comprender":["..."],
"ejecutar":["..."],"decidir":["..."],"repaso":"cuándo y cómo repasar (práctica espaciada)"}.

FÓRMULAS
Notación de libro: 2⁵, x², √25, ×, ÷, ≤, ≥, H₂O, CO₂, H₂SO₄. Fórmulas largas en LaTeX entre $$...$$,
por ejemplo $$VF=VP(1+i)^n$$. Explica cada símbolo con su unidad.

DATOS EN VIVO
Si la pregunta trae "DATOS EN VIVO VERIFICADOS" o "FUENTE VERIFICADA", úsalos, cita fuente y fecha y
no digas que no tienes acceso a información actual.

MICROCLASE
Al final de tu respuesta, después de una línea que diga exactamente <<<LECCION, escribe un objeto
JSON y luego una línea que diga exactamente LECCION>>>. Hecha a la medida de ESTA pregunta:
{"objetivo": "qué podrá hacer la persona al terminar, en una frase",
 "observa": "qué mirar o imaginar para entender la idea central",
 "construye": ["paso 1 de una actividad corta", "paso 2", "paso 3"],
 "aplica": "cómo se usa en la vida real en Cali o en Colombia",
 "reto": "un reto breve para hacer sin volver a leer",
 "demuestra": "cómo demuestra que aprendió (explicarlo, crear un ejemplo, resolver uno nuevo)",
 "video": "palabras para buscar un video educativo en español sobre este tema",
 "valor": "una frase que conecte el tema con un valor, o vacío si no aplica",
 "autonomia": "una frase final que estimule la motivación intrínseca y el siguiente paso autónomo"}`;

const PROMPT_AUDITOR = `Eres el Dot_Auditor_Riguroso del SELLO SABI de CENTEC. Revisas la respuesta BORRADOR que la IA
institucional quiere publicar. Primero, en silencio, resuelve tú mismo cualquier cálculo o dato de
la pregunta; después compara con el borrador.

${SELLO}

Revisa estos criterios:
1. Veracidad: datos, cálculos, fórmulas, unidades y conceptos correctos; nada inventado (ni URL, ni autores, ni DBA).
2. Método pedagógico: de lo sencillo a lo complejo, explica el porqué, ejemplo cercano, errores frecuentes cuando aplica y comprobación final.
3. Rigor científico: separa evidencia de opinión; advierte si la información puede estar desactualizada.
4. Cero sesgo político: ninguna opinión partidista ni propaganda; posturas presentadas con equilibrio.
5. Seguridad para menores y orientación responsable en temas sensibles.
6. Estilo: claro, sin emojis, proporcionado (no enciclopédico).
7. Recursos: si se pidió un comando, el bloque correspondiente existe; cada bloque \`\`\`sabi es JSON válido
   del tipo correcto y cada \`\`\`mermaid tiene sintaxis válida; los datos de gráficas y líneas de tiempo son correctos.
8. La microclase entre <<<LECCION y LECCION>>> existe, es JSON válido y es específica de la pregunta.

Responde SOLO un objeto JSON:
{"aprobado": true o false,
 "fallas": ["número de criterio y explicación breve"],
 "respuesta_corregida": "si aprobado es true, vacío; si es false, la respuesta completa corregida, conservando TODOS los bloques sabi y mermaid (corregidos) y la microclase entre <<<LECCION y LECCION>>>"}`;

async function claude(env, { model, system, content, max_tokens }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens, system, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

function separar(texto) {
  const t = String(texto || "");
  const i = t.indexOf("<<<LECCION"), j = t.indexOf("LECCION>>>");
  if (i < 0) return { answer: t.trim(), leccion: null };
  let leccion = null;
  try {
    const bloque = t.slice(i + 10, j > i ? j : undefined);
    leccion = JSON.parse(bloque.slice(bloque.indexOf("{"), bloque.lastIndexOf("}") + 1));
  } catch { leccion = null; }
  const resto = j > i ? t.slice(j + 10) : "";
  return { answer: (t.slice(0, i) + "\n" + resto).trim(), leccion };
}

const limpiar = (x, n) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// ---------- Enrutador: Dot del área y comando ----------
const sinTildes = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// Palabras clave por Dot: gana el Dot con más coincidencias (raíces sin tildes).
const CLAVES = {
  Dot_Matematicas_Estrategica: ["matemat","algebra","aritmet","geometr","fraccion","decimal","ecuacion","inecuacion","funcion lineal","funcion cuadratica","funciones","polinom","derivad","integral","limite","trigonom","seno","coseno","teorema","pitagoras","porcentaje","proporcion","regla de tres","estadist","probabil","media","mediana","desviacion","grafica","interes","ahorro","presupuesto","inversion","credito","deuda","tasa","financ","dinero","precio","inflacion","multiplic","divis","suma","resta","numero","area de","perimetro","volumen"],
  Dot_LecturaCritica_Lenguaje: ["lectura","texto","comprension","gramatica","ortografia","literatura","novela","cuento","poema","poesia","escritura","ensayo","argument","tesis","resumen","sinonimo","metafora","figura literaria","redaccion","lenguaje","castellano","espanol","verbo","sustantivo","oracion","parrafo"],
  Dot_CienciasNaturales_STEAM: ["biolog","quimic","fisic","ciencia","celula","adn","gen","fotosintesis","ecosistema","especie","evolucion","atomo","molecula","elemento","tabla periodica","reaccion","energia","fuerza","movimiento","velocidad","newton","electric","circuito","magnet","onda","sonido","luz","calor","temperatura","agua","planeta","sistema solar","cuerpo humano","organo","sangre","corazon","virus","bacteria","experimento","steam","ingenier","prototipo","clima","volcan","contamin","ambient","rio ","reciclaj","residuo","salud","nutricion","enfermedad","vacuna","dinosaurio","animal","planta"],
  Dot_CienciasSociales_Ciudadanas: ["historia","geograf","constitucion","ciudadan","democracia","derechos","estado","gobierno","congreso","guerra","independencia","colonia","conquista","revolucion","sociales","filosof","econom","cultura","conflicto","paz","mapa","continente","pais","region","municipio","eleccion","voto","ley"],
  Dot_Bilinguismo_Ingles: ["ingles","english","grammar","vocabulary","speaking","listening","reading","writing","pronunciation","present perfect","past simple","verb to be","traduc","translate","how do i say","como se dice","phrasal"],
  Dot_InteligenciaEmocional_Valores: ["emocion","sentimiento","triste","ansiedad","ansioso","estres","miedo","enojo","rabia","autoestima","confianza","convivencia","bullying","acoso","amistad","valores","respeto","honestidad","mentira","resilien","empatia","liderazgo","bienestar","proyecto de vida","motivacion","felicidad","familia"],
  Dot_Tecnico_SENA: ["sena","tecnico","tecnologo","emprend","negocio","empresa","empleab","hoja de vida","entrevista de trabajo","oficio","contabil","mecanica","soldadura","cocina","electricista","mercadeo","ventas","plan de negocio"],
  Dot_EducacionDigital_IA: ["programa","codigo","python","javascript","scratch","html","informatic","computador","software","inteligencia artificial","chatgpt","robot","algoritmo","internet","digital","ciberseguridad","contrasena","redes sociales","app","videojuego","excel","base de datos","tecnologia"],
};
function elegirDot(area, pregunta) {
  if (DOTS[area]) return area;
  const n = " " + sinTildes(`${area} ${pregunta}`).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ") + " ";
  let mejor = null, puntos = 0;
  for (const [dot, claves] of Object.entries(CLAVES)) {
    const p = claves.reduce((s, k) => s + (n.includes(" " + k) ? k.split(" ").length : 0), 0);
    if (p > puntos) { mejor = dot; puntos = p; }
  }
  return mejor;
}
function elegirComando(comando, pregunta) {
  let c = sinTildes(comando).replace(/^\//, "").trim();
  if (!c) { const m = String(pregunta || "").trim().match(/^\/([a-z0-9_\-]+)/i); c = m ? sinTildes(m[1]) : ""; }
  c = ALIAS[c] || c;
  return COMANDOS[c] ? c : null;
}

async function pedagogiaVigente(env, request) {
  try {
    if (!env.ASSETS) return "";
    const res = await env.ASSETS.fetch(new URL("/data/pedagogia-vigente.json", request.url));
    if (!res.ok) return "";
    const d = await res.json();
    return (d.actualizaciones || []).filter((a) => a.estado === "activo").slice(-12)
      .map((a) => `- ${limpiar(a.tema, 80)}: ${limpiar(a.aplicacion, 220)}`).join("\n");
  } catch { return ""; }
}

// GET /api/institucional → estado y versión (lo consulta el Dot Vigía)
export async function onRequestGet({ request }) {
  return json(request, { ok: true, servicio: "IA institucional SABI CENTEC", version: VERSION, dots: Object.keys(DOTS), comandos: Object.keys(COMANDOS) });
}

export async function onRequestPost({ request, env }) {
  const origen = request.headers.get("origin") || "";
  if (origen && !ORIGENES.includes(origen)) return json(request, { ok: false, error: "Origen no autorizado" }, 403);
  if (!env.ANTHROPIC_API_KEY) return json(request, { ok: false, error: "Falta la clave del servidor" }, 500);

  let body;
  try { body = await request.json(); } catch { return json(request, { ok: false, error: "Solicitud inválida" }, 400); }
  const pregunta = String(body.pregunta || "").trim().slice(0, 3500);
  if (pregunta.length < 2) return json(request, { ok: false, error: "Falta la pregunta" }, 400);
  const audiencia = ["estudiante", "docente", "familia"].includes(body.audiencia) ? body.audiencia : "estudiante";
  const comando = elegirComando(body.comando, pregunta);
  const dot = elegirDot(limpiar(body.dot || body.area, 40), pregunta);

  let contexto = `Quién pregunta: ${audiencia}. Grado (si es estudiante): ${limpiar(body.grado, 20) || "no indicado"}. Área probable: ${limpiar(body.area, 40) || "general"}.`;
  if (dot) contexto += `\nDOT TUTOR ACTIVO: ${dot}. Enfoque: ${DOTS[dot]}`;
  if (comando) contexto += `\nCOMANDO /${comando} (obligatorio producir el recurso): ${COMANDOS[comando]}`;
  contexto += `\n\nPREGUNTA:\n${pregunta}`;

  const vigente = await pedagogiaVigente(env, request);
  const system = [{ type: "text", text: PROMPT_MAESTRO, cache_control: { type: "ephemeral" } }];
  if (vigente) system.push({ type: "text", text: `PEDAGOGÍA VIGENTE APROBADA POR COORDINACIÓN (aplícala cuando corresponda):\n${vigente}` });
  const modelo = env.MODELO_INSTITUCIONAL || "claude-haiku-4-5-20251001";

  try {
    let borrador = await claude(env, { model: modelo, system, content: contexto, max_tokens: 4000 });
    let aprobado = null, fallas = [];
    if (env.AUDITOR !== "no") {
      try {
        const v = await claude(env, {
          model: env.MODELO_AUDITOR || "claude-haiku-4-5-20251001",
          system: [{ type: "text", text: PROMPT_AUDITOR, cache_control: { type: "ephemeral" } }], max_tokens: 6000,
          content: `${contexto}\n\nBORRADOR (revísalo después de resolver tú mismo el contenido):\n${borrador}`,
        });
        const veredicto = JSON.parse(v.slice(v.indexOf("{"), v.lastIndexOf("}") + 1));
        aprobado = veredicto.aprobado !== false;
        fallas = Array.isArray(veredicto.fallas) ? veredicto.fallas.slice(0, 6) : [];
        if (!aprobado && String(veredicto.respuesta_corregida || "").trim().length > 40) borrador = veredicto.respuesta_corregida;
      } catch (e) { console.error("Auditor no disponible; se entrega el borrador", e); }
    }
    const { answer, leccion } = separar(borrador);
    return json(request, { ok: true, version: VERSION, dot, comando, answer, leccion, auditoria: { revisada: aprobado !== null, aprobado, fallas } });
  } catch (err) {
    return json(request, { ok: false, error: "No pude responder en este momento", detail: String(err).slice(0, 300) }, 502);
  }
}
