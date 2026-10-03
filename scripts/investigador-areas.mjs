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
//
// Variables: ANTHROPIC_API_KEY (obligatoria), MODELO (opcional), MAX_NUEVOS (por defecto 3),
//            FOCO (opcional, ej. "Física|arduino" o "evaluación formativa")
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";

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

const modo = process.argv[2] || "proyectos";
({ proyectos: modoProyectos, pedagogia: modoPedagogia, cobertura: modoCobertura }[modo] || modoProyectos)().catch((e) => {
  console.error("El equipo investigador se detuvo sin modificar los datos:", e.message);
  process.exit(1);
});
