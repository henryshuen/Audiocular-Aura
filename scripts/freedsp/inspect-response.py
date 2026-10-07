"""Pinned official APK response transport evidence; static DEX only.
Optional dependency androguard4.1.3. No APK/native execution or device APIs.
python inspect-response.py pinned.apk > officialResponseStaticEvidence.json
"""
import hashlib
import json
import sys
import zipfile
from loguru import logger
logger.disable('androguard')
from androguard.core.dex import DEX

EXPECTED = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
TARGETS = {
    'CafCmdHelper;': {'sendCmd', 'getMsgByCmd', 'isExecuteSuccess', 'claimInterfaceListener'},
    'UsbHelper;': {'sendHIDReport', 'receiveHIDReport'},
    'CommonUtil;': {'from2ByteToInt'},
    'FreemanCnxtUsbDevice;': {'setFreeman3EQEnabled', 'setEQCFGIsBypass', 'getCurSampleRate', 'setFreeman3EQ', 'setEQParam'},
}


def extract(path):
    with open(path, 'rb') as f:
        raw = f.read()
    if hashlib.sha256(raw).hexdigest() != EXPECTED:
        raise ValueError('Unreviewed APK hash')
    with zipfile.ZipFile(path) as apk:
        dex = DEX(apk.read('classes.dex'))
        methods = []
        for cls in dex.get_classes():
            tail = cls.get_name().split('/')[-1]
            if tail not in TARGETS or not cls.get_name().startswith('Lcom/conexant/'):
                continue
            for method in cls.get_methods():
                if method.get_name() not in TARGETS[tail]:
                    continue
                offset, instructions = 0, []
                for instruction in method.get_code().get_bc().get_instructions():
                    instructions.append({'offset': offset, 'op': instruction.get_name(), 'args': instruction.get_output()})
                    offset += instruction.get_length()
                methods.append({'class': cls.get_name(), 'name': method.get_name(), 'descriptor': method.get_descriptor(), 'instructions': instructions})
        return {'apkSha256': EXPECTED, 'source': 'https://download.moondroplab.com/moondroplink/android-release.apk',
                'tool': 'androguard4.1.3', 'methods': methods, 'usbHelperDumpTagPresent': 'UsbHelperDump' in dex.get_strings(),
                'limits': ['Current APK source, not the exact July dump instrumentation', 'No actual USB completion length captured',
                           'RX buffer mutation by controlTransfer is source evidence, not proof of old hook implementation', 'No hardware access']}


if __name__ == '__main__':
    print(json.dumps(extract(sys.argv[1]), ensure_ascii=False, indent=2))
