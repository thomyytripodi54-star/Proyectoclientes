// Propuesta AQ Capital — genera el .docx a partir del sistema visual en disenio/propuesta.md
// Correr: node clientes/acucapital/armar-propuesta.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  BorderStyle, ShadingType, WidthType, AlignmentType, VerticalAlign,
  HeightRule, LevelFormat, PageBreak, Footer, HeaderFooterType,
  PageNumber, TabStopType, convertMillimetersToTwip,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "propuesta-AQ-Capital-2026-07-30.docx");

// ---------------------------------------------------------------- tokens --
const COLOR = {
  azul: "2A4269",
  azulOscuro: "1E3050",
  rojo: "E9203F",
  blanco: "FFFFFF",
  blancoBanda80: "FBD2D9", // aprox. blanco 80% sobre la banda roja
  cuerpo: "333333",
  pieGris: "888888",
  filaAlt: "F4F5F7",
  bordeTabla: "E0E0E0",
  placeholderGris: "CCCCCC",
};

const cm = (v) => Math.round(v * 566.929);

// -------------------------------------------------------------- imagenes --
const isologoBuffer = fs.readFileSync(path.join(__dirname, "assets", "isologo-yourebrand.png"));
const ISOLOGO_ASPECT = 800 / 491;

// ------------------------------------------------------------ numbering --
const numbering = {
  config: [
    {
      reference: "bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: cm(0.5), hanging: cm(0.35) },
              spacing: { after: 60, line: 336, lineRule: "auto" },
            },
            run: { color: COLOR.cuerpo, size: 21 },
          },
        },
      ],
    },
  ],
};

// ------------------------------------------------------------- helpers --

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: opts.after ?? 70, line: 336, lineRule: "auto" },
    children: runsFrom(text, opts),
  });
}

// admite **negrita** y *itálica* simples dentro del string
function runsFrom(text, opts = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter((p) => p !== "");
  return parts.map((p) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return new TextRun({ text: p.slice(2, -2), bold: true, color: opts.color ?? COLOR.cuerpo, size: opts.size ?? 21, font: "Poppins" });
    }
    if (p.startsWith("*") && p.endsWith("*")) {
      return new TextRun({ text: p.slice(1, -1), italics: true, color: opts.color ?? COLOR.cuerpo, size: opts.size ?? 21, font: "Poppins" });
    }
    return new TextRun({ text: p, color: opts.color ?? COLOR.cuerpo, size: opts.size ?? 21, font: "Poppins" });
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 110, line: 336, lineRule: "auto" },
    alignment: opts.alignment,
    children: runsFrom(text, opts),
  });
}

function h1(numero, titulo) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 120, line: 264, lineRule: "auto" },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.rojo, space: 4 } },
    children: [
      new TextRun({ text: `${numero} · `, bold: true, color: COLOR.rojo, size: 34, font: "Poppins" }),
      new TextRun({ text: titulo, bold: true, color: COLOR.azul, size: 34, font: "Poppins" }),
    ],
  });
}

function h2(titulo, opts = {}) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: opts.before ?? 130, after: 55, line: 264, lineRule: "auto" },
    children: [new TextRun({ text: titulo, color: COLOR.azul, size: 25, font: "Poppins SemiBold" })],
  });
}

function cita(texto, atribucion) {
  return [
    new Paragraph({
      keepNext: true,
      spacing: { before: 100, after: 20, line: 300, lineRule: "auto" },
      indent: { left: cm(0.5) },
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: COLOR.rojo, space: 8 } },
      children: [new TextRun({ text: `"${texto}"`, italics: true, color: COLOR.azul, size: 22, font: "Poppins" })],
    }),
    new Paragraph({
      spacing: { after: 130 },
      indent: { left: cm(0.5) },
      children: [new TextRun({ text: `— ${atribucion}`, color: COLOR.pieGris, size: 18, font: "Poppins" })],
    }),
  ];
}

