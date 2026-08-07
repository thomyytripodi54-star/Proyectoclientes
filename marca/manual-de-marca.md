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

### Jerarquía de color: el rojo manda

**El degradé rojo (coral→magenta) es el color principal de la marca.** El azul es el
complemento: entra a cortar el ritmo, no a llevar la pieza.

- **Degradé coral→magenta** (`fondo-marca`) — el color de Yourebrand. Es lo que hace
  reconocible el feed a la distancia. Domina el carrusel y **siempre** cierra la pieza.
- **Azul** (`fondo-azul`) — complemento. Entra cada 2 o 3 slides para que el rojo no
  sature, y suele quedar bien en la portada porque contrasta contra el interior rojo.

**Reglas de ritmo:**
- Nunca todo azul ni todo rojo. Un carrusel monocromo está mal, sea del color que sea.
- Nunca 3 slides seguidos del mismo fondo.
- El rojo tiene que ser mayoría (~60-70% de los slides).

El renderer asigna los fondos solo si el slide no declara `fondo`, y garantiza estas tres
reglas. El diseñador puede forzar uno puntual, pero **la alternancia por defecto ya es la
correcta**: conviene dejarla trabajar.

### Contraste
Sobre fondo rojo, los acentos que normalmente son rojos pasan a **azul** (números,
`==acento==`) o a blanco (palabra destacada). Nunca rojo sobre rojo.

## Tipografía

**Poppins** en toda la comunicación. Geométrica y redondeada — es lo que le da el aire
amable a la marca.

| Uso | Peso | Tamaño base |
|---|---|---|
| Palabra destacada de portada | 800 | se escala sola hasta llenar el ancho (techo 320px) |
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
2. **La palabra destacada.** Una sola palabra en rojo, mayúsculas, ocupando el ancho
   completo. El renderer la escala sola para que siempre llene el ancho, sea `5` o
   `NEUROMARKETING`. Es el ancla visual del carrusel.
3. **La textura de grano.** Grano fino + rayaduras sutiles sobre todo el fondo, como una
   pieza impresa. Es una firma, no un elemento de diseño: si se lee antes que el título,
   está mal calibrada.
4. **El blob de esquina.** Círculo grande en el color complementario mordiendo una esquina
   (azul sobre rojo, coral sobre azul). Rompe el rectángulo plano de color. Se usa con
   moderación: no en todos los slides, y **nunca en la esquina donde está el logo o el
   número**.

## El símbolo gigante

El recurso gráfico que **siempre está disponible**, porque sale de la tipografía y no de
un archivo: un glifo enorme (`#`, `@`, `%`, `?`, `72h`) mordiendo una esquina.

Es lo que hace que una pieza se vea *del tema* en lugar de genérica. Un carrusel sobre
hashtags con un `#` gigante se lee al instante; el mismo carrusel sin él es texto sobre
color. Tres estilos: `agua` (marca de agua, el default), `linea` (contorno, para llenar
un slide que quedaría vacío abajo) y `solido` (protagonista).

Cada brief define el símbolo de su pieza. Dosis: **3 o 4 slides de 8**, rotando posición.

## Variantes de portada

La portada es lo primero que se ve en el feed. Si dos piezas seguidas tienen la misma
composición, el perfil se lee como un molde. Hay tres variantes —`centrada`, `bloque` y
`simbolo`— y **la variante nunca se repite dos piezas seguidas**. Queda registrado en
`memoria/piezas-visuales.md`.

## Elementos gráficos

Las piezas de Yourebrand no son solo tipografía sobre color: usan **logos de marcas,
fotos reales, personajes 3D y recortes**. Eso es parte de la identidad.

Cinco modos disponibles (uno solo por slide):

| Modo | Qué es | Cuándo |
|---|---|---|
| `recorte` | PNG sin fondo que sangra por abajo, con sombra. | Personajes 3D, productos, objetos. El modo con más impacto. |
| `marco` | Foto con esquinas redondeadas y sombra. | Fotos reales: equipo, clientes, detrás de escena, archivo. |
| `papel` | Tarjeta de papel rasgado con un logo adentro. | Citar una marca con textura editorial. |
| `chip` | Tarjeta blanca redondeada con un logo. | Logos de terceros, o comparar dos marcas con `logos` + `separador: "VS"`. |
| `libre` | Imagen contenida y centrada. | Ilustraciones e íconos sueltos. |

**Regla de dosis: aproximadamente la mitad de los slides lleva gráfico, no todos.** Un
carrusel donde cada slide tiene una imagen se lee saturado y pierde jerarquía. Los slides
de puro texto son los que dejan respirar a los que sí tienen imagen.

Los archivos salen de `marca/assets/graficos/`. El diseñador **solo puede usar imágenes
que existan ahí** — no inventa rutas.

## Isologo

Megáfono con banda roja + wordmark "Yourebrand". En las piezas se usa **solo el iso**
(sin wordmark) porque el handle ya identifica la cuenta.

- Portada: iso centrado, 158px de alto.
- Slides internos: iso chico arriba a la izquierda, 64px.

> 🔴 **PENDIENTE: el isologo actual no es el real.** `marca/assets/isologo.svg` es un
> megáfono genérico dibujado a mano como placeholder. **Dejá el archivo original en
> `marca/assets/isologo.png`** (o `.svg`) y el renderer lo prefiere automáticamente
> sobre el placeholder — no hay que tocar nada más.

## Lo que nunca se hace

- Texto rojo sobre fondo coral/magenta (no contrasta).
- Un carrusel monocromo: ni todo azul ni todo rojo.
- Más de una palabra destacada por portada.
- Más de un elemento gráfico por slide.
- Un recorte con PNG de fondo blanco (se ve como un parche: usá `marco` o `chip`).
- Un blob en la esquina donde está el logo o el número.
- Sombras, bordes o efectos que no estén en el sistema.
- Texto sobre foto sin una capa que garantice contraste.
- Llenar el slide: si no entra, el problema es el texto.
