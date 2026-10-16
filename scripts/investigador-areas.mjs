// ============================================================================
// SABI — Equipo investigador por áreas (proyectos y pedagogía vigente)
// ----------------------------------------------------------------------------
// Corre en GitHub Actions (.github/workflows/sabi-investigadores.yml). Node 20+, sin
// dependencias. Nunca publica directo: deja sus propuestas en un Pull Request que la
// coordinación académica aprueba (auditor humano final).
//
// Modos:
//   node scripts/investigador-areas.mjs proyectos   -> diseña proyectos nuevos donde el banco tiene vacíos
//   node scripts/investigador-areas.mjs pedagogia   -> busca hallazgos recientes con evidencia y los propone
//   node scripts/investigador-areas.mjs cobertura   -> solo informa qué áreas, grados y tipos faltan
//   node scripts/investigador-areas.mjs herramientas -> el Dot del área de la semana busca herramientas pedagógicas reales
//   node scripts/investigador-areas.mjs experimentos -> llena el grado y eje más débil del banco de experimentos
//
// Variables: ANTHROPIC_API_KEY (obligatoria), MODELO (opcional), MAX_NUEVOS (por defecto 3),
//            FOCO (opcional, ej. "Física|arduino" o "evaluación formativa")
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { revisarSeguridad, nivelSuficiente } from "./seguridad-experimentos.mjs";
import { EJES, CORTO, MINIMO_EJE, validarExperimento, coberturaDe, armar } from "./banco-experimentos.mjs";

const BANCO = "data/proyectos-areas.json";
const VIGENTE = "data/pedagogia-vigente.json";
const INFORMES = "data/informes";
const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const MAX_NUEVOS = Number(process.env.MAX_NUEVOS || 3);
const HOY = new Date().toISOString().slice(0, 10);

const TIPOS = ["robotica", "arduino", "steam", "raspberry", "programacion", "juego", "simulacion", "abp"];
const BANDAS = [[0, 2, "Transición a 2°"], [3, 5, "3° a 5°"], [6, 8, "6° a 8°"], [9, 11, "9° a 11°"]];
// Grados en que cada área se enseña como asignatura propia en CENTEC (las demás: Transición a 11°).
const RANGO_AREA = {
  "Trigonometría": [10, 11], "Cálculo": [10, 11], "Filosofía": [10, 11],
  "SENA Recursos y Talento Humano": [10, 11], "SENA Aplicaciones Móviles": [10, 11], "SENA Integración de Contenidos Digitales": [10, 11],
  "Química": [6, 11], "Física": [6, 11], "Biología": [6, 11], "Comportamiento y Salud": [6, 11],
  "Matemáticas Financieras": [6, 11], "Economía y Finanzas": [6, 11], "Ciencias Naturales": [0, 5],
  "Mandarín": [3, 11], "Emprendimiento": [3, 11],
};
const PROYECTOS_INST = ["Ciudadano 2040", "Guardianes Digitales", "Centec Verde", null];
const DOMINIOS_VETADOS = ["grokipedia.com"];

// Temas que rota el Investigador neuropedagógico (uno por semana).
const TEMAS_PEDAGOGIA = [
  "neurociencia cognitiva del aprendizaje y la memoria en niños y adolescentes",
  "neuropsicología de las funciones ejecutivas y la atención en el aula",
  "evaluación formativa y retroalimentación eficaz",
  "enseñanza explícita del pensamiento crítico y la argumentación",
  "didáctica de las matemáticas basada en evidencia",
  "ciencia de la lectura y comprensión lectora",
  "enseñanza de las ciencias por indagación y concepciones alternativas",
  "pensamiento histórico y alfabetización mediática",
  "adquisición de segundas lenguas en contextos escolares",
  "aprendizaje basado en proyectos y aprendizaje STEAM",
  "gamificación y aprendizaje basado en juegos",
  "educación inclusiva, Diseño Universal para el Aprendizaje y dificultades de aprendizaje",
  "metacognición, autorregulación y motivación",
  "uso de la inteligencia artificial en la enseñanza escolar",
  "bienestar socioemocional y aprendizaje",
  "pensamiento computacional y educación en robótica",
];

const CONTEXTO = `Colegio CENTEC, colegio privado de Transición a grado 11 en el barrio Ciudad Córdoba,
Comuna 15 de Santiago de Cali, Colombia. Comunidad con alta vulnerabilidad socioeconómica: muchos
estudiantes no tienen computador propio; se prefieren herramientas gratuitas, de navegador o celular,
y simuladores antes que hardware. Modelo pedagógico Proyecto FUTURO (pensamiento crítico, tecnología,
IA, educación financiera, ética, liderazgo). Proyectos institucionales: Ciudadano 2040, Guardianes
Digitales, Centec Verde. Articulación SENA en 10° y 11°. Currículo alineado a Estándares Básicos de
Competencias y DBA del MEN; evaluación con la escala del Decreto 1290 (Bajo, Básico, Alto, Superior).
Estudiantes menores de edad: Ley 1581 de 2012. Rectoría exige rigor y fuentes verificables; nunca
Grokipedia ni contenido sin autor. Pedagogía no conductista: aprendizaje significativo, neuropedagogía,
modelos de pensamiento y lógicas explícitos, preguntas propias del estudiante, gamificación con criterio.`;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function semanaDelAnio(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - inicio) / 86400000 + 1) / 7);
}

