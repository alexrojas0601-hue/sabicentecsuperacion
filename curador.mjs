// ============================================================================
// SABI — Equipo curador de recursos STEAM, robótica, ABP y aprendizaje con juego
// ----------------------------------------------------------------------------
// Corre en GitHub Actions (ver .github/workflows/sabi-curador.yml). Node 20+, sin
// dependencias. Nunca publica directo: deja los cambios en un Pull Request que
// la coordinación académica aprueba (el auditor humano final).
//
// Modos:
//   node scripts/curador.mjs curar            -> busca, audita y propone recursos nuevos
//   node scripts/curador.mjs auditar-enlaces  -> revisa que todo el catálogo siga vivo
//
// Variables de entorno:
//   ANTHROPIC_API_KEY  (obligatoria, secret del repo en GitHub)
//   MODELO             (opcional, por defecto claude-haiku-4-5-20251001: el más económico)
//   MAX_NUEVOS         (opcional, por defecto 4 recursos por semana)
//   FOCO               (opcional, ej. "arduino|Física" para forzar el tema de la semana)
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";

const CATALOGO = "data/recursos.json";
const INFORMES = "data/informes";
const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const MAX_NUEVOS = Number(process.env.MAX_NUEVOS || 4);
const HOY = new Date().toISOString().slice(0, 10);

const TIPOS = ["steam", "robotica", "arduino", "raspberry", "programacion", "juego", "simulacion", "abp", "docente"];
const COSTOS = ["gratis", "freemium", "pago"];
const HARDWARE = ["ninguno", "opcional", "requerido"];
const BLOOM = ["recordar", "comprender", "aplicar", "analizar", "evaluar", "crear"];
const PROYECTOS = ["Ciudadano 2040", "Guardianes Digitales", "Centec Verde", null];

// Fuentes vetadas por decisión de rectoría: contenido generado por IA sin verificación
// rigurosa. El auditor técnico las rechaza siempre, sin importar el puntaje.
const DOMINIOS_VETADOS = ["grokipedia.com"];

// Rotación semanal: cada semana el equipo investiga un cruce distinto de
// herramienta x área, para que el catálogo crezca equilibrado.
const FOCOS = [
  ["arduino", "Física"], ["raspberry", "Ciencias Naturales"], ["juego", "Matemáticas"],
  ["abp", "Ciencias Sociales"], ["robotica", "Tecnología"], ["simulacion", "Química"],
  ["juego", "Lenguaje"], ["steam", "Artes"], ["programacion", "Inglés"],
  ["abp", "Ética"], ["simulacion", "Biología"], ["juego", "Economía"],
  ["arduino", "Educación Física"], ["steam", "Matemáticas Financieras"], ["robotica", "Emprendimiento"],
  ["juego", "Transición y primaria"], ["raspberry", "Estadística"], ["abp", "Educación Sexual y Comportamiento"],
];

const CONTEXTO = `Colegio CENTEC, colegio privado de Transición a grado 11 en el barrio Ciudad Córdoba,
Comuna 15 de Santiago de Cali, Colombia. Comunidad con alta vulnerabilidad socioeconómica:
muchos estudiantes no tienen computador propio y el colegio tiene presupuesto limitado, por eso
se prefieren herramientas gratuitas, que corran en el navegador o en celular, y simuladores que
eviten comprar hardware. Modelo pedagógico: Proyecto FUTURO (pensamiento crítico, tecnología, IA,
educación financiera, ética, liderazgo). Proyectos institucionales: Ciudadano 2040 (ciudadanía y
ciudad), Guardianes Digitales (ciudadanía digital y seguridad), Centec Verde (ambiente).
Articulación SENA en 10° y 11°: Aplicaciones Móviles, Integración de Contenidos Digitales,
Recursos y Talento Humano. Currículo alineado a Estándares y DBA del MEN. Los estudiantes son
menores de edad: aplica la Ley 1581 de 2012 (protección reforzada de sus datos).`;

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

function clave(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return String(url).toLowerCase();
  }
}

function slug(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

function extraerJSON(texto) {
  const bloque = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  const crudo = bloque ? bloque[1] : texto;
  const ini = Math.min(...["[", "{"].map((c) => crudo.indexOf(c)).filter((i) => i >= 0));
  const fin = Math.max(crudo.lastIndexOf("]"), crudo.lastIndexOf("}"));
  if (!isFinite(ini) || fin < ini) throw new Error("La respuesta no trae JSON");
  return JSON.parse(crudo.slice(ini, fin + 1));
}

async function claude({ system, user, herramientas, max_tokens = 4000 }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY");
  const messages = [{ role: "user", content: user }];
  // Bucle por si la búsqueda web pausa el turno (stop_reason "pause_turn").
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODELO, max_tokens, system, messages, ...(herramientas ? { tools: herramientas } : {}) }),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }
    return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }
  throw new Error("La búsqueda no terminó en 4 vueltas");
}

