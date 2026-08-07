/* ============================================================
   Avatares del equipo.
   Retratos planos y geométricos, construidos con la paleta de
   marca para que se lean como un set. Rita y Lola son mujeres;
   Damián y Facu, varones.
   ============================================================ */

const PIEL = '#E9B894';
const PIEL_SOMBRA = '#D9A280';
const RASGO = '#1B2C47';

const FONDOS = {
  rita:   '#2A4269',
  damian: '#22375A',
  lola:   '#2A4269',
  facu:   '#22375A',
};

const PELO = {
  rita:   '#E9203F',
  damian: '#101B2E',
  lola:   '#D21C7C',
  facu:   '#EE2C4D',
};

/** Torso y cuello, iguales para todos: es lo que los hace un equipo. */
const cuerpo = (ropa) => `
  <path d="M41 60 h18 v14 h-18 z" fill="${PIEL_SOMBRA}"/>
  <path d="M17 100 C17 80 30 71 50 71 C70 71 83 80 83 100 Z" fill="${ropa}"/>`;

/** Ojos y boca. La expresión cambia apenas entre unos y otros. */
const cara = (sonrisa = 'M44 55 q6 5 12 0') => `
  <circle cx="43.5" cy="46" r="2.4" fill="${RASGO}"/>
  <circle cx="56.5" cy="46" r="2.4" fill="${RASGO}"/>
  <path d="${sonrisa}" stroke="${RASGO}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;

const cabeza = `<ellipse cx="50" cy="44" rx="18" ry="21" fill="${PIEL}"/>`;

const AVATARES = {
  /* Rita — investigadora. Pelo largo y anteojos: pasa el día leyendo fuentes. */
  rita: () => `
    <path d="M27 52 C27 24 73 24 73 52 L73 76 C73 66 68 62 68 48 L32 48 C32 62 27 66 27 76 Z" fill="${PELO.rita}"/>
    ${cabeza}
    ${cara()}
    <g stroke="${RASGO}" stroke-width="2" fill="none">
      <circle cx="43.5" cy="46" r="6.5"/>
      <circle cx="56.5" cy="46" r="6.5"/>
      <path d="M50 45.5 h0.5" stroke-linecap="round" stroke-width="2.4"/>
    </g>
    <path d="M32 34 C36 24 64 24 68 34 C60 29 40 29 32 34 Z" fill="${PELO.rita}"/>
    ${cuerpo('#16233A')}`,

  /* Damián — estrategia. Pelo corto y barba corta. */
  damian: () => `
    ${cabeza}
    <path d="M32 44 C32 58 36 64 50 64 C64 64 68 58 68 44 C68 50 63 54 50 54 C37 54 32 50 32 44 Z" fill="${PELO.damian}" opacity="0.92"/>
    <path d="M29 46 C29 20 71 20 71 46 C69 34 62 27 50 27 C38 27 31 34 29 46 Z" fill="${PELO.damian}"/>
    ${cara('M45 56 q5 3.5 10 0')}
    ${cuerpo('#16233A')}`,

  /* Lola — diseño. Carré con flequillo recto: la más gráfica del equipo. */
  lola: () => `
    <path d="M28 46 C28 22 72 22 72 46 L72 70 L64 70 L64 42 L36 42 L36 70 L28 70 Z" fill="${PELO.lola}"/>
    ${cabeza}
    <path d="M31 38 C34 26 66 26 69 38 L69 33 C69 21 31 21 31 33 Z" fill="${PELO.lola}"/>
    <rect x="31" y="30" width="38" height="9" rx="3" fill="${PELO.lola}"/>
    ${cara()}
    ${cuerpo('#16233A')}`,

  /* Facu — copy. Pelo corto con onda al frente. */
  facu: () => `
    ${cabeza}
    <path d="M31 40 C31 21 69 21 69 40 C66 32 60 34 55 30 C48 35 38 31 31 40 Z" fill="${PELO.facu}"/>
    ${cara('M45 56 q5 4 10 -0.5')}
    ${cuerpo('#16233A')}`,
};

/** Devuelve el SVG completo de un agente. Si no lo conocemos, cae en una inicial. */
function avatar(id) {
  const fondo = FONDOS[id] ?? '#22375A';
  const dibujo = AVATARES[id];

  const contenido = dibujo
    ? dibujo()
    : `<text x="50" y="62" text-anchor="middle" font-family="Poppins, sans-serif"
             font-size="40" font-weight="800" fill="#93A4C2">${(id || '?')[0].toUpperCase()}</text>`;

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${id}">
    <defs><clipPath id="c-${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
    <g clip-path="url(#c-${id})">
      <rect width="100" height="100" fill="${fondo}"/>
      ${contenido}
    </g>
  </svg>`;
}