function slug(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function extraerJSON(texto) {
  const bloque = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  const crudo = bloque ? bloque[1] : texto;
  const ini = Math.min(...["[", "{"].map((c) => crudo.indexOf(c)).filter((i) => i >= 0));
  const fin = Math.max(crudo.lastIndexOf("]"), crudo.lastIndexOf("}"));
  if (!isFinite(ini) || fin < ini) throw new Error("La respuesta no trae JSON");
  return JSON.parse(crudo.slice(ini, fin + 1));
}

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

async function intentoEnlace(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36", "accept-language": "es-CO,es;q=0.9,en;q=0.8" } });
    return { estado: res.status };
  } catch (e) {
    return { estado: e.name === "AbortError" ? "timeout" : "sin respuesta" };
  } finally { clearTimeout(t); }
}

// Igual que el curador: solo 404 o 410 repetido se considera caído; lo lento queda para revisión manual.
async function enlaceVivo(url) {
  let r = await intentoEnlace(url, 20000);
  if (typeof r.estado === "number" && r.estado < 400) return { ok: true };
  await new Promise((ok) => setTimeout(ok, 3000));
  r = await intentoEnlace(url, 30000);
  if (typeof r.estado === "number" && r.estado < 400) return { ok: true };
  if (r.estado === 404 || r.estado === 410) return { ok: false, estado: r.estado };
  return { ok: true, manual: `no respondió a tiempo (${r.estado}); abrir a mano antes de aprobar` };
}

function urlSegura(u) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && !DOMINIOS_VETADOS.some((d) => x.hostname.endsWith(d));
  } catch { return false; }
}

async function guardarInforme(nombre, texto) {
  await mkdir(INFORMES, { recursive: true });
  await writeFile(`${INFORMES}/${HOY}-${nombre}.md`, texto + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, texto + "\n", { flag: "a" });
  console.log(texto);
}

// ---------------------------------------------------------------------------
// Cobertura: dónde faltan proyectos (área x banda de grados x tipo)
// ---------------------------------------------------------------------------

function cobertura(banco) {
  const filas = [];
  for (const a of banco.areas) {
    const activos = (a.proyectos || []).filter((p) => p.estado === "activo");
    const [rd, rh] = RANGO_AREA[a.area] || [0, 11];
    const bandas = BANDAS.map(([d, h, n]) => [Math.max(d, rd), Math.min(h, rh), n]).filter(([d, h]) => d <= h)
      .map(([d, h, n]) => [d, h, d === 10 && h === 11 ? "10° y 11°" : n]);
    for (const [d, h, nombre] of bandas) {
      const enBanda = activos.filter((p) => p.grados.desde <= h && p.grados.hasta >= d);
      const tipos = new Set(enBanda.flatMap((p) => p.tipo));
      filas.push({ area: a.area, banda: nombre, desde: d, hasta: h, total: enBanda.length, faltan: TIPOS.filter((t) => !tipos.has(t)) });
    }
  }
  return filas.sort((x, y) => x.total - y.total || y.faltan.length - x.faltan.length);
}

function elegirFoco(banco) {
  if (process.env.FOCO && process.env.FOCO.includes("|")) {
    const [area, tipo] = process.env.FOCO.split("|").map((s) => s.trim());
    const fila = cobertura(banco).find((f) => f.area === area) || { area, banda: "todos", desde: 0, hasta: 11, faltan: [tipo] };
    return { ...fila, tipo };
  }
  const filas = cobertura(banco);
  const vacios = filas.filter((f) => f.total === filas[0].total);
  const fila = vacios[semanaDelAnio() % vacios.length];
  const tipo = fila.faltan.length ? fila.faltan[semanaDelAnio() % fila.faltan.length] : TIPOS[semanaDelAnio() % TIPOS.length];
  return { ...fila, tipo };
}

// ---------------------------------------------------------------------------
// Agente 1 — Investigador de proyectos (con búsqueda web)
// ---------------------------------------------------------------------------

async function investigadorProyectos(foco, banco) {
  const existentes = banco.areas.flatMap((a) => a.proyectos.map((p) => `${a.area}: ${p.titulo}`)).join("\n");
  const system = `Eres el Investigador de proyectos por área del equipo de SABI. ${CONTEXTO}

Diseñas proyectos de aprendizaje significativo que enganchan al estudiante y lo llevan al desempeño
Superior. Cada proyecto: problema auténtico de Cali o del colegio, pregunta motriz desafiante,
indagación, producto público, conexión explícita con el aprendizaje del DBA o estándar del grado
(descríbelo; escribe número de DBA solo si estás completamente seguro), modelo de pensamiento y tipo
de lógica que entrena, y gamificación solo si aporta. Usa la búsqueda web para verificar que la
herramienta existe, es gratuita o freemium, funciona en navegador o celular y es apropiada para
menores. Para Arduino, robótica y Raspberry Pi prioriza simuladores (Wokwi, Tinkercad, VEXcode VR,
MakeCode) y solo bajo voltaje. No repitas proyectos existentes.`;
  const user = `Foco de esta semana: área ${foco.area}, grados ${foco.banda} (de ${foco.desde} a ${foco.hasta}; 0 = Transición), tipo principal "${foco.tipo}".
Tipos que aún faltan en esa banda: ${foco.faltan.join(", ") || "ninguno"}.

Proyectos que ya existen (no repetir):
${existentes}

Propón hasta ${MAX_NUEVOS} proyectos. Responde SOLO un arreglo JSON de objetos con estas claves exactas:
{"titulo": "...", "tipo": ["uno o dos de: ${TIPOS.join(", ")}"], "grados": {"desde": n, "hasta": n},
 "pregunta_motriz": "...", "problema": "problema real de Cali o del colegio", "producto": "producto público",
 "aprendizaje": "aprendizaje del DBA o estándar y competencia", "pensamiento": "modelo de pensamiento",
 "logica": "tipo de lógica con ejemplo", "gamificacion": "mecánica o 'Sin juego: ...'",
 "herramienta": {"nombre": "...", "url": "https://...", "acceso": "ya|codigo|descarga|licencia", "costo": "gratis|freemium|pago"},
 "seguridad": "nota de seguridad para menores", "proyecto_institucional": ${JSON.stringify(PROYECTOS_INST)} (uno),
 "evidencia_busqueda": "qué encontraste en la web que confirma la herramienta"}`;
  const texto = await claude({ system, user, max_tokens: 6000, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] });
  const lista = extraerJSON(texto);
  return Array.isArray(lista) ? lista.slice(0, MAX_NUEVOS) : [];
}

