# superacion.sabicentec.com

Sitio institucional de **SABICENTEC SUPERACIÓN** — la familia de maestros de IA
y el mentor transformacional de Colegio CENTEC (Cali, Colombia).

## Estructura

```
index.html               ← página institucional (misión, objetivos, arquitectura)
tutor.html                ← chat funcional con SABI
sabi-avatar.png            ← avatar oficial
functions/api/chat.js       ← backend (Cloudflare Pages Function) que llama a Claude
```

## Despliegue en Cloudflare Pages (conectado a este repo de GitHub)

1. En Cloudflare → **Workers & Pages** → **Create application** → pestaña **Pages** → **Connect to Git**.
2. Selecciona este repositorio (`sabicentecsuperacion`).
3. Configuración de build:
   - **Framework preset:** None
   - **Build command:** (vacío — no hay build)
   - **Build output directory:** `/`
4. Deploy. Cloudflare da una URL temporal tipo `sabicentecsuperacion.pages.dev`.
5. **Clave de API:** Settings → Environment variables → Add variable →
   `ANTHROPIC_API_KEY` (marcar **Encrypt**) → volver a desplegar. Sin esto,
   el chat de `tutor.html` no responde.
6. **Dominio propio:** en el proyecto de Pages → **Custom domains** → agregar
   `superacion.sabicentec.com`. Como `sabicentec.com` ya vive en la misma
   cuenta de Cloudflare, el DNS se conecta automático.

## Importante: no usar GitHub Pages para este repo

GitHub Pages solo sirve archivos estáticos — no puede ejecutar
`functions/api/chat.js`. El chat de SABI **solo funciona en Cloudflare
Pages**. Si GitHub Pages está activo en este repo, sirve únicamente como
respaldo del código, no como el sitio que visitan los estudiantes.

## Control de costos (importante — leer antes de activar la clave)

Este proyecto está configurado deliberadamente para minimizar el gasto,
porque el rector lo financia solo:

- **Modelo:** Claude Haiku 4.5 — el más económico por token de la familia
  actual, capaz de sobra para tutoría de Transición a grado 11.
- **Caché de prompt activado:** el texto largo de instrucciones (system
  prompt) se cobra completo solo la primera vez de cada conversación
  activa; los siguientes mensajes reutilizan esa caché a una fracción del
  costo.
- **Historial limitado:** cada conversación solo reenvía los últimos 14
  mensajes, para que no crezca sin control en conversaciones muy largas.
- **Respuesta limitada:** máximo 700 tokens de salida por respuesta
  (suficiente para una explicación completa, sin desperdiciar en texto de
  más).

**Paso obligatorio antes de poner la clave en producción:** en
console.anthropic.com → Settings → Billing → poner un **límite de gasto
mensual** (por ejemplo $5-10 USD para empezar). Al llegarse a ese tope, el
sistema deja de responder hasta el mes siguiente — nunca se cobra de más
ni llega una factura sorpresa.



## Actualizar el sitio

Cada `git push` a la rama principal vuelve a desplegar automáticamente.

## Rector

Alexander Rojas Zamorano — Colegio CENTEC.
