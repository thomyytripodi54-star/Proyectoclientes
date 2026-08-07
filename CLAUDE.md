# Yourebrand — Sistema de contenido para Instagram

Repo del pipeline de agentes que investiga, planifica, diseña y redacta los carruseles
de Instagram de Yourebrand.

## La agencia

- **Yourebrand** — agencia de marketing digital integral. Fundada en 2020 por Tomás
  Tripodi (Thomy). Buenos Aires y España.
- **Diferencial:** integralidad (de la grabación a la pauta) + humanización de marca a
  través de contenido on-site.
- **Servicios principales:** producción de contenido (on-site y UGC remoto), gestión de
  redes (el más contratado), y pauta publicitaria.
- **Complementarios:** desarrollo web, consultoría, Google Ads, TikTok Ads, ecosistema
  de LinkedIn.
- **Rubros de clientes:** gastronomía, servicios, inmobiliarias, estudios jurídicos,
  estética, salud, salones de eventos, fitness, agencias de viaje.
- **Instagram:** `@yourebrand.es`

### ICP — a quién le hablamos
Al **dueño o dueña de una PyME** que ya entiende que necesita estar en redes pero no tiene
tiempo ni equipo para sostenerlo. No le hablamos a colegas del rubro. Si una idea solo le
interesa a otro marketinero, no va.

## El pipeline

```
investigador  →  estratega  →  diseñador  →  copywriter
    ↓                ↓              ↓             ↓
1-research/     2-ideas/      output/*.png   output/copy.md
```

Corré el flujo completo con `/carrusel`. Cada agente también se puede invocar suelto.

**Entregables de una corrida:** `output/AAAA-MM-DD-<slug>/` con `copy.md`,
`slide-01.png … slide-NN.png` y el `spec.json` que los generó.

## Reglas del repo

- **`marca/` es sagrado.** `tokens.css`, `manual-de-marca.md` y `tono-de-voz.md` son la
  fuente de verdad. Ningún agente los modifica por su cuenta; los cambia Thomy.
- **Nada de estilos sueltos.** El diseño sale del sistema de layouts o no sale. Si un
  layout no alcanza, se reporta y se agrega uno — no se parchea con CSS inline.
- **La memoria se actualiza siempre.** Cada agente escribe en `memoria/` al terminar.
  Es lo único que evita que el sistema repita temas, ideas y ganchos.
- **Nada de datos inventados.** Toda estadística que aparezca en una pieza tiene que tener
  fuente rastreable en el informe de research.

## Tono

Español **rioplatense, de vos**. Directo, sin relleno de LinkedIn, sin gurú. Ver
`marca/tono-de-voz.md` para el detalle.

## Comandos

| Comando | Qué hace |
|---|---|
| `/carrusel [tema]` | Pipeline completo: investiga, filtra, diseña y escribe. |
| `/investigar [tema]` | Solo research + briefs. Frena antes de producir. |
| `/disenar <slug>` | Rediseña o re-renderiza una idea ya briefeada. |

## Setup

```bash
npm install                      # playwright
node scripts/bajar-fuentes.mjs   # una sola vez: baja Poppins a marca/fonts/
```

El render usa Chromium headless. Si el entorno ya trae uno preinstalado, `render.mjs` lo
detecta solo; si no, usa el de Playwright. Podés forzar uno con `YB_CHROMIUM=/ruta/chrome`.
