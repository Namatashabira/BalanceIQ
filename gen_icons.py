"""
Generate PNG icons and icon.ico from logo.svg.
Run from the public/ directory:  python gen_icons.py

Requires cairosvg:  pip install cairosvg
Requires Pillow:    pip install Pillow   (for .ico generation)
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

# --- Generate icon.ico (BMP-only, rcedit-compatible) for Electron/Windows ---
ico_path = os.path.join(OUT_DIR, "icon.ico")
try:
    from PIL import Image
    import io

    ICO_SIZES = [16, 32, 48, 64, 128, 256]
    src = os.path.join(OUT_DIR, "icon-512x512.png")
    base = Image.open(src).convert("RGBA")

    frames = []
    for s in ICO_SIZES:
        frame = base.resize((s, s), Image.LANCZOS)
        # Convert RGBA -> BGRA BMP data that rcedit understands
        buf = io.BytesIO()
        # Save as BMP via a temporary RGBA image
        frame.save(buf, format="BMP")
        frames.append((s, buf.getvalue()))

    # Build ICO manually: all BMP frames (no PNG compression)
    # ICO header: reserved(2) + type(2) + count(2)
    count = len(frames)
    header = struct.pack("<HHH", 0, 1, count)
    # Each directory entry: width(1) height(1) colorCount(1) reserved(1)
    #                        planes(2) bitCount(2) bytesInRes(4) imageOffset(4)
    dir_size = count * 16
    offset = 6 + dir_size
    directory = b""
    image_data = b""
    for s, bmp in frames:
        # Strip the 14-byte BMP file header, keep DIB header + pixel data
        dib = bmp[14:]
        w = s if s < 256 else 0   # 0 means 256 in ICO spec
        h = w
        directory += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(dib), offset)
        offset += len(dib)
        image_data += dib

    with open(ico_path, "wb") as f:
        f.write(header + directory + image_data)

    print(f"  {ico_path}  ({os.path.getsize(ico_path):,} bytes)  [BMP/rcedit-compatible]")
except ImportError:
    print("Pillow not found – skipping icon.ico generation.")
    print("Install with:  pip install Pillow")
except Exception as e:
    print(f"icon.ico generation failed: {e}")
