# Arma mapa-creadoras.html inyectando los límites de CABA + GBA (geo.json) en el template.
import pathlib
d=pathlib.Path(__file__).parent
(d/'mapa-creadoras.html').write_text((d/'template.html').read_text().replace('__GEO__',(d/'geo.json').read_text()))
