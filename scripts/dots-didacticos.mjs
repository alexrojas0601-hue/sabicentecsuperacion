// ============================================================================
// SABI — Dots didácticos: investigadores y auditores de herramientas pedagógicas
// ----------------------------------------------------------------------------
// Corre en GitHub Actions (.github/workflows/sabi-dots-didacticos.yml). Node 20+, sin
// dependencias. Nunca publica directo: deja sus propuestas en un Pull Request que
// coordinación académica aprueba (auditor humano final).
//
// Modos:
//   node scripts/dots-didacticos.mjs herramientas  -> el Dot del área de la semana busca (con
//        búsqueda web) herramientas, juegos, estrategias y recursos con evidencia; tres auditores
//        (pedagógico, seguridad de menores, evidencia) filtran; entra a data/herramientas-pedagogicas.json
//   node scripts/dots-didacticos.mjs experimentos  -> completa los grados con menos de 50
//        experimentos (data/experimentos/grado-NN.json) y audita una muestra de los existentes
//        (ciencia correcta + seguridad); corrige o retira lo que no pase
//   node scripts/dots-didacticos.mjs cobertura     -> solo informa qué falta
//
// Variables: ANTHROPIC_API_KEY (obligatoria), MODELO (opcional), AREA (opcional, fuerza el
//            área), MAX_NUEVOS (por defecto 4), LOTE (experimentos por grado y corrida, 10)
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";

const MODELO = process.env.MODELO || "claude-haiku-4-5-20251001";
const HOY = new Date().toISOString().slice(0, 10);
const BANCO = "data/herramientas-pedagogicas.json";
const EXP = (g) => `data/experimentos/grado-${String(g).padStart(2, "0")}.json`;
const MAX_NUEVOS = Number(process.env.MAX_NUEVOS || 4);
const LOTE = Number(process.env.LOTE || 10);
const EJES = ["materia-cambios", "fuerza-movimiento", "luz-sonido-energia", "seres-vivos-cuerpo", "quimica", "tierra-universo"];

