#!/usr/bin/env python3
"""Valida data/experimentos/grado-NN.json contra ESQUEMA.md. Uso: python3 scripts/validar-experimentos.py [NN ...]"""
import json, re, sys, glob, os
EJES = {"materia-cambios","fuerza-movimiento","luz-sonido-energia","seres-vivos-cuerpo","quimica","tierra-universo"}
CLAVES = ["id","grado","eje","titulo","gancho","dba","prediccion","materiales","pasos","seguridad","adulto","que_pasa","concepto","vocabulario","preguntas","reto","minutos"]
base = os.path.join(os.path.dirname(__file__), "..", "data", "experimentos")
grados = sys.argv[1:] or [f"{g:02d}" for g in range(12)]
errores = 0
for g in grados:
    f = os.path.join(base, f"grado-{g}.json")
    def err(m):
        global errores; errores += 1; print(f"grado-{g}: {m}")
    if not os.path.exists(f): err("FALTA el archivo"); continue
    try: arr = json.load(open(f, encoding="utf-8"))
    except Exception as e: err(f"JSON inválido: {e}"); continue
    if not isinstance(arr, list): err("no es un arreglo"); continue
    if len(arr) < 50: err(f"tiene {len(arr)} experimentos (mínimo 50)")
    ids = set()
    for i, e in enumerate(arr):
        p = f"#{i+1} {e.get('id')}"
        faltan = [k for k in CLAVES if k not in e]
        if faltan: err(f"{p} faltan claves {faltan}")
        extra = [k for k in e if k not in CLAVES]
        if extra: err(f"{p} claves extra {extra}")
        if not re.fullmatch(rf"g{g}-e\d{{3}}", str(e.get("id",""))): err(f"{p} id mal formado")
        if e.get("id") in ids: err(f"{p} id repetido")
        ids.add(e.get("id"))
        if e.get("grado") != int(g): err(f"{p} grado={e.get('grado')}")
        if e.get("eje") not in EJES: err(f"{p} eje inválido {e.get('eje')}")
        if not isinstance(e.get("adulto"), bool): err(f"{p} adulto no booleano")
        if not isinstance(e.get("minutos"), int) or not 5 <= e.get("minutos", 0) <= 240: err(f"{p} minutos inválido")
        if not isinstance(e.get("pasos"), list) or not 4 <= len(e.get("pasos", [])) <= 8: err(f"{p} pasos debe tener 4-8")
        if not isinstance(e.get("vocabulario"), list) or not 3 <= len(e.get("vocabulario", [])) <= 5: err(f"{p} vocabulario 3-5")
        if not isinstance(e.get("preguntas"), list) or len(e.get("preguntas", [])) != 3: err(f"{p} preguntas debe tener 3")
        if not isinstance(e.get("materiales"), list) or not e.get("materiales"): err(f"{p} materiales vacío")
        for k in ["titulo","gancho","dba","prediccion","seguridad","que_pasa","concepto","reto"]:
            if not isinstance(e.get(k), str) or not e.get(k).strip(): err(f"{p} {k} vacío")
        txt = json.dumps(e, ensure_ascii=False).lower()
        if int(g) < 6 and re.search(r"\b(vela|fósforo|fosforo|encendedor|mechero|encender fuego)\b", txt): err(f"{p} usa fuego antes de 6°")
        sinnunca = re.sub(r'\b(nunca|jamás|jamas|sin|no)\b[^.,;:"]*', "", txt)  # las prohibiciones no cuentan como uso (sin cruzar de frase ni de campo)
        procedimiento = json.dumps(e.get("pasos", []) + e.get("materiales", []), ensure_ascii=False).lower()
        if not e.get("adulto") and re.search(r"\b(el|un|una|la) (adulto|docente|profesora?)\b", procedimiento): err(f"{p} los pasos piden un adulto pero adulto=false")
        if re.search(r"\b(enchufe|tomacorriente|110 ?v(oltios)?|120 ?v(oltios)?|corriente de la casa)\b", sinnunca): err(f"{p} usa la red eléctrica (solo pilas)")
        circuito = re.sub(r"(linterna|lámpara|lampara|vela|bombillo) led", "", procedimiento)
        if re.search(r"\bleds?\b", circuito) and re.search(r"\b(pila|cable|caimán|caiman)", procedimiento) and "resistencia" not in txt: err(f"{p} LED sin resistencia")
        if int(g) < 10 and re.search(r"ácido (clorhídrico|sulfúrico|nítrico)|acido (clorhidrico|sulfurico|nitrico)", sinnunca): err(f"{p} ácido fuerte antes de 10°")
        if int(g) == 0 and re.search(r"\bglobos?\b", sinnunca): err(f"{p} globo en Transición")
        if "neodimio" in txt and "docente" not in e.get("seguridad","").lower(): err(f"{p} imán de neodimio sin el docente")
        if re.search(r"\b(cloro|blanqueador|límpido|limpido|amoníaco|amoniaco|ácido muriático|soda cáustica)\b", txt) and not re.search(r"\b(nunca|jamás|jamas|no)\b[^.]*\b(mezcl|cloro|blanqueador|límpido|limpido|amon|muriático|soda)", e.get("seguridad","").lower()): err(f"{p} menciona producto peligroso sin advertencia específica")
    ejes = {e.get("eje") for e in arr}
    if ejes != EJES: err(f"no cubre todos los ejes: faltan {EJES-ejes}")
print("OK: todo cumple ESQUEMA.md" if errores == 0 else f"{errores} problema(s)")
sys.exit(1 if errores else 0)