// ---------------------------------------------------------------------------
// Agente 2 — Auditor técnico de proyectos (código: no se le puede convencer)
// ---------------------------------------------------------------------------

async function auditorTecnicoProyectos(candidatos, banco, foco) {
  const titulos = new Set(banco.areas.flatMap((a) => a.proyectos.map((p) => slug(p.titulo))));
  const aprobados = [], rechazados = [];
  for (const c of candidatos) {
    const faltan = ["titulo", "pregunta_motriz", "problema", "producto", "aprendizaje", "pensamiento", "logica", "seguridad"].filter((k) => !String(c[k] || "").trim());
    if (faltan.length) { rechazados.push({ ...c, motivo: `campos vacíos: ${faltan.join(", ")}` }); continue; }
    if (!Array.isArray(c.tipo) || !c.tipo.length || !c.tipo.every((t) => TIPOS.includes(t))) { rechazados.push({ ...c, motivo: "tipo no válido" }); continue; }
    const d = Number(c.grados?.desde), h = Number(c.grados?.hasta);
    if (!(d >= 0 && h <= 11 && d <= h)) { rechazados.push({ ...c, motivo: "grados no válidos" }); continue; }
    if (!urlSegura(c.herramienta?.url)) { rechazados.push({ ...c, motivo: "URL no segura o vetada" }); continue; }
    if (titulos.has(slug(c.titulo))) { rechazados.push({ ...c, motivo: "proyecto repetido" }); continue; }
    const vivo = await enlaceVivo(c.herramienta.url);
    if (!vivo.ok) { rechazados.push({ ...c, motivo: `enlace caído (${vivo.estado})` }); continue; }
    if (vivo.manual) c._revisarManual = vivo.manual;
    c.grados = { desde: d, hasta: h };
    c.herramienta.acceso = ["ya", "codigo", "descarga", "licencia"].includes(c.herramienta.acceso) ? c.herramienta.acceso : "ya";
    c.herramienta.costo = ["gratis", "freemium", "pago"].includes(c.herramienta.costo) ? c.herramienta.costo : "freemium";
    if (!PROYECTOS_INST.includes(c.proyecto_institucional)) c.proyecto_institucional = null;
    c.area = foco.area;
    titulos.add(slug(c.titulo));
    aprobados.push(c);
  }
  return { aprobados, rechazados };
}

// ---------------------------------------------------------------------------
// Agente 3 — Comité auditor de proyectos (pedagógico, pensamiento, seguridad, acceso)
// ---------------------------------------------------------------------------

async function comiteProyectos(candidatos) {
  if (!candidatos.length) return { aprobados: [], rechazados: [] };
  const conId = candidatos.map((c, i) => ({ ...c, _id: i }));
  const system = `Eres el Comité Auditor de proyectos de SABI. ${CONTEXTO}
Cuatro voces independientes, sin complacencia:
1. Pedagógica: aprendizaje significativo, pregunta motriz auténtica, indagación, producto público,
   conexión real con el DBA o estándar del grado; no es entretenimiento vacío ni conductismo.
2. Pensamiento: entrena de forma explícita un modelo de pensamiento y una lógica adecuados a la edad;
   el estudiante formula preguntas propias; la gamificación, si existe, sirve al aprendizaje.
3. Seguridad de menores: sin cuentas con datos personales de menores, sin chat con desconocidos,
   sin publicidad agresiva ni compras; electricidad solo de bajo voltaje (Ley 1581 de 2012).
4. Pertinencia y acceso: contexto real de Cali, costo, conectividad, idioma, celular.
Puntúa de 1 a 5 cada eje. Si puedes mejorar el proyecto sin cambiar la herramienta, entrega la corrección.`;
  const user = `Proyectos a auditar:\n${JSON.stringify(conId, null, 2)}\n\nResponde SOLO un arreglo JSON:
{"_id": n, "puntajes": {"pedagogico": 1-5, "pensamiento": 1-5, "seguridad": 1-5, "acceso": 1-5},
 "observaciones": "2 o 3 frases", "correccion": {campos corregidos del proyecto} o null}`;
  const veredictos = extraerJSON(await claude({ system, user, max_tokens: 5000 }));
  const aprobados = [], rechazados = [];
  for (const c of conId) {
    const v = veredictos.find((x) => x._id === c._id);
    const { _id, ...p } = c;
    if (!v?.puntajes) { rechazados.push({ ...p, motivo: "sin veredicto del comité" }); continue; }
    const n = ["pedagogico", "pensamiento", "seguridad", "acceso"].map((k) => Number(v.puntajes[k]));
    const prom = n.reduce((a, b) => a + b, 0) / n.length;
    // La regla la decide el código: ningún eje por debajo de 3, seguridad mínimo 4, promedio mínimo 3.75.
    const ok = n.every((x) => x >= 3) && n[2] >= 4 && prom >= 3.75;
    if (v.correccion && typeof v.correccion === "object") {
      for (const k of ["pregunta_motriz", "problema", "producto", "aprendizaje", "pensamiento", "logica", "gamificacion", "seguridad"]) {
        if (typeof v.correccion[k] === "string" && v.correccion[k].trim()) p[k] = v.correccion[k].trim();
      }
    }
    p._auditoria = { puntajes: v.puntajes, promedio: Number(prom.toFixed(2)), observaciones: v.observaciones };
    (ok ? aprobados : rechazados).push(ok ? p : { ...p, motivo: `no alcanzó el estándar (promedio ${prom.toFixed(2)}, seguridad ${n[2]})` });
  }
  return { aprobados, rechazados };
}

