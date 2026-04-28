import struct, zlib, os

def chunk(tag, data):
    raw = tag + data
    return struct.pack('>I', len(data)) + raw + struct.pack('>I', zlib.crc32(raw) & 0xffffffff)

def make_png(size, r, g, b):
    # IHDR: width(4) height(4) bitdepth(1) colortype(1) compression(1) filter(1) interlace(1) = 13 bytes
    ihdr_data = struct.pack('>II', size, size) + bytes([8, 2, 0, 0, 0])
    ihdr = chunk(b'IHDR', ihdr_data)

    # Image data: one row = filter_byte(0) + RGB pixels
    row = bytes([0]) + bytes([r, g, b] * size)
    raw_data = row * size
    idat = chunk(b'IDAT', zlib.compress(raw_data, 9))
    iend = chunk(b'IEND', b'')

    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend

out = 'icons'
os.makedirs(out, exist_ok=True)

icons = [
    ('icon-192x192',          192, 24, 144, 255),
    ('icon-512x512',          512, 24, 144, 255),
    ('icon-maskable-192x192', 192, 21, 101, 192),
    ('icon-maskable-512x512', 512, 21, 101, 192),
    ('dashboard-192x192',     192, 24, 144, 255),
    ('orders-192x192',        192, 24, 144, 255),
]

for name, size, r, g, b in icons:
    path = os.path.join(out, name + '.png')
    with open(path, 'wb') as f:
        f.write(make_png(size, r, g, b))
    print('Created:', path, os.path.getsize(path), 'bytes')
