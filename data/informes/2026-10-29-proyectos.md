# Investigador de proyectos por área — 2026-10-29

Foco: Educación Física, 6° a 8°, tipo raspberry.

> Aprobar el Pull Request = publicar en proyectos.html y en el tutor.

## Mi corazón corre: monitoreo de frecuencia cardíaca con Raspberry Pi Pico
- Pregunta motriz: ¿Cómo puedo saber si mi corazón late más rápido cuando corro que cuando estoy sentado, y cómo un Raspberry Pi detecta eso sin ir al hospital?
- Producto: Prototipo con Raspberry Pi Pico W + sensor de pulso óptico (bajo costo, disponible online) + display OLED. El sensor se coloca en dedo. La Pico lee pulsaciones en tiempo real, muestra BPM en pantalla, emite LED rojo que parpadea al ritmo del corazón. Luego, estudiantes corren 2 min y se repite. Se genera gráfico simple (reposo vs. ejercicio) en libreta de ciencias. Simulación en Tinkercad: modelar circuito antes de armar físico.
- Aprendizaje: Concepto fisiológico: respuesta cardiovascular a ejercicio (adaptación del cuerpo). Conceptos de sensores y señales analógicas. Variable dependiente (BPM) vs. independiente (intensidad ejercicio). Cálculo de frecuencia máxima teórica (220 - edad). Lectura de datos biométricos reales = pensamiento científico. Estándar: comprensión de sistemas corporales, relación entre función y estructura.
- Pensamiento y lógica: Pensamiento científico experimental: observación → hipótesis ("mi corazón corre más rápido si corro") → medición → análisis. Pensamiento computacional: captura de dato analógico → digitalización → visualización. · Lógica de sensor-acción: IF pulsación detectada THEN encender LED brevemente ELSE esperar. Lógica de rango: IF BPM < 100 THEN mostrar "reposo" ELIF BPM 100-150 THEN mostrar "moderado" ELIF BPM > 150 THEN mostrar "intenso".
- Herramienta: [Raspberry Pi Pico W + Sensor de Pulso (óptico, ~$10-15) + OLED SSD1306 (~$5); Tinkercad (simulador)](https://projects.raspberrypi.org/en/projects/beating-heart/; https://www.tinkercad.com/; https://github.com/Gemmus/HeartRateDetector)
- Comité: promedio 4.5 — Proyecto excelente: pregunta motriz auténtica, aprendizaje significativo anclado en fisiología real, pensamiento científico experimental explícito con lógica condicional clara. Fisiología + sensores + datos = DBA ciencias naturales 6-8. Seguridad robusta (bajo voltaje, sensor no invasivo, consentimiento Ley 1581), pero requiere protocolo escrito con enfermería para descartar contraindicaciones cardíacas. Acceso bueno en contexto CENTEC: Tinkercad gratis, Pico W ~$15 adquirible por colegio, GitHub abierto; faltan detalles sobre cómo distribuir hardware a estudiantes sin PC propia (práctica compartida vs. grupal).
- Evidencia web: Proyecto oficial Raspberry Pi Foundation 'Beating heart': Pico + sensor de pulso + LED, oficial y verificado. GitHub 'HeartRateDetector': Pico W + sensor óptico, código MicroPython abierto. Proyectos educativos Cornell ECE y Adafruit confirman viabilidad y seguridad de sensores de pulso en colegios. Tinkercad es herramienta gratuita de Autodesk para simular circuitos antes de armar.

## Rechazados (2)

- Entrenador de ejercicios con inteligencia artificial en Raspberry Pi: enlace caído (404)
- Carrera de avatares programada: tu velocidad real controla el juego: enlace caído (404)