// Un Dot por área (Prompt Maestro SABICENTEC). Rotan semana a semana.
const DOTS = [
  ["Dot_Matematicas_Estrategica", "Matemáticas, Estadística y Matemática Financiera", "manipulativos virtuales, juegos de cálculo mental, fichas graduadas, problemas cotidianos, series y patrones, geometría visual, dinero y cambio, Singapur CPA"],
  ["Dot_LecturaCritica_Lenguaje", "Lectura crítica y Lenguaje", "comprensión literal, inferencial y crítica, vocabulario en contexto, escritura, lectura en voz alta, bibliotecas digitales gratuitas en español"],
  ["Dot_CienciasNaturales_STEAM", "Ciencias Naturales, Química, Física y STEAM", "experimentos caseros seguros, simuladores (PhET, etc.), indagación, robótica educativa, cuadernos de ciencia"],
  ["Dot_CienciasSociales_Ciudadanas", "Ciencias Sociales y Competencias Ciudadanas", "historia con fuentes primarias, mapas interactivos, debates, juegos de rol, aprendizaje-servicio"],
  ["Dot_Bilinguismo_Ingles", "Inglés (hacia B2/C1)", "juegos de rol, pronunciación con reconocimiento de voz, lectura graduada, podcasts, intercambio, vocabulario espaciado"],
  ["Dot_InteligenciaEmocional_Valores", "Inteligencia emocional, ética y valores", "aprendizaje socioemocional con evidencia (CASEL), dilemas, mindfulness escolar, convivencia, comunicación no violenta"],
  ["Dot_Tecnico_SENA", "Formación técnica SENA y emprendimiento", "aprendizaje basado en proyectos, prototipado, finanzas personales, empleabilidad, emprendimiento escolar"],
  ["Dot_EducacionDigital_IA", "Educación digital, programación e IA", "programación por bloques, pensamiento computacional desconectado, alfabetización en IA, ciudadanía digital y seguridad en línea"],
];

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
function extraerJSON(t) {
  const s = String(t || ""); const i = Math.min(...["[", "{"].map((c) => { const k = s.indexOf(c); return k < 0 ? Infinity : k; }));
  if (!isFinite(i)) return null;
  const fin = s.lastIndexOf(s[i] === "[" ? "]" : "}");
  try { return JSON.parse(s.slice(i, fin + 1)); } catch { return null; }
}
async function leer(ruta, def) { try { return JSON.parse(await readFile(ruta, "utf8")); } catch { return def; } }
async function enlaceVivo(url) {
  try { const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 SABI-Dots" }, signal: AbortSignal.timeout(20000) }); return r.status !== 404 && r.status !== 410; }
  catch { return true; } // lento o bloqueado: queda para revisión humana en el PR
}
const informe = [];
const log = (t) => { console.log(t); informe.push(t); };

// ============================================================ HERRAMIENTAS
async function herramientas() {
  const banco = await leer(BANCO, { version: HOY, nota: "", herramientas: [] });
  const semana = Math.floor(Date.now() / (7 * 864e5));
  const dot = process.env.AREA ? DOTS.find((d) => d[0].toLowerCase().includes(process.env.AREA.toLowerCase()) || d[1].toLowerCase().includes(process.env.AREA.toLowerCase())) || DOTS[semana % DOTS.length] : DOTS[semana % DOTS.length];
  const [nombre, area, foco] = dot;
  const ya = banco.herramientas.filter((h) => h.area === area).map((h) => h.nombre).join("; ");
  log(`## ${nombre} — ${area} (${HOY})`);
  const system = `Eres ${nombre}, un agente investigador del ecosistema SABI del Colegio CENTEC (Cali, Colombia, Transición a 11°). Tu único trabajo es encontrar herramientas pedagógicas que logren que los niños VERDADERAMENTE aprendan: estrategias didácticas, juegos educativos, recursos y aplicaciones gratuitas o de bajo costo, con evidencia de que mejoran el aprendizaje. Busca en la web fuentes confiables (universidades, ministerios de educación, Education Endowment Foundation, What Works Clearinghouse, revistas revisadas por pares, organizaciones reconocidas). Nunca uses Grokipedia ni contenido sin autor. Prefiere recursos en español o fáciles de adaptar a Colombia, que funcionen con poca conectividad y sin cuentas para menores.`;
  const user = `Área: ${area}. Enfoque: ${foco}.
Ya tenemos: ${ya || "nada todavía"} (no repitas).
Propón hasta ${MAX_NUEVOS + 2} herramientas nuevas. Responde SOLO un arreglo JSON de objetos:
{"nombre": "...", "tipo": "estrategia|juego|recurso digital|material concreto|simulador|banco de actividades",
 "grados": "ej. 3° a 7°", "para_que": "qué aprendizaje concreto mejora (1 frase)",
 "como_usarla": "cómo la usa SABI o el docente en una sesión, paso a paso breve",
 "comando_sabi": "el comando o herramienta de SABI que mejor la aplica (ej. /escape, /worksheet, [[manipulativo base10 N]], /lectura) o 'docente'",
 "evidencia": "qué dice la investigación, con autor y año", "fuente": "URL verificable de la evidencia",
 "url": "URL del recurso si es digital, o vacío", "costo": "gratis|bajo|pago", "requiere_cuenta": true|false,
 "seguridad_menores": "chat con desconocidos, publicidad, compras, datos personales: qué tiene"}`;
  const propuestas = extraerJSON(await claude({ system, user, max_tokens: 6000, herramientas: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] })) || [];
  log(`Propuestas del investigador: ${propuestas.length}`);
  const sistemaAud = `Eres el Dot_Auditor_Riguroso de SABI CENTEC: tres auditores en uno (pedagógico, seguridad de menores según Ley 1581 de 2012 de Colombia, y evidencia científica). Eres exigente: rechaza lo que sea entretenimiento sin aprendizaje, lo que no tenga evidencia verificable, lo que exponga a menores a chat con desconocidos, publicidad o compras, o lo que exija datos personales de niños. Responde SOLO JSON.`;
  let nuevas = 0;
  for (const h of propuestas) {
    if (nuevas >= MAX_NUEVOS) break;
    if (!h?.nombre || banco.herramientas.some((x) => x.nombre.toLowerCase() === String(h.nombre).toLowerCase())) continue;
    if (h.url && !(await enlaceVivo(h.url))) { log(`- Rechazada por enlace caído: ${h.nombre}`); continue; }
    const v = extraerJSON(await claude({ system: sistemaAud, max_tokens: 900, user: `Audita esta herramienta para ${area}:\n${JSON.stringify(h)}\nResponde {"pedagogico": 1-5, "seguridad": 1-5, "evidencia": 1-5, "aprobada": true|false, "motivo": "...", "ajuste": "cómo usarla mejor en CENTEC (opcional)"}. Aprobada solo si los tres puntajes son 4 o 5.` }));
    if (!v?.aprobada || Math.min(v.pedagogico, v.seguridad, v.evidencia) < 4) { log(`- Rechazada: ${h.nombre} — ${v?.motivo || "sin veredicto"}`); continue; }
    banco.herramientas.push({ ...h, area, dot: nombre, auditoria: { pedagogico: v.pedagogico, seguridad: v.seguridad, evidencia: v.evidencia, nota: v.ajuste || "" }, fecha: HOY });
    nuevas++; log(`- Aprobada: ${h.nombre} (${h.tipo}, ${h.grados}) → ${h.comando_sabi}`);
  }
  banco.version = HOY;
  banco.nota = "Herramientas pedagógicas encontradas por los Dots investigadores por área y filtradas por el Dot Auditor Riguroso. El tutor (chat.js) las usa según la asignatura. Solo entran con Pull Request aprobado por coordinación académica.";
  await writeFile(BANCO, JSON.stringify(banco, null, 1));
  log(`Nuevas aprobadas: ${nuevas}. Total en el banco: ${banco.herramientas.length}.`);
}

