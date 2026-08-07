#!/usr/bin/env node
/**
 * YOUREBRAND — Renderizador de carruseles
 *
 * Toma un spec JSON de slides y escupe un PNG por slide a 1080x1350.
 * El agente diseñador NO escribe HTML: escribe el JSON y llama a esto.
 * Así el sistema visual queda blindado y toda pieza sale on-brand.
 *
 *   node disenio/render.mjs <spec.json> [carpeta-salida]
 *
 * Si no se pasa carpeta, usa output/<slug>/
 */
import { readFile, mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ANCHO = 1080;
const ALTO = 1350;

/**
 * Busca un Chromium usable.
 * En entornos con Chromium preinstalado (CI, Claude Code on the web) la versión
 * del browser no siempre coincide con la que espera el paquete playwright,
 * así que lo detectamos a mano. Si no hay ninguno, devolvemos undefined y
 * playwright usa el suyo.
 */
async function buscarChromium() {
  if (process.env.YB_CHROMIUM) return process.env.YB_CHROMIUM;

  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(base)) return undefined;

  try {
    const dirs = (await readdir(base)).filter((d) => d.startsWith('chromium-')).sort().reverse();
    for (const d of dirs) {
      const exe = join(base, d, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  } catch {
    /* si no se puede leer, que decida playwright */
  }
  return undefined;
}

/* ------------------------------------------------------------------
   Texto: markdown mínimo y escapado.
   **negrita**, *itálica*, ==acento de color== y saltos de línea.
   ------------------------------------------------------------------ */
const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const md = (s) =>
  escapar(s)
    .replace(/==(.+?)==/g, '<span class="acento">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<i>$2</i>')
    .replace(/\n/g, '<br>');

/** Resuelve rutas de imagen relativas a la raíz del repo. */
const ruta = (p) => (p ? (isAbsolute(p) ? p : join(RAIZ, p)) : null);

const img = (src, clase = '') => {
  const r = ruta(src);
  if (!r) return '';
  if (!existsSync(r)) {
    console.warn(`  ⚠ no existe la imagen: ${src}`);
    return '';
  }
  return `<img class="${clase}" src="${pathToFileURL(r).href}" alt="">`;
};

const clasesFondo = {
  marca: 'fondo-marca',
  rojo: 'fondo-rojo',
  azul: 'fondo-azul',
  'azul-liso': 'fondo-azul-liso',
};

/**
 * Isologo. Preferimos el PNG por si Thomy deja el archivo original ahí;
 * el SVG es la recreación de respaldo. Dejar `isologo.png` en
 * marca/assets/ alcanza para que todos los slides lo tomen.
 */
const ISO = (() => {
  for (const n of ['isologo.png', 'isologo.svg']) {
    const p = join(RAIZ, 'marca/assets', n);
    if (existsSync(p)) return pathToFileURL(p).href;
  }
  return '';
})();

const logo = (extra = '') =>
  `<div class="logo ${extra}"><img src="${ISO}" alt="Yourebrand"></div>`;

/* ------------------------------------------------------------------
   Fondos: el rojo es el principal, el azul el complemento.
   Si el slide no declara `fondo`, lo asigna esta función, que garantiza
   que el carrusel alterne y que nunca haya 3 seguidos iguales.
   ------------------------------------------------------------------ */
function asignarFondos(slides) {
  let previo = null;
  let repes = 0;

  const fondos = slides.map((s) => {
    let f = s.fondo;
    if (!f) {
      if (s.layout === 'portada') f = 'azul';           // la portada corta contra el rojo interior
      else if (s.layout === 'cierre') f = 'marca';      // el cierre siempre es de marca
      else f = previo === 'marca' && repes >= 2 ? 'azul' : 'marca';
    }
    repes = f === previo ? repes + 1 : 1;
    previo = f;
    return f;
  });

  // Barrido final: rompemos cualquier corrida de 3+ girando el del medio.
  for (let i = 2; i < fondos.length; i++) {
    const enMedio = slides[i - 1];
    if (
      fondos[i] === fondos[i - 1] &&
      fondos[i - 1] === fondos[i - 2] &&
      !enMedio.fondo &&
      enMedio.layout !== 'cierre'
    ) {
      fondos[i - 1] = fondos[i - 1] === 'marca' ? 'azul' : 'marca';
    }
  }
  return fondos;
}

/* ------------------------------------------------------------------
   Elementos gráficos.
   Un solo elemento por slide. Cinco modos:
     libre   — imagen contenida, centrada (default)
     recorte — PNG sin fondo que sangra por abajo (personajes, productos)
     marco   — foto con esquinas redondeadas
     papel   — tarjeta de papel rasgado con un logo adentro
     chip    — tarjeta blanca con logo; con `logos` arma una comparación
   ------------------------------------------------------------------ */
function visualInline(s) {
  if (Array.isArray(s.logos) && s.logos.length) {
    const sep = s.separador ? `<span class="chip-vs">${escapar(s.separador)}</span>` : '';
    const chips = s.logos.map((l) => `<div class="chip">${img(l)}</div>`).join(sep);
    return `<div class="visual"><div class="chips">${chips}</div></div>`;
  }
  if (!s.visual) return '';

  switch (s.visual_modo ?? 'libre') {
    case 'recorte':
      return ''; // se dibuja aparte, a nivel de slide
    case 'marco':
      return `<div class="visual"><div class="visual-marco">${img(s.visual)}</div></div>`;
    case 'papel':
      return `<div class="visual"><div class="visual-papel">${img(s.visual)}</div></div>`;
    case 'chip':
      return `<div class="visual"><div class="chips"><div class="chip">${img(s.visual)}</div></div></div>`;
    default:
      return `<div class="visual">${img(s.visual)}</div>`;
  }
}

function visualRecorte(s) {
  if (!s.visual || s.visual_modo !== 'recorte') return '';
  const pos = ['izq', 'der'].includes(s.visual_pos) ? s.visual_pos : '';
  return `<div class="visual-recorte ${pos}">${img(s.visual)}</div>`;
}

function blobHtml(s) {
  if (!s.blob) return '';
  const pos = typeof s.blob === 'string' ? s.blob : 'abajo-der';
  const validas = ['abajo-der', 'abajo-izq', 'arriba-der', 'arriba-izq'];
  const clase = validas.includes(pos) ? pos : 'abajo-der';
  return `<span class="deco"><span class="blob blob-${clase}"></span></span>`;
}

/** Sin imagen inline, el bloque de texto se ancla arriba en vez de centrarse. */
const centro = (s, vis) => `centro${vis ? '' : ' centro-arriba'}`;

/* ------------------------------------------------------------------
   Layouts
   ------------------------------------------------------------------ */
const layouts = {
  /** Slide 1: gancho. Handle enmarcado + título con palabra destacada. */
  portada(s, ctx) {
    const vis = visualInline(s);
    return `
      <div class="cabecera"><div class="handle-enmarcado">${escapar(ctx.handle)}</div></div>
      <div class="centro">
        <div class="apilado-sm">
          ${s.mostrar_iso === false ? '' : logo('logo-centrado logo-grande')}
          <h1 class="titulo-portada">
            ${s.titulo ? md(s.titulo) : ''}
            ${s.destacado ? `<span class="destacado">${escapar(s.destacado)}</span>` : ''}
          </h1>
          ${s.subtitulo ? `<p class="subtitulo-portada">${md(s.subtitulo)}</p>` : ''}
        </div>
        ${vis}
      </div>
      <div class="pie">
        <div class="deslizar"><span>${escapar(s.pie ?? 'Deslizá')}</span><span class="flecha">›</span></div>
      </div>`;
  },

  /** Slide de desarrollo numerado. El caballito de batalla del carrusel. */
  punto(s, ctx) {
    const vis = visualInline(s);
    return `
      <div class="cabecera"><div class="numero">${escapar(s.numero ?? '')}</div></div>
      <div class="${centro(s, vis)}">
        <div class="apilado">
          ${s.titulo ? `<h2 class="titulo">${md(s.titulo)}</h2>` : ''}
          ${s.cuerpo ? `<p class="cuerpo">${md(s.cuerpo)}</p>` : ''}
          ${s.remate ? `<p class="remate">${md(s.remate)}</p>` : ''}
        </div>
        ${vis}
      </div>
      <div class="pie"><div class="firma"><span>${escapar(ctx.handle)}</span><span>${escapar(s.numero ?? '')}</span></div></div>`;
  },

  /** Slide libre de contenido: título grande + cuerpo + remate en itálica. */
  contenido(s, ctx) {
    const vis = visualInline(s);
    return `
      <div class="cabecera">${logo('logo-chico')}</div>
      <div class="${centro(s, vis)}">
        <div class="apilado">
          ${s.eyebrow ? `<div class="eyebrow">${escapar(s.eyebrow)}</div>` : ''}
          ${s.titulo ? `<h2 class="titulo">${md(s.titulo)}</h2>` : ''}
          ${s.cuerpo ? `<p class="cuerpo">${md(s.cuerpo)}</p>` : ''}
          ${s.remate ? `<p class="remate">${md(s.remate)}</p>` : ''}
        </div>
        ${vis}
      </div>
      <div class="pie"><div class="firma"><span>${escapar(ctx.handle)}</span><span></span></div></div>`;
  },

  /** Enumeración con bullets. Para "5 señales de que...", checklists, etc. */
  lista(s, ctx) {
    const items = (s.items ?? [])
      .map((it) => `<li class="lista-item"><span class="bullet"></span><span>${md(it)}</span></li>`)
      .join('');
    return `
      <div class="cabecera">${logo('logo-chico')}</div>
      <div class="${centro(s, '')}">
        <div class="apilado">
          ${s.titulo ? `<h2 class="titulo">${md(s.titulo)}</h2>` : ''}
          <ul class="lista">${items}</ul>
        </div>
      </div>
      <div class="pie"><div class="firma"><span>${escapar(ctx.handle)}</span><span></span></div></div>`;
  },

  /** Frase suelta con peso. Para datos duros o afirmaciones fuertes. */
  cita(s, ctx) {
    const vis = visualInline(s);
    return `
      <div class="cabecera">${logo('logo-chico')}</div>
      <div class="centro">
        <div class="apilado">
          <h2 class="titulo">${md(s.texto ?? '')}</h2>
          ${s.autor ? `<p class="cuerpo">${md(s.autor)}</p>` : ''}
        </div>
        ${vis}
      </div>
      <div class="pie"><div class="firma"><span>${escapar(ctx.handle)}</span><span></span></div></div>`;
  },

  /** Último slide: cierre + CTA. Siempre sobre el degradé de marca. */
  cierre(s, ctx) {
    return `
      <div class="cabecera">${logo('logo-centrado')}</div>
      <div class="centro">
        <div class="apilado" style="text-align:center;align-items:center">
          ${s.titulo ? `<h2 class="titulo" style="text-align:center">${md(s.titulo)}</h2>` : ''}
          ${s.cuerpo ? `<p class="cuerpo" style="text-align:center">${md(s.cuerpo)}</p>` : ''}
          ${s.cta ? `<div class="cta cta-centrado">${escapar(s.cta)}</div>` : ''}
        </div>
      </div>
      <div class="pie"><div class="firma" style="justify-content:center"><span>${escapar(ctx.handle)}</span></div></div>`;
  },
};

function construirHtml(spec) {
  const ctx = { handle: spec.handle ?? '@yourebrand.es' };
  const fondos = asignarFondos(spec.slides);

  const slides = spec.slides
    .map((s, i) => {
      const fn = layouts[s.layout];
      if (!fn) {
        throw new Error(
          `Slide ${i + 1}: layout desconocido "${s.layout}". Válidos: ${Object.keys(layouts).join(', ')}`
        );
      }
      const recorte = visualRecorte(s);
      const clases = [
        'slide',
        clasesFondo[fondos[i]] ?? 'fondo-marca',
        s.textura === false ? '' : 'con-textura',
        recorte ? 'con-recorte' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return `<section class="${clases}" data-n="${i + 1}">${blobHtml(s)}${fn(s, ctx)}${recorte}</section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<link rel="stylesheet" href="${pathToFileURL(join(RAIZ, 'marca/fonts/fonts.css')).href}">
<link rel="stylesheet" href="${pathToFileURL(join(RAIZ, 'marca/tokens.css')).href}">
<link rel="stylesheet" href="${pathToFileURL(join(RAIZ, 'disenio/estilos.css')).href}">
</head><body>${slides}</body></html>`;
}

/* ------------------------------------------------------------------
   Autoajuste: ningún texto se desborda nunca.
   Corre dentro del browser, después de que cargaron las fuentes.
   ------------------------------------------------------------------ */
function autoajustar() {
  const avisos = [];

  for (const slide of document.querySelectorAll('.slide')) {
    const n = slide.dataset.n;

    // 1) La palabra destacada se come el ancho.
    // Arrancamos del techo y bajamos hasta que entre en una línea: así una
    // palabra larga se achica y una corta ("5") crece, en vez de quedar
    // clavada en el tamaño base y perder el rol de ancla visual.
    const dest = slide.querySelector('.destacado');
    if (dest) {
      const disponible = slide.clientWidth - 2 * parseFloat(getComputedStyle(slide).paddingLeft);
      const TECHO = 320;
      let px = TECHO;
      dest.style.fontSize = px + 'px';
      let guardia = 0;
      while (dest.scrollWidth > disponible && px > 40 && guardia++ < 200) {
        px -= 2;
        dest.style.fontSize = px + 'px';
      }
      if (dest.scrollWidth > disponible) avisos.push(`slide ${n}: "destacado" no entra ni al mínimo`);
    }

    // 2) Overflow vertical.
    // Medimos SOLO los hijos en flujo: los adornos absolutos (blobs, recortes)
    // sobresalen a propósito y no son desborde de texto.
    const est = getComputedStyle(slide);
    const disponible =
      slide.clientHeight - parseFloat(est.paddingTop) - parseFloat(est.paddingBottom);
    const enFlujo = [...slide.children].filter(
      (el) => getComputedStyle(el).position !== 'absolute'
    );
    const alto = () => enFlujo.reduce((a, el) => a + el.getBoundingClientRect().height, 0);

    const titulo = slide.querySelector('.titulo, .titulo-portada');
    const cuerpos = slide.querySelectorAll('.cuerpo, .lista-item, .remate');
    let guardia = 0;
    while (alto() > disponible + 1 && guardia++ < 60) {
      let toque = false;
      if (titulo) {
        const t = parseFloat(getComputedStyle(titulo).fontSize);
        if (t > 44) { titulo.style.fontSize = t - 2 + 'px'; toque = true; }
      }
      for (const c of cuerpos) {
        const t = parseFloat(getComputedStyle(c).fontSize);
        if (t > 22) { c.style.fontSize = t - 1 + 'px'; toque = true; }
      }
      if (!toque) break; // ya está todo al mínimo, no tiene sentido seguir
    }
    if (alto() > disponible + 1) {
      avisos.push(`slide ${n}: el contenido excede el canvas — hay que recortar texto en el brief`);
    }
  }
  return avisos;
}

/* ------------------------------------------------------------------ */
async function main() {
  const [specPath, salidaArg] = process.argv.slice(2);
  if (!specPath) {
    console.error('Uso: node disenio/render.mjs <spec.json> [carpeta-salida]');
    process.exit(1);
  }

  const spec = JSON.parse(await readFile(resolve(specPath), 'utf8'));
  if (!Array.isArray(spec.slides) || spec.slides.length === 0) {
    throw new Error('El spec no tiene slides.');
  }

  // Sin carpeta explícita, los PNG van al lado del spec. Es lo que uno espera
  // al correr `render.mjs output/2026-08-07-algo/spec.json`.
  const salida = salidaArg ? resolve(salidaArg) : dirname(resolve(specPath));
  await mkdir(salida, { recursive: true });

  const html = construirHtml(spec);
  const htmlTmp = join(salida, '_preview.html');
  await writeFile(htmlTmp, html);

  const executablePath = await buscarChromium();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({
    viewport: { width: ANCHO, height: ALTO },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(htmlTmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const avisos = await page.evaluate(autoajustar);
  for (const a of avisos) console.warn(`  ⚠ ${a}`);

  const nodos = await page.$$('.slide');
  const archivos = [];
  for (let i = 0; i < nodos.length; i++) {
    const nombre = `slide-${String(i + 1).padStart(2, '0')}.png`;
    await nodos[i].screenshot({ path: join(salida, nombre) });
    archivos.push(nombre);
    console.log(`  ✓ ${nombre}`);
  }

  await browser.close();
  await rm(htmlTmp, { force: true });

  console.log(`\n✓ ${archivos.length} slides en ${salida}`);
}

main().catch((e) => {
  console.error('✗ Error al renderizar:', e.message);
  process.exit(1);
});