function callout(text) {
  return new Table({
    width: { size: cm(16), type: WidthType.DXA },
    columnWidths: [cm(16)],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: cm(16), type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.filaAlt },
            margins: { top: 160, bottom: 160, left: 220, right: 220 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR.azul },
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            },
            children: [new Paragraph({ spacing: { line: 336, lineRule: "auto" }, children: runsFrom(text, { size: 21 }) })],
          }),
        ],
      }),
    ],
  });
}

function standardTable({ headers, rows, widthsCm }) {
  const widths = widthsCm.map(cm);
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: headers.map((htext, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.azul },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: htext, color: COLOR.blanco, size: 20, font: "Poppins SemiBold" })] })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((ctext, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: ri % 2 === 0 ? COLOR.blanco : COLOR.filaAlt },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.bordeTabla },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.bordeTabla },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      },
      children: [new Paragraph({ spacing: { line: 300, lineRule: "auto" }, children: runsFrom(ctext, { size: 20 }) })],
    })),
  }));
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

// envoltorio de una sola celda: una tabla adentro de una fila cantSplit no se
// puede partir entre filas propias — o entra entera en la página, o se mueve
// entera a la siguiente. Así se evita que una tabla se corte entre páginas.
function atomic(tabla) {
  return new Table({
    width: { size: cm(16), type: WidthType.DXA },
    columnWidths: [cm(16)],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: cm(16), type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [tabla],
          }),
        ],
      }),
    ],
  });
}

function numbersBlock(items, perRow = items.length) {
  const w = cm(16 / perRow);
  const filas = [];
  for (let i = 0; i < items.length; i += perRow) filas.push(items.slice(i, i + perRow));
  const tabla = new Table({
    width: { size: cm(16), type: WidthType.DXA },
    columnWidths: Array(perRow).fill(w),
    rows: filas.map((fila) => new TableRow({
      cantSplit: true,
      children: fila.map((it) => new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 65, bottom: 65, left: 60, right: 60 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 25 }, children: [new TextRun({ text: it.numero, bold: true, color: COLOR.rojo, size: 52, font: "Poppins" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: it.etiqueta, color: COLOR.pieGris, size: 18, font: "Poppins" })] }),
        ],
      })),
    })),
  });
  return perRow < items.length ? atomic(tabla) : tabla;
}

// dos tablas estándar lado a lado, para no gastar el doble de alto vertical
function sideBySide(tablaA, tablaB, wA = 7.1, wGap = 0.8, wB = 8.1) {
  return new Table({
    width: { size: cm(16), type: WidthType.DXA },
    columnWidths: [cm(wA), cm(wGap), cm(wB)],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: cm(wA), type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [tablaA],
          }),
          new TableCell({
            width: { size: cm(wGap), type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: cm(wB), type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [tablaB],
          }),
        ],
      }),
    ],
  });
}

// -------------------------------------------------------- tabla de inversión --
function investmentTable(options) {
  const w = cm(16 / options.length);
  const widths = options.map(() => w);

  const tagRow = new TableRow({
    cantSplit: true,
    height: { value: cm(0.7), rule: HeightRule.EXACT },
    children: options.map((opt) => new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: opt.recomendada ? COLOR.rojo : COLOR.blanco },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: opt.recomendada ? [new TextRun({ text: "RECOMENDADA", bold: true, color: COLOR.blanco, size: 16, font: "Poppins", characterSpacing: 20 })] : [new TextRun({ text: "", size: 16 })],
      })],
    })),
  });

  const headerRow = new TableRow({
    cantSplit: true,
    children: options.map((opt) => new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: opt.recomendada ? COLOR.rojo : COLOR.azul },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 264, lineRule: "auto" }, children: [new TextRun({ text: opt.titulo, color: COLOR.blanco, size: 21, font: "Poppins SemiBold" })] })],
    })),
  });

  const montoRow = new TableRow({
    cantSplit: true,
    children: options.map((opt) => new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.filaAlt },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 140, bottom: 100, left: 140, right: 140 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: opt.monto, bold: true, color: COLOR.azul, size: 32, font: "Poppins" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opt.pago, color: COLOR.pieGris, size: 17, font: "Poppins" })] }),
      ],
    })),
  });

  const itemsRow = new TableRow({
    cantSplit: true,
    children: options.map((opt) => new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.filaAlt },
      margins: { top: 100, bottom: 160, left: 220, right: 140 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: opt.items.map((it) => new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 45, line: 264, lineRule: "auto" },
        indent: { left: cm(0.35), hanging: cm(0.3) },
        children: [new TextRun({ text: it, color: COLOR.cuerpo, size: 19, font: "Poppins" })],
      })),
    })),
  });

  return atomic(new Table({
    width: { size: cm(16), type: WidthType.DXA },
    columnWidths: widths,
    rows: [tagRow, headerRow, montoRow, itemsRow],
  }));
}

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// =============================================================== PORTADA ==

