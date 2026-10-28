// ============================================================================
// SABI — Auditor de referencias (DOI contra Crossref)
// ----------------------------------------------------------------------------
// Regla de rectoría: toda práctica pedagógica que use SABI cita investigación con DOI
// verificado. Este auditor comprueba, contra la base pública de Crossref, que cada DOI
// existe y que corresponde a la cita (apellido del primer autor y año). No inventa DOI:
// para las citas que no tienen, solo SUGIERE candidatos que coordinación confirma.
//
// Corre en GitHub Actions (allí hay internet). Node 20+, sin dependencias.
//   node scripts/verificar-doi.mjs            -> audita data/pedagogia-vigente.json y deja informe
//   import { verificarDOI } from "./verificar-doi.mjs"   -> lo usa el Auditor de rigor
//
// Qué cambia en los datos (siempre dentro de un Pull Request que aprueba coordinación):
//   - Guarda en cada entrada "verificacion": fecha y resultado por DOI.
//   - Si un DOI NO EXISTE en Crossref, la entrada pasa a "en revisión": el tutor deja de
//     usarla hasta que alguien corrija la cita. Si Crossref no responde, no toca nada.
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const VIGENTE = "data/pedagogia-vigente.json";
const INFORMES = "data/informes";
const HOY = new Date().toISOString().slice(0, 10);
const UA = "SABI-CENTEC-auditor/1.0 (https://superacion.sabicentec.com)";
const RE_DOI = /10\.\d{4,9}\/[^\s;,]+/g;

const sinTildes = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function extraerDOIs(texto) {
  return [...new Set((String(texto || "").match(RE_DOI) || []).map((d) => d.replace(/[.)\]]+$/, "")))];
}

async function pedir(url, ms = 15000) {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
      if (r.status === 404) return { estado: 404 };
      if (r.ok) return { estado: 200, json: await r.json() };
      if (r.status !== 429 && r.status < 500) return { estado: r.status };
    } catch (e) { if (intento) return { estado: "sin respuesta" }; }
    await new Promise((ok) => setTimeout(ok, 3000));
  }
  return { estado: "sin respuesta" };
}

function resumir(m) {
  const fecha = m.issued?.["date-parts"]?.[0] || m["published-print"]?.["date-parts"]?.[0] || m["published-online"]?.["date-parts"]?.[0] || [];
  const autores = (m.author || []).map((a) => a.family || a.name || "").filter(Boolean);
  return { titulo: (m.title || [""])[0], autores, anio: fecha[0] || null, revista: (m["container-title"] || [""])[0] };
}