// ---------------------------------------------------------------------------
// Agente 4 — Investigador neuropedagógico (con búsqueda web) y su auditor de rigor
// ---------------------------------------------------------------------------

async function investigadorPedagogia(tema, vigente) {
  const conocidos = vigente.actualizaciones.map((a) => `- ${a.tema}: ${a.fuente}`).join("\n");
  const system = `Eres el Investigador neuropedagógico de SABI. ${CONTEXTO}
Buscas hallazgos con evidencia sólida y aplicable en el aula: metaanálisis, ensayos controlados,
revisiones sistemáticas o guías de organismos serios (Education Endowment Foundation, OCDE, UNESCO e
IBE-UNESCO, Banco Mundial, What Works Clearinghouse, CAST, MEN e ICFES de Colombia, revistas con
revisión por pares). Prefiere publicaciones de los últimos cinco años, sin descartar clásicos muy
replicados. Rechaza neuromitos, opiniones sin datos, blogs comerciales y contenido generado sin autor.
Cada hallazgo debe traducirse en una instrucción concreta para un tutor de IA que enseña a niños y
adolescentes, y su fuente debe aparecer en tus resultados de búsqueda con URL.`;
  const user = `Tema de esta semana: ${tema}.
Hallazgos que ya están en SABI (no repetir; puedes proponer matizar alguno si la evidencia cambió):
${conocidos}

Propón hasta 2 hallazgos. Responde SOLO un arreglo JSON:
{"tema": "...", "hallazgo": "qué dice la evidencia, en 1 o 2 frases", "aplicacion": "qué debe hacer SABI distinto",
 "fuente": "autores, año y publicación u organismo", "url": "https://...", "evidencia": "alta|moderada|emergente",
 "matiza": "tema existente que corrige o vacío"}`;
  const texto = await claude({ system, user, max_tokens: 4000, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] });
  const lista = extraerJSON(texto);
  return Array.isArray(lista) ? lista.slice(0, 2) : [];
}

async function auditorRigor(candidatos, vigente) {
  const aprobados = [], rechazados = [];
  const temas = new Set(vigente.actualizaciones.map((a) => slug(a.tema)));
  for (const c of candidatos) {
    if (!["tema", "hallazgo", "aplicacion", "fuente"].every((k) => String(c[k] || "").trim())) { rechazados.push({ ...c, motivo: "campos vacíos" }); continue; }
    if (!urlSegura(c.url)) { rechazados.push({ ...c, motivo: "fuente sin URL segura o vetada" }); continue; }
    if (!c.matiza && temas.has(slug(c.tema))) { rechazados.push({ ...c, motivo: "tema repetido" }); continue; }
    if (/estilos? de aprendizaje|hemisferio (izquierdo|derecho)|10 ?%|brain ?gym|gimnasia cerebral/i.test(c.hallazgo + c.aplicacion) && !/mito|no tiene respaldo|sin respaldo/i.test(c.hallazgo)) {
      rechazados.push({ ...c, motivo: "posible neuromito" }); continue;
    }
    const vivo = await enlaceVivo(c.url);
    if (!vivo.ok) { rechazados.push({ ...c, motivo: `fuente caída (${vivo.estado})` }); continue; }
    if (vivo.manual) c._revisarManual = vivo.manual;
    aprobados.push(c);
  }
  if (!aprobados.length) return { aprobados, rechazados };
  const system = `Eres el Auditor de rigor científico de SABI. ${CONTEXTO}
Evalúas si cada hallazgo propuesto es fiel a su fuente, si el nivel de evidencia declarado es honesto
(no exagera), si es aplicable a un tutor de IA con niños y adolescentes y si no contradice la evidencia
consolidada. Puntúa de 1 a 5: fidelidad, evidencia, aplicabilidad. Si la redacción exagera, corrígela.`;
  const user = `Hallazgos:\n${JSON.stringify(aprobados.map((c, i) => ({ ...c, _id: i })), null, 2)}\n\nResponde SOLO un arreglo JSON:
{"_id": n, "puntajes": {"fidelidad": 1-5, "evidencia": 1-5, "aplicabilidad": 1-5}, "observaciones": "...",
 "hallazgo_corregido": "..." o null, "aplicacion_corregida": "..." o null, "evidencia_corregida": "alta|moderada|emergente" o null}`;
  const veredictos = extraerJSON(await claude({ system, user, max_tokens: 3000 }));
  const finales = [];
  aprobados.forEach((c, i) => {
    const v = veredictos.find((x) => x._id === i);
    if (!v?.puntajes) { rechazados.push({ ...c, motivo: "sin veredicto" }); return; }
    const n = ["fidelidad", "evidencia", "aplicabilidad"].map((k) => Number(v.puntajes[k]));
    if (!(n.every((x) => x >= 3) && n[0] >= 4)) { rechazados.push({ ...c, motivo: `rigor insuficiente (${n.join("/")})` }); return; }
    if (v.hallazgo_corregido) c.hallazgo = v.hallazgo_corregido;
    if (v.aplicacion_corregida) c.aplicacion = v.aplicacion_corregida;
    if (v.evidencia_corregida) c.evidencia = v.evidencia_corregida;
    c._auditoria = { puntajes: v.puntajes, observaciones: v.observaciones };
    finales.push(c);
  });
  return { aprobados: finales, rechazados };
}