const banda = new Table({
  width: { size: cm(16), type: WidthType.DXA },
  columnWidths: [cm(16)],
  rows: [
    new TableRow({
      cantSplit: true,
      height: { value: cm(7.2), rule: HeightRule.EXACT },
      children: [
        new TableCell({
          width: { size: cm(16), type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.rojo },
          verticalAlign: VerticalAlign.CENTER,
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 90 }, children: [new TextRun({ text: "Propuesta de trabajo", bold: true, color: COLOR.blanco, size: 60, font: "Poppins" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AQ Capital", color: COLOR.blancoBanda80, size: 26, font: "Poppins" })] }),
          ],
        }),
      ],
    }),
  ],
});

const logoPlaceholder = new Table({
  width: { size: cm(12), type: WidthType.DXA },
  columnWidths: [cm(12)],
  alignment: AlignmentType.CENTER,
  rows: [
    new TableRow({
      cantSplit: true,
      height: { value: cm(4), rule: HeightRule.EXACT },
      children: [
        new TableCell({
          width: { size: cm(12), type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.DASHED, size: 4, color: COLOR.placeholderGris },
            bottom: { style: BorderStyle.DASHED, size: 4, color: COLOR.placeholderGris },
            left: { style: BorderStyle.DASHED, size: 4, color: COLOR.placeholderGris },
            right: { style: BorderStyle.DASHED, size: 4, color: COLOR.placeholderGris },
          },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Reemplazar por el logo de AQ Capital", color: COLOR.placeholderGris, size: 16, font: "Poppins" })],
          })],
        }),
      ],
    }),
  ],
});

function metaRow(label, valor) {
  return new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: cm(4.2), type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 50, bottom: 50 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: COLOR.azul, size: 19, font: "Poppins" })] })],
      }),
      new TableCell({
        width: { size: cm(11.8), type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 50, bottom: 50 },
        children: [new Paragraph({ children: [new TextRun({ text: valor, color: COLOR.cuerpo, size: 19, font: "Poppins" })] })],
      }),
    ],
  });
}

const metadatos = new Table({
  width: { size: cm(16), type: WidthType.DXA },
  columnWidths: [cm(4.2), cm(11.8)],
  rows: [
    metaRow("Preparado para", "AQ Capital"),
    metaRow("Interlocutor", "Santiago Acuña — socio (cargo exacto a confirmar)"),
    metaRow("Preparado por", "Yourebrand — Thomas Tripodi"),
    metaRow("Fecha", "30 de julio de 2026"),
    metaRow("Origen", "Reunión del 30 de julio de 2026 (grabación en Fathom)"),
  ],
});

const isoWordmark = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 130 },
  children: [
    new ImageRun({
      type: "png",
      data: isologoBuffer,
      transformation: { height: 34, width: Math.round(34 * ISOLOGO_ASPECT) },
    }),
    new TextRun({ text: "  Yourebrand", bold: true, color: COLOR.azul, size: 25, font: "Poppins" }),
  ],
});

const taglineBlock = [
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 3, color: COLOR.placeholderGris, space: 6 } },
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "", size: 2 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 90, after: 90 },
    children: [new TextRun({ text: "EL CAMINO A LA DIGITALIZACIÓN DE TU NEGOCIO", color: COLOR.pieGris, size: 18, font: "Poppins", characterSpacing: 26 })],
  }),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 3, color: COLOR.placeholderGris, space: 6 } },
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "", size: 2 })],
  }),
];

