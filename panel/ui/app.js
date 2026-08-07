/* ============================================================
   Panel de contenido — lógica de la interfaz
   ============================================================ */

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];

const ORDEN = ['rita', 'damian', 'lola', 'facu'];
let estado = { agentes: [], ideas: [], piezas: [], corridas: [], memoria: {} };
let corriendo = false;

/* ---------------------------------------------------------- helpers */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const miles = (n) => Number(n ?? 0).toLocaleString('es-AR');

const plata = (n) => '$' + Number(n ?? 0).toFixed(2);

const duracion = (ms) => {
  const s = Math.round((ms ?? 0) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};

const titulizar = (slug) =>
  String(slug).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

function tostada(mensaje, mal = false) {
  $$('.tostada').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'tostada' + (mal ? ' mal' : '');
  t.textContent = mensaje;
  document.body.append(t);
  setTimeout(() => t.remove(), 3600);
}

async function api(ruta, opciones = {}) {
  const res = await fetch(ruta, {
    ...opciones,
    headers: opciones.body ? { 'content-type': 'application/json' } : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || `Error ${res.status}`);
  return datos;
}

/* ---------------------------------------------------------- navegación */

$$('.nav-item').forEach((b) =>
  b.addEventListener('click', () => mostrar(b.dataset.seccion)));

function mostrar(id) {
  $$('.nav-item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.seccion === id)));
  $$('.seccion').forEach((s) => s.classList.toggle('activa', s.id === `s-${id}`));
  location.hash = id;
}

/* ---------------------------------------------------------- pipeline */

function pintarPipeline() {
  const agentes = ORDEN
    .map((id) => estado.agentes.find((a) => a.id === id))
    .filter(Boolean);

  const lista = agentes.length ? agentes : estado.agentes;

  $('#pipeline').innerHTML = lista
    .map(
      (a) => `
      <div class="estacion" data-agente="${esc(a.id)}" data-estado="espera">
        <div class="avatar-aro">${avatar(a.id)}</div>
        <div>
          <div class="estacion-nombre">${esc(a.nombre)}</div>
          <div class="estacion-rol">${esc(a.rol || a.modelo)}</div>
        </div>
        <div class="estacion-estado"></div>
      </div>`
    )
    .join('');
}

function estacion(id) {
  return $(`.estacion[data-agente="${CSS.escape(id)}"]`);
}

function marcarEstacion(id, estadoNuevo, texto = '') {
  const el = estacion(id);
  if (!el) return;
  el.dataset.estado = estadoNuevo;
  $('.estacion-estado', el).innerHTML =
    estadoNuevo === 'listo' ? '<span class="tilde">✓ listo</span>' : esc(texto);

  const i = ORDEN.indexOf(id);
  if (i >= 0) {
    const avance = estadoNuevo === 'listo' ? i + 1 : i;
    $('#pipeline').style.setProperty('--avance', Math.max(avance, 0));
  }
}

function reiniciarPipeline() {
  $$('.estacion').forEach((e) => {
    e.dataset.estado = 'espera';
    $('.estacion-estado', e).textContent = '';
  });
  $('#pipeline').style.setProperty('--avance', 0);
}

/* ---------------------------------------------------------- registro */

function log(texto, clase = '') {
  const reg = $('#registro');
  const hora = new Date().toLocaleTimeString('es-AR', { hour12: false });
  const linea = document.createElement('div');
  linea.className = clase;
  linea.innerHTML = `<span class="l-hora">${hora}</span>${esc(texto)}`;
  reg.append(linea);
  reg.scrollTop = reg.scrollHeight;
}

/* ---------------------------------------------------------- corrida */

let acumulado = { entrada: 0, salida: 0 };
let herramientasUsadas = 0;
let agenteActual = null;
let arranque = 0;

function metricasCorrida() {
  const transcurrido = arranque ? Date.now() - arranque : 0;
  $('#metricas-corrida').innerHTML = [
    ['Tokens de entrada', miles(acumulado.entrada)],
    ['Tokens de salida', miles(acumulado.salida)],
    ['Herramientas', miles(herramientasUsadas)],
    ['Tiempo', duracion(transcurrido)],
  ]
    .map(([k, v]) => `<div class="metrica"><div class="valor">${v}</div><div class="clave">${k}</div></div>`)
    .join('');
}

let reloj = null;

function conectarEventos() {
  const es = new EventSource('/api/eventos');

  es.onmessage = (e) => {
    let d;
    try { d = JSON.parse(e.data); } catch { return; }

    switch (d.clase) {
      case 'corrida-inicio':
        corriendo = true;
        acumulado = { entrada: 0, salida: 0 };
        herramientasUsadas = 0;
        agenteActual = null;
        arranque = d.inicio;
        reiniciarPipeline();
        botonesCorriendo(true);
        log(`▶ ${d.comando}`, 'l-agente');
        reloj = setInterval(metricasCorrida, 1000);
        break;

      case 'agente-arranca': {
        if (agenteActual && agenteActual !== d.agente) marcarEstacion(agenteActual, 'listo');
        agenteActual = d.agente;
        marcarEstacion(d.agente, 'trabajando', 'trabajando…');
        const a = estado.agentes.find((x) => x.id === d.agente);
        log(`${a ? a.nombre : d.agente} arrancó`, 'l-agente');
        break;
      }

      case 'herramienta':
        herramientasUsadas++;
        if (agenteActual) marcarEstacion(agenteActual, 'trabajando', `${d.nombre}…`);
        break;

      case 'texto':
        if (d.sub) log(d.texto.split('\n')[0].slice(0, 150));
        break;

      case 'tokens':
        acumulado = d.acumulado ?? acumulado;
        metricasCorrida();
        break;

      case 'corrida-fin':
        corriendo = false;
        clearInterval(reloj);
        if (agenteActual) marcarEstacion(agenteActual, 'listo');
        botonesCorriendo(false);
        metricasCorrida();
        if (d.codigo === 0) {
          log(`✓ Terminó en ${duracion(d.duracion)} · ${plata(d.costo)}`, 'l-ok');
          tostada('Corrida terminada');
        } else {
          log(`✗ Falló (código ${d.codigo}) ${d.error ?? ''}`, 'l-error');
          tostada('La corrida falló, mirá el registro', true);
        }
        cargar();
        break;
    }
  };

  es.onerror = () => log('Se cortó la conexión con el servidor, reintentando…', 'l-error');
}

function botonesCorriendo(activo) {
  $('#btn-activar').disabled = activo;
  $('#btn-investigar').disabled = activo;
  $('#btn-detener').hidden = !activo;
  $('#btn-activar').textContent = activo ? 'Corriendo…' : 'Activar flujo';
}

async function lanzar(base) {
  const tema = $('#tema').value.trim();
  try {
    await api('/api/correr', { method: 'POST', body: JSON.stringify({ comando: `${base} ${tema}`.trim() }) });
  } catch (e) {
    tostada(e.message, true);
  }
}

$('#btn-activar').addEventListener('click', () => lanzar('/carrusel'));
$('#btn-investigar').addEventListener('click', () => lanzar('/investigar'));
$('#btn-detener').addEventListener('click', () => api('/api/detener', { method: 'POST' }).catch(() => {}));
$('#btn-limpiar').addEventListener('click', () => { $('#registro').innerHTML = ''; });

/* ---------------------------------------------------------- contenido */

function pintarPiezas() {
  const cont = $('#piezas');
  if (!estado.piezas.length) {
    cont.innerHTML = `<div class="vacio">Todavía no hay piezas producidas.<br>Andá a <strong>Flujo</strong> y activá una corrida.</div>`;
    return;
  }

  cont.innerHTML = estado.piezas.map((p) => {
    const publicada = p.marca.estado === 'publicada';
    const c = p.copy;

    const slides = p.slides
      .map((s) => `<img src="/salida/${encodeURIComponent(p.slug)}/${s}" alt="${esc(s)}" loading="lazy">`)
      .join('');

    return `
    <article class="pieza" data-slug="${esc(p.slug)}">
      <header class="pieza-cab">
        <h3>${esc(titulizar(p.slug))}</h3>
        <span class="pill">${p.slides.length} slides</span>
        ${publicada ? '<span class="pill pill-ok">Publicada</span>' : '<span class="pill pill-media">Lista para subir</span>'}
        ${c?.meta?.pilar ? `<span class="pill">${esc(c.meta.pilar)}</span>` : ''}
        <div class="pieza-acciones">
          <button class="boton boton-chico" data-accion="copiar">Copiar caption</button>
          <button class="boton boton-chico" data-accion="bajar">Descargar slides</button>
          <button class="boton boton-chico" data-accion="publicada">${publicada ? 'Marcar pendiente' : 'Marcar publicada'}</button>
          <button class="boton boton-chico boton-peligro" data-accion="borrar">Eliminar</button>
        </div>
      </header>

      ${slides ? `<div class="tira">${slides}</div>` : ''}

      <div class="pieza-cuerpo">
        ${c?.antes ? `<div class="aviso"><strong>Antes de publicar</strong>\n${esc(c.antes)}</div>` : ''}

        ${c ? `
          <div>
            <div class="etiqueta" style="margin-bottom:8px">Caption</div>
            <div class="copy-caja" data-caption>${esc(c.caption)}</div>
          </div>
          ${c.hashtags ? `<div><div class="etiqueta" style="margin-bottom:8px">Hashtags</div><div class="copy-caja hashtags">${esc(c.hashtags)}</div></div>` : ''}
        ` : '<div class="vacio">Esta pieza todavía no tiene copy.</div>'}

        <details class="editor">
          <summary>Corregir diseño — editar el spec y volver a renderizar</summary>
          <textarea class="codigo" data-spec spellcheck="false">${esc(JSON.stringify(p.spec ?? {}, null, 2))}</textarea>
          <div style="display:flex;gap:9px;margin-top:10px;align-items:center">
            <button class="boton boton-chico boton-primario" data-accion="renderizar">Guardar y renderizar</button>
            <span class="etiqueta" data-salida-render></span>
          </div>
        </details>
      </div>
    </article>`;
  }).join('');
}

$('#piezas').addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  const img = e.target.closest('.tira img');

  if (img) { abrirLightbox(img.src); return; }
  if (!boton) return;

  const pieza = boton.closest('.pieza');
  const slug = pieza.dataset.slug;
  const datos = estado.piezas.find((p) => p.slug === slug);

  switch (boton.dataset.accion) {
    case 'copiar': {
      const texto = [datos.copy?.caption, datos.copy?.hashtags].filter(Boolean).join('\n\n');
      if (!texto) return tostada('Esta pieza no tiene copy', true);
      await navigator.clipboard.writeText(texto);
      tostada('Caption copiado');
      break;
    }

    case 'bajar':
      datos.slides.forEach((s, i) => {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = `/salida/${encodeURIComponent(slug)}/${s}`;
          a.download = `${slug}-${s}`;
          a.click();
        }, i * 220);
      });
      tostada(`Bajando ${datos.slides.length} slides`);
      break;

    case 'publicada': {
      const nuevo = datos.marca.estado === 'publicada' ? 'listo' : 'publicada';
      await api(`/api/piezas/${encodeURIComponent(slug)}/marca`, {
        method: 'PUT', body: JSON.stringify({ estado: nuevo }),
      });
      tostada(nuevo === 'publicada' ? 'Marcada como publicada' : 'Vuelve a pendiente');
      cargar();
      break;
    }

    case 'borrar':
      if (!confirm(`¿Eliminar "${titulizar(slug)}"?\n\nSe borran los slides, el copy y el spec. No se puede deshacer.`)) return;
      await api(`/api/piezas/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      tostada('Pieza eliminada');
      cargar();
      break;

    case 'renderizar': {
      const area = $('[data-spec]', pieza);
      const salida = $('[data-salida-render]', pieza);
      let spec;
      try { spec = JSON.parse(area.value); }
      catch { return tostada('El JSON tiene un error de sintaxis', true); }

      boton.disabled = true;
      salida.textContent = 'Renderizando…';
      try {
        const r = await api(`/api/piezas/${encodeURIComponent(slug)}/spec`, {
          method: 'PUT', body: JSON.stringify({ spec }),
        });
        salida.textContent = r.salida?.split('\n').pop() ?? 'Listo';
        tostada('Slides regenerados');
        cargar();
      } catch (err) {
        salida.textContent = err.message;
        tostada('Falló el render', true);
      } finally {
        boton.disabled = false;
      }
      break;
    }
  }
});

/* ---------------------------------------------------------- ideas */

function pintarIdeas() {
  const producidas = new Set(estado.piezas.map((p) => p.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')));
  const cont = $('#ideas');

  if (!estado.ideas.length) {
    cont.innerHTML = `<div class="vacio">Todavía no hay ideas. Corré <strong>Solo investigar</strong> para que Damián arme el repertorio.</div>`;
    return;
  }

  const peso = { alta: 0, media: 1, baja: 2 };
  const ordenadas = [...estado.ideas].sort((a, b) => (peso[a.prioridad] ?? 3) - (peso[b.prioridad] ?? 3));

  cont.innerHTML = ordenadas.map((i) => `
    <article class="idea">
      <div class="idea-cab">
        ${i.simbolo ? `<div class="idea-simbolo">${esc(i.simbolo)}</div>` : ''}
        <h3>${esc(i.titulo)}</h3>
      </div>
      <div class="idea-pills">
        <span class="pill pill-${esc(i.prioridad)}">${esc(i.prioridad)}</span>
        ${i.pilar ? `<span class="pill">${esc(i.pilar)}</span>` : ''}
        <span class="pill">${esc(i.formato)}${i.slides ? ` · ${i.slides}` : ''}</span>
        ${producidas.has(i.slug) ? '<span class="pill pill-ok">producida</span>' : ''}
      </div>
      ${i.pulgar ? `<div class="pulgar">${esc(i.pulgar)}</div>` : ''}
      ${i.angulo ? `<p>${esc(i.angulo)}</p>` : ''}
      ${!producidas.has(i.slug)
        ? `<button class="boton boton-chico boton-primario" style="align-self:flex-start" data-producir="${esc(i.slug)}">Producir esta</button>`
        : ''}
    </article>`).join('');
}

$('#ideas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-producir]');
  if (!b) return;
  if (corriendo) return tostada('Ya hay una corrida en curso', true);
  mostrar('flujo');
  api('/api/correr', { method: 'POST', body: JSON.stringify({ comando: `/disenar ${b.dataset.producir}` }) })
    .catch((err) => tostada(err.message, true));
});

/* ---------------------------------------------------------- agentes */

function pintarAgentes() {
  $('#agentes').innerHTML = estado.agentes.map((a) => `
    <article class="agente" data-agente="${esc(a.id)}">
      <div class="agente-cab">
        ${avatar(a.id)}
        <div>
          <h3>${esc(a.nombre)}</h3>
          <div class="rol">${esc(a.rol || 'Agente')}</div>
        </div>
      </div>
      <div class="agente-meta">
        <span class="pill pill-modelo">${esc(a.modelo)}</span>
        <span class="pill">${a.herramientas.length} herramientas</span>
      </div>
      <p class="agente-desc">${esc(a.descripcion.split('.')[0])}.</p>
      <div class="agente-tools">${esc(a.herramientas.join(' · '))}</div>
      <details class="editor">
        <summary>Ver y editar el contexto</summary>
        <textarea class="codigo" data-contenido spellcheck="false">${esc(a.contenido)}</textarea>
        <div style="display:flex;gap:9px;margin-top:10px;align-items:center">
          <button class="boton boton-chico boton-primario" data-guardar>Guardar</button>
          <span class="etiqueta" data-aviso></span>
        </div>
      </details>
    </article>`).join('');
}

$('#agentes').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-guardar]');
  if (!b) return;
  const tarjeta = b.closest('.agente');
  const contenido = $('[data-contenido]', tarjeta).value;
  const aviso = $('[data-aviso]', tarjeta);

  b.disabled = true;
  try {
    await api(`/api/agentes/${encodeURIComponent(tarjeta.dataset.agente)}`, {
      method: 'PUT', body: JSON.stringify({ contenido }),
    });
    aviso.textContent = 'Guardado';
    tostada('Contexto actualizado — aplica en la próxima corrida');
    cargar();
  } catch (err) {
    aviso.textContent = err.message;
    tostada(err.message, true);
  } finally {
    b.disabled = false;
  }
});

/* ---------------------------------------------------------- tokens */

function pintarTokens() {
  const cs = estado.corridas ?? [];

  const total = cs.reduce((a, c) => ({
    entrada: a.entrada + (c.tokens?.entrada ?? 0),
    salida: a.salida + (c.tokens?.salida ?? 0),
    costo: a.costo + (c.costo ?? 0),
  }), { entrada: 0, salida: 0, costo: 0 });

  $('#metricas-tokens').innerHTML = [
    ['Corridas', miles(cs.length)],
    ['Tokens de entrada', miles(total.entrada)],
    ['Tokens de salida', miles(total.salida)],
    ['Costo acumulado', plata(total.costo)],
  ].map(([k, v]) => `<div class="metrica"><div class="valor">${v}</div><div class="clave">${k}</div></div>`).join('');

  // Desglose por modelo, sumando todas las corridas
  const porModelo = {};
  for (const c of cs) {
    for (const [modelo, u] of Object.entries(c.porModelo ?? {})) {
      porModelo[modelo] ??= { entrada: 0, salida: 0, costo: 0 };
      porModelo[modelo].entrada += (u.inputTokens ?? 0) + (u.cacheReadInputTokens ?? 0) + (u.cacheCreationInputTokens ?? 0);
      porModelo[modelo].salida += u.outputTokens ?? 0;
      porModelo[modelo].costo += u.costUSD ?? 0;
    }
  }

  const filas = Object.entries(porModelo).sort((a, b) => b[1].costo - a[1].costo);
  const techo = Math.max(1, ...filas.map(([, u]) => u.costo));

  $('#tabla-modelos').innerHTML = filas.length
    ? `<thead><tr><th>Modelo</th><th>Entrada</th><th>Salida</th><th>Costo</th><th style="width:120px">Peso</th></tr></thead>
       <tbody>${filas.map(([m, u]) => `
         <tr>
           <td style="font-family:var(--mono);font-size:12.5px">${esc(m)}</td>
           <td class="num">${miles(u.entrada)}</td>
           <td class="num">${miles(u.salida)}</td>
           <td class="num">${plata(u.costo)}</td>
           <td><div class="barra"><span style="width:${(u.costo / techo) * 100}%"></span></div></td>
         </tr>`).join('')}</tbody>`
    : `<tbody><tr><td style="color:var(--tenue)">Todavía no hay corridas registradas.</td></tr></tbody>`;

  $('#tabla-corridas').innerHTML = cs.length
    ? `<thead><tr><th>Cuándo</th><th>Comando</th><th>Duración</th><th>Tokens</th><th>Costo</th></tr></thead>
       <tbody>${cs.map((c) => `
         <tr>
           <td>${new Date(c.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
           <td style="font-family:var(--mono);font-size:12.5px">${esc(c.comando)}</td>
           <td class="num">${duracion(c.duracion)}</td>
           <td class="num">${miles((c.tokens?.entrada ?? 0) + (c.tokens?.salida ?? 0))}</td>
           <td class="num">${plata(c.costo)}</td>
         </tr>`).join('')}</tbody>`
    : `<tbody><tr><td style="color:var(--tenue)">Sin corridas todavía.</td></tr></tbody>`;
}

/* ---------------------------------------------------------- lightbox */

const lightbox = $('#lightbox');
const abrirLightbox = (src) => { $('img', lightbox).src = src; lightbox.classList.add('abierto'); };
lightbox.addEventListener('click', () => lightbox.classList.remove('abierto'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('abierto'); });

/* ---------------------------------------------------------- arranque */

async function cargar() {
  try {
    estado = await api('/api/estado');
  } catch (e) {
    tostada('No se puede hablar con el servidor', true);
    return;
  }

  $('#c-piezas').textContent = estado.piezas.length;
  $('#c-ideas').textContent = estado.ideas.length;
  $('#c-agentes').textContent = estado.agentes.length;
  $('#pie-permisos').textContent = `permisos: ${estado.permisos}`;

  pintarPipeline();
  pintarPiezas();
  pintarIdeas();
  pintarAgentes();
  pintarTokens();
  metricasCorrida();

  if (estado.corriendo && !corriendo) {
    corriendo = true;
    botonesCorriendo(true);
  }
}

if (location.hash) mostrar(location.hash.slice(1));
cargar().then(conectarEventos);
