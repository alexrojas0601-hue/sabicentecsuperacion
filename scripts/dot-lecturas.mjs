// ============================================================================
// SABI — Dot de lectura: escribe lecturas nuevas para lecturas.html
// ----------------------------------------------------------------------------
// Corre en GitHub Actions (.github/workflows/sabi-dot-lecturas.yml), cada miércoles.
// Elige los grados con menos lecturas y escribe una lectura original por grado en siete pasos.
// Auditor de código: cada respuesta literal debe estar COPIADA del texto, las palabras en contexto
// deben aparecer en el texto y los párrafos deben existir; si no pasa, el Dot reintenta una vez y
// si vuelve a fallar se descarta. Nunca publica directo: abre un Pull Request para coordinación.
//
//   node scripts/dot-lecturas.mjs           -> escribe lecturas nuevas
//   node scripts/dot-lecturas.mjs cobertura -> solo cuenta lecturas por grado (no gasta)
// Variables: ANTHROPIC_API_KEY · MODELO (por defecto Haiku 4.5) · MAX_NUEVOS (por defecto 3)
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";

const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const MAX_NUEVOS = Number(process.env.MAX_NUEVOS || 3);
const HOY = new Date().toISOString().slice(0, 10);
const INFORMES = "data/informes";
const LECTURAS = { primaria: "data/lecturas/primaria.json", bachillerato: "data/lecturas/bachillerato.json" };
const gradoTxt = (g) => (g === 0 ? "Transición" : `${g}°`);

function semanaDelAnio(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
}
function extraerJSON(texto) {
  const bloque = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  const crudo = bloque ? bloque[1] : texto;
  const ini = Math.min(...["[", "{"].map((c) => crudo.indexOf(c)).filter((i) => i >= 0));
  const fin = Math.max(crudo.lastIndexOf("]"), crudo.lastIndexOf("}"));
  if (!isFinite(ini) || fin < ini) throw new Error("La respuesta no trae JSON");
  return JSON.parse(crudo.slice(ini, fin + 1));
}
async function claude({ system, user, herramientas, max_tokens = 6000 }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY");
  const messages = [{ role: "user", content: user }];
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODELO, max_tokens, system, messages, ...(herramientas ? { tools: herramientas } : {}) }),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: data.content }); continue; }
    return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }
  throw new Error("La búsqueda no terminó a tiempo");
}
const leerJSON = async (ruta, defecto) => { try { return JSON.parse(await readFile(ruta, "utf8")); } catch { return defecto; } };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
async function guardarInforme(nombre, texto) {
  await mkdir(INFORMES, { recursive: true });
  await writeFile(`${INFORMES}/${HOY}-${nombre}.md`, texto + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, texto + "\n", { flag: "a" });
  console.log(texto);
}
function validarLectura(r) {
  const f = [];
  if (!Array.isArray(r.parrafos) || !r.parrafos.length) return ["sin párrafos"];
  const todo = r.parrafos.join(" ");
  if (!Array.isArray(r.literal) || r.literal.length !== 4) f.push("deben ser 4 literales");
  (r.literal || []).forEach((q, i) => { if (!todo.includes(q.evidencia || "@@")) f.push(`evidencia ${i + 1} no copiada exactamente`); });
  (r.palabras_contexto || []).forEach((w, i) => { if (!norm(todo).includes(norm(w.palabra))) f.push(`palabra ${i + 1} no está en el texto`); });
  (r.donde_lo_pone || []).forEach((d, i) => { if (!(d.parrafo >= 1 && d.parrafo <= r.parrafos.length)) f.push(`párrafo ${i + 1} fuera de rango`); });
  for (const k of ["entre_lineas", "piensa_argumenta"]) if (!Array.isArray(r[k]) || r[k].length < 2) f.push(`faltan ${k}`);
  if (!r.orden_causas || !Array.isArray(r.orden_causas.secuencia) || r.orden_causas.secuencia.length < 3) f.push("falta secuencia");
  return f;
}
async function modoLecturas() {
  const prim = await leerJSON(LECTURAS.primaria, []), bach = await leerJSON(LECTURAS.bachillerato, []);
  const todas = [...prim, ...bach];
  const conteo = Array.from({ length: 12 }, (_, g) => ({ g, n: todas.filter((l) => Number(l.grado) === g).length })).sort((a, b) => a.n - b.n);
  const espec = await readFile("data/lecturas/ESPECIFICACION.md", "utf8").catch(() => "");
  const informe = [`# Dot de lectura · nuevas lecturas · ${HOY}`, ""];
  let nuevas = 0;
  for (const { g } of conteo.slice(0, MAX_NUEVOS)) {
    const titulos = todas.filter((l) => Number(l.grado) === g).map((l) => l.titulo).join("; ");
    let ultimo = "", ok = null;
    for (let intento = 0; intento < 2 && !ok; intento++) {
      try {
        const r = extraerJSON(await claude({
          system: "Eres el Dot_LecturaCritica_Lenguaje de SABI (Colegio CENTEC, Cali). Escribes textos 100 % originales y sus preguntas en siete niveles.",
          user: `${espec}\n\nEscribe UNA lectura nueva para el grado ${g} (${gradoTxt(g)}), distinta de: ${titulos || "ninguna"}. Responde SOLO el objeto JSON (no arreglo).${ultimo ? "\nTU INTENTO ANTERIOR FALLÓ: " + ultimo : ""}`,
          max_tokens: 7000,
        }));
        const fallas = validarLectura(r);
        if (fallas.length) { ultimo = fallas.join("; "); continue; }
        ok = r;
      } catch (e) { ultimo = String(e.message).slice(0, 120); }
    }
    if (!ok) { informe.push(`- ${gradoTxt(g)}: no superó la validación (${ultimo}).`); continue; }
    const destino = g <= 5 ? prim : bach;
    const n = destino.filter((l) => Number(l.grado) === g).length + 1;
    destino.push({ ...ok, id: `L${g}-${String(n).padStart(2, "0")}-${HOY.replace(/-/g, "")}`, grado: g, agregado: HOY });
    nuevas++;
    informe.push(`- ${gradoTxt(g)}: **${ok.titulo}** (${ok.tipologia}). Evidencias literales verificadas por código.`);
  }
  if (nuevas) { await writeFile(LECTURAS.primaria, JSON.stringify(prim, null, 2) + "\n"); await writeFile(LECTURAS.bachillerato, JSON.stringify(bach, null, 2) + "\n"); }
  await guardarInforme("dot-lecturas", informe.join("\n"));
}


async function cobertura() {
  const todas = [...(await leerJSON(LECTURAS.primaria, [])), ...(await leerJSON(LECTURAS.bachillerato, []))];
  const filas = Array.from({ length: 12 }, (_, g) => `| ${gradoTxt(g)} | ${todas.filter((l) => Number(l.grado) === g).length} |`);
  await guardarInforme("dot-lecturas-cobertura", [`# Lecturas por grado · ${HOY}`, "", "| Grado | Lecturas |", "|---|---|", ...filas].join("\n"));
}

(process.argv[2] === "cobertura" ? cobertura() : modoLecturas()).catch((e) => { console.error(e); process.exit(1); });
