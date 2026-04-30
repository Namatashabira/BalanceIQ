"""
Generate PNG icons from logo.svg.
Run from the public/ directory:  python gen_icons.py

Requires cairosvg:  pip install cairosvg
Falls back to a solid-colour placeholder if cairosvg is unavailable.
"""
import os, struct, zlib

SIZES = [
    ("icon-192x192",          192),
    ("icon-512x512",          512),
    ("icon-maskable-192x192", 192),
    ("icon-maskable-512x512", 512),
    ("dashboard-192x192",     192),
    ("orders-192x192",        192),
]

SVG_FILE = os.path.join(os.path.dirname(__file__), "logo.svg")
OUT_DIR  = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def _png_chunk(tag, data):
    raw = tag + data
    return struct.pack(">I", len(data)) + raw + struct.pack(">I", zlib.crc32(raw) & 0xFFFFFFFF)


def _solid_png(size, r=24, g=144, b=255):
    """Minimal solid-colour PNG fallback."""
    ihdr = _png_chunk(b"IHDR", struct.pack(">II", size, size) + bytes([8, 2, 0, 0, 0]))
    row  = bytes([0]) + bytes([r, g, b] * size)
    idat = _png_chunk(b"IDAT", zlib.compress(row * size, 9))
    iend = _png_chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend


try:
    import cairosvg
    def make_icon(name, size):
        path = os.path.join(OUT_DIR, name + ".png")
        cairosvg.svg2png(url=SVG_FILE, write_to=path, output_width=size, output_height=size)
        return path
    print("Using cairosvg to render logo.svg")
except ImportError:
    print("cairosvg not found – writing solid-colour placeholders.")
    print("Install with:  pip install cairosvg")
    def make_icon(name, size):
        path = os.path.join(OUT_DIR, name + ".png")
        with open(path, "wb") as f:
            f.write(_solid_png(size))
        return path


for name, size in SIZES:
    path = make_icon(name, size)
    print(f"  {path}  ({os.path.getsize(path):,} bytes)")
