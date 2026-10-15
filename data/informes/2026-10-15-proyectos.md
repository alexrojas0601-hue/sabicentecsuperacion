# Investigador de proyectos por área — 2026-10-15

Foco: Artes, 3° a 5°, tipo robotica.

> Aprobar el Pull Request = publicar en proyectos.html y en el tutor.

## Robot Artista: Máquina que pinta historias de Cali
- Pregunta motriz: ¿Cómo podríamos enseñarle a un robot a pintar o dibujar los símbolos y ritmos de la salsa caleña?
- Producto: Un robot simulado (en Wokwi o Tinkercad) programado para trazar patrones salsa (ocho, vueltas) o líneas que representen ritmos; video documental del proceso creativo del robot; instalación artística con el código impreso y la trayectoria del robot proyectada.
- Aprendizaje: Estándar: Reconocer elementos constitutivos del lenguaje visual (línea, forma, color) y su capacidad expresiva. DBA (Artes 3-5): Interpreta manifestaciones artísticas y culturales a través de la exploración sensorial. Competencia: Pensamiento crítico sobre cómo la tecnología puede expresar arte; comunicación del patrimonio caleño a través de nuevos lenguajes.
- Pensamiento y lógica: Pensamiento de diseño (design thinking): empatía con la salsa → definición del problema visual → prototipado con código → iteración artística. Modelo lógico: secuencia de instrucciones que generan un patrón emergente. · Lógica algorítmica y secuencial: el robot recibe comandos de movimiento (giro, avance, pausa) que, ordenados, crean un patrón que se percibe como expresión artística. Ejemplo: 'Girar 45°, avanzar 10 unidades, bajar marcador, girar 90°' repetido genera una espiral salsa.
- Herramienta: [Wokwi](https://wokwi.com)
- Comité: promedio 5 — Proyecto excelente: pregunta motriz auténtica sobre patrimonio caleño, DBA explícito en Artes, pensamiento de diseño iterativo claro. Wokwi garantiza acceso sin hardware ni voltaje. Producto público (galería + documental) conecta con comunidad real. Gamificación con criterio pedagógico (niveles de complejidad, votación de pares).
- Evidencia web: Wokwi es un simulador gratuito en navegador que soporta Arduino y componentes como servos; permite simular movimiento programado sin hardware físico, ideal para grados 3-5 con conexión débil. No requiere instalación ni descarga.

## Esculturas Cinéticas: Robots que bailan el ritmo del barrio
- Pregunta motriz: ¿Qué pasaría si pudiéramos programar un robot para que baile o se mueva al ritmo de la música de nuestro barrio?
- Producto: Simulación de robot (VEXcode VR) que ejecuta una secuencia de movimientos coordinados (giros, desplazamientos) sincronizados con un audio corto de salsa/cumbia local; descarga de video MP4 de la coreografía robot; galería interna en servidor escolar (sin subida a redes públicas) donde estudiantes votan coreografía favorita.
- Aprendizaje: Estándar: Expresar ideas mediante distintos lenguajes (visual, corporal, sonoro). DBA (Artes 3-5): Desarrolla procesos de creación artística que impliquen exploración multisensorial. Competencia: Pensamiento lógico-artístico; coordinación entre secuencias programadas y ritmo musical; análisis de movimiento como forma de comunicación.
- Pensamiento y lógica: Pensamiento sistémico y temporal: comprensión de que el movimiento robot es una secuencia de pasos en tiempo; equivalencia entre patrón musical (compás) y patrón de código (bucles, delays). Modelo cinético del arte. · Lógica temporal y secuencial con bifurcaciones: 'Si el ritmo es rápido, aumentar velocidad y reducir pausa entre movimientos; si es lento, invertir'. Uso de bucles (repetición de pasos de baile). Ejemplo: un bucle que hace girar al robot 90° cuatro veces (vuelta completa) cada 2 segundos crea efecto de ritmo.
- Herramienta: [VEXcode VR](https://vr.vex.com)
- Comité: promedio 4.5 — Fortalezas: pregunta motriz clara, pensamiento temporal-sistémico explícito, lógica de bucles y ritmo bien fundamentada. Debilidad: VEXcode VR requiere navegador moderno (riesgo en conexión débil de barrio) y la 'performance simulada en redes internas' es vaga—especificar cómo se comparte (descarga MP4, enlace público seguro). Revalidar acceso='ya' antes de aprobar (error 403 en búsqueda).
- Revisar a mano: no respondió a tiempo (403); abrir a mano antes de aprobar
- Evidencia web: VEXcode VR es un simulador web gratuito (vr.vex.com) diseñado específicamente para estudiantes grados 3+ sin robots físicos; soporta block-based coding y múltiples playgrounds 3D; sincronización de movimiento con tiempo ideal para expresión cinética.

## Luz Programada: Instalación de arte digital que responde a movimiento
- Pregunta motriz: ¿Podemos crear una obra de arte que cambie de color o brillo cuando detecte que alguien se acerca o se mueve?
- Producto: Circuito simulado en Tinkercad con LED RGB y sensor de distancia (ultrasónico simulado) que cambia de color según proximidad; código comentado en español (educativo); video timelapse de interacción (MP4 descargado); código impreso en papel A4 exhibido en aula junto a descripción de lógica condicional; acceso a simulación vía QR estático (código no requiere login si docente comparte como 'view-only').
- Aprendizaje: Estándar: Combinar elementos artísticos con tecnología para crear nuevas formas de expresión. DBA (Artes 3-5): Reconoce y aprecia diferentes formas de expresión artística (plástica, visual, audiovisual). Competencia: Pensamiento crítico sobre retroalimentación en sistemas; comprensión de causa-efecto en arte interactivo; valoración del arte contemporáneo mediado por tecnología.
- Pensamiento y lógica: Pensamiento de sistemas y feedback loops: entrada (sensor) → procesamiento (decisión lógica) → salida (luz). Pensamiento computacional sobre condicionales: 'Si distancia < 30cm, rojo; si 30-60cm, amarillo; si > 60cm, azul'. · Lógica condicional (if-else) anidada con variables numéricas. Ejemplo: `if (distancia < 30) { LED rojo } else if (distancia < 60) { LED amarillo } else { LED azul }`. Bucle de lectura constante del sensor crea efecto de respuesta en tiempo real.
- Herramienta: [Tinkercad Circuits](https://www.tinkercad.com/circuits)
- Comité: promedio 4.5 — Fortalezas: feedback loop explícito (entrada→procesamiento→salida), lógica condicional bien ejemplificada, arte interactivo conecta DBA. Debilidades: Tinkercad requiere cuenta Autodesk (acceso='codigo' sugiere barreras); especificar que docente crea carpeta compartida sin cédulas de menores. 'Galería QR' es vaga—detallar si es código impreso en aula o link digital seguro interno.
- Evidencia web: Tinkercad Circuits es simulador Arduino gratuito en navegador; soporta componentes como LED RGB, sensores ultrasónicos simulados, y código C++; ideal para electrónica educativa sin hardware; beginner-friendly con block y text coding.

