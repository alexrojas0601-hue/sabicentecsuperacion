// ============================================================================
// SABI · Dot de Continuidad (el que "no se queda sin terminar la tarea")
// ----------------------------------------------------------------------------
// Corre cada 5 horas (.github/workflows/sabi-dot-continuidad.yml). Mide qué falta para que el
// ecosistema esté completo y decide el siguiente trabajo; si todo está completo, no gasta nada.
//
// Metas (Prompt Maestro SABICENTEC v2):
//   1. Banco de experimentos: 12 grados × 50 experimentos válidos (scripts/validar-experimentos.py).
//   2. Herramientas pedagógicas: al menos META_HERRAMIENTAS por cada uno de los 8 Dots tutores.
// Salida (para GitHub Actions): modo = experimentos | herramientas | ninguno, y area = Dot con menos.
//
//   node scripts/dot-continuidad.mjs           → imprime el informe y escribe GITHUB_OUTPUT
// ============================================================================
import { readFile, appendFile } from "node:fs/promises";

const META_EXP = 50;
const META_HERRAMIENTAS = Number(process.env.META_HERRAMIENTAS || 6);
const EJES = ["materia-cambios", "fuerza-movimiento", "luz-sonido-energia", "seres-vivos-cuerpo", "quimica", "tierra-universo"];
const DOTS = [
  ["Dot_Matematicas_Estrategica", "Matematicas"], ["Dot_LecturaCritica_Lenguaje", "Lectura"], ["Dot_CienciasNaturales_STEAM", "Ciencias"],
  ["Dot_CienciasSociales_Ciudadanas", "Sociales"], ["Dot_Bilinguismo_Ingles", "Ingles"], ["Dot_InteligenciaEmocional_Valores", "Emocional"],
  ["Dot_Tecnico_SENA", "SENA"], ["Dot_EducacionDigital_IA", "Digital"],
];

const leer = async (f) => { try { return JSON.parse(await readFile(f, "utf8")); } catch { return null; } };

const faltaExp = [];
for (let g = 0; g <= 11; g++) {
  const arr = await leer(`data/experimentos/grado-${String(g).padStart(2, "0")}.json`);
  const lista = Array.isArray(arr) ? arr : [];
  const ejes = new Set(lista.map((e) => e.eje));
  const sinEje = EJES.filter((e) => !ejes.has(e));
  if (lista.length < META_EXP || sinEje.length) faltaExp.push({ grado: g, tiene: lista.length, sinEje });
}

const banco = (await leer("data/herramientas-pedagogicas.json")) || { herramientas: [] };
const conteo = Object.fromEntries(DOTS.map(([d]) => [d, 0]));
for (const h of banco.herramientas || []) if ((h.estado || "activo") === "activo" && conteo[h.dot] !== undefined) conteo[h.dot]++;
const faltaHerr = DOTS.filter(([d]) => conteo[d] < META_HERRAMIENTAS).sort((a, b) => conteo[a[0]] - conteo[b[0]]);

let modo = "ninguno", area = "";
if (faltaExp.length) modo = "experimentos";
else if (faltaHerr.length) { modo = "herramientas"; area = faltaHerr[0][0]; }

const l = ["# Dot de Continuidad · " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", "",
  `**Siguiente trabajo:** ${modo}${area ? " (" + area + ")" : ""}`, "",
  "## Banco de experimentos", faltaExp.length ? faltaExp.map((f) => `- ${f.grado === 0 ? "Transición" : f.grado + "°"}: ${f.tiene} de ${META_EXP}${f.sinEje.length ? " · faltan ejes " + f.sinEje.join(", ") : ""}`).join("\n") : "- Completo: 12 grados × 50 experimentos.", "",
  `## Herramientas pedagógicas (meta ${META_HERRAMIENTAS} por Dot)`, ...DOTS.map(([d]) => `- ${conteo[d] >= META_HERRAMIENTAS ? "✅" : "⏳"} ${d}: ${conteo[d]}`)];
const informe = l.join("\n");
console.log(informe);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `modo=${modo}\narea=${area}\n`);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, informe + "\n");
