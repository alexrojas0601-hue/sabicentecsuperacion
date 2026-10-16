// ============================================================================
// Banco de experimentos de Ciencias de CENTEC — validador y armador
// ----------------------------------------------------------------------------
//   node scripts/banco-experimentos.mjs validar data/experimentos/grado-3.json
//        → revisa estructura, DBA, seguridad y cobertura de un grado (para los diseñadores)
//   node scripts/banco-experimentos.mjs armar
//        → une data/experimentos/grado-*.json en data/experimentos.json, aplica el auditor de
//          seguridad (rechaza o sube el nivel de supervisión) y escribe el informe
//   node scripts/banco-experimentos.mjs cobertura
//        → tabla de experimentos por grado y eje
// Sin dependencias; Node 20+.
// ============================================================================
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { revisarSeguridad, nivelSuficiente } from "./seguridad-experimentos.mjs";

export const EJES = {
  "materia-cambios": "Materia y sus cambios",
  "fuerza-movimiento": "Fuerza y movimiento",
  "luz-sonido-energia": "Luz, sonido y energía",
  "seres-vivos-cuerpo": "Seres vivos y cuerpo humano",
  "quimica": "Química",
  "tierra-ambiente": "Tierra, universo y ambiente",
};
export const CORTO = { "materia-cambios": "materia", "fuerza-movimiento": "fuerza", "luz-sonido-energia": "energia", "seres-vivos-cuerpo": "vida", "quimica": "quimica", "tierra-ambiente": "tierra" };
export const MINIMO_EJE = { "materia-cambios": 8, "fuerza-movimiento": 8, "luz-sonido-energia": 8, "seres-vivos-cuerpo": 9, "quimica": 6, "tierra-ambiente": 5 };
export const MINIMO_GRADO = 50;
const DIR = "data/experimentos", BANCO = "data/experimentos.json", DBA = "data/dba-ciencias.json";
const HOY = new Date().toISOString().slice(0, 10);

const txt = (x, min = 8) => typeof x === "string" && x.trim().length >= min;
async function leerJSON(ruta) { try { return JSON.parse(await readFile(ruta, "utf8")); } catch { return null; } }

export function validarExperimento(e, dba, grado) {
  const p = [];
  if (!/^g(1[01]|[0-9])-(materia|fuerza|energia|vida|quimica|tierra)-\d{2,3}$/.test(e.id || "")) p.push("id con formato inválido (ej. g3-materia-01)");
  if (e.grado !== grado) p.push(`grado ${e.grado} no corresponde al archivo (${grado})`);
  if (!EJES[e.eje]) p.push(`eje desconocido: ${e.eje}`);
  else if (!String(e.id).includes(`-${CORTO[e.eje]}-`)) p.push("el id no coincide con el eje");
  for (const k of ["titulo", "prediccion", "observa", "explicacion", "error_comun", "variable", "conexion"]) if (!txt(e[k], k === "titulo" ? 4 : 12)) p.push(`falta o es muy corto: ${k}`);
  if (!txt(e.pregunta) || !/^¿.+\?$/.test(e.pregunta.trim())) p.push("pregunta debe ir entre ¿ y ?");
  if (!Array.isArray(e.materiales) || e.materiales.length < 2 || e.materiales.length > 15) p.push("materiales: entre 2 y 15");
  if (!Array.isArray(e.pasos) || e.pasos.length < 3 || e.pasos.length > 10) p.push("pasos: entre 3 y 10");
  if (!Number.isInteger(e.duracion_min) || e.duracion_min < 5 || e.duracion_min > 120) p.push("duracion_min: entero de 5 a 120");
  if (!e.seguridad || !["libre", "supervision", "docente"].includes(e.seguridad.nivel)) p.push("seguridad.nivel: libre | supervision | docente");
  else if (e.seguridad.nivel !== "libre" && !txt(e.seguridad.nota)) p.push("seguridad.nota obligatoria cuando hay supervisión");
  if (!Array.isArray(e.dba) || !e.dba.length) p.push("dba: arreglo con al menos un número");
  else if (dba) {
    const validos = new Set((dba.grados?.[String(grado)]?.dba || []).map((d) => d.n));
    const malos = e.dba.filter((n) => !validos.has(n));
    if (validos.size && malos.length) p.push(`DBA inexistentes para el grado ${grado}: ${malos.join(", ")}`);
  }
  const s = revisarSeguridad(e);
  if (s.rechazo.length) p.push(`SEGURIDAD — prohibido: ${s.rechazo.join("; ")}`);
  else if (e.seguridad && !nivelSuficiente(e.seguridad.nivel, s.exige)) p.push(`SEGURIDAD — exige nivel "${s.exige}" por: ${s.motivos.join(", ")}`);
  return p;
}

export function coberturaDe(lista) {
  const t = {};
  for (const e of lista) { t[e.grado] ||= { total: 0 }; t[e.grado].total++; t[e.grado][e.eje] = (t[e.grado][e.eje] || 0) + 1; }
  return t;
}

