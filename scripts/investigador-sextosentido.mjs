// ============================================================================
// SABI · Dot_Investigador_SextoSentido  (Prompt Maestro §3.A.1)
// ----------------------------------------------------------------------------
// Cada semana investiga en la web tendencias educativas mundiales, avances tecnológicos y
// transformaciones del mercado laboral a 30, 40 y 50 años, y las traduce en oportunidades
// concretas para CENTEC (qué enseñar, qué proyecto, qué área Sabic fortalecer).
// Luego el Dot_Auditor_Riguroso (otro agente + reglas de código) verifica cada hallazgo:
// fuente real con fecha, evidencia, nada inventado, cero sesgo político, utilidad para el aula.
// Resultado: data/tendencias.json + informe en data/informes/, en un Pull Request.
// La app AI CENTEC (sabicentec.com) muestra las tendencias aprobadas en «Radar del futuro».
//
//   node scripts/investigador-sextosentido.mjs
// Variables: ANTHROPIC_API_KEY (obligatoria), MODELO (opcional), MAX_NUEVAS (opcional, 4)
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";

const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const ARCHIVO = "data/tendencias.json";
const HOY = new Date().toISOString().slice(0, 10);
const MAX_NUEVAS = Number(process.env.MAX_NUEVAS || 4);
const DOMINIOS_VETADOS = ["grokipedia.com"];

// Rota el foco cada semana para cubrir todo el horizonte del Prompt Maestro.
const FOCOS = [
  "inteligencia artificial en la educación escolar: evidencia de aprendizaje, riesgos y buenas prácticas (UNESCO, OCDE, universidades)",
  "futuro del trabajo y habilidades que pedirá el mercado laboral en 2055-2075 (Foro Económico Mundial, OCDE, OIT)",
  "educación financiera de niños y jóvenes: evidencia y programas exitosos (OCDE PISA financiero, Banco de la República)",
  "aprendizaje de inglés como segunda lengua en escuelas latinoamericanas: metodologías con evidencia hacia B2/C1",
  "enfoque STEAM y aprendizaje basado en proyectos: resultados medidos en escuelas",
  "inteligencia emocional y bienestar escolar: programas con evidencia (CASEL, aprendizaje socioemocional)",
  "formación técnica temprana y articulación media-SENA en Colombia: empleabilidad y emprendimiento",
  "políticas y novedades del Ministerio de Educación Nacional de Colombia e ICFES Saber 11",
  "biotecnología, energía y sostenibilidad: carreras emergentes y lo que deben saber hoy los estudiantes",
  "neurociencia del aprendizaje: hallazgos recientes aplicables al aula",
];

const AREAS = ["Matemáticas y finanzas", "Lectura crítica", "Ciencias STEAM", "Sociales y ciudadanía", "Inglés", "Inteligencia emocional", "Técnico SENA", "Educación digital e IA"];

async function claude({ system, user, herramientas, max_tokens = 5000 }) {
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

const extraerJSON = (t) => JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));

const INVESTIGADOR = `Eres el Dot_Investigador_SextoSentido del ecosistema SABI CENTEC (colegio privado K-11 de Cali,
Colombia; modelo Proyecto FUTURO: pensamiento crítico, tecnología, IA, educación financiera, ética y liderazgo).
Buscas en la web hallazgos RECIENTES (últimos 18 meses) y verificables sobre el foco indicado.
Reglas: solo fuentes con autor u organización identificable y fecha (organismos internacionales,
universidades, revistas científicas, gobierno, medios serios). Nunca ${DOMINIOS_VETADOS.join(", ")}.
No inventes cifras ni URL: copia la URL exacta que encontraste. Cero opinión política.
Traduce cada hallazgo en una acción concreta para el aula de CENTEC.
Responde SOLO un JSON:
{"tendencias":[{"titulo":"máx. 12 palabras","hallazgo":"qué se encontró, con la cifra si la hay (máx. 60 palabras)",
"horizonte":"hoy | 2035 | 2055 | 2075","area":"una de: ${AREAS.join(" | ")}",
"oportunidad_centec":"qué debería enseñar o hacer CENTEC con esto (máx. 45 palabras)",
"pregunta_para_sabi":"una pregunta que un estudiante podría hacerle a SABI para aprender sobre esto",
"fuente":"organización y título","url":"https://...","fecha_fuente":"AAAA-MM","evidencia":"alta | media | baja"}]}`;

const AUDITOR = `Eres el Dot_Auditor_Riguroso de SABI CENTEC. Revisas hallazgos que un investigador encontró en la web.
Aprueba solo si: (1) la fuente es seria y la URL parece real y coherente con la fuente; (2) el hallazgo
no exagera ni inventa cifras; (3) es neutral políticamente; (4) es útil y apropiado para un colegio
con estudiantes menores de edad; (5) la oportunidad para CENTEC es concreta y realizable.
Responde SOLO un JSON: {"veredictos":[{"indice":0,"aprobado":true,"motivo":"breve"}]}`;

