# Investigador de proyectos por área — 2026-10-22

Foco: Artes, 6° a 8°, tipo raspberry.

> Aprobar el Pull Request = publicar en proyectos.html y en el tutor.

## Instalación sensorial: la huerta brilla
- Pregunta motriz: ¿Cómo puede la luz inteligente embellecer y proteger la huerta del colegio sin gastar mucha energía?
- Producto: Prototipo de sistema de iluminación interactiva con sensor de movimiento y luz ambiental, simulado en Wokwi, documentado para instalación futura
- Aprendizaje: Integración de arte y tecnología: luz como elemento expresivo; sensores y accionadores; diseño de interfaces amigables; pensamiento sistémico (causa-efecto en sistemas físicos)
- Pensamiento y lógica: Diseño de sistemas y pensamiento computacional: ciclos de entrada (sensores) → procesamiento → salida (luz) · Lógica condicional (if/else): si detecta movimiento Y es de noche, enciende LED RGB progresivamente; ejemplo: sensor PIR + sensor LDR → luminosidad adaptativa
- Herramienta: [Wokwi](https://wokwi.com)
- Comité: promedio 5 — Proyecto excelente: pregunta motriz auténtica conectada con Centec Verde; simulador Wokwi elimina riesgo eléctrico total; ciclo entrada-procesamiento-salida es modelo mental explícito y transferible. Los retos ('¿cuál es más eficiente?') entrenan pensamiento sistémico sin gamificación superflua. Acceso garantizado en contexto de bajo costo.
- Evidencia web: Wokwi es simulador gratuito en navegador para Raspberry Pi Pico, permite añadir sensores (PIR, LDR) y LEDs RGB; sin cuenta previa; ideal para prototipado sin hardware

## Danzante pixel: tu sombra se mueve con sensores
- Pregunta motriz: ¿Cómo podemos traducir el movimiento de nuestro cuerpo en arte visual y luz que responda en tiempo real?
- Producto: Performance interactivo: personaje pixel animado en Scratch que se mueve según sensores simulados de aceleración/proximidad; video-documental del resultado
- Aprendizaje: Integración Scratch + lógica Raspberry Pi (entrada/salida GPIO simulada); arte generativo; narrativa interactiva; competencia corporal (expresión física) + digital
- Pensamiento y lógica: Pensamiento computacional iterativo: captura → procesamiento → feedback visual; ciclo de mejora estética · Lógica de eventos: cuando webcam detecta movimiento (sin identificación), sprite gira; agregar deslizadores como entrada alternativa para distancia/aceleración simulada; usar variables para feedback suave.
- Herramienta: [Scratch 3 (online o Raspberry Pi OS)](https://scratch.mit.edu)
- Comité: promedio 3.75 — Fortalezas: integración Artes-STEM genuina, pensamiento iterativo claro, Scratch es seguro online. Debilidad crítica: depender de Raspberry Pi local introduce riesgo (menores manipulan GPIO) y requiere hardware escaso en contexto. Gamificación ('compite para detectar gestos secretos') puede desplazar aprendizaje significativo si no se regula. Propuesta: usar solo Scratch online con extensiones simuladas, no GPIO físico.
- Evidencia web: Scratch 3 incluye extensiones GPIO para Raspberry Pi en Raspberry Pi OS; permite entrada de sensores virtuales; pre-instalado en Raspbian; documentación oficial MIT para educación

## Rechazados (1)

- Museo interactivo del barrio: códigos QR y historias animadas: URL no segura o vetada
