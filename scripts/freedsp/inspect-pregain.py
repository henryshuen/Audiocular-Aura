"""Targeted static APK extraction; never loads target native code or accesses USB.

Usage: python -B inspect-pregain.py APK PYTHON_LIBS > evidence.json
Requires Androguard, pyelftools and Capstone in PYTHON_LIBS.
"""
import hashlib
import io
import json
import sys
import zipfile

SHA = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
SELECT = {
    'Lns4;': {'w', 'n'},
    'Lha4;': {'c', 'o', 'k'},
    'Lbt4;': {'c', 'k'},
    'Lat4;': {'call'},
    'Lju2;': {'j'},
    'Lcom/moondroplab/moondrop/moondrop_app/native/handlers/UsbDeviceHandler;': {
        'handleSetSpvPreGain', 'handleSetSpvPreGain$lambda$0',
        'handleGetSpvPreGain$lambda$0'},
    'Lcom/moondroplab/communication/ble/protocol/eq/BleEqProtocolClient;': {'setPreGain'},
}


def extract(apk_path, libraries):
    sys.path.insert(0, libraries)
    from loguru import logger
    logger.disable('androguard')
    from androguard.core.dex import DEX
    from elftools.elf.elffile import ELFFile
    from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
    raw = open(apk_path, 'rb').read()
    if hashlib.sha256(raw).hexdigest() != SHA:
        raise ValueError('Pinned APK hash mismatch')
    methods, functions = [], []
    with zipfile.ZipFile(io.BytesIO(raw)) as apk:
        for cls in DEX(apk.read('classes.dex')).get_classes():
            owner = cls.get_name()
            for method in cls.get_methods():
                selected = method.get_name() in SELECT.get(owner, set())
                selected |= owner.endswith('/BleEqProtocolClient;') and method.get_name() == 'setPreGain'
                selected |= owner.endswith('/BleSourceSwitchFlutterHandler;') and method.get_name() == 'handleSetPeqPreGain'
                selected |= owner.endswith('/BleSourceCommand;') and method.get_name() in {'<clinit>', '<init>'}
                selected |= owner.endswith('/BleProtocolBytesKt;') and method.get_name() == 'encodeI16LittleEndian'
                if not selected or not method.get_code():
                    continue
                offset, instructions = 0, []
                for ins in method.get_code().get_bc().get_instructions():
                    instructions.append({'offset': offset, 'opcode': ins.get_name(), 'args': ins.get_output()})
                    offset += ins.get_length()
                methods.append({'class': owner, 'method': method.get_name(),
                                'descriptor': method.get_descriptor(), 'instructions': instructions})
        data = apk.read('lib/arm64-v8a/libutils-lib.so')
        elf = ELFFile(io.BytesIO(data))
        decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
        for symbol in elf.get_section_by_name('.dynsym').iter_symbols():
            if not symbol.name.startswith('Java_com_moondroplab_communication_usb_util_SpvCodecNative_'):
                continue
            if symbol.name.rsplit('_', 1)[-1] not in {'writeQ88', 'readQ88', 'buildSpvPacket'}:
                continue
            address, size = symbol['st_value'], symbol['st_size']
            segment = next(s for s in elf.iter_segments() if s['p_type'] == 'PT_LOAD'
                           and s['p_vaddr'] <= address < s['p_vaddr'] + s['p_filesz'])
            offset = address - segment['p_vaddr'] + segment['p_offset']
            code = data[offset:offset + size]
            functions.append({'name': symbol.name, 'address': address, 'size': size,
                              'hex': code.hex(), 'instructions': [
                                  {'address': i.address, 'mnemonic': i.mnemonic, 'operands': i.op_str}
                                  for i in decoder.disasm(code, address)]})
    return {'apkSha256': SHA, 'nativeSha256': hashlib.sha256(data).hexdigest(),
            'scope': 'Selected DEX methods and three JNI functions only; no target execution.',
            'methods': methods, 'functions': functions}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(extract(sys.argv[1], sys.argv[2]), indent=2, ensure_ascii=True))
