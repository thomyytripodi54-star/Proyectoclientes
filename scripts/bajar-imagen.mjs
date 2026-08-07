#!/usr/bin/env node
/**
 * Baja una imagen a la biblioteca de gráficos.
 *
 *   node scripts/bajar-imagen.mjs <url> <destino>
 *
 * Ejemplo:
 *   node scripts/bajar-imagen.mjs https://.../nike.svg marca/assets/graficos/logos/nike.svg
 *
 * Nota: en Claude Code on the web el proxy bloquea los CDN externos. Este script
 * está pensado para correrlo desde tu máquina.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';

const TIPOS_OK = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

async function main() {
  const [url, destino] = process.argv.slice(2);
  if (!url || !destino) {
    console.error('Uso: node scripts/bajar-imagen.mjs <url> <destino>');
    process.exit(1);
  }

  const ext = extname(destino).toLowerCase();
  if (!TIPOS_OK.includes(ext)) {
    console.error(`✗ Extensión no soportada: "${ext}". Usá una de: ${TIPOS_OK.join(', ')}`);
    process.exit(1);
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; yourebrand-assets/1.0)' },
  });
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status} al bajar ${url}`);
    process.exit(1);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  const ruta = resolve(destino);
  await mkdir(dirname(ruta), { recursive: true });
  await writeFile(ruta, bytes);

  console.log(`✓ ${destino} (${(bytes.length / 1024).toFixed(0)} KB)`);

  if (ext !== '.svg') {
    console.log('  Recordá: para usarlo con visual_modo "recorte" necesita fondo transparente.');
  }
}

main().catch((e) => {
  console.error('✗ Falló la descarga:', e.message);
  process.exit(1);
});
