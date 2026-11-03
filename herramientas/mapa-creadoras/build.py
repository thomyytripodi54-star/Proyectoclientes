# Arma mapa-creadoras-3d.html inyectando los límites de CABA + GBA (geo.json) en el template.
import pathlib
d=pathlib.Path(__file__).parent
(d/'mapa-creadoras-3d.html').write_text((d/'mapa-3d.template.html').read_text().replace('__GEO__',(d/'geo.json').read_text()))