// ---------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------

async function modoProyectos() {
  const banco = JSON.parse(await readFile(BANCO, "utf8"));
  const foco = elegirFoco(banco);
  const propuestos = await investigadorProyectos(foco, banco);
  const t = await auditorTecnicoProyectos(propuestos, banco, foco);
  const c = await comiteProyectos(t.aprobados);
  let area = banco.areas.find((a) => a.area === foco.area);
  if (!area) { area = { area: foco.area, proyectos: [] }; banco.areas.push(area); }
  for (const p of c.aprobados) {
    const { area: _a, evidencia_busqueda, _auditoria, _revisarManual, ...limpio } = p;
    area.proyectos.push({ id: `p-${slug(p.titulo)}`, ...limpio, estado: "activo", origen: "investigador", verificado: HOY });
  }
  banco.actualizado = HOY;
  await writeFile(BANCO, JSON.stringify(banco, null, 1) + "\n");
  const l = [`# Investigador de proyectos por área — ${HOY}`, "", `Foco: ${foco.area}, ${foco.banda}, tipo ${foco.tipo}.`, "", "> Aprobar el Pull Request = publicar en proyectos.html y en el tutor.", ""];
  for (const p of c.aprobados) {
    l.push(`## ${p.titulo}`, `- Pregunta motriz: ${p.pregunta_motriz}`, `- Producto: ${p.producto}`, `- Aprendizaje: ${p.aprendizaje}`,
      `- Pensamiento y lógica: ${p.pensamiento} · ${p.logica}`, `- Herramienta: [${p.herramienta.nombre}](${p.herramienta.url})`,
      `- Comité: promedio ${p._auditoria.promedio} — ${p._auditoria.observaciones}`, ...(p._revisarManual ? [`- Revisar a mano: ${p._revisarManual}`] : []), `- Evidencia web: ${p.evidencia_busqueda || "no indicada"}`, "");
  }
  const rech = [...t.rechazados, ...c.rechazados];
  if (rech.length) { l.push(`## Rechazados (${rech.length})`, ""); rech.forEach((r) => l.push(`- ${r.titulo || "(sin título)"}: ${r.motivo}`)); }
  await guardarInforme("proyectos", l.join("\n"));
}

async function modoPedagogia() {
  const vigente = JSON.parse(await readFile(VIGENTE, "utf8"));
  const tema = process.env.FOCO && !process.env.FOCO.includes("|") ? process.env.FOCO : TEMAS_PEDAGOGIA[semanaDelAnio() % TEMAS_PEDAGOGIA.length];
  const propuestos = await investigadorPedagogia(tema, vigente);
  const r = await auditorRigor(propuestos, vigente);
  for (const h of r.aprobados) {
    if (h.matiza) {
      const viejo = vigente.actualizaciones.find((a) => slug(a.tema) === slug(h.matiza) && a.estado === "activo");
      if (viejo) { viejo.estado = "reemplazado"; viejo.reemplazado_el = HOY; }
    }
    vigente.actualizaciones.push({ fecha: HOY, tema: h.tema, hallazgo: h.hallazgo, aplicacion: h.aplicacion, fuente: h.fuente, url: h.url, evidencia: h.evidencia || "moderada", estado: "activo" });
  }
  vigente.actualizado = HOY;
  await writeFile(VIGENTE, JSON.stringify(vigente, null, 1) + "\n");
  const l = [`# Investigador neuropedagógico — ${HOY}`, "", `Tema de la semana: ${tema}.`, "", "> Aprobar el Pull Request = SABI aplica estos hallazgos desde el siguiente turno.", ""];
  for (const h of r.aprobados) l.push(`## ${h.tema}`, `- Hallazgo: ${h.hallazgo}`, `- En SABI: ${h.aplicacion}`, `- Fuente: ${h.fuente} (${h.url})`, `- Evidencia: ${h.evidencia}`, ...(h.matiza ? [`- Reemplaza a: ${h.matiza}`] : []), ...(h._revisarManual ? [`- Revisar a mano: ${h._revisarManual}`] : []), "");
  if (r.rechazados.length) { l.push(`## Rechazados (${r.rechazados.length})`, ""); r.rechazados.forEach((x) => l.push(`- ${x.tema || "(sin tema)"}: ${x.motivo}`)); }
  await guardarInforme("pedagogia", l.join("\n"));
}

async function modoCobertura() {
  const banco = JSON.parse(await readFile(BANCO, "utf8"));
  const filas = cobertura(banco);
  const l = [`# Cobertura del banco de proyectos — ${HOY}`, "", "| Área | Grados | Proyectos | Tipos que faltan |", "|---|---|---|---|"];
  filas.forEach((f) => l.push(`| ${f.area} | ${f.banda} | ${f.total} | ${f.faltan.join(", ") || "completo"} |`));
  await guardarInforme("cobertura", l.join("\n"));
}

