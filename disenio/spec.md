# Referencia del spec de carrusel

El agente diseñador escribe un `spec.json` y lo renderiza con:

```bash
node disenio/render.mjs output/AAAA-MM-DD-<slug>/spec.json
```

Salida: un PNG de **1080×1350** por slide, numerado `slide-01.png`, `slide-02.png`, …

## Estructura

```json
{
  "slug": "kebab-case",
  "handle": "@yourebrand.es",
  "slides": [ { "layout": "portada", "...": "..." } ]
}
```

## Campos comunes a todos los slides

| Campo | Tipo | Default | Qué hace |
|---|---|---|---|
| `layout` | string | — | **Requerido.** Uno de los seis de abajo. |
| `fondo` | string | según layout | `azul`, `azul-liso`, `marca`, `rojo`. |
| `textura` | bool | `true` | Anillos sutiles en la esquina. `false` los saca. |
| `visual` | string | — | Ruta a una imagen, relativa a la raíz del repo. |

## Layouts

### `portada` — slide 1
Fondo default: `azul`.

| Campo | Qué es |
|---|---|
| `titulo` | Línea liviana de arriba. Ej: `"Principios del"` |
| `destacado` | **La palabra ancla.** Mayúsculas, roja, gigante. Máx ~16 caracteres. |
| `pie` | Texto del indicador de swipe. Default: `"Deslizá"` |
| `mostrar_iso` | `false` para ocultar el megáfono. |

### `punto` — desarrollo numerado
Fondo default: `azul`. El caballito de batalla.

| Campo | Qué es |
|---|---|
| `numero` | `"01"`, `"02"`… Se muestra grande arriba y chico en el pie. |
| `titulo` | Título del concepto. |
| `cuerpo` | Texto. Máx ~280 caracteres. |
| `remate` | Frase corta en itálica bold que cierra el slide. |

### `contenido` — bloque libre
Fondo default: `marca`.

| Campo | Qué es |
|---|---|
| `eyebrow` | Etiqueta chica en mayúsculas arriba del título. |
| `titulo`, `cuerpo`, `remate` | Igual que `punto`. |

### `lista` — enumeración
Fondo default: `azul`.

| Campo | Qué es |
|---|---|
| `titulo` | Título de la lista. |
| `items` | Array de strings. 3 a 5 items; más de 5 no entra bien. |

### `cita` — afirmación suelta
Fondo default: `marca`. Para un dato duro o una frase con peso.

| Campo | Qué es |
|---|---|
| `texto` | La frase, en tamaño de título. |
| `autor` | Atribución opcional. |

### `cierre` — último slide
Fondo default: `marca`. Todo centrado.

| Campo | Qué es |
|---|---|
| `titulo`, `cuerpo` | El cierre. |
| `cta` | Texto del botón. **Una sola acción.** |

## Formato de texto

En `titulo`, `cuerpo`, `remate`, `items` y `texto` podés usar:

- `**negrita**` → una frase clave por slide, no media oración
- `*itálica*`
- saltos de línea reales

El HTML se escapa: no se puede inyectar markup.

## Autoajuste

Después de cargar las fuentes, el renderer:

1. Achica la palabra `destacado` hasta que entre en una línea.
2. Si un slide se desborda verticalmente, baja título y cuerpo escalonadamente.
3. Si aun así no entra, tira `⚠` por consola.

**Un `⚠` significa que el texto es demasiado largo, no que el diseño esté mal.** La
solución es recortar el copy del brief, no forzar el layout.

## Ejemplo

```json
{
  "slug": "errores-pauta-pyme",
  "handle": "@yourebrand.es",
  "slides": [
    { "layout": "portada", "titulo": "4 errores de", "destacado": "PAUTA" },
    { "layout": "punto", "numero": "01", "titulo": "Pautás sin haber ordenado el perfil",
      "cuerpo": "Mandás tráfico a un perfil que no explica **qué vendés**. La plata se va en clicks que rebotan.",
      "remate": "Primero la casa, después las visitas" },
    { "layout": "lista", "titulo": "Qué revisar antes",
      "items": ["**Bio** que diga qué hacés", "**Destacadas** ordenadas", "**Últimos 9 posteos** coherentes"] },
    { "layout": "cierre", "titulo": "¿Lo revisamos juntos?", "cta": "Mandanos un DM" }
  ]
}
```
