// Dot de Calidad (corrector de errores): revisa sin IA y sin costo que nada esté roto.
// Sintaxis de todo el JavaScript (archivos y scripts dentro del HTML), JSON de data/ y banco de experimentos.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const fallas = [];
const omitir = new Set([".git", "node_modules"]);
const archivos = (d) => readdirSync(d).flatMap((f) => {
  if (omitir.has(f)) return [];
  const p = join(d, f);
  return statSync(p).isDirectory() ? archivos(p) : [p];
});
const tmp = mkdtempSync(join(tmpdir(), "sabi-calidad-"));
const revisarJS = (codigo, origen) => {
  const f = join(tmp, "x.mjs");
  writeFileSync(f, codigo);
  try { execFileSync("node", ["--check", f], { stdio: "pipe" }); }
  catch (e) {
    // Los scripts del HTML pueden no ser módulos: se reintenta como script clásico.
    const g = join(tmp, "x.js"); writeFileSync(g, codigo);
    try { execFileSync("node", ["--check", g], { stdio: "pipe" }); }
    catch (e2) { fallas.push(`JavaScript con error en ${origen}: ${String(e2.stderr).split("\n").slice(0, 5).join(" ")}`); }
  }
};

for (const p of archivos(".")) {
  const ext = extname(p);
  if (ext === ".js" || ext === ".mjs") revisarJS(readFileSync(p, "utf8"), p);
  else if (ext === ".html") {
    const s = readFileSync(p, "utf8");
    [...s.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:application\/(?:ld\+)?json|text\/template)")[^>]*>([\s\S]*?)<\/script>/g)]
      .forEach((m, i) => m[1].trim() && revisarJS(m[1], `${p} (script ${i + 1})`));
  } else if (ext === ".json" && p.startsWith("data")) {
    try { JSON.parse(readFileSync(p, "utf8")); } catch (e) { fallas.push(`JSON inválido en ${p}: ${e.message}`); }
  }
}
try { execFileSync("python3", ["scripts/validar-experimentos.py"], { stdio: "pipe" }); }
catch (e) { fallas.push(`Banco de experimentos con fallas: ${String(e.stdout || e.stderr).slice(0, 800)}`); }

const informe = fallas.length
  ? `El Dot de Calidad encontró ${fallas.length} falla(s):\n\n${fallas.map((f) => "- " + f).join("\n")}\n\nEl error no nos detiene: nos enseña. Corregir y volver a correr el flujo «SABI · Dot de Calidad».`
  : "Sin fallas: JavaScript, JSON y banco de experimentos en orden.";
writeFileSync("informe-calidad.md", informe);
console.log(informe);
process.exit(fallas.length ? 1 : 0);
