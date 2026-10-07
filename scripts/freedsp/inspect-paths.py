"""Offline pinned DEX name/string search. Never loads APK/native code."""
import hashlib, json, re, sys, zipfile
sys.path.insert(0, sys.argv[2])
from loguru import logger
logger.disable('androguard')
from androguard.core.dex import DEX
raw = open(sys.argv[1], 'rb').read()
expected = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
if hashlib.sha256(raw).hexdigest() != expected:
    raise ValueError('APK hash mismatch')
with zipfile.ZipFile(sys.argv[1]) as apk:
    dex = DEX(apk.read('classes.dex'))
matches = []
command190_methods = []
for cls in dex.get_classes():
    if not cls.get_name().startswith('Lcom/conexant/') or '/R$' in cls.get_name():
        continue
    for field in cls.get_fields():
        if re.search(r'left|right|channel|stereo', field.get_name(), re.I):
            matches.append({'class': cls.get_name(), 'field': field.get_name()})
    for method in cls.get_methods():
        if re.search(r'left|right|channel|stereo', method.get_name(), re.I):
            matches.append({'class': cls.get_name(), 'method': method.get_name()})
        if not method.get_code():
            continue
        instructions = list(method.get_code().get_bc().get_instructions())
        if cls.get_name().endswith('/FreemanCnxtUsbDevice;') and any(i.get_name().startswith('const') and re.search(r',\s*190$', i.get_output()) for i in instructions):
            command190_methods.append(method.get_name())
        offset = 0
        for instruction in instructions:
            args = instruction.get_output()
            if instruction.get_name().startswith('const-string') and re.search(r'left|right|channel|stereo', args, re.I):
                matches.append({'class': cls.get_name(), 'method': method.get_name(), 'offset': offset, 'string': args})
            offset += instruction.get_length()
print(json.dumps({'apkSha256': expected, 'scope': 'com/conexant classes in classes.dex, excluding generated R resources; field/method names and literal strings, not firmware or Dart AOT', 'freemanMethodsWithLiteral190': command190_methods, 'matches': matches}, indent=2))
