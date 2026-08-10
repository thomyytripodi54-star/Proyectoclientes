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
Rita  →  Damián  →  Lola  →  Facu
  ↓        ↓         ↓        ↓
1-research/  2-ideas/  *.png  copy.md
```

| Agente | Rol | Modelo |
|---|---|---|
| **Rita** | Investigación de tendencias | Sonnet |
| **Damián** | Estrategia y filtrado de ideas | Opus |
| **Lola** | Diseño de los carruseles | Opus |
| **Facu** | Copy final | Opus |

Corré el flujo completo con `/carrusel`. Cada agente también se puede invocar suelto.

**Entregables de una corrida:** `output/AAAA-MM-DD-<slug>/` con `copy.md`,
`slide-01.png … slide-NN.png` y el `spec.json` que los generó.

## El sistema de clientes

Independiente del pipeline de contenido. Son **dos flujos separados** que nunca se cruzan:
uno prepara reuniones, el otro las convierte en propuestas.

```
PRE-CALL                    POST-CALL
Santiago                    Pablo  →  Lola-propuestas
   ↓                          ↓             ↓
precall-<fecha>.md      propuesta-<fecha>.md   propuesta-<Cliente>.docx
```

| Agente | Rol | Modelo |
|---|---|---|
| **Santiago** | Investigación previa a la reunión | Sonnet |
| **Pablo** | Análisis de la reunión y redacción de la propuesta | Opus |
| **Lola-propuestas** | Diseño del documento Word | Sonnet |

Santiago corre solo, antes de la reunión. Pablo y Lola corren **siempre juntos**: la salida
de Pablo es texto y no sirve hasta que Lola la maqueta.

**Todo lo de un cliente vive en `clientes/<slug>/`:** el logo, el briefing pre-call, la
propuesta en texto, el `.docx` final y el script que lo generó.

El sistema visual del documento está en `disenio/propuesta.md`. `marca/contexto-agencia.md`
es la fuente de verdad de servicios, casos con números y equipo.

## Reglas del repo

- **`marca/` es sagrado.** `tokens.css`, `manual-de-marca.md` y `tono-de-voz.md` son la
  fuente de verdad. Ningún agente los modifica por su cuenta; los cambia Thomy.
- **Nada de estilos sueltos.** El diseño sale del sistema de layouts o no sale. Si un
  layout no alcanza, se reporta y se agrega uno — no se parchea con CSS inline.
- **La memoria se actualiza siempre.** Cada agente escribe en `memoria/` al terminar.
  Es lo único que evita que el sistema repita temas, ideas, ganchos y composiciones.
- **Ninguna pieza se ve igual a la anterior.** La variante de portada rota; queda
  registrado en `memoria/piezas-visuales.md`.
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
| `/precall <cliente + links>` | Investigación previa a una reunión. |
| `/propuesta <link de Fathom>` | Propuesta post-reunión: analiza y entrega el Word. |

## Setup

```bash
npm install                      # playwright
node scripts/bajar-fuentes.mjs   # una sola vez: baja Poppins a marca/fonts/
```

El render usa Chromium headless. Si el entorno ya trae uno preinstalado, `render.mjs` lo
detecta solo; si no, usa el de Playwright. Podés forzar uno con `YB_CHROMIUM=/ruta/chrome`.
