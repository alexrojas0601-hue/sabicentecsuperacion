# Equipo de agentes de SABI — Laboratorio de retos

El catálogo de retos STEAM, robótica, ABP y juegos (`recursos.html`) se mantiene solo, con
control humano al final. Nada se publica sin aprobación de coordinación académica.

| Rol | Quién lo hace | Qué hace |
|---|---|---|
| Investigador STEAM | Claude con búsqueda web | Cada lunes busca hasta 4 herramientas reales para el foco de la semana y diseña un reto con problema local y producto público. |
| Auditor técnico | Código (sin IA) | Rechaza URL no seguras, duplicadas, enlaces caídos o campos incompletos. No se le puede convencer. |
| Auditor pedagógico | Claude | Aprendizaje significativo, Bloom, calidad ABP, que no sea solo entretenimiento. |
| Auditor de seguridad de menores | Claude | Cuentas, chat con desconocidos, publicidad, compras, electricidad; Ley 1581. Exige 4 de 5. |
| Auditor de pertinencia y acceso | Claude | DBA/MEN, costo, conectividad, idioma, contexto real de Cali. |
| Auditor de enlaces | Código | El día 1 de cada mes revisa todo el catálogo; oculta lo que dejó de funcionar. |
| Auditor humano final | Coordinación académica | Lee el informe del Pull Request y aprueba (merge) o cierra. |

Los focos rotan por semana entre 18 cruces de herramienta × área (Arduino-Física,
Raspberry-Ciencias, juegos-Matemáticas, ABP-Sociales, robótica-Emprendimiento, etc.).

## Archivos
- `scripts/curador.mjs` — el equipo de agentes.
- `.github/workflows/sabi-curador.yml` — calendario (lunes y día 1 del mes).
- `data/recursos.json` — catálogo; lo leen `recursos.html` y el tutor SABI (`chat.js`).
- `data/informes/` — un informe por ejecución, para la coordinación.
- `skills/sabi-curador-steam/SKILL.md` — la misma metodología para usar a mano en Claude.

## Costo
Modelo por defecto: Claude Haiku 4.5 (el más económico), máximo 6 búsquedas y 4 recursos por
semana. Se puede subir la calidad con la variable `MODELO` en el workflow. El límite de gasto
mensual en console.anthropic.com protege contra cualquier sorpresa.
