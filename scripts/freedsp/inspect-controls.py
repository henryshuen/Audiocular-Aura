"""Static, hash-pinned official APK control inventory; never executes app/native code.

Usage: python inspect-controls.py APK ANDROGUARD_LIBRARY_DIRECTORY
JSON goes to stdout. Dependencies match the existing offline APK inspectors.
"""
import hashlib
import io
import json
import re
import sys
import zipfile

sys.path.insert(0, sys.argv[2])
from loguru import logger
logger.disable('androguard')
from androguard.core.dex import DEX
from elftools.elf.elffile import ELFFile
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM

EXPECTED = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
raw = open(sys.argv[1], 'rb').read()
if hashlib.sha256(raw).hexdigest() != EXPECTED:
    raise ValueError('APK hash mismatch')
control_names = re.compile(r'gain|volume|balance|bass|treble|mic|monitor|mute|loopback|preamp', re.I)
full_methods = {'getFeatureConfigFM3', 'getFreeman3EQConfig', 'convertIndexToDBGain',
                'convertGainIndex', 'formatBandGainValue', 'getOriginalGainValue'}
inventory, matches, methods, dexes, native, callers = [], [], [], [], [], []
with zipfile.ZipFile(io.BytesIO(raw)) as apk:
    for name in sorted(apk.namelist()):
        if not re.fullmatch(r'classes\d*\.dex', name):
            continue
        data = apk.read(name)
        dex = DEX(data)
        classes = [c for c in dex.get_classes() if c.get_name().startswith('Lcom/conexant/') and '/R$' not in c.get_name()]
        dexes.append({'file': name, 'sha256': hashlib.sha256(data).hexdigest(), 'conexantClasses': len(classes)})
        for cls in classes:
            owner = cls.get_name()
            if re.search(r'Freeman.*(?:Device|Controller|Session);|CnxtUsbDeviceBase;|FeatureConfigFM3;', owner):
                inventory.append({'dex': name, 'class': owner,
                                  'methods': sorted(m.get_name() + m.get_descriptor() for m in cls.get_methods()),
                                  'fields': sorted(f.get_name() + ':' + f.get_descriptor() for f in cls.get_fields())})
            for m in cls.get_methods():
                if control_names.search(m.get_name()):
                    matches.append({'class': owner, 'method': m.get_name(), 'descriptor': m.get_descriptor()})
                if not m.get_code():
                    continue
                offset, instructions = 0, []
                for ins in m.get_code().get_bc().get_instructions():
                    instructions.append({'offset': offset, 'opcode': ins.get_name(), 'args': ins.get_output()})
                    if ins.get_name().startswith('invoke') and re.search(r'->(?:convertIndexToDBGain|convertGainIndex|formatBandGainValue|getOriginalGainValue)\(', ins.get_output()):
                        callers.append({'class': owner, 'method': m.get_name(), 'offset': offset, 'call': ins.get_output()})
                    offset += ins.get_length()
                if m.get_name() in full_methods:
                    methods.append({'dex': name, 'class': owner, 'method': m.get_name(), 'descriptor': m.get_descriptor(), 'instructions': instructions})
    for name in sorted(apk.namelist()):
        if not name.startswith('lib/arm64-v8a/') or not re.search(r'CxAudio|cxaudio', name):
            continue
        data = apk.read(name)
        elf = ELFFile(io.BytesIO(data))
        symbols = elf.get_section_by_name('.dynsym')
        hits = sorted({s.name for s in symbols.iter_symbols() if control_names.search(s.name) and 'mutex' not in s.name.lower()}) if symbols else []
        functions = []
        if symbols:
            for symbol in symbols.iter_symbols():
                if 'CommonUtilNative_convertGainIndex' not in symbol.name or not symbol['st_size']:
                    continue
                address, size = symbol['st_value'], symbol['st_size']
                for section in elf.iter_sections():
                    if section['sh_type'] != 'SHT_NOBITS' and section['sh_addr'] <= address < section['sh_addr'] + section['sh_size']:
                        code = section.data()[address - section['sh_addr']:address - section['sh_addr'] + size]
                        functions.append({'name': symbol.name, 'address': address, 'size': size,
                                          'instructions': [f'{i.address:x}: {i.mnemonic} {i.op_str}' for i in Cs(CS_ARCH_ARM64, CS_MODE_ARM).disasm(code, address)]})
                        break
        native.append({'file': name, 'sha256': hashlib.sha256(data).hexdigest(), 'controlNameSymbols': hits, 'gainConversionFunctions': functions})
print(json.dumps({'apkSha256': EXPECTED, 'source': 'https://download.moondroplab.com/moondroplink/android-release.apk',
                  'scope': 'All classes*.dex: com/conexant method names and selected full method instructions; arm64 CxAudio dynamic symbols.',
                  'limitations': 'Not firmware, Dart AOT, reflection, USB Audio descriptors or a USB capture. Name absence does not prove no hardware support. Generic mic biquad math is not a FreeDSP control mapping.',
                  'dexes': dexes, 'freemanInventory': inventory, 'controlNameMethods': matches,
                  'methodInstructions': methods, 'gainConversionCallers': callers, 'nativeLibraries': native}, indent=2))
