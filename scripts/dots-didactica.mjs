// ============================================================================
// SABI — Dots del Taller de Aprendizaje (investigadores, auditores y mejora continua)
// ----------------------------------------------------------------------------
// Corre en GitHub Actions (.github/workflows/sabi-didactica.yml). Node 20+, sin dependencias.
// Nunca publica directo: deja sus propuestas en un Pull Request que la coordinación académica
// aprueba (auditor humano final).
//
// Modos:
//   herramientas  -> el Dot del área de la semana busca herramientas y estrategias didácticas con
//                    evidencia; auditor de código + comité (pedagogía, evidencia, seguridad, acceso).
//   lecturas      -> escribe lecturas nuevas para los grados con menos; el auditor de código exige
//                    que cada respuesta literal esté copiada del texto; el Dot Auditor revisa.
//   experimentos  -> el Auditor de seguridad y ciencia revisa una muestra rotativa de experimentos
//                    y marca los que deben corregirse (campo "revision"); completa ejes incompletos.
//   cobertura     -> solo informa cuántos recursos hay por grado, eje y área (no gasta).
//
// Variables: ANTHROPIC_API_KEY · MODELO (por defecto Haiku 4.5) · MAX_NUEVOS · FOCO (área opcional)
// ============================================================================

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";

const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const MAX_NUEVOS = Number(process.env.MAX_NUEVOS || 3);
const HOY = new Date().toISOString().slice(0, 10);
const INFORMES = "data/informes";
const HERRAMIENTAS = "data/herramientas-didacticas.json";
const DIR_EXP = "data/experimentos";
const LECTURAS = { primaria: "data/lecturas/primaria.json", bachillerato: "data/lecturas/bachillerato.json" };
const EJES = ["materia", "fuerza", "energia", "vida", "quimica"];
const DOMINIOS_VETADOS = ["grokipedia.com"];

// Los 8 Dots tutores del Prompt Maestro, cada uno con su foco de búsqueda didáctica.
const DOTS = [
  ["Dot_Matematicas_Estrategica", "Matemáticas y matemática financiera", "material manipulativo, modelo de barras de Singapur, juegos de cálculo mental, fichas con variación, educación financiera escolar"],
  ["Dot_LecturaCritica_Lenguaje", "Lenguaje y lectura crítica", "comprensión lectora literal, inferencial y crítica, fluidez, vocabulario en contexto, lectura dialógica, escritura con propósito"],
  ["Dot_CienciasNaturales_STEAM", "Ciencias Naturales y STEAM", "indagación 5E, experimentos de bajo costo, ciencia en casa, simulaciones gratuitas, cuadernos de ciencia"],
  ["Dot_CienciasSociales_Ciudadanas", "Ciencias Sociales y competencias ciudadanas", "pensamiento histórico, fuentes primarias, debates, mapas, aprendizaje basado en problemas del barrio"],
  ["Dot_Bilinguismo_Ingles", "Inglés", "speaking en clase, juegos comunicativos, fonética, lectura graduada, TPR, aprendizaje por tareas"],
  ["Dot_InteligenciaEmocional_Valores", "Inteligencia emocional y valores", "aprendizaje socioemocional, círculos de diálogo, resolución de conflictos, autorregulación"],
  ["Dot_Tecnico_SENA", "Técnica, emprendimiento y SENA", "aprendizaje basado en proyectos técnicos, simulación de empresa, prototipado, competencias laborales"],
  ["Dot_EducacionDigital_IA", "Tecnología, programación e IA", "pensamiento computacional desconectado, Scratch, robótica educativa, ciudadanía digital, uso ético de IA"],
];

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
async function intentoEnlace(url, ms) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 Chrome/128 Safari/537.36", "accept-language": "es-CO,es;q=0.9,en;q=0.8" } });
    return { estado: res.status };
  } catch (e) { return { estado: e.name === "AbortError" ? "timeout" : "sin respuesta" }; } finally { clearTimeout(t); }
}
async function enlaceVivo(url) {
  let r = await intentoEnlace(url, 20000);
  if (typeof r.estado === "number" && r.estado < 400) return { ok: true };
  await new Promise((ok) => setTimeout(ok, 3000));
  r = await intentoEnlace(url, 30000);
  if (typeof r.estado === "number" && r.estado < 400) return { ok: true };
  if (r.estado === 404 || r.estado === 410) return { ok: false, estado: r.estado };
  return { ok: true, manual: `no respondió a tiempo (${r.estado}); abrir a mano antes de aprobar` };
}
function urlSegura(u) { try { const x = new URL(u); return x.protocol === "https:" && !DOMINIOS_VETADOS.some((d) => x.hostname.endsWith(d)); } catch { return false; } }
const leerJSON = async (ruta, defecto) => { try { return JSON.parse(await readFile(ruta, "utf8")); } catch { return defecto; } };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
async function guardarInforme(nombre, texto) {
  await mkdir(INFORMES, { recursive: true });
  await writeFile(`${INFORMES}/${HOY}-${nombre}.md`, texto + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, texto + "\n", { flag: "a" });
  console.log(texto);
}
async function experimentos() {
  const archivos = (await readdir(DIR_EXP).catch(() => [])).filter((f) => /^grado-\d\d\.json$/.test(f)).sort();
  const out = {};
  for (const f of archivos) out[Number(f.slice(6, 8))] = await leerJSON(`${DIR_EXP}/${f}`, []);
  return out;
}
const gradoTxt = (g) => (g === 0 ? "Transición" : `${g}°`);

