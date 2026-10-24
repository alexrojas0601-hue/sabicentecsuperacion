// Cloudflare Pages Function que corre antes de cada página del sitio.
// tutor.sabicentec.com es la dirección propia del tutor SABI: si alguien entra por
// ese dominio a la raíz, ve directamente tutor.html (la dirección no cambia y se
// conservan los parámetros como ?rol=estudiante&cmd=/experimento).
// En superacion.sabicentec.com todo sigue igual.
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (url.hostname.startsWith("tutor.") && (url.pathname === "/" || url.pathname === "/index.html")) {
    const destino = new URL("/tutor.html" + url.search, url.origin);
    const res = await env.ASSETS.fetch(new Request(destino, request));
    // Pages puede responder con una redirección a la ruta «bonita» (/tutor); se sigue aquí mismo.
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const otra = new URL(res.headers.get("location"), destino);
      return env.ASSETS.fetch(new Request(otra, request));
    }
    return res;
  }
  return next();
}
