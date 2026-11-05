"""Quantise les PNG de doc/e2e/ au-dessus de 300 kB (palette 128 puis 64 couleurs)."""
import os, sys
from PIL import Image

DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'doc', 'e2e')
LIMIT = 300 * 1000
for name in sorted(os.listdir(DIR)):
    if not name.endswith('.png'):
        continue
    path = os.path.join(DIR, name)
    for colors in (256, 128, 64, 32):
        if os.path.getsize(path) <= LIMIT:
            break
        Image.open(path).convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)
    print(name, os.path.getsize(path) // 1000, 'kB')
