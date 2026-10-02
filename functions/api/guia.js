// ============================================================================
// Cloudflare Pages Function: /api/guia
// "Cómo se construye": guía paso a paso de un reto del Laboratorio, hecha por SABI
// para la herramienta y el grado elegidos. Se guarda en caché: cada reto y grado se
// genera una sola vez, así que el costo es mínimo y la respuesta es inmediata después.
// ============================================================================

const ORIGENES = ["https://superacion.sabicentec.com", "https://sabicentec.com", "https://www.sabicentec.com"];
const VERSION = "v1";

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...extra } });
const corto = (x, n) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);

const PROMPT = `Eres SABI, el tutor del Colegio CENTEC (Ciudad Córdoba, Cali). Escribes la guía "Cómo se construye"
de un reto del Laboratorio de retos, para que un estudiante (o su docente) lo realice paso a paso.

Reglas del sello SABI:
- Pedagógica: cada paso es una acción concreta y corta, en segunda persona, adecuada al grado.
  En Transición a 2° frases muy cortas, pensadas para que un adulto las lea en voz alta.
- Veraz: describe solo funciones que la herramienta realmente tiene. Si no estás seguro del
  nombre exacto de un botón o menú, descríbelo de forma general ("busca el componente LED en la
  lista de componentes"). Nunca inventes enlaces.
- Segura: solo bajo voltaje (5 V o pilas), nunca la red eléctrica de la casa; materiales seguros;
  con menores, sin cuentas personales.
- Activa: incluye un momento para predecir antes de probar y un momento para mejorar después.
- Sin emojis.

Responde SOLO un objeto JSON:
{"tiempo": "duración aproximada, por ejemplo 2 sesiones de 45 minutos",
 "materiales": ["lo que se necesita, incluida la herramienta digital"],
 "pasos": [{"titulo": "título breve del paso", "detalle": "qué hacer exactamente, 1 a 3 frases"}],
 "comprobar": "cómo sabe el estudiante que su producto funciona",
 "mejorar": "una idea para hacerlo mejor o más difícil",
 "presentar": "cómo y a quién se presenta el producto",
 "aprendizaje": "qué aprende de su área y grado (descríbelo; no inventes códigos de DBA)",
 "valor": "una frase que conecte el reto con un valor"}
Usa entre 5 y 8 pasos.`;

export async function onRequestPost({ request, env, waitUntil }) {
  const o = request.headers.get("origin") || "";
  const cors = ORIGENES.includes(o) ? { "access-control-allow-origin": o, "vary": "origin" } : {};
  if (o && !ORIGENES.includes(o)) return json({ error: "Origen no autorizado" }, 403);
  if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta la clave del servidor" }, 500, cors);
  let b;
  try { b = await request.json(); } catch { return json({ error: "Solicitud inválida" }, 400, cors); }
  const id = corto(b.id, 60).replace(/[^a-z0-9-]/gi, ""), grado = corto(b.grado, 12) || "general";
  if (!id) return json({ error: "Falta el reto" }, 400, cors);

  const clave = new Request(`https://cache.sabi/guia/${VERSION}/${id}/${encodeURIComponent(grado)}`);
  const guardado = await caches.default.match(clave);
  if (guardado) return new Response(await guardado.text(), { headers: { "content-type": "application/json", ...cors } });

  const datos = `Reto: ${corto(b.reto, 160)}
Problema real: ${corto(b.problema, 400)}
Producto que se entrega: ${corto(b.producto, 300)}
Herramienta: ${corto(b.herramienta, 80)} (${corto(b.url, 200)})
Áreas: ${corto(b.areas, 120)}
Grado del estudiante: ${grado}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: env.MODELO_GUIA || "claude-haiku-4-5-20251001", max_tokens: 1500,
        system: [{ type: "text", text: PROMPT, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: datos }] }),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    const t = (d.content || []).filter((x) => x.type === "text").map((x) => x.text).join("");
    const guia = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    if (!Array.isArray(guia.pasos) || guia.pasos.length < 3) throw new Error("guía incompleta");
    const cuerpo = JSON.stringify({ guia });
    waitUntil(caches.default.put(clave, new Response(cuerpo, { headers: { "content-type": "application/json", "cache-control": "public, max-age=2592000" } })));
    return new Response(cuerpo, { headers: { "content-type": "application/json", ...cors } });
  } catch (err) {
    return json({ error: "No se pudo preparar la guía", detail: String(err).slice(0, 200) }, 502, cors);
  }
}
