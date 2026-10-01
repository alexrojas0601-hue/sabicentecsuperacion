/*
  SABI · Puerta de acceso al tutor de SABI Superación
  ----------------------------------------------------
  Permite que cualquier aplicación SABI (sabicentec.com, Familia de Maestros, Saber 11,
  Pedagogía, PreICFES) use el mismo tutor con los tres agentes, voz e idiomas, sin copiar código.

  Uso 1. Botón flotante (una sola línea antes de </body>):
    <script src="https://superacion.sabicentec.com/sabi-puerta.js" data-materia="Inglés"></script>
    Atributos opcionales: data-rol (estudiante | docente | padre), data-materia, data-mision
    (DETECTIVE | INVENTOR | CALI 2040 | ENSÉÑALE A SABI | MI TAREA), data-texto (texto del botón),
    data-boton="no" (para no mostrar el botón y usar solo la función).

  Uso 2. Desde el código de un simulador, por ejemplo al fallar una pregunta:
    SABI.abrir({ materia: 'Matemáticas', mision: 'MI TAREA', tema: 'No entendí la pregunta 12 sobre porcentajes' });
*/
(function () {
  var BASE = 'https://superacion.sabicentec.com/tutor.html';
  var script = document.currentScript || {};
  var cfg = (script.dataset) || {};

  function enlace(op) {
    op = op || {};
    var p = new URLSearchParams();
    p.set('rol', op.rol || cfg.rol || 'estudiante');
    if (op.materia || cfg.materia) p.set('materia', op.materia || cfg.materia);
    if (op.mision || cfg.mision) p.set('mision', op.mision || cfg.mision);
    if (op.tema) p.set('tema', String(op.tema).slice(0, 300));
    return BASE + '?' + p.toString();
  }

  window.SABI = {
    enlace: enlace,
    abrir: function (op) { window.open(enlace(op), '_blank', 'noopener'); }
  };

  if (cfg.boton === 'no') return;
  function pintar() {
    var a = document.createElement('a');
    a.href = enlace();
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = cfg.texto || 'Aprender con SABI';
    a.setAttribute('aria-label', 'Abrir el tutor SABI en una pestaña nueva');
    a.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483000;background:#0B1F3F;color:#FBF8F1;' +
      'font:600 16px/1 "Public Sans",system-ui,sans-serif;padding:14px 22px;border-radius:999px;text-decoration:none;' +
      'box-shadow:0 6px 20px rgba(11,31,63,.3);border:2px solid #F5A623;';
    document.body.appendChild(a);
  }
  if (document.body) pintar(); else document.addEventListener('DOMContentLoaded', pintar);
})();
