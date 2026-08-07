# Yourebrand — Sistema de agentes para carruseles de Instagram

Pipeline de 4 agentes que investiga tendencias, filtra ideas, diseña carruseles on-brand
y escribe el copy. Entrega **PNG a 1080×1350** + **`copy.md`** listos para publicar.

```
investigador  →  estratega  →  diseñador  →  copywriter
    ↓                ↓             ↓             ↓
1-research/      2-ideas/     slide-NN.png    copy.md
```

## El panel

```bash
npm run panel     # → http://localhost:4321
```

Interfaz para operar el sistema sin tocar la terminal:

- **Flujo** — botón Activar que corre de verdad los cuatro agentes, con el pipeline
  animado según lo que está pasando y el registro en vivo.
- **Contenido** — las piezas producidas con sus slides y el copy. Copiar caption,
  descargar slides, marcar como publicada, eliminar, y corregir el diseño editando el
  spec y volviendo a renderizar sin salir de la página.
- **Ideas** — el repertorio de Damián, con botón para producir cualquiera.
- **Agentes** — cada uno con su avatar, su modelo y sus instrucciones editables. Guardar
  escribe el archivo del repo, así que aplica en la corrida siguiente.
- **Consumo** — tokens y costo por corrida, con desglose por modelo.

Corre sobre el repo, así que **siempre refleja el estado real**: no hay copia que
sincronizar. Un archivo de agente que cambiás por fuera aparece en el panel al recargar.

> El panel corre la CLI con `--permission-mode acceptEdits` y las herramientas del
> pipeline pre-aprobadas: una corrida headless que pide confirmación se cuelga. Se ajusta
> con `YB_PERMISOS` y `YB_HERRAMIENTAS`. Levantalo solo sobre repos tuyos.

## Uso desde la terminal

```
/carrusel                         # pipeline completo, tema libre
/carrusel pauta para gastronomía  # pipeline completo, tema dirigido
/investigar                       # solo research + briefs, frena antes de producir
/disenar <slug>                   # produce una idea ya briefeada
```

Cada agente también se puede invocar suelto por nombre: `rita`, `damian`, `lola`, `facu`.

## Setup

```bash
npm install                      # playwright
node scripts/bajar-fuentes.mjs   # una vez: baja Poppins a marca/fonts/
```

Probá el render:

```bash
node disenio/render.mjs output/ejemplo/spec.json /tmp/prueba
```

## Estructura

| Carpeta | Qué hay |
|---|---|
| `.claude/agents/` | Los 4 agentes. |
| `.claude/commands/` | Los comandos del pipeline. |
| `marca/` | **Fuente de verdad.** Tokens, manual de marca, tono de voz, fuentes, isologo. |
| `disenio/` | Sistema de layouts + renderer. `spec.md` documenta el formato. |
| `pipeline/` | Trabajo en curso: research crudo → briefs. |
| `output/` | Entregables por pieza: `spec.json` + PNG + `copy.md`. |
| `memoria/` | Lo que el sistema aprende entre corridas. |

## Cómo funciona la memoria

Los subagentes arrancan en cero cada vez — no tienen memoria propia. Lo que hace de
memoria son los archivos de `memoria/`, que cada agente **lee al arrancar y actualiza al
terminar**. Queda versionado en git, así que es auditable.

| Archivo | Quién lo lee | Para qué |
|---|---|---|
| `temas-cubiertos.md` | investigador | No repetir temas. |
| `ideas-descartadas.md` | estratega | No reproponer lo que ya se bajó, con el motivo. |
| `hooks-que-funcionan.md` | copywriter | No quemar ganchos; reusar los que rinden. |
| `performance.md` | investigador, estratega | Doblar la apuesta en lo que funciona. |

## Elementos gráficos

Las piezas usan logos, fotos reales, personajes 3D y recortes — no son solo tipografía
sobre color. El diseñador tiene cinco modos (`recorte`, `marco`, `papel`, `chip`, `libre`)
y una regla de dosis: **un elemento por slide, y solo en la mitad de los slides**.

Las imágenes salen de `marca/assets/graficos/` (ver el README de esa carpeta). El
diseñador solo puede usar archivos que existan ahí, así que cargar la biblioteca es lo que
más mejora el resultado.

```bash
node scripts/bajar-imagen.mjs <url> marca/assets/graficos/logos/nike.svg
```

## Color

El **degradé rojo es el color principal**; el azul es complemento. El renderer asigna los
fondos solo y garantiza que el rojo sea mayoría, que nunca haya 3 slides seguidos iguales
y que el cierre sea siempre de marca. Conviene no declarar `fondo` a mano.

## Personalizar la marca

Todo lo visual sale de `marca/tokens.css`. Cambiás un hex ahí y se actualiza el sistema
entero. El manual explicado está en `marca/manual-de-marca.md`.

## Pendientes

- [ ] **Isologo real.** `marca/assets/isologo.svg` es un placeholder genérico. Dejá el
      original en `marca/assets/isologo.png` y el renderer lo prefiere automáticamente.
- [ ] **Hex exactos.** Los colores están derivados de piezas publicadas, no del manual.
- [ ] **Biblioteca de gráficos.** Está vacía: cargá personajes, logos y fotos.
- [ ] **Referencias.** `marca/referencias.md` espera el análisis de los posteos de
      referencia (Instagram está bloqueado en el sandbox).
