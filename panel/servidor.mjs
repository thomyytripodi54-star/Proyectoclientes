#!/usr/bin/env node
/**
 * YOUREBRAND — Panel de control del pipeline
 *
 *   npm run panel      →  http://localhost:4321
 *
 * Servidor local sin dependencias: sirve la UI y expone una API sobre el repo.
 * A diferencia de una página publicada, esto corre en tu máquina, así que puede
 * ejecutar de verdad los agentes (vía la CLI de Claude Code) y el renderer.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir, rm, mkdir, stat } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import { join, dirname, resolve, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UI = join(RAIZ, 'panel', 'ui');
const ESTADO = join(RAIZ, 'panel', 'estado.json');
const PUERTO = Number(process.env.YB_PUERTO ?? 4321);

/* Permisos con los que corre la CLI. El panel lo levantás vos sobre tu propio
   repo, así que pre-aprobamos las herramientas del pipeline: si no, la corrida
   headless se cuelga esperando una confirmación que nadie puede dar. */
const PERMISOS = process.env.YB_PERMISOS ?? 'acceptEdits';
const HERRAMIENTAS = process.env.YB_HERRAMIENTAS ?? 'Bash,Read,Write,Edit,Glob,Grep,WebSearch,WebFetch,Task,TodoWrite';

/* ------------------------------------------------------------------ utilidades */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
};