const portada = [
  banda,
  new Paragraph({ spacing: { before: 260, after: 0 }, children: [] }),
  logoPlaceholder,
  new Paragraph({ spacing: { before: 320, after: 0 }, children: [] }),
  metadatos,
  new Paragraph({ spacing: { before: 420, after: 0 }, children: [] }),
  isoWordmark,
  ...taglineBlock,
  pageBreak(),
];

// ============================================================ PÁGINA 2 ====
// 01 · Resumen ejecutivo — 02 · Situación actual del negocio

const pagina2 = [
  h1("01", "Resumen ejecutivo"),
  body("AQ Capital arrancó a principios de 2026, pero la cartera venía de antes: los clientes llegaron por los 30 años de trayectoria en el mercado, no por una campaña. Ese es el punto de partida y también lo que Santiago trajo a la reunión: *no es que estamos desesperados buscando clientes*, pero sí quiere *tener una marca importante, que la gente nos conozca en el ambiente*."),
  body("Hoy AQ Capital tiene página web y un LinkedIn con dos publicaciones, la última de hace un mes. Instagram no existe. El negocio llega por recomendación, y cuando alguien los recomienda, el recomendado busca — y encuentra una firma que arrancó y se frenó."),
  body("Ya intentaron resolverlo puertas adentro: un plan para publicar una vez por semana que quedó en la nada. No falló la idea, falló la agenda — son dos personas gestionando carteras."),
  body("Lo que proponemos es acotado y **no es captación de clientes**: una Community Manager asignada que sostiene LinkedIn e Instagram con 2 a 3 publicaciones semanales, más la puesta a punto de los dos perfiles."),
  body("Desde **525.000 pesos por mes** en el plan trimestral. El detalle está en la última página.", { after: 25 }),

  h1("02", "Situación actual del negocio"),
  h2("Lo que ya está funcionando"),
  bullet("El negocio existe y factura sin necesitar marketing. La cartera llegó por confianza y recomendación — el canal más difícil de construir en gestión de inversiones."),
  bullet("La web está resuelta y tiene testimonios de presidentes de empresas: aval de peso, poco común en una firma de seis meses."),
  bullet("El diferencial está claro: atención personalizada y los 30 años del padre de Santiago en el mercado."),
  bullet("Están sumando banca corporativa sobre la base de banca privada — crecimiento de servicio real.", { after: 18 }),
  ...cita("Los ofrecen todos, son todos iguales.", "Santiago, sobre los servicios del sector, en la reunión del 30 de julio"),

  h2("Lo que nos contaste en la reunión"),
  bullet("Son dos personas. Los clientes son mayormente de Buenos Aires. Un cliente grande, para ustedes, es a partir de los 100.000 dólares gestionados."),
  bullet("Están entrando al agro, apalancados en dos familiares del sector."),
  bullet("El canal es el boca a boca: un cliente grande no va a llegar por Instagram, y si llegan chicos, bienvenidos.", { after: 18 }),

  h2("Lo que observamos"),
  bullet("Tu perfil personal te presenta como Agente Registrado y Especialista en Mercado de Capitales (IAMC) — la credencial más dura de la firma, y hoy está en un solo lugar."),
  bullet("Sobre la marca, tu propia descripción fue: *no hay mucho complejo, es una página web, LinkedIn, unos logos y listo*.", { after: 18 }),
  standardTable({
    headers: ["", "LinkedIn hoy", "Con la puesta a punto"],
    widthsCm: [4.3, 5.7, 6],
    rows: [
      ["Servicios y contacto", "Sin apartado de servicios, sin ruta directa", "Banca privada y corporativa explicadas, con ruta para agendar"],
      ["Actividad", "Última publicación hace un mes. Instagram no existe", "2 a 3 publicaciones por semana entre ambas redes"],
    ],
  }),
];