// ---------------------------------------------------------------------------
// Modo herramientas: Dot del área de la semana + auditores
// ---------------------------------------------------------------------------
async function modoHerramientas() {
  const banco = await leerJSON(HERRAMIENTAS, { version: 1, actualizado: HOY, herramientas: [] });
  const foco = process.env.FOCO ? DOTS.find((d) => norm(d[1]).includes(norm(process.env.FOCO))) : null;
  const [dot, area, pistas] = foco || DOTS[semanaDelAnio() % DOTS.length];
  const ya = banco.herramientas.map((h) => `${h.nombre} (${h.url})`).join("; ").slice(0, 3000);
  const system = `Eres ${dot}, investigador didáctico de SABI, el ecosistema del Colegio CENTEC (Cali, Colombia, colegio privado de Transición a 11°).
Buscas en la web herramientas, recursos y estrategias didácticas REALES, gratuitas o de muy bajo costo, en español o fáciles de usar
en Colombia, que hagan que los niños aprendan de verdad (aprendizaje significativo, evidencia en investigación educativa). Nunca
inventes nombres, URL ni estudios. Prefiere fuentes oficiales y universidades (MEN Colombia Aprende, EEF, UNESCO, OCDE, revistas revisadas por pares)
y herramientas maduras. Excluye apps con publicidad para niños, chat con desconocidos o recolección de datos de menores sin control (Ley 1581).`;
  const user = `Área: ${area}. Pistas: ${pistas}. Ya tenemos: ${ya || "nada"}.
Propón hasta ${MAX_NUEVOS} herramientas o estrategias NUEVAS. Responde SOLO un JSON:
[{"nombre":"","url":"https://... (página oficial)","area":"${area}","grados":[números 0..11],"tipo":"herramienta|estrategia|juego|material|simulacion",
"que_es":"2 frases","como_usarla":"pasos concretos para una clase de 45 minutos en CENTEC","evidencia":"qué respalda que funciona y la fuente",
"costo":"gratis|bajo|medio","conectividad":"sin internet|internet basico|internet bueno","comando_sabi":"una de: worksheet, escape, detective, boardgame, stations, manipulative, comic, lapbook, puzzle, minibook, o ninguno"}]`;
  const candidatos = extraerJSON(await claude({ system, user, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] }));
  const informe = [`# Dot investigador didáctico · ${area} · ${HOY}`, ""];
  const aprobados = [];
  for (const c of (Array.isArray(candidatos) ? candidatos : []).slice(0, MAX_NUEVOS)) {
    const problemas = [];
    if (!urlSegura(c.url)) problemas.push("URL no segura o vetada");
    if (banco.herramientas.some((h) => h.url === c.url || norm(h.nombre) === norm(c.nombre))) problemas.push("repetida");
    for (const k of ["nombre", "que_es", "como_usarla", "evidencia"]) if (!String(c[k] || "").trim()) problemas.push(`falta ${k}`);
    if (!Array.isArray(c.grados) || !c.grados.every((g) => Number.isInteger(g) && g >= 0 && g <= 11)) problemas.push("grados inválidos");
    let nota = "";
    if (!problemas.length) { const v = await enlaceVivo(c.url); if (!v.ok) problemas.push(`enlace caído (${v.estado})`); if (v.manual) nota = v.manual; }
    if (problemas.length) { informe.push(`- RECHAZADA por el auditor técnico: ${c.nombre} — ${problemas.join(", ")}`); continue; }
    const juicio = extraerJSON(await claude({
      system: "Eres el comité auditor de SABI: pedagogía, evidencia, seguridad de menores y acceso real en Cali. Eres exigente y no te dejas convencer por el entusiasmo.",
      user: `Califica de 1 a 5: pedagogia (aprendizaje significativo, no solo entretenimiento), evidencia (respaldo verificable), seguridad (menores, datos, publicidad), acceso (costo, conectividad, idioma). Responde SOLO {"pedagogia":n,"evidencia":n,"seguridad":n,"acceso":n,"comentario":""}.\n\n${JSON.stringify(c)}`,
      max_tokens: 800,
    }));
    const notas = ["pedagogia", "evidencia", "seguridad", "acceso"].map((k) => Number(juicio[k]) || 0);
    const promedio = notas.reduce((a, b) => a + b, 0) / 4;
    if (promedio >= 3.75 && Math.min(...notas) >= 3 && Number(juicio.seguridad) >= 4) {
      aprobados.push({ ...c, id: `H-${HOY}-${aprobados.length + 1}`, dot, agregado: HOY, comite: juicio, ...(nota ? { revisar_enlace: nota } : {}) });
      informe.push(`- PROPUESTA: **${c.nombre}** (${c.url}) — promedio ${promedio.toFixed(2)}. ${juicio.comentario || ""}${nota ? " · " + nota : ""}`);
    } else informe.push(`- RECHAZADA por el comité: ${c.nombre} — notas ${notas.join("/")}. ${juicio.comentario || ""}`);
  }
  if (aprobados.length) { banco.herramientas.push(...aprobados); banco.actualizado = HOY; await writeFile(HERRAMIENTAS, JSON.stringify(banco, null, 2) + "\n"); }
  informe.push("", `Total en el banco: ${banco.herramientas.length}. Aprobar el Pull Request = publicar en el Taller.`);
  await guardarInforme("dot-herramientas", informe.join("\n"));
}