const json = (res, datos, codigo = 200) => {
  res.writeHead(codigo, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
  res.end(JSON.stringify(datos));
};

const leerCuerpo = (req) =>
  new Promise((ok, mal) => {
    let d = '';
    req.on('data', (c) => {
      d += c;
      if (d.length > 5e6) mal(new Error('cuerpo demasiado grande'));
    });
    req.on('end', () => {
      try { ok(d ? JSON.parse(d) : {}); } catch (e) { mal(e); }
    });
  });

/** Parser de frontmatter YAML plano — alcanza para lo que guardamos. */
function frontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { datos: {}, cuerpo: texto };
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const p = linea.match(/^([\w-]+):\s*(.*)$/);
    if (p) datos[p[1]] = p[2].trim().replace(/^["']|["']$/g, '');
  }
  return { datos, cuerpo: m[2] };
}

/** Evita que un slug con ../ se escape de la carpeta que le corresponde. */
function slugSeguro(s) {
  const limpio = String(s ?? '').replace(/[^a-zA-Z0-9._-]/g, '');
  return limpio && !limpio.startsWith('.') ? limpio : null;
}

async function leerEstado() {
  if (!existsSync(ESTADO)) return { piezas: {}, corridas: [] };
  try { return JSON.parse(await readFile(ESTADO, 'utf8')); }
  catch { return { piezas: {}, corridas: [] }; }
}

async function guardarEstado(e) {
  await mkdir(dirname(ESTADO), { recursive: true });
  await writeFile(ESTADO, JSON.stringify(e, null, 2));
}

/* ------------------------------------------------------------------ lectura del repo */

const GENERO = { rita: 'f', lola: 'f', damian: 'm', facu: 'm' };
const NOMBRE = { rita: 'Rita', damian: 'Damián', lola: 'Lola', facu: 'Facu' };
const ROL = {
  rita: 'Investigación',
  damian: 'Estrategia',
  lola: 'Diseño',
  facu: 'Copy',
};
const ORDEN = ['rita', 'damian', 'lola', 'facu'];

async function leerAgentes() {
  const dir = join(RAIZ, '.claude', 'agents');
  if (!existsSync(dir)) return [];
  const archivos = (await readdir(dir)).filter((f) => f.endsWith('.md'));

  const agentes = await Promise.all(
    archivos.map(async (f) => {
      const texto = await readFile(join(dir, f), 'utf8');
      const { datos, cuerpo } = frontmatter(texto);
      const id = datos.name ?? f.replace(/\.md$/, '');
      return {
        id,
        archivo: f,
        nombre: NOMBRE[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
        rol: ROL[id] ?? '',
        genero: GENERO[id] ?? 'n',
        modelo: datos.model ?? 'heredado',
        herramientas: (datos.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean),
        descripcion: datos.description ?? '',
        instrucciones: cuerpo.trim(),
        contenido: texto,
      };
    })
  );

  return agentes.sort((a, b) => {
    const ia = ORDEN.indexOf(a.id), ib = ORDEN.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

async function leerIdeas() {
  const dir = join(RAIZ, 'pipeline', '2-ideas');
  if (!existsSync(dir)) return [];
  const archivos = (await readdir(dir)).filter((f) => f.endsWith('.md'));

  return Promise.all(
    archivos.map(async (f) => {
      const texto = await readFile(join(dir, f), 'utf8');
      const { datos, cuerpo } = frontmatter(texto);
      const seccion = (titulo) =>
        cuerpo.match(new RegExp(`##\\s+${titulo}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i'))?.[1]?.trim() ?? '';
      return {
        slug: datos.slug ?? f.replace(/\.md$/, ''),
        titulo: datos.titulo ?? datos.slug ?? f,
        estado: datos.estado ?? 'backlog',
        prioridad: datos.prioridad ?? 'media',
        pilar: datos.pilar ?? '',
        formato: datos.formato ?? 'carrusel',
        slides: Number(datos.slides ?? 0),
        simbolo: datos.simbolo ?? '',
        objetivo: datos.objetivo ?? '',
        fecha: datos.fecha ?? '',
        pulgar: seccion('Por qué frena el pulgar'),
        angulo: seccion('Ángulo'),
        promesa: seccion('Promesa al lector'),
        guion: seccion('Guion slide por slide'),
        cuerpo,
      };
    })
  );
}

async function leerPiezas() {
  const dir = join(RAIZ, 'output');
  if (!existsSync(dir)) return [];
  const carpetas = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const estado = await leerEstado();

  const piezas = await Promise.all(
    carpetas.map(async (slug) => {
      const base = join(dir, slug);
      const archivos = await readdir(base);
      const slides = archivos.filter((f) => /^slide-\d+\.png$/.test(f)).sort();

      let copy = null;
      if (archivos.includes('copy.md')) {
        const texto = await readFile(join(base, 'copy.md'), 'utf8');
        const { datos, cuerpo } = frontmatter(texto);
        const seccion = (titulo) =>
          cuerpo.match(new RegExp(`##\\s+${titulo}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i'))?.[1]?.trim() ?? '';
        copy = {
          meta: datos,
          caption: seccion('Caption'),
          hashtags: seccion('Hashtags'),
          textoSlides: seccion('Texto de los slides'),
          alternativas: seccion('Alternativas de hook'),
          antes: seccion('Antes de publicar'),
          crudo: texto,
        };
      }

      let spec = null;
      if (archivos.includes('spec.json')) {
        try { spec = JSON.parse(await readFile(join(base, 'spec.json'), 'utf8')); } catch {}
      }

      const info = await stat(base);
      return {
        slug,
        slides,
        copy,
        spec,
        modificada: info.mtimeMs,
        marca: estado.piezas?.[slug] ?? { estado: 'listo', notas: '' },
      };
    })
  );

  return piezas.sort((a, b) => b.modificada - a.modificada);
}

async function leerMemoria() {
  const dir = join(RAIZ, 'memoria');
  if (!existsSync(dir)) return {};
  const archivos = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  const out = {};
  for (const f of archivos) out[f.replace(/\.md$/, '')] = await readFile(join(dir, f), 'utf8');
  return out;
}

/* ------------------------------------------------------------------ corridas */

const clientes = new Set();          // conexiones SSE
let corrida = null;                  // { proc, agente, eventos[], tokens, inicio }

function emitir(evento) {
  const linea = `data: ${JSON.stringify(evento)}\n\n`;
  for (const res of clientes) {
    try { res.write(linea); } catch { clientes.delete(res); }
  }
}

/** Traduce los eventos crudos de la CLI a algo que la UI pueda animar. */
function interpretar(d) {
  if (d.type === 'system' && d.subtype === 'init') {
    return { clase: 'inicio', modelo: d.model, sesion: d.session_id };
  }

  if (d.type === 'assistant' && d.message) {
    const bloques = d.message.content ?? [];
    const eventos = [];

    for (const b of bloques) {
      if (b.type === 'tool_use' && (b.name === 'Agent' || b.name === 'Task')) {
        const quien = b.input?.subagent_type ?? b.input?.description ?? 'agente';
        eventos.push({ clase: 'agente-arranca', agente: String(quien).toLowerCase() });
      } else if (b.type === 'tool_use') {
        eventos.push({ clase: 'herramienta', nombre: b.name, sub: !!d.parent_tool_use_id });
      } else if (b.type === 'text' && b.text?.trim()) {
        eventos.push({ clase: 'texto', texto: b.text.trim().slice(0, 400), sub: !!d.parent_tool_use_id });
      }
    }

    const u = d.message.usage;
    if (u) {
      eventos.push({
        clase: 'tokens',
        entrada: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
        salida: u.output_tokens ?? 0,
      });
    }
    return eventos;
  }

  if (d.type === 'result') {
    return {
      clase: 'fin',
      error: !!d.is_error,
      texto: typeof d.result === 'string' ? d.result : '',
      costo: d.total_cost_usd ?? 0,
      duracion: d.duration_ms ?? 0,
      turnos: d.num_turns ?? 0,
      porModelo: d.modelUsage ?? {},
    };
  }
  return null;
}

async function correr(comando) {
  if (corrida) throw new Error('Ya hay una corrida en curso.');

  const args = [
    '-p', comando,
    '--output-format', 'stream-json',
    '--verbose',
    '--permission-mode', PERMISOS,
    '--allowedTools', HERRAMIENTAS,
  ];

  const proc = spawn('claude', args, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
  corrida = { proc, comando, inicio: Date.now(), tokens: { entrada: 0, salida: 0 }, porModelo: {}, costo: 0 };

  emitir({ clase: 'corrida-inicio', comando, inicio: corrida.inicio });

  let buffer = '';
  proc.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lineas = buffer.split('\n');
    buffer = lineas.pop() ?? '';

    for (const linea of lineas) {
      if (!linea.trim()) continue;
      let d;
      try { d = JSON.parse(linea); } catch { continue; }

      const salida = interpretar(d);
      if (!salida) continue;

      for (const ev of [].concat(salida)) {
        if (ev.clase === 'tokens') {
          corrida.tokens.entrada += ev.entrada;
          corrida.tokens.salida += ev.salida;
        }
        if (ev.clase === 'fin') {
          corrida.porModelo = ev.porModelo;
          corrida.costo = ev.costo;
        }
        emitir({ ...ev, acumulado: corrida.tokens });
      }
    }
  });

  let errores = '';
  proc.stderr.on('data', (c) => { errores += c; });

  proc.on('close', async (codigo) => {
    const resumen = {
      clase: 'corrida-fin',
      codigo,
      comando,
      duracion: Date.now() - corrida.inicio,
      tokens: corrida.tokens,
      porModelo: corrida.porModelo,
      costo: corrida.costo,
      error: codigo === 0 ? '' : errores.slice(-800),
    };

    const estado = await leerEstado();
    estado.corridas = [
      { fecha: new Date().toISOString(), ...resumen },
      ...(estado.corridas ?? []),
    ].slice(0, 40);
    await guardarEstado(estado);

    corrida = null;
    emitir(resumen);
  });

  return { ok: true };
}

/* ------------------------------------------------------------------ estáticos */

async function servirArchivo(res, ruta) {
  if (!existsSync(ruta)) { json(res, { error: 'No encontrado' }, 404); return; }
  const info = await stat(ruta);
  if (info.isDirectory()) { json(res, { error: 'No encontrado' }, 404); return; }
  res.writeHead(200, {
    'content-type': MIME[extname(ruta).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
    'content-length': info.size,
  });
  createReadStream(ruta).pipe(res);
}

/** Resuelve una ruta pedida contra una base, sin permitir salirse de ella. */
function dentroDe(base, relativa) {
  const destino = resolve(base, '.' + normalize('/' + relativa));
  return destino.startsWith(base) ? destino : null;
}

/* ------------------------------------------------------------------ servidor */

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const ruta = decodeURIComponent(url.pathname);

  try {
    /* --- API --- */
    if (ruta === '/api/estado') {
      const [agentes, ideas, piezas, memoria, estado] = await Promise.all([
        leerAgentes(), leerIdeas(), leerPiezas(), leerMemoria(), leerEstado(),
      ]);
      return json(res, {
        agentes, ideas, piezas, memoria,
        corridas: estado.corridas ?? [],
        corriendo: !!corrida,
        permisos: PERMISOS,
      });
    }

    if (ruta === '/api/eventos') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      res.write(': conectado\n\n');
      clientes.add(res);
      const latido = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
      req.on('close', () => { clearInterval(latido); clientes.delete(res); });
      return;
    }

    if (ruta === '/api/correr' && req.method === 'POST') {
      const { comando } = await leerCuerpo(req);
      if (typeof comando !== 'string' || !comando.trim()) {
        return json(res, { error: 'Falta el comando.' }, 400);
      }
      try { return json(res, await correr(comando.trim())); }
      catch (e) { return json(res, { error: e.message }, 409); }
    }

    if (ruta === '/api/detener' && req.method === 'POST') {
      if (!corrida) return json(res, { error: 'No hay ninguna corrida.' }, 409);
      corrida.proc.kill('SIGTERM');
      return json(res, { ok: true });
    }

    // Guardar las instrucciones de un agente
    const mAgente = ruta.match(/^\/api\/agentes\/([\w-]+)$/);
    if (mAgente && req.method === 'PUT') {
      const { contenido } = await leerCuerpo(req);
      if (typeof contenido !== 'string' || !contenido.startsWith('---')) {
        return json(res, { error: 'El archivo tiene que arrancar con el frontmatter (---).' }, 400);
      }
      const nombre = slugSeguro(mAgente[1]);
      if (!nombre) return json(res, { error: 'Nombre inválido.' }, 400);
      await writeFile(join(RAIZ, '.claude', 'agents', `${nombre}.md`), contenido);
      return json(res, { ok: true });
    }

    // Corrección de diseño: guardar spec y volver a renderizar
    const mSpec = ruta.match(/^\/api\/piezas\/([\w.-]+)\/spec$/);
    if (mSpec && req.method === 'PUT') {
      const slug = slugSeguro(mSpec[1]);
      if (!slug) return json(res, { error: 'Pieza inválida.' }, 400);
      const { spec } = await leerCuerpo(req);
      const carpeta = join(RAIZ, 'output', slug);
      if (!existsSync(carpeta)) return json(res, { error: 'No existe esa pieza.' }, 404);

      await writeFile(join(carpeta, 'spec.json'), JSON.stringify(spec, null, 2));

      const r = spawn('node', ['disenio/render.mjs', `output/${slug}/spec.json`], { cwd: RAIZ });
      let salida = '';
      r.stdout.on('data', (c) => { salida += c; });
      r.stderr.on('data', (c) => { salida += c; });

      return new Promise((listo) => {
        r.on('close', (codigo) => {
          json(res, { ok: codigo === 0, salida: salida.trim() }, codigo === 0 ? 200 : 500);
          listo();
        });
      });
    }

    // Marcar como publicada / notas
    const mMarca = ruta.match(/^\/api\/piezas\/([\w.-]+)\/marca$/);
    if (mMarca && req.method === 'PUT') {
      const slug = slugSeguro(mMarca[1]);
      if (!slug) return json(res, { error: 'Pieza inválida.' }, 400);
      const { estado: nuevo, notas } = await leerCuerpo(req);
      const est = await leerEstado();
      est.piezas ??= {};
      est.piezas[slug] = { estado: nuevo ?? 'listo', notas: notas ?? '' };
      await guardarEstado(est);
      return json(res, { ok: true });
    }

    // Eliminar una pieza ya subida
    const mBorrar = ruta.match(/^\/api\/piezas\/([\w.-]+)$/);
    if (mBorrar && req.method === 'DELETE') {
      const slug = slugSeguro(mBorrar[1]);
      if (!slug) return json(res, { error: 'Pieza inválida.' }, 400);
      const carpeta = join(RAIZ, 'output', slug);
      if (!existsSync(carpeta)) return json(res, { error: 'No existe esa pieza.' }, 404);
      await rm(carpeta, { recursive: true, force: true });
      const est = await leerEstado();
      delete est.piezas?.[slug];
      await guardarEstado(est);
      return json(res, { ok: true });
    }

    /* --- estáticos --- */
    if (ruta.startsWith('/salida/')) {
      const destino = dentroDe(join(RAIZ, 'output'), ruta.slice('/salida/'.length));
      return destino ? servirArchivo(res, destino) : json(res, { error: 'Ruta inválida' }, 400);
    }
    if (ruta.startsWith('/marca/')) {
      const destino = dentroDe(join(RAIZ, 'marca'), ruta.slice('/marca/'.length));
      return destino ? servirArchivo(res, destino) : json(res, { error: 'Ruta inválida' }, 400);
    }

    const destino = dentroDe(UI, ruta === '/' ? '/index.html' : ruta);
    return destino ? servirArchivo(res, destino) : json(res, { error: 'Ruta inválida' }, 400);
  } catch (e) {
    json(res, { error: e.message }, 500);
  }
});

servidor.listen(PUERTO, () => {
  console.log(`\n  Yourebrand — panel de control`);
  console.log(`  http://localhost:${PUERTO}\n`);
  console.log(`  permisos de la CLI: ${PERMISOS}`);
  console.log(`  (Ctrl+C para cortar)\n`);
});