function reglasDeCodigo(t, existentes) {
  const fallas = [];
  try {
    const u = new URL(t.url);
    if (u.protocol !== "https:") fallas.push("URL sin https");
    if (DOMINIOS_VETADOS.some((d) => u.hostname.endsWith(d))) fallas.push("dominio vetado");
  } catch { fallas.push("URL inválida"); }
  for (const c of ["titulo", "hallazgo", "oportunidad_centec", "fuente", "area"]) if (!String(t[c] || "").trim()) fallas.push(`falta ${c}`);
  if (existentes.some((e) => e.url === t.url || e.titulo.toLowerCase() === String(t.titulo).toLowerCase())) fallas.push("duplicada");
  return fallas;
}

async function enlaceVivo(url) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (SABI CENTEC auditor de enlaces)" }, signal: AbortSignal.timeout(15000) });
    return r.status < 400 || r.status === 403; // 403: muchos sitios bloquean robots pero existen
  } catch { return false; }
}

async function main() {
  let datos = { version: HOY, nota: "Radar del futuro de SABI CENTEC. Lo amplía cada semana el Dot_Investigador_SextoSentido y lo verifica el Dot_Auditor_Riguroso; coordinación aprueba con Merge.", tendencias: [] };
  try { datos = JSON.parse(await readFile(ARCHIVO, "utf8")); } catch {}
  const semana = Math.floor(Date.now() / 604800000);
  const foco = process.env.FOCO || FOCOS[semana % FOCOS.length];

  const texto = await claude({
    system: INVESTIGADOR,
    user: `Foco de esta semana: ${foco}.\nFecha de hoy: ${HOY}. Encuentra hasta ${MAX_NUEVAS + 2} hallazgos distintos. Ya tenemos estos títulos (no repetir): ${datos.tendencias.map((t) => t.titulo).slice(-40).join("; ") || "ninguno"}.`,
    herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    max_tokens: 6000,
  });
  const candidatas = (extraerJSON(texto).tendencias || []).slice(0, MAX_NUEVAS + 2);

  const revisadas = [];
  for (const t of candidatas) {
    const fallas = reglasDeCodigo(t, datos.tendencias);
    if (!fallas.length && !(await enlaceVivo(t.url))) fallas.push("enlace caído");
    revisadas.push({ t, fallas });
  }
  const pasan = revisadas.filter((r) => !r.fallas.length);
  let veredictos = [];
  if (pasan.length) {
    const v = await claude({ system: AUDITOR, user: JSON.stringify(pasan.map((r, i) => ({ indice: i, ...r.t }))), max_tokens: 1500 });
    veredictos = extraerJSON(v).veredictos || [];
  }
  const aprobadas = [];
  pasan.forEach((r, i) => {
    const ver = veredictos.find((x) => x.indice === i);
    if (ver && ver.aprobado) aprobadas.push({ ...r.t, id: `t-${HOY}-${aprobadas.length + 1}`, agregado: HOY, foco, estado: "activo" });
    else r.fallas.push(`auditor: ${ver ? ver.motivo : "sin veredicto"}`);
  });

  datos.version = HOY;
  datos.tendencias = [...datos.tendencias, ...aprobadas.slice(0, MAX_NUEVAS)].slice(-60);
  await writeFile(ARCHIVO, JSON.stringify(datos, null, 1) + "\n");

  const l = [`# Dot_Investigador_SextoSentido — ${HOY}`, "", `**Foco:** ${foco}`, "",
    `Propuestas: ${candidatas.length} · Aprobadas por el Dot_Auditor_Riguroso: ${aprobadas.length}`, "",
    "## Aprobadas (aparecen en «Radar del futuro» de sabicentec.com al hacer Merge)", ""];
  for (const t of aprobadas) l.push(`- **${t.titulo}** (${t.area}, horizonte ${t.horizonte}) — ${t.hallazgo}`, `  - Oportunidad CENTEC: ${t.oportunidad_centec}`, `  - Fuente: [${t.fuente}](${t.url}) · ${t.fecha_fuente} · evidencia ${t.evidencia}`);
  l.push("", "## Rechazadas", "");
  for (const r of revisadas.filter((x) => x.fallas.length)) l.push(`- ${r.t.titulo || "(sin título)"}: ${r.fallas.join("; ")}`);
  const informe = l.join("\n");
  await mkdir("data/informes", { recursive: true });
  await writeFile(`data/informes/${HOY}-sextosentido.md`, informe + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, informe + "\n", { flag: "a" });
  console.log(informe);
}

main().catch((e) => { console.error("El Dot_Investigador_SextoSentido se detuvo:", e.message); process.exit(1); });
