// Cloudflare Pages Function: /api/voz
// Convierte texto en voz clara con Workers AI (MeloTTS) y la devuelve como MP3 en base64.
// El navegador la amplifica con Web Audio para que se escuche fuerte en celulares y salones.
//
// Requiere en Cloudflare Pages: Settings, Bindings, Add, Workers AI, nombre de variable: AI.
// Si el binding no existe, responde 501 y la página usa la voz del navegador como respaldo.

const IDIOMAS = new Set(["en", "es", "fr", "zh", "jp", "kr"]);

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

async function huella(texto) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.AI) return json({ error: "Voz del servidor no configurada" }, 501);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
  const texto = String(body.texto || "").replace(/\s+/g, " ").trim().slice(0, 600);
  const lang = IDIOMAS.has(body.lang) ? body.lang : "es";
  if (!texto) return json({ error: "Falta el texto" }, 400);

  // Caché: el mismo texto en el mismo idioma no se vuelve a generar (ahorra costo y tiempo).
  const clave = new Request(`https://cache.sabi/voz/${lang}/${await huella(texto)}`);
  const cache = caches.default;
  const guardado = await cache.match(clave);
  if (guardado) return guardado;

  try {
    const r = await env.AI.run("@cf/myshell-ai/melotts", { prompt: texto, lang });
    const audio = typeof r === "string" ? r : r && r.audio;
    if (!audio) return json({ error: "Sin audio" }, 502);
    const resp = new Response(JSON.stringify({ audio }), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=2592000" },
    });
    waitUntil(cache.put(clave, resp.clone()));
    return resp;
  } catch (err) {
    return json({ error: "No se pudo generar la voz", detail: String(err) }, 502);
  }
}
