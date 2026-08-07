# Manual de marca — Yourebrand (aplicado a contenido IG)

Este documento describe **cómo se ve** una pieza de Yourebrand. Los valores ejecutables
viven en `marca/tokens.css`; esto es la explicación de por qué.

> ⚠️ **Estado: derivado, no oficial.** La paleta y la tipografía se dedujeron a partir de
> piezas publicadas (portada "Principios del Neuromarketing", slide "Producción de
> contenido", isologo). Si tenés el manual original con los valores exactos, actualizá
> `tokens.css` y borrá este aviso.

## Paleta

| Rol | Token | Hex | Uso |
|---|---|---|---|
| Azul de marca | `--yb-azul` | `#2A4269` | Fondo base de portadas y slides de desarrollo. |
| Azul profundo | `--yb-azul-oscuro` | `#1E3050` | Extremo oscuro del degradé azul. |
| Rojo | `--yb-rojo` | `#E9203F` | Acento. Palabra destacada, números, bullets. **Nunca para bloques grandes de texto.** |
| Magenta | `--yb-magenta` | `#D21C7C` | Extremo del degradé de marca. |
| Coral | `--yb-coral` | `#EE2C4D` | Otro extremo del degradé de marca. |
| Blanco | `--yb-blanco` | `#FFFFFF` | Todo el texto. |
| Gris | `--yb-gris` | `#D9D9D9` | Cuerpo del megáfono en el iso. |

### Los dos mundos
La marca vive en **dos fondos** y el ritmo del carrusel sale de alternarlos:

- **Azul** (`fondo-azul`) — el terreno serio. Portadas, desarrollo, listas. Es donde vive
  el contenido educativo.
- **Degradé coral→magenta** (`fondo-marca`) — el terreno enérgico. Slides de peso,
  servicios y **siempre** el cierre. Es lo que le da identidad al feed a la distancia.

Regla: no más de 3 slides seguidos con el mismo fondo.

## Tipografía

**Poppins** en toda la comunicación. Geométrica y redondeada — es lo que le da el aire
amable a la marca.

| Uso | Peso | Tamaño base |
|---|---|---|
| Palabra destacada de portada | 800 | 132px, mayúsculas, se autoajusta |
| Título de portada | 700 | 78px |
| Título de slide | 700 | 82px, interlineado 0.96 |
| Remate en itálica | 700 itálica | 52px |
| Cuerpo | 400 | 34px, interlineado 1.48 |
| Handle / eyebrow | 500-700 | 28px, tracking 0.18em |
| Número de slide | 800 | 120px |

Los títulos van con **interlineado apretado** (0.96–1.06). Es un rasgo fuerte de la marca:
los bloques de título se leen como un ladrillo compacto, no como líneas sueltas.

## Grilla

- Canvas **1080×1350** (4:5). Es el formato del feed.
- Margen lateral **88px**. Nada de texto fuera de ahí, nunca.
- Margen superior 92px, inferior 128px (deja aire para los puntitos del carrusel de IG).
- Estructura de 3 zonas: `cabecera` (fija arriba) / `centro` (elástica) / `pie` (fija abajo).

## Elementos de firma

Son los tres detalles que hacen reconocible una pieza:

1. **El handle enmarcado.** `@yourebrand.es` entre dos hairlines de ancho completo, arriba
   de todo, con tracking abierto. Va **solo en la portada**.
2. **La palabra destacada.** Una sola palabra en rojo, mayúsculas, gigante, ocupando el
   ancho completo. Es el ancla visual del carrusel.
3. **La textura de círculos.** Anillos finísimos en la esquina superior derecha, al 16% de
   opacidad. Es una firma, no un elemento de diseño: si se lee antes que el título,
   está mal.

## Isologo

Megáfono con banda roja + wordmark "Yourebrand". En las piezas se usa **solo el iso**
(sin wordmark) porque el handle ya identifica la cuenta.

- Portada: iso centrado, 158px de alto.
- Slides internos: iso chico arriba a la izquierda, 64px.
- El archivo es `marca/assets/isologo.svg`. **Es una recreación vectorial aproximada** —
  pisalo con el original cuando lo tengas y todos los slides lo toman solos.

## Lo que nunca se hace

- Texto rojo sobre fondo coral/magenta (no contrasta).
- Más de una palabra destacada por portada.
- Sombras, bordes o efectos que no estén en el sistema.
- Texto sobre foto sin una capa que garantice contraste.
- Llenar el slide: si no entra, el problema es el texto.
