# Sistema visual — Documento de propuesta

Referencia de diseño para las propuestas de cliente en Word. Es a la propuesta lo que
`disenio/spec.md` es a los carruseles: **de acá sale todo, no se improvisa nada.**

Los valores salen de `marca/tokens.css`. Si un color o un tamaño no está acá, no se usa.

## La traducción de la marca al papel

El sistema de Instagram es **fondo inundado de color**: cada slide es un rectángulo rojo o
azul con texto encima. Trasladar eso a un documento es un error — un Word con páginas
inundadas de degradé se imprime mal, se lee como plantilla descargada y cansa a las tres
páginas.

La traducción correcta es al revés:

> **La portada lleva el color. El interior es blanco con acentos.**

El degradé de marca aparece una sola vez, en la banda de portada. De ahí en adelante el
color entra en encabezados de sección, encabezados de tabla, números y citas. Nunca de
fondo.

## Página

- **A4** — 210 × 297 mm. En DXA: `width: 11906, height: 16838`. No Letter: los clientes
  están en Argentina y España.
- **Márgenes: 2,5 cm** en los cuatro lados (`1417` DXA).
- Numeración de página en el pie, desde la página 2.

## Tipografía

Poppins en todo el documento. Está en `marca/fonts/`; si el entorno no la resuelve, el
fallback es Calibri — pero declarala igual, porque en la máquina de Thomy sí está.

| Uso | Peso | Tamaño | Color |
|---|---|---|---|
| Título de portada | 700 | 30 pt | Blanco |
| Subtítulo de portada | 400 | 13 pt | Blanco 80% |
| Título de sección (H1) | 700 | 17 pt | `#2A4269` |
| Subtítulo (H2) | 600 | 12,5 pt | `#2A4269` |
| Cuerpo | 400 | 10,5 pt | `#333333` |
| Cita del cliente | 400 itálica | 11 pt | `#2A4269` |
| Número destacado | 800 | 26 pt | `#E9203F` |
| Encabezado de tabla | 600 | 10 pt | Blanco |
| Celda de tabla | 400 | 10 pt | `#333333` |
| Pie de página | 400 | 8 pt | `#888888` |

**Interlineado del cuerpo: 1,4.** Los títulos de sección van con interlineado 1,1 — el
apretado de la marca funciona en tipografía grande, no en cuerpo de 10 pt.

**Nunca texto rojo en párrafos largos.** El rojo es para números, un dato suelto y los
encabezados de la columna recomendada. Un párrafo rojo no se lee.

## Componentes

### 1. Portada

De arriba a abajo:

1. **Banda de color** de ancho completo ocupando el tercio superior — tabla de una celda
   con `shading` sólido `#2A4269`. Adentro, en blanco: el título del documento
   (*"Propuesta de trabajo"*) y el nombre del cliente.
2. **Logo del cliente** centrado debajo de la banda, sobre blanco, máximo 4 cm de alto.
   Es lo que hace que la propuesta se vea hecha para él y no sacada de una carpeta.
3. **Tabla de metadatos** sin bordes, dos columnas, alineada a la izquierda:
   Preparado para · Interlocutor · Preparado por · Fecha · Origen (la reunión).
4. **Isologo de Yourebrand** abajo, chico, con el tagline *"El camino a la digitalización
   de tu negocio"*.

> No intentes fondo sangrado a página completa. En Word depende de los márgenes de
> impresión y se rompe distinto en cada máquina. La banda dentro de márgenes se ve
> igual en todos lados.

### 2. Encabezado de sección

Número de sección en `#E9203F` peso 800, seguido del título en `#2A4269` peso 700, y
debajo una línea fina (`borders.bottom`, 1 pt, `#E9203F`) de ancho completo.

Nunca uses una tabla como línea horizontal: es un borde inferior de párrafo.

### 3. Cita del cliente

El componente más importante del documento: es lo que prueba que la propuesta salió de
esa reunión y no de una plantilla.

Párrafo en itálica, `#2A4269`, con **borde izquierdo de 3 pt en `#E9203F`** y sangría de
0,5 cm. Debajo, en 9 pt gris, la atribución: *— <Nombre>, en la reunión del <fecha>*.

Van 2 o 3 en todo el documento. Más pierde el efecto.

### 4. Tabla estándar

- Encabezado: fondo `#2A4269`, texto blanco 600.
- Filas alternadas: blanco y `#F4F5F7`.
- Sin bordes verticales. Bordes horizontales finos en `#E0E0E0`.
- **Anchos duales obligatorios**: `columnWidths` en la tabla y `width` en cada celda,
  ambos en `WidthType.DXA`. Con porcentajes se rompe al abrirlo en Google Docs.
- Sombreado siempre con `ShadingType.CLEAR` — `SOLID` renderiza negro.

### 5. Bloque de números

Para los resultados de un caso de éxito. Tabla sin bordes de 3 o 4 columnas: en cada celda
el número en 26 pt `#E9203F` peso 800, y debajo la etiqueta en 9 pt gris.

Es el componente con mejor relación impacto/espacio de todo el documento.

### 6. Tabla de inversión

Una columna por opción, la más completa a la izquierda para anclar.

- Encabezado de cada opción: fondo `#2A4269`.
- **La opción recomendada lleva el encabezado en `#E9203F`** y arriba una fila con la
  etiqueta "RECOMENDADA" en 8 pt, blanco, tracking abierto.
- Fila de monto: 16 pt peso 700 `#2A4269`.
- Debajo, los ítems incluidos en bullets de 9,5 pt.

### 7. Callout

Caja de fondo `#F4F5F7` con borde izquierdo de 3 pt `#2A4269` y padding interno. Para el
argumento que el interlocutor necesita para defender la decisión puertas adentro.

Máximo dos en todo el documento.

### 8. Pie de página

`Yourebrand · El camino a la digitalización de tu negocio` a la izquierda, número de
página a la derecha, 8 pt `#888888`, con línea superior fina.

## Reglas duras

- **El color no se inventa.** Todo hex sale de `marca/tokens.css`.
- **Un componente por trabajo.** Si algo no entra en los ocho de arriba, no lo improvises:
  reportalo y que se agregue acá.
- **Nada de degradé en el interior.** Solo portada, y solo si se pidió explícitamente.
- **Nunca `\n`.** Cada párrafo es un `Paragraph` propio.
- **Los bullets se hacen con `numbering` y `LevelFormat.BULLET`**, nunca escribiendo `•`.
- **Blanco de sobra.** Si una página se ve llena, sobra texto: eso es problema de Pablo,
  no se resuelve achicando la tipografía.
