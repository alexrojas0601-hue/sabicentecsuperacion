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

## Agentes que trabajan en vivo con cada estudiante

Además del equipo curador semanal, cada sesión de un estudiante pasa por tres agentes:

| Agente | Cuándo actúa | Qué hace |
|---|---|---|
| Planificador pedagógico | Al iniciar cada misión | Diseña el plan de la sesión: DBA o estándar del grado, competencia MEN e ICFES, escalera de niveles de pensamiento, lectura crítica (literal, inferencial, crítica), estrategia de pensamiento, valor a comentar y técnicas de neuroaprendizaje. El estudiante ve el propósito en lenguaje sencillo. |
| Maestro de la asignatura | En cada turno | Enseña con el Motor de Experiencia más el módulo especializado de la materia construido por CENTEC (Matemáticas, Lenguaje, Inglés, Ciencias, Sociales, Ética y Religión, Artes). |
| Auditor neuropedagógico | En cada turno, antes de que la respuesta llegue al estudiante | Resuelve por su cuenta el contenido y lo compara, revisa ocho criterios (veracidad, que el estudiante piense, escalón correcto, neuroaprendizaje, lectura crítica y competencia, valor comentado, estilo de libro, seguridad), corrige si hace falta y registra el avance. |

El avance que registra el Auditor queda en el historial del estudiante, y el docente lo recibe en el informe pedagógico.
Para apagar el Auditor (por ejemplo, para ahorrar), crear en Cloudflare la variable `AUDITOR` con valor `no`.
