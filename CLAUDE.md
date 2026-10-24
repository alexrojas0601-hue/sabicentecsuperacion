# Instrucciones para Claude en este repositorio

Aplicación: **SABICENTEC Superación (tutor, experimentos, fichas, juegos y proyectos)**. Hace parte del ecosistema SABI CENTEC del Colegio CENTEC Córdoba (Comuna 15, Cali).

## Regla principal
Toda tarea en este repositorio sigue `docs/PROMPT-MAESTRO-SABI.md`, la gobernanza común del ecosistema. Incluye los Dots investigadores, auditores y de mejora; los tutores por área; la instrucción maestra visual; los comandos didácticos (`/worksheet` `/escape` `/detective` `/boardgame` `/stations` `/manipulative` `/comic` `/lapbook` `/puzzle` `/minibook` y demás) y los comandos de pensamiento (`/ultrathink` `/stepback` `/firstprinciples` … `/selfcheck`).

El tutor tiene su propio cerebro en `PROMPT_MAESTRO_SABI.md` (v5), aplicado en `functions/api/chat.js`, y los agentes están en `AGENTES.md`. Ese prompt manda en todo lo del tutor; `docs/PROMPT-MAESTRO-SABI.md` es la gobernanza común del ecosistema. Si los mejoras, mantenlos coherentes.

## No negociables
1. Que las personas verdaderamente aprendan: producir el recurso (no describirlo), interpretarlo, aplicarlo y comprobar la comprensión.
2. Currículo MEN (EBC y DBA con número y redacción oficial; si no se verifica, se dice) y áreas SABI (matemática y estadística financiera, inteligencia emocional, inglés, STEAM, SENA).
3. Evidencia revisada por pares con DOI verificado; nada de neuromitos; nunca inventar datos ni referencias.
4. Seguridad infantil y privacidad (Ley 1581 de 2012): nadie ve datos de otros; nada personal en archivos públicos.
5. Pedagogía del error: «El error no nos detiene: nos enseña, nos fortalece y nos hace crecer».
6. Identidad: azul #1A2D7A, naranja #F47C20, dorado #F5C518; español de Colombia claro, sin juicio.
7. Todo contenido nuevo queda «en revisión» hasta que lo apruebe el docente o el equipo responsable.

## Antes de publicar
- No romper lo que funciona: probar en navegador, en computador y en celular, sin errores de JavaScript.
- Aplicar `/factcheck` y `/selfcheck`, y que un Dot auditor distinto de quien creó el contenido lo revise.
- Commit en español que diga qué cambió; Cloudflare despliega desde GitHub. Verificar que el despliegue terminó.

## Propiedad y protección (no quitar)
- Titulares: **SABI CENTEC — Alexander Rojas Zamorano, Paula Andrea Rojas Cairasco y Daniela Rojas Cairasco**. Licencia propietaria en `LICENSE` (todos los derechos reservados, no es código abierto).
- Se publica la raíz del repositorio (Cloudflare Pages, sin build, con Pages Functions en `functions/`). Cada HTML que se sirve lleva: comentario de derechos tras `<!DOCTYPE html>`, metas `author`/`copyright`/`rights`/`robots noai`/`og:site_name`, JSON-LD con `copyrightHolder` y el pie `.sabi-derechos` («© 2025-2026 SABI CENTEC… Todos los derechos reservados»). Toda página nueva debe llevarlos.
- `sabi-proteccion.js` (raíz) se carga en todas las páginas públicas. Es disuasivo (aviso «Copia no autorizada» fuera de *.sabicentec.com, bloqueo de marcos ajenos, imágenes protegidas, Ctrl+S/Ctrl+U desactivados, fuente en textos largos copiados): la protección real es el aviso legal + el registro ante la DNDA.
- `robots.txt` bloquea bots de IA y copiadores; `_headers` agrega cabeceras de derechos y `frame-ancestors` (no agregar CSP completa: el sitio usa CDNs y APIs externas).
