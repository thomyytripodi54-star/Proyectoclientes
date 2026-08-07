# Referencia del spec de carrusel

El agente diseñador escribe un `spec.json` y lo renderiza con:

```bash
node disenio/render.mjs output/AAAA-MM-DD-<slug>/spec.json
```

Salida: un PNG de **1080×1350** por slide, numerado `slide-01.png`, `slide-02.png`, …
Sin segundo argumento, los PNG se escriben **al lado del spec**.

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
| `fondo` | string | **automático** | `marca` (rojo, principal), `rojo`, `azul` (complemento), `azul-liso`. |
| `textura` | bool | `true` | Grano y rayaduras sobre el fondo. `false` lo saca. |
| `visual` | string | — | Ruta a una imagen, relativa a la raíz del repo. |
| `visual_modo` | string | `libre` | `recorte`, `marco`, `papel`, `chip`, `libre`. |
| `visual_pos` | string | centrado | Solo con `recorte`: `izq` o `der`. |
| `logos` | string[] | — | Varias imágenes como chips (comparar marcas). |
| `separador` | string | — | Texto entre chips. Típicamente `"VS"`. |
| `blob` | bool\|string | — | Círculo de color en una esquina: `abajo-der`, `abajo-izq`, `arriba-der`, `arriba-izq`. |
| `simbolo` | string | — | Glifo gigante: `"#"`, `"@"`, `"%"`, `"?"`, `"72h"`… |
| `simbolo_estilo` | string | `agua` | `agua`, `linea`, `solido`. |
| `simbolo_pos` | string | `abajo-der` | Las cuatro esquinas o `centro`. |

## El símbolo: el elemento gráfico que siempre existe

Un glifo enorme sacado de la tipografía de marca. **No depende de que haya assets
cargados**, y es lo que hace que una pieza se vea *del tema* en vez de genérica: un
carrusel sobre hashtags con un `#` gigante mordiendo la esquina se lee al instante.

| Estilo | Qué hace | Cuándo |
|---|---|---|
| `agua` | Marca de agua blanca al 13%, detrás de todo. | El default. Textura temática sin competir con el texto. |
| `linea` | Solo el contorno, al 30%. | Para llenar un slide que quedaría vacío en el tercio inferior. |
| `solido` | Color complementario, protagonista. | Un slide de peso, o la portada `simbolo`. |

```json
{ "layout": "contenido", "titulo": "…", "simbolo": "#", "simbolo_estilo": "linea", "simbolo_pos": "abajo-izq" }
```

**Dosis: 3 o 4 slides de 8**, rotando posición. En todos satura; en ninguno, la pieza se
ve genérica.

### Fondos: dejalos en automático

**El rojo es el color principal y el azul el complemento.** Si no ponés `fondo`, el
renderer lo asigna solo y garantiza que:

- el rojo sea mayoría,
- nunca haya 3 slides seguidos del mismo color,
- la portada corte en azul y el cierre siempre sea rojo de marca.

Poné `fondo` a mano solo cuando tengas un motivo puntual. La alternancia automática ya
cumple el manual.

## Elementos gráficos

Un solo elemento por slide, y **aproximadamente la mitad de los slides**, no todos.

```json
{ "layout": "punto", "visual": "marca/assets/graficos/personajes/x.png", "visual_modo": "recorte" }
{ "layout": "contenido", "visual": "marca/assets/graficos/fotos/equipo.jpg", "visual_modo": "marco" }
{ "layout": "cita", "visual": "marca/assets/graficos/logos/nike.svg", "visual_modo": "papel" }
{ "layout": "portada", "logos": ["…/nike.svg", "…/adidas.svg"], "separador": "VS" }
```

- `recorte` necesita **PNG con fondo transparente**. Si no lo tiene, usá `marco` o `chip`.
- Las imágenes salen de `marca/assets/graficos/`. Si la ruta no existe, el renderer avisa
  por consola y deja el slide sin imagen — **no inventes rutas**.

## Layouts

### `portada` — slide 1
Fondo default: `azul`.

**Tres variantes.** No repitas la de la pieza anterior (mirá `memoria/piezas-visuales.md`):

| `variante` | Composición |
|---|---|
| `centrada` (default) | Iso grande arriba, título y destacado centrados. La clásica. |
| `bloque` | Todo alineado a la izquierda, sin iso centrado, texto anclado abajo. Más editorial. |
| `simbolo` | Un glifo gigante manda la composición (usa `simbolo` + `simbolo_estilo`) y el texto lo acompaña. El destacado baja de techo solo, para no competir. |

| Campo | Qué es |
|---|---|
| `variante` | `centrada`, `bloque` o `simbolo`. |
| `titulo` | Línea liviana de arriba. Ej: `"Cambios en el"` |
| `destacado` | **La palabra ancla.** Mayúsculas, roja. Se escala sola para llenar el ancho (techo 320px), así que tanto `5` como `NEUROMARKETING` quedan del tamaño máximo que entra en una línea. |
| `subtitulo` | Bajada subrayada. Ej: `"¿Los reels ya no funcionan?"` |
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
- `==acento==` → colorea la palabra con el color complementario del fondo
  (rojo sobre azul, azul sobre rojo). Ej: `"NIKE ==VS== ADIDAS"`
- saltos de línea reales

El HTML se escapa: no se puede inyectar markup.

## Autoajuste

Después de cargar las fuentes, el renderer:

1. Escala la palabra `destacado` para que ocupe el ancho: arranca del techo (320px) y baja hasta que entre en una línea. Una palabra corta crece, una larga se achica.
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
    { "layout": "portada", "titulo": "4 errores de", "destacado": "PAUTA",
      "subtitulo": "Los que más plata queman" },
    { "layout": "punto", "numero": "01", "titulo": "Pautás sin haber ordenado el perfil",
      "cuerpo": "Mandás tráfico a un perfil que no explica **qué vendés**. La plata se va en clicks que rebotan.",
      "remate": "Primero la casa, después las visitas",
      "blob": "abajo-der" },
    { "layout": "punto", "numero": "02", "titulo": "Le hablás a todos",
      "cuerpo": "Una audiencia amplia parece más alcance. En la práctica es **el mismo presupuesto repartido entre gente que no te va a comprar**.",
      "visual": "marca/assets/graficos/personajes/megafono-3d.png",
      "visual_modo": "recorte" },
    { "layout": "lista", "titulo": "Qué revisar antes",
      "items": ["**Bio** que diga qué hacés", "**Destacadas** ordenadas", "**Últimos 9 posteos** coherentes"] },
    { "layout": "cierre", "titulo": "¿Lo revisamos juntos?", "cta": "Mandanos un DM" }
  ]
}
```

Fijate que ningún slide declara `fondo`: la alternancia rojo/azul la resuelve el renderer.
