# Especificación: banco de experimentos SABI CENTEC (Colegio CENTEC, Cali, Colombia)

Escribes en español de Colombia, prosa clara de libro, sin emojis. Cada experimento debe ser
REAL (funciona de verdad), SEGURO para la edad, con materiales caseros o de bajo costo que se
consigan en Cali (tienda de barrio, papelería, cocina), y alineado con los Derechos Básicos de
Aprendizaje (DBA) y los Estándares Básicos de Competencias en Ciencias Naturales del MEN de
Colombia para el grado indicado. Nunca inventes números o códigos de DBA: describe en palabras
el aprendizaje del DBA/estándar al que apunta.

## Cantidad y reparto
Exactamente 50 experimentos para tu grado, 10 por cada eje:
- "materia"  : Materia y sus cambios (estados, mezclas, propiedades, cambios físicos)
- "fuerza"   : Fuerza y movimiento (empujar, halar, fricción, gravedad, palancas, flotación, presión)
- "energia"  : Luz, sonido y energía (sombras, reflexión, color, vibración, calor, electricidad segura, magnetismo)
- "vida"     : Seres vivos y cuerpo humano (plantas, animales, células, sentidos, sistemas, ecosistemas, salud)
- "quimica"  : Química según el grado (disoluciones, ácidos y bases con indicador de repollo, reacciones
               con bicarbonato y vinagre, oxidación, densidad, cromatografía, pH, estequiometría sencilla,
               velocidad de reacción, electroquímica con limón, polímeros, etc.)
Adapta la profundidad al grado: Transición a 2° = jugar, observar, predecir, nombrar; 3° a 5° = variables,
medir, registrar en tablas; 6° a 8° = modelos, variables controladas, gráficas; 9° a 11° = cuantificar,
ecuaciones, error experimental, hipótesis contrastables. No repitas experimentos dentro de tu grado.

## Seguridad (obligatoria)
- Prohibido: fuego abierto o calor para menores de 6°; ácidos o bases fuertes; electricidad de la red
  (110 V); vidrio caliente; sustancias tóxicas; productos de limpieza mezclados; láser.
- En 6° a 11° el calor solo con supervisión adulta y fuente controlada (agua caliente de grifo o
  hervidor manejado por adulto). Electricidad solo con pilas.
- Campo "supervision": "adulto presente" | "adulto realiza el paso de riesgo" | "autónomo con normas".

## Formato de salida
Un archivo JSON válido (UTF-8), un arreglo de 50 objetos con EXACTAMENTE estas claves:
{
  "id": "G{grado}-{eje}-{nn}"            (ej. "G3-fuerza-04"; grado 0 = Transición),
  "grado": número 0..11,
  "eje": "materia|fuerza|energia|vida|quimica",
  "titulo": "nombre atractivo y corto",
  "pregunta": "la pregunta científica que el niño quiere responder",
  "aprendizaje": "qué aprende, en palabras del DBA/estándar MEN (sin códigos)",
  "duracion_min": número,
  "materiales": ["lista con cantidades"],
  "supervision": "...",
  "seguridad": "precaución concreta para este experimento",
  "prediccion": "pregunta para que prediga ANTES de hacer",
  "pasos": ["4 a 8 pasos numerables, en imperativo, claros"],
  "observa": "qué debe observar, medir o registrar (y cómo: tabla, dibujo, gráfica)",
  "explicacion": "por qué ocurre, científicamente correcto, al nivel del grado (3-6 frases)",
  "error_comun": "la concepción alternativa típica que este experimento ayuda a corregir",
  "pregunta_pensar": "pregunta de nivel alto (por qué / qué pasaría si / cómo lo probarías)",
  "variable_reto": "qué variable cambiar para un segundo experimento propio",
  "conexion": "conexión con la vida en Cali, otra área (matemáticas, lenguaje, tecnología) o un valor"
}
Escribe el archivo con la herramienta Write en la ruta indicada. Después valida con
`node -e "const a=JSON.parse(require('fs').readFileSync(RUTA,'utf8'));console.log(a.length, new Set(a.map(x=>x.id)).size)"`
que haya 50 objetos y 50 ids únicos, y corrige si no. Termina respondiendo solo "OK <n>".
Tu revisión final como auditor: lee cada experimento y pregúntate "¿funciona de verdad?, ¿es seguro
para esta edad?, ¿la explicación es científicamente correcta?". Corrige cualquier fallo antes de terminar.