// ============================================================ 03 ==========
// Puntos de mejora

const seccion3 = [
  h1("03", "Puntos de mejora"),

  h2("1. Las dos personas que pueden publicar son las mismas que atienden las carteras"),
  body("Ya hubo un intento: publicar una vez por semana. No falló la herramienta ni la idea — falló que nadie tiene la agenda para ejecutarlo. Mientras la publicación compita con un cliente que llama, siempre pierde."),
  ...cita("Somos dos, estamos con muchas cosas y hay veces que no tengo ni tiempo para eso. Cuando tengo tiempo lo hago.", "Santiago, en la reunión del 30 de julio"),
  body("**Qué te cuesta:** el problema no es de voluntad, es estructural. Sin alguien de afuera a cargo, cualquier plan que armen va a durar dos publicaciones.", { after: 65 }),

  h2("2. El boca a boca funciona, pero el que llega recomendado no encuentra dónde apoyarse", { before: 40 }),
  body("Cuando un cliente los recomienda, el recomendado googlea antes de llamar. Hoy encuentra una web correcta, un LinkedIn frenado hace un mes y ningún Instagram."),
  body("**Qué te cuesta:** la recomendación trae a alguien con la guardia baja, y la marca se la vuelve a levantar. En una decisión donde el otro va a confiar cien mil dólares, una firma que arrancó y se detuvo genera exactamente la pregunta que no quieren.", { after: 65 }),

  h2("3. En LinkedIn no se entiende a qué se dedican", { before: 40 }),
  body("Sin apartado de servicios cargado y sin ruta de contacto. Para saber qué hacen hay que salir a buscar la página web."),
  body("**Qué te cuesta:** la banca corporativa es el servicio que están sumando ahora, el que más necesita explicación — y hoy no está escrito en ningún lado donde lo lea un dueño de PyME que necesita descontar cheques.", { after: 65 }),

  h2("4. El único activo que no les pueden copiar no está circulando", { before: 40 }),
  body("Treinta años de mercado, testimonios de presidentes de empresas y la matrícula de Agente Registrado. Eso es lo que diferencia a AQ Capital de la otra ALyC que ofrece lo mismo. Hoy está repartido entre una web que hay que buscar a propósito y un perfil personal de LinkedIn."),
  body("**Qué te cuesta:** el aval solo sirve si aparece antes de la reunión, no durante. Si el otro ya se sentó con ustedes, la trayectoria la cuentan ustedes — el problema es todo lo que pasa antes de que se siente."),
];

// ============================================================ 04 y 05 =====
// Cómo lo resolvemos — Alcance

const tablaIncluye = standardTable({
  headers: ["Qué incluye", "Frecuencia"],
  widthsCm: [4.3, 2.8],
  rows: [
    ["Community Manager asignada, con experiencia en el sector", "1, dedicada"],
    ["Publicaciones entre LinkedIn e Instagram", "2 a 3 por semana"],
    ["Calendario de contenido para aprobación", "Mensual"],
    ["Diseño de piezas gráficas, flyers y edición de video (material provisto)", "En cada publicación"],
    ["Puesta a punto de perfiles (bio, destacadas, enlaces)", "Mes 1, una vez"],
    ["Reunión de seguimiento con Thomas Tripodi", "1 por mes"],
  ],
});

const tablaNoIncluye = standardTable({
  headers: ["Qué NO incluye", "Aclaración"],
  widthsCm: [2.6, 5.5],
  rows: [
    ["Pauta publicitaria", "Se cotiza aparte: 250.000 $/mes de gestión, sin el presupuesto de anuncios"],
    ["Prospección en LinkedIn", "Servicio separado, no está en ninguna de las tres opciones"],
    ["Grabación on-site", "No está contemplada. Si más adelante quieren video con sus caras, se cotiza"],
    ["Rediseño de la web y consultas entrantes", "La web queda como está. Las consultas las contestan ustedes — nosotros publicamos y avisamos"],
    ["Opinión de inversión propia", "Nunca emitimos criterio en nombre de AQ Capital: todo contenido de mercado lo aprueban ustedes antes de publicarse"],
  ],
});