// ---------------------------------------------------------------------------
// Agente 5 — Dots investigadores de herramientas pedagógicas (uno por área, rotan cada semana)
// ---------------------------------------------------------------------------
const HERRAMIENTAS = "data/herramientas-didacticas.json";
const DOTS_HERRAMIENTAS = [
  ["Dot_Matematicas_Estrategica", "Matemáticas", "manipulativos virtuales, generadores de ejercicios y fichas, juegos de cálculo mental y razonamiento, geometría dinámica, dinero y finanzas"],
  ["Dot_LecturaCritica_Lenguaje", "Lectura y Lenguaje", "comprensión lectora literal, inferencial y crítica, textos graduados por nivel, vocabulario en contexto, escritura con propósito"],
  ["Dot_CienciasNaturales_STEAM", "Ciencias Naturales", "simuladores de laboratorio, experimentos caseros seguros, observación de la naturaleza, datos científicos abiertos"],
  ["Dot_CienciasSociales_Ciudadanas", "Ciencias Sociales y Ciudadanas", "mapas interactivos, líneas de tiempo, fuentes primarias, simulaciones de ciudadanía y economía"],
  ["Dot_Bilinguismo_Ingles", "Inglés", "escucha y habla, lectura graduada, vocabulario, pronunciación"],
  ["Dot_InteligenciaEmocional_Valores", "Inteligencia emocional y valores", "juegos cooperativos, dilemas, regulación emocional, convivencia"],
  ["Dot_EducacionDigital_IA", "Educación digital e IA", "pensamiento computacional, programación por bloques, ciudadanía digital, IA explicada a niños"],
  ["Dot_Didacticas_Transversales", "Didácticas transversales", "escape rooms, gamificación con criterio, generadores de juegos, plantillas imprimibles, código abierto para crear juegos educativos infinitos"],
];

async function investigadorHerramientas(dot, existentes) {
  const [nombre, area, foco] = dot;
  const system = `Eres ${nombre}, Dot investigador de herramientas pedagógicas de SABI para ${area}. ${CONTEXTO}
Buscas herramientas REALES que hagan que los niños y jóvenes aprendan de verdad (no solo que se
entretengan): ${foco}. Prioriza gratuitas, de navegador o celular, en español, sin cuentas de
estudiantes, sin publicidad ni compras, y de código abierto o de instituciones serias (universidades,
museos de ciencia, ministerios, fundaciones educativas). Cada herramienta debe aparecer en tus
resultados de búsqueda con su URL oficial. Nunca inventes una URL ni una herramienta.`;
  const user = `Herramientas que SABI ya tiene (no repetir):\n${existentes.map((h) => `- ${h.nombre}: ${h.url}`).join("\n") || "(ninguna todavía)"}

Propón hasta ${MAX_NUEVOS} herramientas. Responde SOLO un arreglo JSON:
{"nombre": "...", "url": "https://...", "dot": "${nombre}", "area": "${area}", "grados": {"desde": 0-11, "hasta": 0-11},
 "tipo": "generador|simulador|juego|manipulativo|banco|plantilla|app|codigo-abierto",
 "para_que": "qué aprendizaje concreto logra", "como_usar": "una actividad de clase en 3 pasos",
 "comando": "comando de SABI que la potencia (/worksheet, /escape, /experimento, /lectura...) o vacío",
 "costo": "gratis|freemium", "cuenta": "ninguna|docente|estudiante", "idioma": "...", "sin_internet": true|false,
 "licencia": "si es código abierto, cuál; si no, vacío", "evidencia_busqueda": "dónde la encontraste"}`;
  const texto = await claude({ system, user, max_tokens: 4500, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }] });
  const lista = extraerJSON(texto);
  return Array.isArray(lista) ? lista.slice(0, MAX_NUEVOS) : [];
}

async function auditoresHerramientas(candidatos, existentes, recursos) {
  const urls = new Set([...existentes.map((h) => h.url), ...recursos].map((u) => String(u).replace(/\/+$/, "").toLowerCase()));
  const tecnicos = [], rechazados = [];
  for (const c of candidatos) {
    if (!["nombre", "url", "para_que", "como_usar"].every((k) => String(c[k] || "").trim())) { rechazados.push({ ...c, motivo: "campos vacíos" }); continue; }
    if (!urlSegura(c.url)) { rechazados.push({ ...c, motivo: "URL no segura o vetada" }); continue; }
    if (urls.has(String(c.url).replace(/\/+$/, "").toLowerCase())) { rechazados.push({ ...c, motivo: "ya está en SABI" }); continue; }
    const g = c.grados || {};
    if (!(Number.isInteger(g.desde) && Number.isInteger(g.hasta) && g.desde >= 0 && g.hasta <= 11 && g.desde <= g.hasta)) { rechazados.push({ ...c, motivo: "grados inválidos" }); continue; }
    if (c.cuenta === "estudiante") { rechazados.push({ ...c, motivo: "exige cuenta del estudiante (Ley 1581)" }); continue; }
    const vivo = await enlaceVivo(c.url);
    if (!vivo.ok) { rechazados.push({ ...c, motivo: `enlace caído (${vivo.estado})` }); continue; }
    if (vivo.manual) c._revisarManual = vivo.manual;
    tecnicos.push(c);
  }
  if (!tecnicos.length) return { aprobados: [], rechazados };
  const conId = tecnicos.map((c, i) => ({ ...c, _id: i }));
  const system = `Eres el Comité Auditor de herramientas pedagógicas de SABI. ${CONTEXTO}
Cuatro voces independientes, sin complacencia:
1. Pedagógica: produce aprendizaje real y transferible (no solo diversión ni conductismo de clic).
2. Seguridad de menores: sin chat con desconocidos, sin publicidad ni compras, sin datos de menores.
3. Acceso: gratis, celular o navegador, conectividad limitada, español.
4. Pertinencia: sirve a los Estándares y DBA del MEN y al contexto de Cali.
Puntúa de 1 a 5 y mejora "como_usar" si puedes.`;
  const user = `Herramientas:\n${JSON.stringify(conId, null, 2)}\n\nResponde SOLO un arreglo JSON:
{"_id": n, "puntajes": {"pedagogico": 1-5, "seguridad": 1-5, "acceso": 1-5, "pertinencia": 1-5}, "observaciones": "...", "como_usar": "versión mejorada o null"}`;
  const veredictos = extraerJSON(await claude({ system, user, max_tokens: 4000 }));
  const aprobados = [];
  for (const c of conId) {
    const v = veredictos.find((x) => x._id === c._id);
    const { _id, ...h } = c;
    if (!v?.puntajes) { rechazados.push({ ...h, motivo: "sin veredicto" }); continue; }
    const n = ["pedagogico", "seguridad", "acceso", "pertinencia"].map((k) => Number(v.puntajes[k]));
    const prom = n.reduce((a, b) => a + b, 0) / n.length;
    const ok = n.every((x) => x >= 3) && n[1] >= 4 && prom >= 3.75;   // la regla la decide el código
    if (typeof v.como_usar === "string" && v.como_usar.trim()) h.como_usar = v.como_usar.trim();
    h._auditoria = { puntajes: v.puntajes, promedio: Number(prom.toFixed(2)), observaciones: v.observaciones };
    (ok ? aprobados : rechazados).push(ok ? h : { ...h, motivo: `no alcanzó el estándar (promedio ${prom.toFixed(2)}, seguridad ${n[1]})` });
  }
  return { aprobados, rechazados };
}

