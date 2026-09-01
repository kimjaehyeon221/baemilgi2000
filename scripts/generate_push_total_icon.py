from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 1024
BG = (166, 75, 53)          # terracotta / brick
INK = (249, 247, 242)       # warm ivory
ACCENT = (132, 53, 37)      # darker brick accent
RADIUS = 30

img = Image.new('RGB', (SIZE, SIZE), BG)
draw = ImageDraw.Draw(img)

# PUSH TOTAL icon concept:
# a wall that is built bottom -> top, matching the app's lifetime-brick metaphor.
# Keep the geometry simple so the symbol survives iOS home-screen scaling.

def brick(x1, y1, x2, y2):
    draw.rounded_rectangle((x1, y1, x2, y2), radius=RADIUS, fill=INK)

# bottom course
brick(145, 690, 369, 810)
brick(400, 690, 624, 810)
brick(655, 690, 879, 810)

# middle course
brick(272, 540, 496, 660)
brick(528, 540, 752, 660)

# upper course
brick(400, 390, 624, 510)

# tiny progress marker between the completed wall and the next brick
# (reads as "the next rep / next brick" rather than decorative noise)
draw.ellipse((491, 344, 533, 386), fill=ACCENT)

# next brick, visually separated so the stack feels alive / still growing
brick(400, 205, 624, 325)

out = Path('assets/icon.png')
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, format='PNG', optimize=True)
print(f'Wrote {out} ({img.size[0]}x{img.size[1]}, {img.mode})')
