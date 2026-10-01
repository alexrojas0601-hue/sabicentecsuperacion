// Cloudflare Pages Function: /api/voz
// Convierte texto en voz clara con Workers AI (MeloTTS) y la devuelve como MP3 en base64.
// El navegador la amplifica con Web Audio para que se escuche fuerte en celulares y salones.
// La usan superacion.sabicentec.com y sabicentec.com (por eso permite esos orígenes).
//
// Requiere en Cloudflare Pages: Settings, Bindings, Add, Workers AI, nombre de variable: AI.
// Si el binding no existe, responde 501 y la página usa la voz del navegador como respaldo.

const IDIOMAS = new Set(["en", "es", "fr", "zh", "jp", "kr"]);
const ORIGENES = ["https://sabicentec.com", "https://www.sabicentec.com", "https://superacion.sabicentec.com"];

function corsDe(request) {
  const o = request.headers.get("origin") || "";
  return ORIGENES.includes(o)
    ? { "access-control-allow-origin": o, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "vary": "origin" }
    : {};
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors } });
}
async function huella(texto) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsDe(request) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const cors = corsDe(request);
  if (!env.AI) return json({ error: "Voz del servidor no configurada" }, 501, cors);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Solicitud inválida" }, 400, cors); }
  const texto = String(body.texto || "").replace(/\s+/g, " ").trim().slice(0, 600);
  const lang = IDIOMAS.has(body.lang) ? body.lang : "es";
  if (!texto) return json({ error: "Falta el texto" }, 400, cors);

  // Caché: el mismo texto en el mismo idioma no se vuelve a generar (ahorra costo y tiempo).
  const clave = new Request(`https://cache.sabi/voz/${lang}/${await huella(texto)}`);
  const cache = caches.default;
  const guardado = await cache.match(clave);
  if (guardado) return new Response(await guardado.text(), { headers: { "content-type": "application/json", ...cors } });

  try {
    const r = await env.AI.run("@cf/myshell-ai/melotts", { prompt: texto, lang });
    const audio = typeof r === "string" ? r : r && r.audio;
    if (!audio) return json({ error: "Sin audio" }, 502, cors);
    const cuerpo = JSON.stringify({ audio });
    waitUntil(cache.put(clave, new Response(cuerpo, { headers: { "content-type": "application/json", "cache-control": "public, max-age=2592000" } })));
    return new Response(cuerpo, { headers: { "content-type": "application/json", ...cors } });
  } catch (err) {
    return json({ error: "No se pudo generar la voz", detail: String(err) }, 502, cors);
  }
}
