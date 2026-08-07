---
description: Diseña y escribe el copy de una idea ya briefeada
argument-hint: "<slug>"
---

Producí la pieza correspondiente al brief: **$ARGUMENTS**

El brief está en `pipeline/2-ideas/$ARGUMENTS.md`. Si no existe, mostrame los briefs
disponibles en `pipeline/2-ideas/` y pará.

Corré los dos últimos pasos del pipeline:

1. **disenador** — diseñá el carrusel y exportá los PNG. Tiene que revisar visualmente el
   resultado e iterar hasta que pase el checklist de marca.
2. **copywriter** — escribí el `copy.md` mirando los slides ya diseñados.

## Al terminar

Mostrame la ruta de salida, la lista de PNG generados y el caption completo listo para
copiar. Marcá el brief como `estado: en-produccion` en su frontmatter.