export async function consultarCrossref(doi) {
  const r = await pedir(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (r.estado === 404) return { existe: false };
  if (r.estado !== 200) return { existe: null, motivo: `Crossref ${r.estado}` };
  return { existe: true, ...resumir(r.json.message || {}) };
}

// La cita corresponde al DOI si en ella aparece algún apellido de los autores y el año (±1 por
// publicación en línea antes de impresión). Las citas de SABI pueden traer varias obras separadas por ";".
export function coincide(meta, cita) {
  const c = sinTildes(cita);
  const autor = (meta.autores || []).some((a) => a.length > 2 && c.includes(sinTildes(a)));
  const anios = (c.match(/\b(19|20)\d{2}\b/g) || []).map(Number);
  const anio = !meta.anio || anios.some((x) => Math.abs(x - meta.anio) <= 1);
  return { autor, anio, ok: autor && anio };
}

export async function verificarDOI(doi, cita) {
  const meta = await consultarCrossref(doi);
  if (meta.existe === false) return { doi, ok: false, motivo: "el DOI no existe en Crossref" };
  if (meta.existe === null) return { doi, ok: null, motivo: meta.motivo };
  const c = coincide(meta, cita);
  const ref = `${meta.autores[0] || "?"} (${meta.anio || "s. f."}), ${meta.revista}: «${meta.titulo}»`;
  if (c.ok) return { doi, ok: true, ref };
  return { doi, ok: false, ref, motivo: `el DOI existe pero no coincide con la cita (${!c.autor ? "autor" : ""}${!c.autor && !c.anio ? " y " : ""}${!c.anio ? "año" : ""})` };
}

// Para una obra sin DOI ("Gruber, Gelman y Ranganath (2014), Neuron") propone el mejor candidato
// de Crossref solo si coinciden apellido y año. Es una sugerencia: nunca se escribe en los datos.
export async function sugerirDOI(obra) {
  const r = await pedir(`https://api.crossref.org/works?rows=3&select=DOI,title,author,issued,container-title&query.bibliographic=${encodeURIComponent(obra)}`);
  if (r.estado !== 200) return null;
  for (const it of r.json.message?.items || []) {
    const meta = resumir(it);
    if (coincide(meta, obra).ok) return { doi: it.DOI, ref: `${meta.autores[0]} (${meta.anio}), ${meta.revista}: «${meta.titulo}»` };
  }
  return null;
}

// Separa una fuente en obras citadas, ignorando el tramo "DOI: ..." y los organismos sin año.
function obrasSinDOI(fuente) {
  return String(fuente).replace(/DOI:[^.]*\.?/gi, "").split(/;\s*/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => /\b(19|20)\d{2}\b/.test(s) && /[A-ZÁÉÍÓÚ][a-záéíóúñ]+/.test(s));
}

async function auditarVigente() {
  const vigente = JSON.parse(await readFile(VIGENTE, "utf8"));
  const l = [`# Auditor de referencias (DOI contra Crossref) — ${HOY}`, "",
    "> Regla: toda práctica que usa SABI cita investigación con DOI verificado. Si un DOI no existe, la entrada pasa a «en revisión» y el tutor deja de usarla hasta corregirla.", ""];
  const cuenta = { verificados: 0, fallidos: 0, sinRespuesta: 0, sinDOI: 0 };
  let cambios = 0;

  for (const a of vigente.actualizaciones) {
    if (a.estado === "reemplazado") continue;
    const dois = extraerDOIs(a.fuente);
    l.push(`## ${a.tema} (${a.estado})`);
    if (!dois.length) {
      cuenta.sinDOI++;
      l.push("- Sin DOI en la cita.");
      for (const obra of obrasSinDOI(a.fuente)) {
        const s = await sugerirDOI(obra);
        l.push(s ? `- Candidato para «${obra}»: \`${s.doi}\` — ${s.ref}. Confirmar y agregar «DOI: ${s.doi}» a la fuente.` : `- «${obra}»: Crossref no devolvió un candidato que coincida; revisar a mano.`);
      }
      l.push("");
      continue;
    }
    const resultados = [];
    for (const doi of dois) {
      const r = await verificarDOI(doi, a.fuente);
      resultados.push(r);
      if (r.ok === true) { cuenta.verificados++; l.push(`- ✔ \`${doi}\` — ${r.ref}`); }
      else if (r.ok === false) { cuenta.fallidos++; l.push(`- ✘ \`${doi}\` — ${r.motivo}${r.ref ? `. Crossref dice: ${r.ref}` : ""}`); }
      else { cuenta.sinRespuesta++; l.push(`- ? \`${doi}\` — ${r.motivo}; se vuelve a intentar en la próxima corrida.`); }
    }
    if (resultados.every((r) => r.ok !== null)) {
      const nueva = { fecha: HOY, dois: resultados.map(({ doi, ok, motivo }) => (ok ? { doi, ok } : { doi, ok, motivo })) };
      if (JSON.stringify((({ fecha, ...x }) => x)(a.verificacion || {})) !== JSON.stringify((({ fecha, ...x }) => x)(nueva))) { a.verificacion = nueva; cambios++; }
    }
    const inexistente = resultados.some((r) => r.motivo === "el DOI no existe en Crossref");
    if (inexistente && a.estado === "activo") {
      a.estado = "en revisión"; cambios++;
      l.push("- Pasa a «en revisión»: el tutor deja de usarla hasta que se corrija la cita.");
    }
    l.push("");
  }

  l.splice(4, 0, `Resumen: ${cuenta.verificados} DOI verificados, ${cuenta.fallidos} con problema, ${cuenta.sinRespuesta} sin respuesta de Crossref, ${cuenta.sinDOI} entradas sin DOI.`, "");
  if (cambios) { vigente.actualizado = HOY; await writeFile(VIGENTE, JSON.stringify(vigente, null, 1) + "\n"); }
  await mkdir(INFORMES, { recursive: true });
  await writeFile(`${INFORMES}/${HOY}-referencias.md`, l.join("\n") + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, l.join("\n") + "\n", { flag: "a" });
  console.log(l.join("\n"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  auditarVigente().catch((e) => { console.error("El auditor de referencias se detuvo sin modificar los datos:", e.message); process.exit(1); });
}
