#!/usr/bin/env python3
"""Isolated LibRaw decoding. Originals never modified. Emits TIFF and camera date."""
import ctypes as C
import ctypes.util
import datetime
import json
import os
import re
import resource
import struct
import sys
resource.setrlimit(resource.RLIMIT_AS, (1536 * 1024 * 1024, 1536 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_CPU, (100, 110))
try:
    bundled = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'vendor', 'lib', 'libraw.so')
    library = os.environ.get('LIBRAW_LIBRARY_PATH') or (bundled if os.path.exists(bundled) else ctypes.util.find_library('raw') or ctypes.util.find_library('raw_r'))
    if not library:
        raise RuntimeError('LibRaw unavailable')
    raw = C.CDLL(library)
    required = ['libraw_init', 'libraw_open_file', 'libraw_get_raw_width', 'libraw_get_raw_height', 'libraw_get_imgother', 'libraw_set_output_bps', 'libraw_set_output_tif', 'libraw_set_demosaic', 'libraw_dcraw_ppm_tiff_writer']
    if not all(hasattr(raw, name) for name in required):
        raise RuntimeError('LibRaw version lacks required functions')
    if len(sys.argv) == 2 and sys.argv[1] == '--check':
        raw.libraw_version.restype = C.c_char_p
        version = raw.libraw_version().decode('ascii')
        numbers = tuple(map(int, re.findall(r'\d+', version)[:3]))
        if numbers < (0, 21, 4):
            raise RuntimeError('LibRaw 0.21.4 or newer required for the verified camera workflow')
        print(json.dumps({'available': True, 'version': version}))
        sys.exit(0)
    raw.libraw_init.argtypes = [C.c_uint]
    raw.libraw_init.restype = C.c_void_p
    handle = raw.libraw_init(0)
    if not handle:
        raise RuntimeError('Cannot initialize decoder')
    def function(name, args, result=C.c_int):
        fn = getattr(raw, name)
        fn.argtypes, fn.restype = args, result
        return fn
    close = function('libraw_close', [C.c_void_p], None)
    try:
        opened = function('libraw_open_file', [C.c_void_p, C.c_char_p])(handle, os.fsencode(sys.argv[1]))
        if opened:
            raise RuntimeError('Unsupported or damaged RAW')
        width = function('libraw_get_raw_width', [C.c_void_p])(handle)
        height = function('libraw_get_raw_height', [C.c_void_p])(handle)
        if width <= 0 or height <= 0 or width * height > 80_000_000:
            raise RuntimeError('RAW exceeds 80 megapixels')
        class Other(C.Structure):
            _fields_ = [('iso', C.c_float), ('shutter', C.c_float), ('aperture', C.c_float), ('focal', C.c_float), ('timestamp', C.c_long)]
        other = function('libraw_get_imgother', [C.c_void_p], C.POINTER(Other))(handle).contents
        date = datetime.datetime.fromtimestamp(other.timestamp).strftime('%Y-%m-%d') if other.timestamp > 0 else ''
        # Prefer the literal camera DateTimeOriginal, independent of server timezone.
        try:
            with open(sys.argv[1], 'rb') as source:
                header = source.read(1024 * 1024)
            offsets = [position for magic in (b'II\x2a\x00', b'MM\x00\x2a') if (position := header.find(magic)) >= 0]
            if offsets:
                base = min(offsets)
                endian = '<' if header[base:base+2] == b'II' else '>'
                def u16(position):
                    return struct.unpack_from(endian+'H', header, base+position)[0]
                def u32(position):
                    return struct.unpack_from(endian+'I', header, base+position)[0]
                def entry(directory, wanted):
                    count = u16(directory)
                    if count > 200:
                        raise ValueError()
                    for index in range(count):
                        offset = directory+2+index*12
                        if u16(offset) == wanted:
                            return offset
                    return None
                pointer = entry(u32(4), 0x8769)
                tag = entry(u32(pointer+8), 0x9003) if pointer is not None else None
                if tag is not None and u16(tag+2) == 2 and u32(tag+4) == 20:
                    value = header[base+u32(tag+8):base+u32(tag+8)+10].decode('ascii').replace(':','-')
                    datetime.datetime.strptime(value, '%Y-%m-%d')
                    date = value
        except (ValueError, UnicodeError, struct.error, OSError):
            pass

        for name, value in [('libraw_set_output_bps', 16), ('libraw_set_output_tif', 1), ('libraw_set_output_color', 1), ('libraw_set_demosaic', 3)]:
            function(name, [C.c_void_p, C.c_int], None)(handle, value)
        cam_mul = function('libraw_get_cam_mul', [C.c_void_p, C.c_int], C.c_float)
        set_mul = function('libraw_set_user_mul', [C.c_void_p, C.c_int, C.c_float], None)
        if all(cam_mul(handle, i) > 0 for i in range(3)):
            for i in range(4):
                set_mul(handle, i, cam_mul(handle, i))
        if function('libraw_unpack', [C.c_void_p])(handle) or function('libraw_dcraw_process', [C.c_void_p])(handle):
            raise RuntimeError('RAW conversion failed')
        if function('libraw_dcraw_ppm_tiff_writer', [C.c_void_p, C.c_char_p])(handle, os.fsencode(sys.argv[2])):
            raise RuntimeError('Cannot write rendered TIFF')
        print(json.dumps({'takenAt': date, 'rawWidth': width, 'rawHeight': height}))
    finally:
        close(handle)
except Exception:
    print('RAW decoding unavailable or unsupported file', file=sys.stderr)
    sys.exit(1)