// ============================================================ EXPERIMENTOS
const SEGURIDAD = `Reglas de seguridad no negociables: solo materiales domésticos o escolares de bajo riesgo (agua, sal, azúcar, vinagre, bicarbonato, limón, repollo morado, aceite de cocina, globos, imanes, linternas, pilas de 1,5 a 9 V, espejos, lupas, semillas). Nunca mezclar productos de limpieza, nunca probar sustancias, nunca fuego ni calor sin adulto (y nunca fuego antes de 6°), nunca red eléctrica de 110 V, nada que dañe animales.`;
async function experimentos() {
  const esquema = await readFile("data/experimentos/ESQUEMA.md", "utf8").catch(() => "");
  for (let g = 0; g <= 11; g++) {
    const lista = await leer(EXP(g), []);
    // 1) completar hasta 50
    if (lista.length < 50) {
      const falta = Math.min(LOTE, 50 - lista.length);
      const cuenta = Object.fromEntries(EJES.map((e) => [e, lista.filter((x) => x.eje === e).length]));
      log(`## Grado ${g}: tiene ${lista.length}, se generan ${falta}`);
      const texto = await claude({ max_tokens: 12000,
        system: `Eres el Dot_CienciasNaturales_STEAM de SABI CENTEC (Cali, Colombia): docente experto en ciencias para el grado ${g === 0 ? "Transición" : g + "°"}, didacta y experto en seguridad infantil. Diseñas experimentos alineados a los DBA de Ciencias Naturales del MEN. ${SEGURIDAD}`,
        user: `Esquema exacto:\n${esquema}\n\nYa existen estos títulos (no repitas el fenómeno): ${lista.map((x) => x.titulo).join(" | ")}\nConteo por eje: ${JSON.stringify(cuenta)} — equilibra los ejes con menos.\nEscribe ${falta} experimentos nuevos para el grado ${g}. Usa ids desde g${String(g).padStart(2, "0")}-e${String(lista.length + 1).padStart(3, "0")} en adelante. Responde SOLO el arreglo JSON.` });
      const nuevos = (extraerJSON(texto) || []).filter((e) => e?.titulo && Array.isArray(e.pasos) && EJES.includes(e.eje));
      for (const e of nuevos) {
        const v = await auditarExperimento(e, g);
        if (v.aprobado) { lista.push({ ...(v.corregido || e), grado: g, id: `g${String(g).padStart(2, "0")}-e${String(lista.length + 1).padStart(3, "0")}` }); log(`- Nuevo: ${e.titulo}`); }
        else log(`- Rechazado: ${e.titulo} — ${v.motivo}`);
      }
    }
    // 2) auditar una muestra de los existentes (rota cada corrida)
    const muestra = lista.filter((_, i) => (i + Math.floor(Date.now() / 864e5)) % 10 === 0).slice(0, 3);
    for (const e of muestra) {
      const v = await auditarExperimento(e, g);
      if (!v.aprobado && v.corregido) { Object.assign(e, v.corregido, { id: e.id, grado: g }); log(`- Corregido ${e.id}: ${v.motivo}`); }
      else if (!v.aprobado) log(`- ⚠ Revisar a mano ${e.id} (${e.titulo}): ${v.motivo}`);
    }
    if (lista.length) await writeFile(EXP(g), JSON.stringify(lista, null, 1));
  }
}
async function auditarExperimento(e, g) {
  const v = extraerJSON(await claude({ max_tokens: 3000,
    system: `Eres el Dot_Auditor_Riguroso de SABI CENTEC para ciencias. Verificas tres cosas: 1) la ciencia es correcta (la explicación "que_pasa" y el concepto no tienen errores ni simplificaciones falsas), 2) la seguridad cumple las reglas para el grado ${g === 0 ? "Transición" : g + "°"}, 3) es adecuado a la edad y al DBA. ${SEGURIDAD} Responde SOLO JSON.`,
    user: `Experimento:\n${JSON.stringify(e)}\nResponde {"aprobado": true|false, "motivo": "breve", "corregido": null o el objeto completo corregido si el problema se arregla editando (misma forma)}` }));
  return v || { aprobado: false, motivo: "el auditor no respondió JSON" };
}

// ============================================================ COBERTURA
async function cobertura() {
  for (let g = 0; g <= 11; g++) { const l = await leer(EXP(g), []); log(`Grado ${g}: ${l.length} experimentos ${l.length < 50 ? "(incompleto)" : ""}`); }
  const b = await leer(BANCO, { herramientas: [] });
  for (const [, area] of DOTS) log(`${area}: ${b.herramientas.filter((h) => h.area === area).length} herramientas`);
}

const modo = process.argv[2] || "cobertura";
try {
  if (modo === "herramientas") await herramientas();
  else if (modo === "experimentos") await experimentos();
  else await cobertura();
} finally {
  await mkdir("data/informes", { recursive: true });
  await writeFile(`data/informes/${HOY}-dots-${modo}.md`, `# SABI · Dots didácticos · ${modo} · ${HOY}\n\n${informe.join("\n")}\n`);
}
