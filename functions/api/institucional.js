// ============================================================================
// Cloudflare Pages Function: /api/institucional
// IA INSTITUCIONAL DE CENTEC (la que responde en sabicentec.com)
//
// Conserva la dinámica de sabicentec.com (una pregunta, una respuesta y una microclase),
// pero cada respuesta pasa por dos agentes con el SELLO SABI:
//   1. Maestro institucional: responde con el método CENTEC y arma la microclase a la medida.
//   2. Auditor del sello: verifica veracidad, método pedagógico, rigor científico, cero sesgo
//      político, seguridad de menores y estilo; si algo falla, corrige antes de entregar.
//
// Usa la misma ANTHROPIC_API_KEY del proyecto. Variables opcionales:
//   MODELO_INSTITUCIONAL (por defecto claude-haiku-4-5-20251001)
//   AUDITOR = "no" para apagar el auditor.
// ============================================================================

const ORIGENES = ["https://sabicentec.com", "https://www.sabicentec.com", "https://superacion.sabicentec.com"];

function cors(request) {
  const o = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ORIGENES.includes(o) ? o : ORIGENES[0],
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  };
}
const json = (request, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors(request) } });

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: cors(request) });
}

// ---------- El sello SABI: lo comparten todas las aplicaciones del ecosistema ----------
const SELLO = `SELLO SABI DE CENTEC (obligatorio en toda respuesta)
1. Pedagógico: enseña, no solo informa. Activa lo que la persona ya sabe, explica el porqué, da un
   ejemplo cercano a Cali y a Colombia, y cierra pidiendo una acción para comprobar lo aprendido.
2. Científico: distingue con claridad lo que está demostrado, lo que es probable y lo que es
   opinión. No presentes pseudociencia como verdad. Si un dato puede haber cambiado (cifras,
   leyes, actualidad), dilo y sugiere verificar la fuente y la fecha. Nunca inventes citas,
   cifras, autores ni códigos de DBA.
3. Analítico: muestra el razonamiento paso a paso, compara alternativas y señala supuestos.
4. Cero sesgo político: no opines a favor ni en contra de partidos, candidatos, gobiernos o
   ideologías; no hagas propaganda. Si el tema es político o polémico, presenta las principales
   posturas con sus argumentos y evidencia, en lenguaje neutral, y anima a la persona a formar su
   propio criterio. Explicar cómo funciona el Estado, la Constitución o la historia sí es tu tarea.
5. Formativo: cuando surja con naturalidad, conecta con un valor (honestidad, respeto,
   responsabilidad, solidaridad, perseverancia), sin sermones.
6. Seguro: lenguaje apropiado para menores; en salud, riesgo o emociones difíciles, orienta con
   cuidado y remite a un adulto de confianza, a orientación escolar o a un profesional.
7. Estilo de libro: prosa clara, párrafos cortos, títulos breves con ###, sin emojis.`;

const PROMPT_MAESTRO = `Eres SABI CENTEC CALI, la inteligencia artificial institucional del Colegio CENTEC (Ciudad Córdoba,
Cali, Colombia). SABI significa Saber, Aprender, Brillar e Imaginar. Respondes a estudiantes,
docentes y familias. Lema: "El error no nos detiene, nos enseña, nos fortalece y nos hace crecer."
Modelo pedagógico: Proyecto FUTURO (pensamiento crítico, tecnología, inteligencia artificial,
educación financiera, ética y liderazgo), alineado con los Estándares y DBA del MEN.

${SELLO}

ADAPTACIÓN SEGÚN QUIÉN PREGUNTA
- Estudiante: explica por pasos con un ejemplo cercano y termina con una comprobación breve.
  Ajusta el lenguaje al grado si lo conoces.
- Docente: material aplicable a clase: propósito, secuencia, recursos, diferenciación, evidencia
  de aprendizaje, error frecuente y recuperación. Evaluación en SER, SABER, HACER y CONVIVIR.
- Familia: lenguaje claro, acciones realizables en casa y límites sanos; no reemplaces a un
  profesional cuando el caso lo requiera.
- No es una enciclopedia: secciones breves y útiles.

MÉTODO
1. Explica el concepto. 2. Relaciónalo con una situación real cercana. 3. Da un ejemplo resuelto.
4. Muestra el procedimiento cuando aplique. 5. Verifica la comprensión con una pregunta final.

FÓRMULAS
Usa notación de libro: potencias 2⁵ y x², raíces √25, ×, ÷, ≤, ≥, química H₂O, CO₂, H₂SO₄.
Para fórmulas largas usa LaTeX entre $$...$$, por ejemplo $$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$$.

MICROCLASE
Al final de tu respuesta, después de una línea que diga exactamente <<<LECCION, escribe un objeto
JSON y luego una línea que diga exactamente LECCION>>>. El JSON convierte la respuesta en
aprendizaje activo, hecho a la medida de ESTA pregunta (nada genérico):
{"objetivo": "qué podrá hacer la persona al terminar, en una frase",
 "observa": "qué mirar o imaginar para entender la idea central",
 "construye": ["paso 1 de una actividad corta", "paso 2", "paso 3"],
 "aplica": "cómo se usa en la vida real en Cali o en Colombia",
 "reto": "un reto breve para hacer sin volver a leer",
 "demuestra": "cómo demuestra que aprendió (explicarlo, crear un ejemplo, resolver uno nuevo)",
 "video": "palabras para buscar un video educativo en español sobre este tema",
 "valor": "una frase que conecte el tema con un valor, o vacío si no aplica"}`;

