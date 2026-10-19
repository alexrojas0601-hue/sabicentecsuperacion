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

## Capa SUPERACIÓN de aprendizaje profundo (todas las áreas)

Desde octubre de 2026, el Planificador, el Maestro y el Auditor trabajan con una capa común
(`MOTOR_PROFUNDO` en `functions/api/chat.js`) más dos archivos vivos que leen en cada sesión:

| Pieza | Qué hace |
|---|---|
| Cómo se explica | Saberes previos, una idea por turno, el porqué, palabra más representación, ejemplo y contraejemplo, comprobación con un desempeño. |
| Modelos de pensamiento | Por banda de grado: Veo-pienso-me pregunto, Pólya, Paul y Elder, pensamiento científico, histórico, sistémico, de diseño, Toulmin. |
| Lógicas | Deductiva, inductiva, abductiva, analógica, causal, probabilística, formal, dialéctica, falacias y computacional. |
| Preguntar | Técnica de formulación de preguntas y preguntas socráticas; el estudiante formula al menos una pregunta propia por misión. |
| Obstáculos | Diagnóstico del tipo de error antes de reenseñar (enunciado, concepción alternativa, obstáculo epistemológico, prerrequisito, procedimiento, emoción). |
| Gamificación con criterio | Solo cuando sirve al aprendizaje; sin rankings que humillen; siempre cierra con reflexión. |
| `data/pedagogia-vigente.json` | Hallazgos de neurociencia, neuropedagogía y didáctica con fuente; tienen prioridad sobre la memoria del modelo. |
| `data/proyectos-areas.json` | Banco de proyectos por área y grado (robótica, Arduino, STEAM, Raspberry Pi, programación, juegos, simulación, ABP). Se ve en `proyectos.html`. |

El Planificador ahora entrega además: modelo de pensamiento, lógica, pregunta propia, obstáculo
probable, gamificación, proyecto y meta de desempeño Superior. El Auditor revisa cuatro criterios
nuevos (12 a 15) y registra en el estado el pensamiento usado, la pregunta del estudiante y el
obstáculo detectado.

## Equipo investigador por áreas (`scripts/investigador-areas.mjs`)

| Rol | Cuándo | Qué hace |
|---|---|---|
| Investigador neuropedagógico | Martes | Rota 16 temas (neurociencia, funciones ejecutivas, evaluación formativa, pensamiento crítico, didácticas por área, inclusión, IA en la escuela...). Busca evidencia con fuente y URL y propone hasta 2 hallazgos. |
| Auditor de rigor | Martes | Código: URL segura, no vetada, viva, sin neuromitos, sin repetidos. Claude: fidelidad a la fuente (mínimo 4), evidencia y aplicabilidad. Puede reemplazar un hallazgo viejo si la evidencia cambió. |
| Investigador de proyectos | Jueves | Mide la cobertura del banco (área x grados x tipo) y diseña hasta 3 proyectos donde hay vacíos, verificando la herramienta en la web. |
| Auditor técnico de proyectos | Jueves | Código: campos completos, tipos y grados válidos, URL segura y viva, sin repetidos. |
| Comité de proyectos | Jueves | Pedagógico, pensamiento, seguridad de menores y acceso; aprueba solo con promedio 3,75, ningún eje bajo 3 y seguridad mínimo 4. |
| Auditor humano final | Coordinación académica | Aprueba (merge) o cierra el Pull Request. |

Calendario: `.github/workflows/sabi-investigadores.yml`. Para ver qué falta sin gastar: Actions,
"SABI · investigadores por área", Run workflow, modo `cobertura`.

## IA institucional v3 (sabicentec.com) · Prompt Maestro de Gobernanza y Tutoría

Desde el 15 de octubre de 2026, `functions/api/institucional.js` aplica el Prompt Maestro del ecosistema
SABICENTEC y la Instrucción Maestra de educación visual. Detalle completo en el repositorio de la app:
`sabi-centec-AI--cali/AGENTES-IA.md`.

| Pieza | Qué hace |
|---|---|
| Enrutador de Dots | Elige uno de 8 Dots tutores (Matemáticas Estratégica con finanzas, Lectura Crítica, Ciencias STEAM, Sociales y Ciudadanas, Bilingüismo, Inteligencia Emocional, Técnico SENA, Educación Digital e IA). |
| Comandos | 19 herramientas (`/investigar`, `/proyecto`, `/paso_a_paso`, `/mathvisual`, `/flashcards`, `/quiz`, `/crucigrama`…) que obligan a PRODUCIR el recurso como bloque ```sabi``` o ```mermaid```, que la app dibuja. |
| Secuencia de aprendizaje | Objetivos, idea intuitiva, fundamentos, cómo funciona, ejemplo resuelto, usos y límites, errores frecuentes, práctica con recuperación activa y síntesis (memorizar, comprender, hacer, decidir). |
| Dot_Auditor_Riguroso | 8 criterios: los 6 del sello más validez de los recursos y de la microclase. |
| Pedagogía vigente | Lee `data/pedagogia-vigente.json` (la amplían los investigadores con aprobación de coordinación). |
| Dot_Investigador_SextoSentido | `scripts/investigador-sextosentido.mjs` cada viernes: tendencias de educación, tecnología y trabajo a 30-50 años → `data/tendencias.json` («Radar del futuro» de sabicentec.com), vía Pull Request. |