const seccion4y5 = [
  h1("04", "Cómo lo resolvemos"),
  body("No proponemos un sistema de captación, y es a propósito: Santiago no está desesperado por clientes, y un cliente grande no llega por redes. El objetivo es que **cuando la demanda llegue por recomendación, la marca no la frene** — y que ustedes no sean el cuello de botella. Todo lo que sigue está armado para que su carga de trabajo sea aprobar, no producir.", { after: 65 }),

  h2("Etapa 1 — Puesta a punto (mes 1)", { before: 20 }),
  bullet("LinkedIn: apartado de servicios (banca privada y corporativa, separadas y explicadas), ruta de contacto directa y revisión del perfil de empresa."),
  bullet("Instagram: apertura y armado completo — biografía, destacadas por servicio, identidad visual, enlace a la web y a la agenda.", { after: 65 }),

  h2("Etapa 2 — Flujo sostenido (desde el mes 1, en simultáneo)", { before: 20 }),
  body("2 a 3 publicaciones semanales entre las dos redes, sobre tres ejes: lectura de mercado (dólar MEP, coyuntura), explicación de servicios (sobre todo banca corporativa) y trayectoria y aval. Santiago aprueba el calendario — no escribe ni diseña nada.", { after: 65 }),

  h2("Etapa 3 — Recién si lo piden", { before: 20 }),
  body("Prospección en LinkedIn y pauta publicitaria quedan fuera del arranque. Están en la última página para que sepan qué sigue, no para que lo contraten ahora.", { after: 25 }),

  h1("05", "Alcance"),
  sideBySide(tablaIncluye, tablaNoIncluye),
];

// ============================================================ 06 y 07 =====
// Quiénes lo hacen — Próximos pasos

const seccion6y7 = [
  h1("06", "Quiénes lo hacen"),
  h2("El equipo asignado a AQ Capital", { before: 20 }),
  bullet("**Thomas Tripodi** — Founder & CEO. Contacto directo, con reunión mensual — no se reúnen solo con el equipo operativo."),
  bullet("**Community Manager asignada** — se define del equipo según el perfil de la cuenta, y se presenta con nombre en la reunión de arranque."),
  bullet("**Tefy** — diseño e identidad de marca. Interviene en la puesta a punto del mes 1.", { after: 45 }),
  body("Somos una agencia de más de 20 personas, 6 años en el mercado y más de 400 clientes en Argentina y España — incluidos servicios profesionales: estudios jurídicos, consultoras, salud.", { after: 65 }),

  h2("Un caso, y por qué lo mostramos", { before: 20 }),
  body("Gema Salud Animal no es el rubro de AQ Capital. Se lo mostramos porque tenía el mismo problema: una firma que existía y a la que nadie encontraba cuando la iban a buscar.", { after: 25 }),
  numbersBlock([
    { numero: "21,7 mil", etiqueta: "Visitas al perfil (+213%)" },
    { numero: "18,1 mil", etiqueta: "Clics en el enlace (+204%)" },
    { numero: "10 mil", etiqueta: "Interacciones (+408%)" },
    { numero: "+3.000", etiqueta: "Seguidores (desde 300)" },
  ], 2),
  body("Los dos números que importan para este caso son los primeros: gente que llegó al perfil y gente que desde ahí fue a buscar el contacto — exactamente lo que hoy no pasa cuando alguien los recomienda.", { after: 65 }),

  h1("07", "Próximos pasos"),
  body("Revisen esta propuesta los dos — sabemos que la decisión la toman entre Santiago y su padre. Junto a este documento van la grabación de la reunión y el portfolio, para que tengan el mismo contexto."),
  body("**La acción concreta:** el miércoles 12 de agosto hacemos una segunda reunión de 30 minutos, donde definimos opción, alcance final y fecha de arranque. Thomas manda la invitación esta semana."),
];

// ============================================================ PÁGINA 6 ====
// Anexo — Tu inversión

