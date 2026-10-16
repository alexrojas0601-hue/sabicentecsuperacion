// GET /api/comandos → menú de comandos SABI agrupado (lo usan tutor.html y las demás apps del ecosistema)
import { menuComandos } from "../_shared/comandos.js";

export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, grupos: menuComandos() }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" },
  });
}