async function enlaceVivo(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "GET", redirect: "follow", signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (SABI CENTEC curador; +https://superacion.sabicentec.com)" },
    });
    // 401/403/429: el sitio existe pero bloquea robots -> revisión manual, no rechazo.
    if (res.status < 400) return { ok: true, estado: res.status };
    if ([401, 403, 429].includes(res.status)) return { ok: true, manual: true, estado: res.status };
    return { ok: false, estado: res.status };
  } catch (e) {
    return { ok: false, estado: e.name === "AbortError" ? "timeout" : "sin respuesta" };
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// Agente 1 — Investigador STEAM (con búsqueda web)
// ---------------------------------------------------------------------------

async function investigador(foco, catalogo) {
  const conocidas = catalogo.recursos.map((r) => r.url).join("\n");
  const system = `Eres el Investigador STEAM del equipo curador de SABI. ${CONTEXTO}

Tu trabajo: encontrar herramientas, plataformas, simuladores, juegos educativos y guías de
proyectos REALES y vigentes que hagan el aprendizaje significativo y aplicado a problemas del
mundo real. Solo propones recursos que verificaste en los resultados de búsqueda de esta misma
sesión. Nunca inventes una URL: copia la URL exacta del resultado. No uses ni propongas
Grokipedia ni otras enciclopedias generadas por IA sin revisión humana: CENTEC exige
rigor académico verificable. Prefiere fuentes oficiales, universitarias o con revisión editorial. Si no encuentras suficientes
recursos de calidad, entrega menos; cero es una respuesta válida.

Para cada recurso diseñas un RETO contextualizado: un problema concreto que viven los
estudiantes en Ciudad Córdoba, en el colegio o en sus casas (agua, energía, basuras, movilidad,
convivencia, salud, economía familiar, seguridad digital…), y un PRODUCTO que alguien real va a
usar o ver (otra clase, las familias, la Junta de Acción Comunal, el colegio).`;

  const user = `Foco de esta semana: herramienta tipo "${foco[0]}" para el área "${foco[1]}".

Busca en la web y propone hasta ${MAX_NUEVOS} recursos NUEVOS. Prioriza: gratuitos, en español
o fáciles de usar sin dominar inglés, que funcionen en navegador o celular, sin exigir cuentas
personales de menores, y con evidencia de uso educativo real.

No repitas ninguna de estas URL que ya están en el catálogo:
${conocidas}

Responde SOLO un arreglo JSON (sin texto adicional) con objetos de esta forma exacta:
{
  "titulo": "nombre oficial de la herramienta",
  "url": "https://… (copiada del resultado de búsqueda)",
  "tipo": [uno o más de ${JSON.stringify(TIPOS)}],
  "areas": ["área o áreas escolares"],
  "grados": {"desde": 0-11, "hasta": 0-11},   // 0 = Transición
  "costo": uno de ${JSON.stringify(COSTOS)},
  "hardware": uno de ${JSON.stringify(HARDWARE)},
  "idioma": "español" | "inglés" | "multilingüe",
  "descripcion": "qué es y qué permite hacer, en 1-2 frases claras",
  "reto": {"titulo": "…", "problema": "problema real y local en 1-2 frases", "producto": "qué se entrega y para quién"},
  "proyecto_institucional": uno de ${JSON.stringify(PROYECTOS)},
  "bloom": uno de ${JSON.stringify(BLOOM)},
  "seguridad": "cómo usarlo protegiendo a menores (cuentas, chat, publicidad, datos)",
  "evidencia": "de dónde sabes que es real y educativo (sitio oficial, institución, estudio)"
}`;

  const texto = await claude({
    system, user, max_tokens: 6000,
    herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
  });
  const lista = extraerJSON(texto);
  return Array.isArray(lista) ? lista.slice(0, MAX_NUEVOS) : [];
}

// ---------------------------------------------------------------------------
// Agente 2 — Auditor técnico (código, sin IA: no se le puede convencer)
// ---------------------------------------------------------------------------

async function auditorTecnico(candidatos, catalogo) {
  const existentes = new Set(catalogo.recursos.map((r) => clave(r.url)));
  const aprobados = [], rechazados = [];
  for (const c of candidatos) {
    const motivo = [];
    if (!/^https:\/\//.test(c.url || "")) motivo.push("la URL no es https");
    if (existentes.has(clave(c.url))) motivo.push("ya está en el catálogo");
    try {
      const host = new URL(c.url).hostname.replace(/^www\./, "");
      if (DOMINIOS_VETADOS.some((d) => host === d || host.endsWith("." + d))) motivo.push("fuente vetada por rigor académico");
    } catch {}
    if (!c.titulo || !c.descripcion || !c.reto?.problema || !c.reto?.producto) motivo.push("faltan campos obligatorios");
    if (!Array.isArray(c.tipo) || !c.tipo.length || !c.tipo.every((t) => TIPOS.includes(t))) motivo.push("tipo inválido");
    const g = c.grados || {};
    if (!(Number.isInteger(g.desde) && Number.isInteger(g.hasta) && g.desde >= 0 && g.hasta <= 11 && g.desde <= g.hasta)) motivo.push("rango de grados inválido");
    if (!COSTOS.includes(c.costo)) motivo.push("costo inválido");
    if (!HARDWARE.includes(c.hardware)) motivo.push("hardware inválido");
    if (!BLOOM.includes(c.bloom)) c.bloom = "aplicar";
    if (!PROYECTOS.includes(c.proyecto_institucional ?? null)) c.proyecto_institucional = null;

    if (!motivo.length) {
      const v = await enlaceVivo(c.url);
      if (!v.ok) motivo.push(`el enlace no responde (${v.estado})`);
      else if (v.manual) c._revisarManual = `el sitio bloquea revisiones automáticas (${v.estado}); abrirlo a mano antes de aprobar`;
    }
    (motivo.length ? rechazados : aprobados).push(motivo.length ? { ...c, motivo: motivo.join("; ") } : c);
    existentes.add(clave(c.url));
  }
  return { aprobados, rechazados };
}

// ---------------------------------------------------------------------------
// Agentes 3, 4 y 5 — Comité auditor (pedagógico, seguridad de menores, pertinencia)
// ---------------------------------------------------------------------------

async function comiteAuditor(candidatos) {
  if (!candidatos.length) return { aprobados: [], rechazados: [] };
  const conId = candidatos.map((c, i) => ({ ...c, _id: i }));
  const system = `Eres el Comité Auditor de SABI. ${CONTEXTO}

Evalúas recursos propuestos por el Investigador. Hablas con tres voces independientes y luego
das el puntaje. No eres complaciente: un recurso mediocre se rechaza aunque la herramienta sea
famosa.

1. Auditor pedagógico: ¿el reto produce aprendizaje significativo (Ausubel) y aplicado? ¿tiene
   problema real, producto con público real y nivel de Bloom coherente con el grado? ¿cumple lo
   esencial de un buen proyecto ABP (pregunta auténtica, indagación, producto público)? ¿la
   herramienta sirve al aprendizaje o es solo entretenimiento?
2. Auditor de seguridad y datos de menores: ¿exige cuentas con datos personales de menores?
   ¿tiene chat abierto con desconocidos, publicidad agresiva, compras dentro del juego o
   contenido inapropiado? ¿la nota de seguridad es suficiente? (Ley 1581 de 2012).
3. Auditor de pertinencia y acceso: ¿es pertinente para el área y los grados indicados según
   Estándares/DBA del MEN? ¿es accesible para una comunidad con pocos recursos (costo,
   conectividad, idioma, celular)? ¿el contexto del reto es realmente de Cali y no genérico?

Puntúa cada eje de 1 a 5: pedagogico, contexto, seguridad, acceso. Si puedes mejorar el reto o
la nota de seguridad sin cambiar la herramienta, entrega la versión corregida.`;

  const user = `Recursos a auditar:
${JSON.stringify(conId, null, 2)}

Responde SOLO un arreglo JSON, un objeto por recurso:
{"_id": n, "puntajes": {"pedagogico": 1-5, "contexto": 1-5, "seguridad": 1-5, "acceso": 1-5},
 "observaciones": "2-3 frases con lo más importante",
 "reto_corregido": {"titulo": "...", "problema": "...", "producto": "..."} o null,
 "seguridad_corregida": "..." o null}`;

  const veredictos = extraerJSON(await claude({ system, user, max_tokens: 5000 }));
  const aprobados = [], rechazados = [];
  for (const c of conId) {
    const v = veredictos.find((x) => x._id === c._id);
    const { _id, ...rec } = c;
    if (!v?.puntajes) { rechazados.push({ ...rec, motivo: "el comité no emitió veredicto" }); continue; }
    const p = v.puntajes;
    const notas = [p.pedagogico, p.contexto, p.seguridad, p.acceso].map(Number);
    const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
    // La regla de aprobación la decide el código, no el modelo:
    // ningún eje por debajo de 3, seguridad mínimo 4, promedio mínimo 3.5.
    const ok = notas.every((n) => n >= 3) && Number(p.seguridad) >= 4 && promedio >= 3.5;
    if (v.reto_corregido?.problema) rec.reto = v.reto_corregido;
    if (v.seguridad_corregida) rec.seguridad = v.seguridad_corregida;
    rec._auditoria = { puntajes: p, promedio: Number(promedio.toFixed(2)), observaciones: v.observaciones };
    (ok ? aprobados : rechazados).push(ok ? rec : { ...rec, motivo: `no alcanzó el estándar (promedio ${promedio.toFixed(2)}, seguridad ${p.seguridad})` });
  }
  return { aprobados, rechazados };
}

// ---------------------------------------------------------------------------
// Informe para el auditor humano (coordinación académica)
// ---------------------------------------------------------------------------

function informe({ titulo, foco, nuevos, rechazados, notas = [] }) {
  const l = [`# ${titulo} — ${HOY}`, ""];
  if (foco) l.push(`**Foco de la semana:** ${foco[0]} · ${foco[1]}`, "");
  l.push("> Revisar antes de aprobar el Pull Request. Nada se publica sin esta aprobación.", "");
  if (nuevos?.length) {
    l.push(`## Propuestos para publicar (${nuevos.length})`, "");
    for (const r of nuevos) {
      l.push(`### ${r.reto.titulo}`, `- Herramienta: [${r.titulo}](${r.url}) · ${r.costo} · grados ${r.grados.desde}–${r.grados.hasta}`);
      l.push(`- Problema: ${r.reto.problema}`, `- Producto: ${r.reto.producto}`);
      if (r._auditoria) l.push(`- Comité: promedio ${r._auditoria.promedio} — ${r._auditoria.observaciones}`);
      if (r._revisarManual) l.push(`- ⚠️ ${r._revisarManual}`);
      if (r.evidencia) l.push(`- Evidencia: ${r.evidencia}`);
      l.push("");
    }
  }
  if (rechazados?.length) {
    l.push(`## Rechazados por los auditores (${rechazados.length})`, "");
    for (const r of rechazados) l.push(`- **${r.titulo || r.url}**: ${r.motivo}`);
    l.push("");
  }
  for (const n of notas) l.push(n);
  return l.join("\n");
}

async function guardar(catalogo, nombre, texto) {
  catalogo.actualizado = HOY;
  await writeFile(CATALOGO, JSON.stringify(catalogo, null, 2) + "\n");
  await mkdir(INFORMES, { recursive: true });
  await writeFile(`${INFORMES}/${HOY}-${nombre}.md`, texto + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, texto + "\n", { flag: "a" });
  console.log(texto);
}

// ---------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------

async function curar() {
  const catalogo = JSON.parse(await readFile(CATALOGO, "utf8"));
  const foco = process.env.FOCO ? process.env.FOCO.split("|") : FOCOS[semanaDelAnio() % FOCOS.length];
  console.log(`Foco: ${foco.join(" · ")} · modelo ${MODELO}`);

  const candidatos = await investigador(foco, catalogo);
  const tecnico = await auditorTecnico(candidatos, catalogo);
  const comite = await comiteAuditor(tecnico.aprobados);

  const nuevos = comite.aprobados.map((r) => {
    const { _auditoria, _revisarManual, evidencia, ...limpio } = r;
    return { id: slug(r.titulo), ...limpio, estado: "activo", verificado: HOY, origen: "curador" };
  });
  catalogo.recursos.push(...nuevos);

  await guardar(catalogo, "curaduria", informe({
    titulo: "Curaduría semanal de SABI", foco,
    nuevos: comite.aprobados, rechazados: [...tecnico.rechazados, ...comite.rechazados],
    notas: nuevos.length ? [] : ["Esta semana ningún recurso superó las auditorías. El catálogo no cambia."],
  }));
}

async function auditarEnlaces() {
  const catalogo = JSON.parse(await readFile(CATALOGO, "utf8"));
  const caidos = [], recuperados = [];
  for (const r of catalogo.recursos) {
    const v = await enlaceVivo(r.url);
    if (!v.ok && r.estado === "activo") { r.estado = "revisar"; r.nota_auditoria = `Enlace caído (${v.estado}) el ${HOY}`; caidos.push({ ...r, motivo: r.nota_auditoria }); }
    else if (v.ok && r.estado === "revisar") { r.estado = "activo"; delete r.nota_auditoria; recuperados.push(r); }
    if (v.ok) r.verificado = HOY;
  }
  await guardar(catalogo, "enlaces", informe({
    titulo: "Auditoría mensual de enlaces", rechazados: caidos,
    notas: [`Recuperados: ${recuperados.length}. Revisados: ${catalogo.recursos.length}.`,
      caidos.length ? "Los recursos caídos quedan ocultos en la página hasta que vuelvan a responder." : "Todos los enlaces activos responden."],
  }));
}

const modo = process.argv[2] || "curar";
(modo === "auditar-enlaces" ? auditarEnlaces() : curar()).catch((e) => {
  console.error("El equipo curador se detuvo sin modificar el catálogo:", e.message);
  process.exit(1);
});
