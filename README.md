# sabicentecsuperacion.com

Sitio institucional de **SABICENTEC SUPERACIÓN** — la familia de maestros de IA
y el mentor transformacional de Colegio CENTEC (Cali, Colombia).

## Estructura

Sitio estático de un solo archivo, sin build ni dependencias:

```
index.html   ← todo el sitio (HTML + CSS + JS inline)
```

## Despliegue en Cloudflare Pages (conectado a este repo de GitHub)

1. En Cloudflare → **Workers & Pages** → **Create application** → pestaña **Pages** → **Connect to Git**.
2. Selecciona este repositorio (`sabicentecsuperacion`).
3. Configuración de build:
   - **Framework preset:** None
   - **Build command:** (vacío — no hay build)
   - **Build output directory:** `/`
4. Deploy. Cloudflare da una URL temporal tipo `sabicentecsuperacion.pages.dev`.
5. **Dominio propio:** en el proyecto de Pages → **Custom domains** → agregar
   `sabicentecsuperacion.com` (y `www.sabicentecsuperacion.com` si aplica).
   Si el dominio ya está en Cloudflare (mismo panel), el DNS se conecta automático.

## Actualizar el sitio

Cada `git push` a la rama principal vuelve a desplegar automáticamente.

## Rector

Alexander Rojas Zamorano — Colegio CENTEC.