async function modoHerramientas() {
  let datos;
  try { datos = JSON.parse(await readFile(HERRAMIENTAS, "utf8")); } catch { datos = { actualizado: HOY, herramientas: [] }; }
  let recursos = [];
  try { recursos = (JSON.parse(await readFile("data/recursos.json", "utf8")).recursos || []).map((r) => r.url).filter(Boolean); } catch {}
  const foco = process.env.FOCO;
  const dot = DOTS_HERRAMIENTAS.find((d) => foco && (d[0] === foco || d[1].toLowerCase().includes(foco.toLowerCase()))) || DOTS_HERRAMIENTAS[semanaDelAnio() % DOTS_HERRAMIENTAS.length];
  const propuestas = await investigadorHerramientas(dot, datos.herramientas);
  const r = await auditoresHerramientas(propuestas, datos.herramientas, recursos);
  for (const h of r.aprobados) {
    const { _auditoria, _revisarManual, evidencia_busqueda, ...limpio } = h;
    datos.herramientas.push({ id: `h-${slug(h.nombre)}`, ...limpio, estado: "activo", verificado: HOY });
  }
  datos.actualizado = HOY;
  await writeFile(HERRAMIENTAS, JSON.stringify(datos, null, 1) + "\n");
  const l = [`# ${dot[0]} — herramientas pedagógicas — ${HOY}`, "", `Área: ${dot[1]}.`, "", "> Aprobar el Pull Request = el tutor las recomienda a los docentes del área.", ""];
  for (const h of r.aprobados) l.push(`## ${h.nombre}`, `- [${h.url}](${h.url}) · ${h.tipo} · grados ${h.grados.desde}-${h.grados.hasta} · ${h.costo} · cuenta: ${h.cuenta}`, `- Para qué: ${h.para_que}`, `- Cómo usarla: ${h.como_usar}`, `- Comité: promedio ${h._auditoria.promedio} — ${h._auditoria.observaciones}`, ...(h._revisarManual ? [`- Revisar a mano: ${h._revisarManual}`] : []), "");
  if (r.rechazados.length) { l.push(`## Rechazadas (${r.rechazados.length})`, ""); r.rechazados.forEach((x) => l.push(`- ${x.nombre || "(sin nombre)"}: ${x.motivo}`)); }
  await guardarInforme("herramientas", l.join("\n"));
}

