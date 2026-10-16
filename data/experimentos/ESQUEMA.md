# Banco de experimentos SABI CENTEC — esquema

Un archivo por grado: `grado-00.json` (Transición), `grado-01.json` … `grado-11.json`.
Cada archivo es un arreglo JSON de 50 objetos con esta forma exacta:

{
  "id": "g03-e017",                       // gNN-eNNN, único
  "grado": 3,                              // 0 = Transición
  "eje": "materia-cambios" | "fuerza-movimiento" | "luz-sonido-energia" | "seres-vivos-cuerpo" | "quimica" | "tierra-universo",
  "titulo": "¿Por qué flota el limón y se hunde la papa?",
  "gancho": "Pregunta o misterio real de Cali/Colombia que despierta curiosidad (1-2 frases).",
  "dba": "Aprendizaje del MEN al que apunta, descrito en palabras (DBA de Ciencias Naturales del grado). No inventes numeraciones.",
  "prediccion": "Qué se le pide al niño que prediga ANTES de hacerlo.",
  "materiales": ["materiales caseros, seguros y baratos"],
  "pasos": ["paso 1", "paso 2", "…"],          // 4 a 8 pasos cortos, en orden
  "seguridad": "Nota de seguridad concreta (adulto presente cuando aplica).",
  "adulto": true | false,
  "que_pasa": "Explicación científica correcta adaptada a la edad (2-4 frases).",
  "concepto": "Nombre del concepto clave",
  "vocabulario": ["3 a 5 palabras clave"],
  "preguntas": ["literal", "inferencial", "de transferencia a la vida real"],
  "reto": "Variación para investigar cambiando UNA variable.",
  "minutos": 15
}

Reglas de seguridad no negociables: solo materiales domésticos o escolares de bajo riesgo
(agua, sal, azúcar, vinagre, bicarbonato, limón, repollo morado, aceite de cocina, globos,
imanes, linternas, pilas de 1,5 a 9 V, espejos, lupas, semillas). Nunca mezclar productos de
limpieza, nunca probar sustancias, nunca fuego ni calor sin adulto (y nunca fuego antes de 6°),
nunca red eléctrica de 110 V, nada con animales vivos que les cause daño.