function tablaCobertura(t) {
  const ejes = Object.keys(EJES);
  const l = ["| Grado | Total | " + ejes.map((e) => EJES[e]).join(" | ") + " |", "|---|---|" + ejes.map(() => "---").join("|") + "|"];
  for (let g = 0; g <= 11; g++) {
    const f = t[g] || { total: 0 };
    l.push(`| ${g ? g + "°" : "Transición"} | ${f.total}${f.total < MINIMO_GRADO ? " ⚠" : ""} | ` + ejes.map((e) => `${f[e] || 0}${(f[e] || 0) < MINIMO_EJE[e] ? " ⚠" : ""}`).join(" | ") + " |");
  }
  return l.join("\n");
}

async function validar(ruta) {
  const dba = await leerJSON(DBA);
  const d = await leerJSON(ruta);
  if (!d || !Array.isArray(d.experimentos)) { console.error("El archivo no es JSON válido con { grado, experimentos: [...] }"); process.exit(1); }
  const grado = d.grado;
  let errores = 0;
  const ids = new Set(), titulos = new Set();
  for (const e of d.experimentos) {
    const p = validarExperimento(e, dba, grado);
    if (ids.has(e.id)) p.push("id repetido");
    const t = String(e.titulo || "").toLowerCase().trim();
    if (titulos.has(t)) p.push("título repetido");
    ids.add(e.id); titulos.add(t);
    if (p.length) { errores++; console.log(`✗ ${e.id || "(sin id)"}: ${p.join(" | ")}`); }
  }
  const c = coberturaDe(d.experimentos)[grado] || { total: 0 };
  const faltan = Object.entries(MINIMO_EJE).filter(([k, m]) => (c[k] || 0) < m).map(([k, m]) => `${EJES[k]} ${c[k] || 0}/${m}`);
  console.log(`\nGrado ${grado}: ${d.experimentos.length} experimentos, ${errores} con problemas.`);
  if (d.experimentos.length < MINIMO_GRADO) console.log(`✗ Faltan ${MINIMO_GRADO - d.experimentos.length} para el mínimo de ${MINIMO_GRADO}.`);
  if (faltan.length) console.log(`✗ Ejes por debajo del mínimo: ${faltan.join("; ")}`);
  if (!errores && d.experimentos.length >= MINIMO_GRADO && !faltan.length) console.log("✓ Listo para el banco.");
  else process.exitCode = 1;
}

export async function armar() {
  const dba = await leerJSON(DBA);
  const archivos = (await readdir(DIR)).filter((f) => /^grado-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
  const banco = [], rechazados = [], ajustados = [];
  const ids = new Set();
  for (const f of archivos) {
    const d = await leerJSON(`${DIR}/${f}`);
    for (const e of d?.experimentos || []) {
      const s = revisarSeguridad(e);
      if (s.rechazo.length) { rechazados.push(`${e.id}: ${s.rechazo.join("; ")}`); continue; }
      if (e.seguridad && !nivelSuficiente(e.seguridad.nivel, s.exige)) {
        ajustados.push(`${e.id}: ${e.seguridad.nivel} → ${s.exige} (${s.motivos.join(", ")})`);
        e.seguridad = { nivel: s.exige, nota: e.seguridad.nota || `Requiere supervisión por: ${s.motivos.join(", ")}.` };
      }
      const p = validarExperimento(e, dba, d.grado).filter((x) => !x.startsWith("SEGURIDAD"));
      if (ids.has(e.id)) p.push("id repetido");
      if (p.length) { rechazados.push(`${e.id}: ${p.join(" | ")}`); continue; }
      ids.add(e.id);
      banco.push({ ...e, estado: "activo" });
    }
  }
  const salida = { version: HOY, fuente_dba: dba?.fuente || null, ejes: EJES, total: banco.length, experimentos: banco };
  await writeFile(BANCO, JSON.stringify(salida) + "\n");
  const t = coberturaDe(banco);
  const informe = [`# Banco de experimentos de Ciencias — ${HOY}`, "", `Total aprobado: ${banco.length}. Rechazados: ${rechazados.length}. Nivel de supervisión subido por el auditor: ${ajustados.length}.`, "", tablaCobertura(t), "",
    ...(rechazados.length ? ["## Rechazados", ...rechazados.map((r) => "- " + r), ""] : []),
    ...(ajustados.length ? ["## Supervisión ajustada por el auditor de seguridad", ...ajustados.map((r) => "- " + r)] : [])].join("\n");
  await mkdir("data/informes", { recursive: true });
  await writeFile(`data/informes/${HOY}-experimentos.md`, informe + "\n");
  console.log(informe);
}

async function cobertura() {
  const b = await leerJSON(BANCO);
  console.log(tablaCobertura(coberturaDe(b?.experimentos || [])));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [modo, ruta] = process.argv.slice(2);
  ({ validar: () => validar(ruta), armar, cobertura }[modo] || (() => console.log("Uso: validar <archivo> | armar | cobertura")))().catch((e) => { console.error(e); process.exit(1); });
}