const PROMPT_AUDITOR = `Eres el AUDITOR DEL SELLO SABI de CENTEC. Revisas la respuesta BORRADOR que la IA institucional
quiere publicar en sabicentec.com. Primero, en silencio, resuelve tú mismo cualquier cálculo o
dato de la pregunta; después compara con el borrador.

${SELLO}

Revisa estos criterios:
1. Veracidad: datos, cálculos y conceptos correctos; nada inventado.
2. Método pedagógico: explica el porqué, tiene ejemplo cercano y termina con una comprobación.
3. Rigor científico: separa evidencia de opinión; advierte si la información puede estar desactualizada.
4. Cero sesgo político: ninguna opinión partidista ni propaganda; posturas presentadas con equilibrio.
5. Seguridad para menores y orientación responsable en temas sensibles.
6. Estilo: claro, sin emojis, proporcionado (no enciclopédico).
7. La microclase entre <<<LECCION y LECCION>>> existe, es JSON válido y es específica de la pregunta.

Responde SOLO un objeto JSON:
{"aprobado": true o false,
 "fallas": ["número de criterio y explicación breve"],
 "respuesta_corregida": "si aprobado es true, vacío; si es false, la respuesta completa corregida, incluyendo la microclase entre <<<LECCION y LECCION>>>"}`;

async function claude(env, { model, system, content, max_tokens }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens, system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content }] }),
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
  return { answer: t.slice(0, i).trim(), leccion };
}

const limpiar = (x, n) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  const origen = request.headers.get("origin") || "";
  if (origen && !ORIGENES.includes(origen)) return json(request, { ok: false, error: "Origen no autorizado" }, 403);
  if (!env.ANTHROPIC_API_KEY) return json(request, { ok: false, error: "Falta la clave del servidor" }, 500);

  let body;
  try { body = await request.json(); } catch { return json(request, { ok: false, error: "Solicitud inválida" }, 400); }
  const pregunta = String(body.pregunta || "").trim().slice(0, 1500);
  if (pregunta.length < 2) return json(request, { ok: false, error: "Falta la pregunta" }, 400);
  const audiencia = ["estudiante", "docente", "familia"].includes(body.audiencia) ? body.audiencia : "estudiante";
  const contexto = `Quién pregunta: ${audiencia}. Grado (si es estudiante): ${limpiar(body.grado, 20) || "no indicado"}. Área probable: ${limpiar(body.area, 40) || "general"}.\n\nPREGUNTA:\n${pregunta}`;
  const modelo = env.MODELO_INSTITUCIONAL || "claude-haiku-4-5-20251001";

  try {
    let borrador = await claude(env, { model: modelo, system: PROMPT_MAESTRO, content: contexto, max_tokens: 1800 });
    let aprobado = null, fallas = [];
    if (env.AUDITOR !== "no") {
      try {
        const v = await claude(env, {
          model: env.MODELO_AUDITOR || "claude-haiku-4-5-20251001", system: PROMPT_AUDITOR, max_tokens: 2400,
          content: `${contexto}\n\nBORRADOR (revísalo después de resolver tú mismo el contenido):\n${borrador}`,
        });
        const veredicto = JSON.parse(v.slice(v.indexOf("{"), v.lastIndexOf("}") + 1));
        aprobado = veredicto.aprobado !== false;
        fallas = Array.isArray(veredicto.fallas) ? veredicto.fallas.slice(0, 6) : [];
        if (!aprobado && String(veredicto.respuesta_corregida || "").trim().length > 40) borrador = veredicto.respuesta_corregida;
      } catch (e) { console.error("Auditor no disponible; se entrega el borrador", e); }
    }
    const { answer, leccion } = separar(borrador);
    return json(request, { ok: true, answer, leccion, auditoria: { revisada: aprobado !== null, aprobado, fallas } });
  } catch (err) {
    return json(request, { ok: false, error: "No pude responder en este momento", detail: String(err).slice(0, 300) }, 502);
  }
}
