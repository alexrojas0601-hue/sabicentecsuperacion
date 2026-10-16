// ============================================================================
// Auditor de seguridad de experimentos (código, sin IA: no se le puede convencer)
// ----------------------------------------------------------------------------
// Revisa materiales y pasos de cada experimento del banco (data/experimentos.json).
//   - PROHIBIDO: se rechaza el experimento, sin excepción.
//   - SUPERVISIÓN: el experimento solo pasa si declara seguridad.nivel "supervision" o "docente"
//     (y "docente" cuando el grado es bajo).
// Las frases en negativo ("nunca mires al sol", "sin fuego") no cuentan como uso.
// ============================================================================

const plano = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// [expresión, motivo, grado mínimo permitido (null = nunca)]
const PROHIBIDOS = [
  [/\b(cloro|lejia|hipoclorito|blanqueador)\b/, "cloro o lejía (gases tóxicos al mezclarse)", null],
  [/\bacido (muriatico|clorhidrico|sulfurico|nitrico|fluorhidrico)\b|\bmuriatico\b/, "ácido fuerte", null],
  [/\b(soda caustica|hidroxido de sodio|hidroxido de potasio|destapacanerias|destapa ?canerias)\b/, "base cáustica", null],
  [/\bamoniaco\b/, "amoníaco", null],
  [/\bmercurio\b/, "mercurio", null],
  [/\b(polvora|fuegos artificiales|petardo|totes?)\b/, "pólvora", null],
  [/\b(gasolina|thinner|acetona|varsol|keroseno|queroseno)\b/, "solvente inflamable", null],
  [/\bhielo seco\b/, "hielo seco (quemaduras por frío)", null],
  [/\b(tomacorriente|toma corriente|enchufe|110 ?v|120 ?v|220 ?v|corriente (de la casa|domiciliaria|alterna))\b/, "electricidad de la red", null],
  [/\b(desarmar|abrir|perforar) (una )?(bateria|pila)\b|bateria de litio/, "baterías desarmadas o de litio", null],
  [/\bagua oxigenada (al|de) ([4-9]|[1-9][0-9]) ?%|peroxido de hidrogeno (al|de) ([4-9]|[1-9][0-9]) ?%/, "agua oxigenada concentrada (más de 3 %)", null],
  [/\bmirar? (directamente )?al sol\b/, "mirar al Sol", null],
  [/\b(pila|bateria) de boton\b/, "pila de botón (riesgo grave si se traga)", 6],
  [/\biman(es)? de neodimio\b|\bimanes? pequen/, "imanes pequeños (riesgo grave si se tragan)", 6],
  [/\bpermanganato\b/, "permanganato de potasio", 9],
  [/\b(alcohol|etanol)\b.{0,60}\b(fuego|llama|encend|vela|mechero)\b|\b(fuego|llama|vela|mechero)\b.{0,60}\b(alcohol|etanol)\b/, "alcohol cerca del fuego", null],
];

// [expresión, motivo, grado hasta el cual lo hace solo el docente, grado desde el cual ya no exige supervisión]
const SUPERVISION = [
  [/\b(vela|fosforo|cerilla|encendedor|mechero|fuego|llama|quemar)\b/, "fuego", 7, 99],
  [/\b(cuchillo|bisturi|cuchilla|cortador|navaja|bistur)\b/, "objeto cortante", 5, 99],
  [/\b(agua caliente|agua hirviendo|hervir|estufa|horno|microondas|plancha|calentar)\b/, "calor o agua caliente", 3, 99],
  [/\b(vidrio|frasco de vidrio|botella de vidrio)\b/, "vidrio", -1, 99],
  [/\bglobos?\b/, "globos (riesgo de asfixia en menores de 8)", -1, 8],
  [/\bagua oxigenada|peroxido de hidrogeno\b/, "agua oxigenada al 3 %: guantes y gafas", 5, 99],
  [/\balcohol\b/, "alcohol antiséptico", 5, 99],
  [/\b(pila de 9 ?v|bateria de 9 ?v|cables?|bombillo|led)\b/, "circuito con pilas", -1, 6],
  [/\b(lupa)\b.{0,80}\b(sol)\b|\b(sol)\b.{0,80}\b(lupa)\b/, "lupa al sol (quemaduras)", 5, 99],
  [/\b(yodo|lugol)\b/, "yodo (mancha e irrita)", -1, 8],
  [/\b(clavo|tachuela|alfiler|aguja|chinche)\b/, "objeto punzante", 3, 99],
  [/\b(semillas? de ricino|higuerilla)\b/, "semillas tóxicas", 99, 99],
];

function usos(texto, re) {
  const out = [];
  const g = new RegExp(re.source, "g");
  let m;
  while ((m = g.exec(texto))) {
    const antes = texto.slice(Math.max(0, m.index - 18), m.index);
    if (!/\b(no|nunca|sin|evita|evitar|jamas|ni)\b[^.]*$/.test(antes)) out.push(m[0]);
    if (m.index === g.lastIndex) g.lastIndex++;
  }
  return out;
}

// Devuelve { rechazo: [motivos], exige: "libre"|"supervision"|"docente", motivos: [] }
export function revisarSeguridad(e) {
  const texto = plano([...(e.materiales || []), ...(e.pasos || []), e.titulo, e.variable].join(" · "));
  const g = Number(e.grado);
  const rechazo = [];
  for (const [re, motivo, gmin] of PROHIBIDOS) if (usos(texto, re).length && (gmin === null || g < gmin)) rechazo.push(motivo);
  let exige = "libre";
  const motivos = [];
  for (const [re, motivo, hasta, libreDesde] of SUPERVISION) {
    if (!usos(texto, re).length || g >= libreDesde) continue;
    if (hasta === 99) { rechazo.push(motivo); continue; }
    motivos.push(motivo);
    if (g <= hasta) exige = "docente";
    else if (exige === "libre") exige = "supervision";
  }
  return { rechazo, exige, motivos };
}

const ORDEN = { libre: 0, supervision: 1, docente: 2 };
export function nivelSuficiente(declarado, exige) {
  return (ORDEN[declarado] ?? -1) >= ORDEN[exige];
}