// ---------------------------------------------------------------------------
// Modo lecturas: más lecturas para los grados con menos
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Modo experimentos: auditor de seguridad y ciencia (muestra rotativa)
// ---------------------------------------------------------------------------
async function modoExperimentos() {
  const bancos = await experimentos();
  const todos = Object.values(bancos).flat();
  const tam = Number(process.env.MUESTRA || 24);
  const inicio = (semanaDelAnio() * tam) % Math.max(1, todos.length);
  const muestra = [...todos.slice(inicio, inicio + tam), ...todos.slice(0, Math.max(0, inicio + tam - todos.length))];
  const informe = [`# Dot auditor de experimentos · ${HOY}`, "", `Muestra rotativa: ${muestra.length} de ${todos.length}.`, ""];
  let marcados = 0;
  for (let i = 0; i < muestra.length; i += 6) {
    const lote = muestra.slice(i, i + 6);
    const v = extraerJSON(await claude({
      system: "Eres el auditor de seguridad y ciencia de SABI. Revisas experimentos escolares: ¿funciona de verdad?, ¿es seguro para la edad?, ¿la explicación es científicamente correcta?, ¿está al nivel del grado y del MEN? Sé estricto con la seguridad de niños.",
      user: `Responde SOLO un arreglo JSON con un objeto por experimento: [{"id":"","ok":true|false,"gravedad":"ninguna|leve|grave","problema":"","correccion":"texto corregido sugerido"}].\n\n${JSON.stringify(lote)}`,
      max_tokens: 5000,
    }));
    for (const r of Array.isArray(v) ? v : []) {
      if (r.ok !== false) continue;
      const e = todos.find((x) => x.id === r.id); if (!e) continue;
      e.revision = { fecha: HOY, gravedad: r.gravedad, problema: r.problema, correccion: r.correccion };
      marcados++;
      informe.push(`- ${r.gravedad === "grave" ? "GRAVE" : "Leve"} · ${r.id} «${e.titulo}»: ${r.problema}. Sugerencia: ${r.correccion}`);
    }
  }
  // Completa ejes con menos de 10 experimentos.
  for (const [g, lista] of Object.entries(bancos)) {
    for (const eje of EJES) {
      const faltan = 10 - lista.filter((e) => e.eje === eje).length;
      if (faltan <= 0) continue;
      informe.push(`- ${gradoTxt(Number(g))} · ${eje}: faltan ${faltan}. Se proponen nuevos.`);
      try {
        const nuevos = extraerJSON(await claude({
          system: "Eres el Dot_CienciasNaturales_STEAM de SABI. Diseñas experimentos reales, seguros y alineados con los DBA del MEN.",
          user: `Escribe ${Math.min(faltan, 3)} experimentos nuevos del eje ${eje} para el grado ${g}, con la misma estructura exacta de este ejemplo, distintos de: ${lista.map((e) => e.titulo).join("; ")}.\nEjemplo: ${JSON.stringify(lista[0])}\nResponde SOLO el arreglo JSON.`,
          max_tokens: 6000,
        }));
        for (const n of nuevos) { const k = lista.filter((e) => e.eje === eje).length + 1; lista.push({ ...n, grado: Number(g), eje, id: `G${g}-${eje}-${String(k).padStart(2, "0")}`, agregado: HOY }); }
      } catch (e) { informe.push(`  (no se pudieron generar: ${String(e.message).slice(0, 80)})`); }
    }
  }
  for (const [g, lista] of Object.entries(bancos)) await writeFile(`${DIR_EXP}/grado-${String(g).padStart(2, "0")}.json`, JSON.stringify(lista, null, 2) + "\n");
  informe.push("", `Marcados para revisión: ${marcados}. Los marcados muestran el aviso de revisión en el Taller hasta que coordinación corrija el texto.`);
  await guardarInforme("dot-experimentos", informe.join("\n"));
}

