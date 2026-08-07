---
description: Pipeline completo de carrusel — investiga, filtra ideas, diseña y escribe el copy
argument-hint: "[tema opcional]"
---

Corré el pipeline completo de contenido de Yourebrand para: **$ARGUMENTS**

(Si no hay tema arriba, el investigador elige libremente según tendencias y lo que falte
cubrir en `memoria/temas-cubiertos.md`.)

Ejecutá los cuatro agentes **en orden**, pasándole a cada uno el resultado del anterior.
No los corras en paralelo: cada uno depende del output del previo.

1. **investigador** — traé material fresco con fuentes. Salida en `pipeline/1-research/`.
2. **estratega** — filtrá y bajá a tierra. Salida: briefs en `pipeline/2-ideas/`.
   Si genera más de una idea, seguí con **la de prioridad más alta** y dejá el resto en
   backlog. Decí cuáles quedaron en cola.
3. **disenador** — diseñá el carrusel del brief elegido y exportá los PNG.
   Tiene que revisar visualmente los PNG e iterar hasta que pasen el checklist de marca.
4. **copywriter** — escribí el `copy.md` mirando los slides ya diseñados.

## Al terminar

Mostrame:
- La ruta de `output/AAAA-MM-DD-<slug>/` y la lista de archivos generados.
- El **caption completo**, listo para copiar y pegar.
- Las ideas que quedaron en backlog, por si quiero producir otra.
- Cualquier cosa que haya quedado floja o que necesite decisión mía.

Si algún paso falla o queda dudoso, frená y decímelo en vez de seguir con material malo.
