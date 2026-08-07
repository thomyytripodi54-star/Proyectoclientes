# Biblioteca de gráficos

Acá viven los elementos visuales que el diseñador puede meter en los carruseles.
**El diseñador solo puede usar archivos que existan en esta carpeta** — no inventa
imágenes ni referencia rutas que no están.

## Organización

| Carpeta | Qué va | Formato ideal |
|---|---|---|
| `personajes/` | Ilustraciones 3D, personajes, muñecos. | PNG con fondo transparente |
| `logos/` | Logos de marcas que se citan (Nike, Meta, Google…). | SVG o PNG transparente |
| `fotos/` | Fotos reales: equipo, clientes, detrás de escena, stock. | JPG o PNG |

## Reglas de formato

- **Los recortes necesitan fondo transparente.** Un PNG con fondo blanco metido en
  `visual_modo: "recorte"` se ve como un parche. Si no tiene transparencia, usalo con
  `marco` o `chip`.
- Resolución mínima **1000px** en el lado largo. El canvas es 1080×1350 y una imagen
  chica se pixela al escalarla.
- Nombres en kebab-case y descriptivos: `personaje-laptop.png`, no `img1.png`. El
  diseñador elige por nombre, así que un nombre claro es un mejor resultado.

## Cómo cargar assets

**A mano:** arrastrá los archivos a la subcarpeta que corresponda. Listo.

**Desde una URL:**

```bash
node scripts/bajar-imagen.mjs <url> marca/assets/graficos/logos/nike.svg
```

> ⚠️ En Claude Code on the web, los bancos de imágenes y CDNs externos están bloqueados
> por el proxy de red. El script funciona desde tu máquina local; en el sandbox no.
> Por eso conviene tener la biblioteca cargada y versionada en el repo.

## Derechos

Las fotos de stock tienen que ser de bancos con licencia libre (Unsplash, Pexels) o
propias. Los logos de terceros se usan de forma nominativa — para citar o comparar
marcas, nunca dando a entender que son clientes o que auspician a Yourebrand.
