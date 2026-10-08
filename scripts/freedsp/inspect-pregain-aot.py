"""Pinned, targeted Dart AOT evidence extraction; static dae-rs 0.1.13 only.

Usage: python -B inspect-pregain-aot.py APK PYTHON_LIBS DAE_EXE
The analyzer executable is compiled from https://github.com/ejfkdev/dae;
target APK/native code is never executed. Snapshot SDK profile is UNVERIFIED.
"""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

FUNCTIONS = [
    ('USB debug read', 0x952924, 484),
    ('FlutterNative.getSpvPreGain', 0x71c960, 168),
    ('FlutterNative.setSpvPreGain', 0x7137ac, 276),
    ('usesSpvUsbPeqProtocol', 0x8e5460, 404),
    ('BLE debug read', 0x93d370, 2308),
    ('BleEqProtocolApi.setPreGain', 0x976908, 416),
    ('Device function-list loader', 0x76a1bc, 564),
    ('HttpUtils.getDeviceFunc', 0x4d3a08, 632),
]
PP_PATTERNS = ['setSpvPreGain', 'getSpvPreGain', 'preGainDb', 'preGainRaw',
               '/spv', '/bluetrumusb', '/jieliusb', 'cachedDeviceFunc_',
               'MethodChannel', 'PreGain', 'pregain']


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    sys.path.insert(0, sys.argv[2])
    from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
    from elftools.elf.elffile import ELFFile
    raw = Path(sys.argv[1]).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5':
        raise ValueError('Pinned APK hash mismatch')
    with zipfile.ZipFile(io.BytesIO(raw)) as apk:
        data = apk.read('lib/arm64-v8a/libapp.so')
    elf = ELFFile(io.BytesIO(data))
    decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
    functions = []
    for name, address, size in FUNCTIONS:
        segment = next(s for s in elf.iter_segments() if s['p_type'] == 'PT_LOAD'
                       and s['p_vaddr'] <= address < s['p_vaddr'] + s['p_filesz'])
        offset = address - segment['p_vaddr'] + segment['p_offset']
        code = data[offset:offset + size]
        functions.append({'label': name, 'address': address, 'size': size, 'hex': code.hex(),
                          'instructions': [{'address': i.address, 'mnemonic': i.mnemonic,
                                            'operands': i.op_str}
                                           for i in decoder.disasm(code, address)]})
    # Temporary extraction is deleted on completion; no device or network access.
    with tempfile.TemporaryDirectory(prefix='aurapeq-pregain-aot-', dir=Path.cwd()) as scratch:
        binary = Path(scratch) / 'libapp.so'
        binary.write_bytes(data)
        def query(*args):
            result = subprocess.run([sys.argv[3], args[0], str(binary), *args[1:]],
                                    check=True, capture_output=True, encoding='utf-8')
            return {'args': list(args), 'stdout': result.stdout, 'stderr': result.stderr}
        queries = [query('info'), query('callers', 'FlutterNative.setSpvPreGain')]
        queries += [query('pp', p) for p in PP_PATTERNS]
    print(json.dumps({'apkSha256': sha, 'libappSha256': hashlib.sha256(data).hexdigest(),
                      'analyzer': 'dae-rs 0.1.13',
                      'limitations': 'UNVERIFIED SDK profile; recovered names/PP annotations cross-checked with raw ARM64. Field/type labels and decompiler branch structure not trusted. 17225 indirect calls unresolved: direct caller list is not exhaustive. Function addresses/sizes are pinned snapshot metadata, not transferable to other APKs.',
                      'functions': functions, 'queries': queries}, indent=2, ensure_ascii=True))


if __name__ == '__main__':
    main()
