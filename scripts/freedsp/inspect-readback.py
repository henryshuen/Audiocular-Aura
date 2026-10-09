"""Pinned APK readback trace. Static data only: never loads APK/native code.
python -B inspect-readback.py APK PYTHON_LIBS
"""
import hashlib
import io
import json
import re
import sys
import zipfile

SHA = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
TARGETS = {
 'FreemanCnxtUsbDevice;': {'getEQParam', 'getEQParamList', 'getEQParamsFromFlash', 'getF3EQCoefficientList', 'getFreeman3EQParam', 'getFreeman3EQConfig', 'getEQMode'},
 'FreemanSession;': {'executeCommand', 'bldCmdGetEQParamsFromFlash', 'bldCmdGetEQCoefficientList'},
 'FreemanController;': {'getEQParam', 'getEQParamsFromFlash', 'getF3EQCoefficientList'},
 'CafCmdHelper;': {'readDataFromDevice', 'getMsgByCmd', 'getCmd', 'isExecuteSuccess'},
 'CommonUtil;': {'formatByteToInt', 'formatByteToSingedInt'},
 'Eq2Coeff;': {'CxAudioConvertCoeffs2EqParams'},
 'UsbDeviceHandler;': {'handleSyGetEqParamsFromFlash'},
}
REFERENCES = re.compile(r'->(?:getEQParamsFromFlash|getEQParamList|getF3EQCoefficientList|getFreeman3EQParam|CxAudioConvertCoeffs2EqParams|handleSyGetEqParamsFromFlash|bldCmdGetEQParamsFromFlash)\(')

def extract(path, libraries):
 sys.path.insert(0, libraries)
 from loguru import logger
 logger.disable('androguard')
 from androguard.core.dex import DEX
 from elftools.elf.elffile import ELFFile
 from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
 raw = open(path, 'rb').read()
 if hashlib.sha256(raw).hexdigest() != SHA:
  raise ValueError('Unreviewed APK: refuse changed artifact')
 methods, callers, fields = [], [], []
 with zipfile.ZipFile(io.BytesIO(raw)) as apk:
  for name in sorted(apk.namelist()):
   if not re.fullmatch(r'classes\d*\.dex', name):
    continue
   for cls in DEX(apk.read(name)).get_classes():
    owner = cls.get_name()
    tail = owner.split('/')[-1]
    if tail in {'EQParam;', 'PersistEQParams;', 'EQBandParam;', 'BandEQCoefficient;'} and owner.startswith('Lcom/conexant/'):
     fields.append({'class': owner, 'fields': sorted(f.get_name()+':'+f.get_descriptor() for f in cls.get_fields())})
    for method in cls.get_methods():
     if not method.get_code():
      continue
     selected = (owner.startswith('Lcom/conexant/') or owner.startswith('Lcom/moondroplab/')) and method.get_name() in TARGETS.get(tail, set())
     offset, instructions = 0, []
     for ins in method.get_code().get_bc().get_instructions():
      text = ins.get_output()
      if selected:
       instructions.append({'offset': offset, 'op': ins.get_name(), 'args': text})
      if REFERENCES.search(text):
       callers.append({'class': owner, 'method': method.get_name(), 'offset': offset, 'call': text})
      offset += ins.get_length()
     if selected:
      methods.append({'class': owner, 'method': method.get_name(), 'descriptor': method.get_descriptor(), 'instructions': instructions})
  lib = apk.read('lib/arm64-v8a/libcxaudiodsplib_embca_jni.so')
  elf = ELFFile(io.BytesIO(lib))
  def at(address, size):
   for s in elf.iter_sections():
    if s['sh_type'] != 'SHT_NOBITS' and s['sh_addr'] <= address < s['sh_addr']+s['sh_size']:
     return s.data()[address-s['sh_addr']:address-s['sh_addr']+size]
   raise ValueError('Unmapped native address')
  cs = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
  functions = []
  for s in elf.get_section_by_name('.dynsym').iter_symbols():
   if s['st_size'] and any(k in s.name for k in ['CxAudioConvertCoeffs2EqParams', 'EqParEx', 'EqFxToFloat', 'convertCoeffsFromJni', 'convertEQParamToJni']):
    addr, size = s['st_value'], s['st_size']
    functions.append({'name': s.name, 'address': addr, 'bytes': size, 'instructions': [f'{i.address:04x}: {i.mnemonic} {i.op_str}'.rstrip() for i in cs.disasm(at(addr, size), addr)]})
  addr, size = 0x2940, 0x2a14-0x2940
  functions.append({'name': 'JNI inverse callback', 'address': addr, 'bytes': size, 'instructions': [f'{i.address:04x}: {i.mnemonic} {i.op_str}'.rstrip() for i in cs.disasm(at(addr, size), addr)]})
  reloc = elf.get_section_by_name('.rela.plt')
  symbols = elf.get_section(reloc['sh_link'])
  plt = elf.get_section_by_name('.plt')['sh_addr']
  calls = {hex(plt+32+16*n): symbols.get_symbol(r['r_info_sym']).name for n,r in enumerate(reloc.iter_relocations())}
 return {'apkSha256': SHA, 'source': 'https://download.moondroplab.com/moondroplink/android-release.apk', 'nativeSha256': hashlib.sha256(lib).hexdigest(), 'fields': fields, 'methods': methods, 'callers': callers, 'nativeFunctions': functions, 'pltTargets': calls,
  'limits': ['Static DEX/JNI/ELF only; no hardware replies or APK execution', 'Dart AOT connection event order is not reconstructed', 'Source getter/store naming is not independent firmware validation', 'No enabled/path/source inferred from unparsed fields']}

if __name__ == '__main__':
 sys.stdout.reconfigure(encoding='utf-8')
 print(json.dumps(extract(sys.argv[1], sys.argv[2]), ensure_ascii=False, indent=2))
