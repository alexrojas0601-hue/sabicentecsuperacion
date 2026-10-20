# Especificación: banco de lecturas SABI CENTEC — "Leer es comprender, relacionar y pensar"

Colegio CENTEC, Cali, Colombia. Español de Colombia, sin emojis. Textos 100 % ORIGINALES
(escritos por ti; nunca copies textos publicados). Variedad de tipologías: cuento, fábula,
noticia escolar, texto expositivo científico, instructivo, carta, crónica de Cali, texto
argumentativo, infografía en prosa, poema original (solo en primaria, con rima sencilla).
Temas cercanos: el barrio Ciudad Córdoba, el río Cauca, la salsa, el Pacífico, la naturaleza
del Valle, el colegio, la familia, la ciencia, el dinero y el ahorro, la tecnología, los valores.

Longitud por grado: Transición–1° 60-110 palabras; 2°-3° 120-200; 4°-5° 200-320; 6°-8° 320-480;
9°-11° 450-650 (en 9°-11° incluye textos argumentativos y discontinuos tipo Saber 11).

## Cada lectura tiene 7 secciones (claves exactas)
{
  "id": "L{grado}-{nn}", "grado": 0..11, "tipologia": "...", "titulo": "...",
  "parrafos": ["el texto dividido en párrafos numerables (2 a 7)"],
  "literal": [ 4 objetos { "pregunta": "...", "evidencia": "copia EXACTA, carácter por carácter, de la oración o frase del texto que la responde", "parrafo": número 1-based } ],
  "entre_lineas": [ 2-3 objetos { "pregunta": "inferencia: qué se deduce aunque no esté escrito", "pista": "qué parte del texto ayuda", "respuesta_modelo": "..." } ],
  "palabras_contexto": [ 2-4 objetos { "palabra": "palabra TAL como aparece en el texto", "pregunta": "¿qué significa ... en este texto?", "opciones": ["A","B","C"], "correcta": índice, "explicacion": "cómo el contexto lo revela" } ],
  "donde_lo_pone": [ 2-3 objetos { "pregunta": "¿en qué párrafo se dice ...?", "parrafo": número, "explicacion": "..." } ],
  "orden_causas": { "secuencia": ["3-5 hechos del texto en el orden correcto"], "causa_efecto": [ 1-3 objetos { "causa": "...", "efecto": "..." } ] },
  "piensa_argumenta": [ 2 objetos { "pregunta": "pregunta crítica: opinar con razones, evaluar al autor, relacionar con su vida o con otro texto", "criterios": "qué debe tener una buena respuesta" } ],
  "valor": "valor que se puede conversar (una frase, sin sermón)"
}
Para Transición y 1°, las preguntas son orales y muy simples (el docente lee en voz alta);
"literal" igual exige evidencia exacta.

## Validación obligatoria (eres tu propio auditor)
Escribe el JSON con Write y luego ejecuta un script node que compruebe, para CADA pregunta literal,
que `parrafos[parrafo-1].includes(evidencia)` es verdadero, y para cada palabra_contexto que la
palabra aparece en el texto. Corrige hasta que todo pase. Revisa también ortografía y que las
respuestas sean inequívocas. Termina respondiendo solo "OK <n lecturas>".