// ---------------------------------------------------------------------------
// Agente 6 — Investigador de experimentos (llena el grado y eje más débil del banco)
// ---------------------------------------------------------------------------
async function modoExperimentos() {
  const dba = JSON.parse(await readFile("data/dba-ciencias.json", "utf8"));
  let banco;
  try { banco = JSON.parse(await readFile("data/experimentos.json", "utf8")).experimentos || []; } catch { banco = []; }
  const t = coberturaDe(banco);
  let grado, eje;
  if (process.env.FOCO && process.env.FOCO.includes("|")) [grado, eje] = [Number(process.env.FOCO.split("|")[0]), process.env.FOCO.split("|")[1]];
  else {
    const celdas = [];
    for (let g = 0; g <= 11; g++) for (const e of Object.keys(EJES)) celdas.push([(t[g]?.[e] || 0) / MINIMO_EJE[e], t[g]?.total || 0, g, e]);
    celdas.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    [, , grado, eje] = celdas[0];
  }
  const archivo = `data/experimentos/grado-${grado}.json`;
  let base;
  try { base = JSON.parse(await readFile(archivo, "utf8")); } catch { base = { grado, experimentos: [] }; }
  const dbaGrado = (dba.grados?.[String(grado)]?.dba || []).map((d) => `DBA ${d.n}: ${d.enunciado}`).join("\n");
  const titulos = base.experimentos.map((e) => `- ${e.titulo}`).join("\n");
  const ultimo = Math.max(0, ...base.experimentos.filter((e) => e.eje === eje).map((e) => Number(String(e.id).split("-").pop()) || 0));
  const system = `Eres el Investigador de experimentos de Ciencias de SABI. ${CONTEXTO}
Diseñas experimentos que enseñan por indagación (pregunta, predicción, prueba, evidencia, explicación)
con materiales caseros y baratos de Cali, seguros para la edad. Puedes buscar en la web ideas de fuentes
serias (universidades, museos de ciencia, programas como Pequeños Científicos o Ondas de Minciencias),
pero la redacción es tuya y adaptada al grado. Nunca uses cloro, ácidos fuertes, solventes, electricidad
del tomacorriente, pilas de botón ni imanes pequeños; el fuego y el calor solo con supervisión adulta.`;
  const user = `Grado ${grado} (0 = Transición). Eje: ${EJES[eje]} (${eje}).
DBA de Ciencias Naturales de este grado (usa SOLO estos números):
${dbaGrado}
Ya existen estos experimentos en el grado (no repetir la idea):
${titulos || "(ninguno)"}

Diseña ${MAX_NUEVOS} experimentos. Responde SOLO un arreglo JSON con objetos:
{"id": "g${grado}-${CORTO[eje]}-NN (continúa desde ${String(ultimo + 1).padStart(2, "0")})", "grado": ${grado}, "eje": "${eje}", "titulo": "...", "pregunta": "¿...?",
 "dba": [números], "duracion_min": 5-120, "materiales": ["..."], "pasos": ["3 a 10 pasos"], "prediccion": "pregunta de predicción",
 "observa": "qué observar o medir", "explicacion": "por qué pasa, al nivel del grado", "error_comun": "concepción alternativa frecuente",
 "seguridad": {"nivel": "libre|supervision|docente", "nota": "..."}, "variable": "reto: qué variable cambiar", "conexion": "vida cotidiana en Cali", "tags": ["..."]}`;
  const propuestas = extraerJSON(await claude({ system, user, max_tokens: 6000, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] }));
  const tecnicos = [], rechazados = [];
  for (const e of Array.isArray(propuestas) ? propuestas : []) {
    const s = revisarSeguridad(e);
    if (s.rechazo.length) { rechazados.push({ ...e, motivo: `seguridad: ${s.rechazo.join(", ")}` }); continue; }
    if (e.seguridad && !nivelSuficiente(e.seguridad.nivel, s.exige)) e.seguridad = { nivel: s.exige, nota: e.seguridad.nota || `Requiere supervisión por: ${s.motivos.join(", ")}.` };
    const p = validarExperimento(e, dba, grado);
    if (base.experimentos.some((x) => x.id === e.id)) p.push("id repetido");
    if (p.length) { rechazados.push({ ...e, motivo: p.join(" | ") }); continue; }
    tecnicos.push(e);
  }
  let aprobados = [];
  if (tecnicos.length) {
    const sys2 = `Eres el Auditor científico y pedagógico de experimentos de SABI. ${CONTEXTO}
Revisas sin complacencia: exactitud científica de la explicación (sin errores conceptuales), seguridad
real para la edad, que el procedimiento funcione de verdad con esos materiales, adecuación al grado y
alineación con el DBA citado. Puntúa de 1 a 5 y corrige la explicación si tiene un error.`;
    const user2 = `Experimentos:\n${JSON.stringify(tecnicos.map((e, i) => ({ ...e, _id: i })), null, 2)}\n\nResponde SOLO un arreglo JSON:
{"_id": n, "puntajes": {"ciencia": 1-5, "seguridad": 1-5, "funciona": 1-5, "edad": 1-5, "dba": 1-5}, "observaciones": "...", "explicacion_corregida": "..." o null}`;
    const ver = extraerJSON(await claude({ system: sys2, user: user2, max_tokens: 4000 }));
    tecnicos.forEach((e, i) => {
      const v = ver.find((x) => x._id === i);
      const n = v?.puntajes ? ["ciencia", "seguridad", "funciona", "edad", "dba"].map((k) => Number(v.puntajes[k])) : [];
      if (n.length && n.every((x) => x >= 3) && n[0] >= 4 && n[1] >= 4) {
        if (v.explicacion_corregida) e.explicacion = v.explicacion_corregida;
        aprobados.push({ ...e, origen: "investigador", verificado: HOY, _obs: v.observaciones });
      } else rechazados.push({ ...e, motivo: v?.puntajes ? `auditor: ${n.join("/")}` : "sin veredicto" });
    });
  }
  base.experimentos.push(...aprobados.map(({ _obs, ...e }) => e));
  await writeFile(archivo, JSON.stringify(base, null, 1) + "\n");
  await armar();
  const l = [`# Investigador de experimentos — ${HOY}`, "", `Foco: grado ${grado}, ${EJES[eje]}.`, "", "> Aprobar el Pull Request = aparecen en experimentos.html y en el tutor.", ""];
  for (const e of aprobados) l.push(`## ${e.id} · ${e.titulo}`, `- ${e.pregunta}`, `- Seguridad: ${e.seguridad.nivel}${e.seguridad.nota ? " — " + e.seguridad.nota : ""}`, `- Auditor: ${e._obs || ""}`, "");
  if (rechazados.length) { l.push(`## Rechazados (${rechazados.length})`, ""); rechazados.forEach((x) => l.push(`- ${x.titulo || x.id || "(sin título)"}: ${x.motivo}`)); }
  await guardarInforme("experimentos-investigador", l.join("\n"));
}

const modo = process.argv[2] || "proyectos";
({ proyectos: modoProyectos, pedagogia: modoPedagogia, cobertura: modoCobertura, herramientas: modoHerramientas, experimentos: modoExperimentos }[modo] || modoProyectos)().catch((e) => {
  console.error("El equipo investigador se detuvo sin modificar los datos:", e.message);
  process.exit(1);
});