const inversionOpciones = [
  {
    titulo: "Gestión + Campañas",
    monto: "835.000 $/mes",
    pago: "Mensual",
    recomendada: false,
    items: [
      "Gestión de LinkedIn + Instagram",
      "2 a 3 publicaciones semanales",
      "Puesta a punto de ambos perfiles",
      "Reunión mensual con Thomas",
      "Gestión de campañas publicitarias",
      "Resuelve los 4 puntos de mejora",
    ],
  },
  {
    titulo: "Gestión — Trimestral",
    monto: "525.000 $/mes",
    pago: "3 meses por adelantado (1.575.000 $)",
    recomendada: true,
    items: [
      "Gestión de LinkedIn + Instagram",
      "2 a 3 publicaciones semanales",
      "Puesta a punto de ambos perfiles",
      "Reunión mensual con Thomas",
      "Resuelve los 4 puntos de mejora",
    ],
  },
  {
    titulo: "Gestión — Mensual",
    monto: "585.000 $/mes",
    pago: "Mes a mes",
    recomendada: false,
    items: [
      "Gestión de LinkedIn + Instagram",
      "2 a 3 publicaciones semanales",
      "Puesta a punto de ambos perfiles",
      "Reunión mensual con Thomas",
      "Resuelve los 4 puntos de mejora",
    ],
  },
];

const anexo = [
  pageBreak(),
  h1("Anexo", "Tu inversión"),
  body("Tres opciones. Todos los valores son mensuales, en pesos argentinos, y salen de los números que se hablaron en la reunión del 30 de julio.", { after: 25 }),
  investmentTable(inversionOpciones),
  body("La opción de Campañas suma 250.000 $/mes de gestión de pauta sobre la gestión mensual. El presupuesto de anuncios va aparte y lo define AQ Capital.", { after: 100, size: 18 }),

  h2("Por qué recomendamos la trimestral", { before: 20 }),
  body("Construcción de marca no se mide en semanas: si el objetivo es que *la gente los conozca en el ambiente*, tres meses es el mínimo honesto para que se note. Un mes de prueba no dice nada, y lo peor que puede pasar es cortar en el mes dos y quedar otra vez con un perfil frenado."),
  body("Además son **60.000 pesos menos por mes** — sobre los tres meses, **180.000 pesos de diferencia** contra el plan mensual.", { after: 25 }),

  h2("Sobre las campañas", { before: 20 }),
  body("No las recomendamos para arrancar: el cliente grande de AQ Capital no está esperando un anuncio en Instagram. Están en la tabla porque es información que merecen tener, y porque en algún momento van a querer probar la pata de venta. Ese momento no es hoy.", { after: 65 }),

  callout("Para leer con tu viejo, en una línea: por 525.000 pesos al mes durante tres meses, AQ Capital deja de tener un LinkedIn frenado y pasa a tener dos canales activos, sin que ninguno de los dos tenga que sacar tiempo de un cliente para escribir un posteo."),
];

// =========================================================== documento ===

const footerDefault = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 3, color: COLOR.bordeTabla, space: 6 } },
      tabStops: [{ type: TabStopType.RIGHT, position: cm(16) }],
      children: [
        new TextRun({ text: "Yourebrand · El camino a la digitalización de tu negocio", color: COLOR.pieGris, size: 16, font: "Poppins" }),
        new TextRun({ text: "\t", size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT], color: COLOR.pieGris, size: 16, font: "Poppins" }),
      ],
    }),
  ],
});

// La portada ya lleva el tagline entre hairlines debajo del isologo.
// Repetirlo en el pie lo diría dos veces en la misma página.
const footerFirst = new Footer({ children: [new Paragraph({ children: [] })] });

const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: "Poppins", size: 21, color: COLOR.cuerpo } } },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 },
        },
        titlePage: true,
      },
      footers: { default: footerDefault, first: footerFirst },
      children: [
        ...portada,
        ...pagina2,
        ...seccion3,
        ...seccion4y5,
        ...seccion6y7,
        ...anexo,
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log("Generado:", OUT);
