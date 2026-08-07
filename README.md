# Yourebrand — Sistema de agentes para carruseles de Instagram

Pipeline de 4 agentes que investiga tendencias, filtra ideas, diseña carruseles on-brand
y escribe el copy. Entrega **PNG a 1080×1350** + **`copy.md`** listos para publicar.

```
investigador  →  estratega  →  diseñador  →  copywriter
    ↓                ↓             ↓             ↓
1-research/      2-ideas/     slide-NN.png    copy.md
```

## Uso

```
/carrusel                       # pipeline completo, tema libre
/carrusel pauta para gastronomía  # pipeline completo, tema dirigido
/investigar                     # solo research + briefs, frena antes de producir
/disenar <slug>                 # produce una idea ya briefeada
```

Cada agente también se puede invocar suelto por nombre: `investigador`, `estratega`,
`disenador`, `copywriter`.

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

## Personalizar la marca

Todo lo visual sale de `marca/tokens.css`. Cambiás un hex ahí y se actualiza el sistema
entero. El manual explicado está en `marca/manual-de-marca.md`.

> Los colores actuales están **derivados de piezas publicadas**, no del manual oficial.
> Si tenés los hex exactos, actualizá `tokens.css`.