// ---------------------------------------------------------------------------
async function modoCobertura() {
  const bancos = await experimentos();
  const lect = [...(await leerJSON(LECTURAS.primaria, [])), ...(await leerJSON(LECTURAS.bachillerato, []))];
  const herr = (await leerJSON(HERRAMIENTAS, { herramientas: [] })).herramientas;
  const filas = ["| Grado | " + EJES.join(" | ") + " | Lecturas |", "|---|" + EJES.map(() => "---|").join("") + "---|"];
  for (let g = 0; g <= 11; g++) {
    const l = bancos[g] || [];
    filas.push(`| ${gradoTxt(g)} | ${EJES.map((e) => l.filter((x) => x.eje === e).length).join(" | ")} | ${lect.filter((x) => Number(x.grado) === g).length} |`);
  }
  await guardarInforme("dot-cobertura", [`# Cobertura del Taller · ${HOY}`, "", ...filas, "", `Herramientas didácticas en el banco: ${herr.length}.`].join("\n"));
}

const modo = process.argv[2] || "cobertura";
const MODOS = { herramientas: modoHerramientas, lecturas: modoLecturas, experimentos: modoExperimentos, cobertura: modoCobertura };
if (!MODOS[modo]) { console.error("Modo desconocido: " + modo); process.exit(1); }
MODOS[modo]().catch((e) => { console.error(e); process.exit(1); });