`GET /api/institucional` devuelve la versión, los Dots y los comandos (lo usa el Dot Vigía).

## Taller de Aprendizaje (`taller.html`) · desde el 19 de octubre de 2026

Una sola página con cinco talleres. Grado elegido arriba; casilla "Ver respuestas (docente)"; todo se imprime en hoja limpia.

| Taller | Qué trae | De dónde sale |
|---|---|---|
| Ciencia | 50 experimentos por grado (Transición a 11°), 10 por eje: materia y cambios; fuerza y movimiento; luz, sonido y energía; seres vivos y cuerpo humano; química. Ciclo predecir, hacer, observar y registrar, explicar, pensar más allá, diseñar mi experimento. | `data/experimentos/grado-NN.json` (especificación en `data/experimentos/ESPECIFICACION.md`) |
| Matemáticas | Fichas infinitas sin IA: cálculo a medida, problemas cotidianos, series y patrones, geometría visual (SVG con medidas), dinero y cambio (pesos colombianos), encuentra el error. Cada ficha abre con una buena idea y trae clave con el porqué y un reto final. El número de ficha la reproduce igual. | `taller-mate.js` · prueba `scripts/test-taller-mate.mjs` |
| Lectura | "Leer es comprender, relacionar y pensar": 4 preguntas literales con evidencia (el niño toca la oración y la app le dice si es la correcta), leer entre líneas, palabras en contexto, ¿dónde lo pone?, orden y causas (ordenar hechos), piensa y argumenta, valor. Banco más lecturas nuevas con IA desde un tema o un texto propio. | `data/lecturas/*.json` y `/api/taller` modo `lectura` |
| Didácticas | `/worksheet`, `/escape`, `/detective`, `/boardgame` (tablero SVG + tarjetas), `/stations`, `/manipulative` (concreto, pictórico, abstracto), `/comic`, `/lapbook`, `/puzzle` (sopa de letras, parejas, criptograma, anagramas, acertijo), `/minibook` (8 páginas de una hoja con plantilla de doblado). | `/api/taller` modo `didactica` |
| Pensar | 40 modos para docentes y directivos: razonar (`/ultrathink`, `/stepback`, `/firstprinciples`, `/chainofthought`), aprender (`/eli5`, `/technicaldeepdive`, `/analogy`, `/socratic`), escribir (`/rewrite`, `/shorten`, `/expand`, `/outline`), código (`/codereview`, `/debug`, `/refactor`, `/testcases`), decidir (`/procons`, `/swot`, `/riskcheck`, `/premortem`), ideas (`/brainstorm`, `/remix`, `/whatif`, `/metaphor`), comunicar (`/formalize`, `/casualize`, `/persuade`, `/deescalate`), planear (`/prd`, `/okrs`, `/timeline`, `/delegate`), verificar (`/factcheck`, `/citesources`, `/summarizeresearch`, `/trendcheck`), autoevaluarse (`/godmode`, `/critique`, `/iterate`, `/selfcheck`). | `/api/taller` modo `pensar` |

Cada recurso con IA pasa por tres filtros (`functions/api/taller.js`): el Dot tutor lo produce como JSON; un auditor de código
valida estructura y cantidades (y que cada evidencia literal esté copiada del texto; si falla, el Dot reintenta); el
Dot_Auditor_Riguroso lo resuelve por su cuenta y, si encuentra errores, entrega la versión corregida. La página dice si fue
aprobado, corregido o si el auditor no estuvo disponible. El tutor (`chat.js`) conoce el Taller y enlaza la parte útil.

### Dots del Taller (`scripts/dots-didactica.mjs`, `.github/workflows/sabi-didactica.yml`)

| Día | Dot | Qué hace |
|---|---|---|
| Lunes | Investigador didáctico del área (rota los 8 Dots del Prompt Maestro) | Busca en la web herramientas y estrategias reales con evidencia; auditor de código (URL segura y viva, sin repetidos) y comité (pedagogía, evidencia, seguridad de menores ≥ 4, acceso). → `data/herramientas-didacticas.json` |
| Miércoles | Dot de lectura | Escribe lecturas para los grados con menos; solo pasan si cada evidencia literal está copiada del texto. |
| Viernes | Auditor de experimentos | Revisa 24 experimentos por semana (funciona, seguro, ciencia correcta, nivel MEN); marca los dudosos (la página muestra el aviso) y completa ejes con menos de 10. |
| A mano | Cobertura | Actions → "SABI · Dots del Taller de Aprendizaje" → Run workflow → `cobertura`: tabla de qué hay por grado, sin gastar. |

Todo llega como Pull Request: **aprobar = publicar**.
