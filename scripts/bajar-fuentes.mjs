#!/usr/bin/env node
/**
 * Baja los subsets latinos de Poppins desde Google Fonts y genera
 * marca/fonts/fonts.css apuntando a los archivos locales.
 *
 * Se corre UNA sola vez (o cuando quieras refrescar las fuentes).
 * Después de esto el render funciona 100% offline y determinista.
 *
 *   node scripts/bajar-fuentes.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'marca', 'fonts');

const URL_CSS =
  'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap';

// Google devuelve woff2 moderno sólo si el User-Agent parece un browser actual.
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Nos quedamos sólo con los bloques latin / latin-ext: el resto es peso muerto. */
const esLatino = (rangoUnicode) =>
  rangoUnicode.includes('U+0000-00FF') || rangoUnicode.includes('U+0100-02AF');

async function main() {
  await mkdir(destino, { recursive: true });

  const css = await (await fetch(URL_CSS, { headers: { 'User-Agent': UA } })).text();

  const bloques = css.split('@font-face').slice(1);
  const reglas = [];
  let bajados = 0;

  for (const bloque of bloques) {
    const rango = bloque.match(/unicode-range:\s*([^;]+);/)?.[1] ?? '';
    if (!esLatino(rango)) continue;

    const url = bloque.match(/url\((https:\/\/[^)]+)\)/)?.[1];
    const peso = bloque.match(/font-weight:\s*(\d+)/)?.[1] ?? '400';
    const estilo = bloque.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal';
    if (!url) continue;

    const sufijo = rango.includes('U+0100-02AF') ? 'ext' : 'lat';
    const archivo = `poppins-${peso}-${estilo}-${sufijo}.woff2`;

    const bytes = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    await writeFile(join(destino, archivo), bytes);
    bajados++;

    reglas.push(
      `@font-face {\n` +
        `  font-family: 'Poppins';\n` +
        `  font-style: ${estilo};\n` +
        `  font-weight: ${peso};\n` +
        `  font-display: block;\n` +
        `  src: url('./${archivo}') format('woff2');\n` +
        `  unicode-range: ${rango.trim()};\n` +
        `}`
    );
  }

  await writeFile(
    join(destino, 'fonts.css'),
    `/* Generado por scripts/bajar-fuentes.mjs — no editar a mano. */\n\n${reglas.join('\n\n')}\n`
  );

  console.log(`✓ ${bajados} archivos de fuente en marca/fonts/`);
  console.log(`✓ marca/fonts/fonts.css generado`);
}

main().catch((e) => {
  console.error('✗ Falló la descarga de fuentes:', e.message);
  process.exit(1);
});
