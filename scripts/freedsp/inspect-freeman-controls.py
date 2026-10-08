"""Targeted pinned Freeman/CAF static trace; no target execution/device access.

python -B inspect-freeman-controls.py APK PYTHON_LIBS > evidence.json
Only classes.dex Freeman device, feature struct/controller and their DEX
references are analyzed. Assets are inventoried by targeted firmware/config
names; no full APK string/native scan.
"""
import hashlib
import io
import json
import re
import sys
import zipfile

SHA = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
DEVICE = 'Lcom/conexant/cnxtusbcheadset/FreemanCnxtUsbDevice;'
FEATURE = 'Lcom/conexant/genericfeature/FeatureConfigFM3;'
CONTROLLER = 'Lcom/conexant/conexantusbtypec/svcimpl/FreemanController;'
EXTRA = {
    'Lcom/conexant/cnxtusbcheadset/CnxtUsbFactory;': {'createUsbDeviceBase', 'identifyDeviceById'},
    'Lcom/conexant/cnxtusbcheadset/CnxtUsbDeviceBase;': {'getFirmwareParam'},
    'Lcom/syna/FirmwareParam;': {'<init>'},
    'Lcom/conexant/universalfunction/CommonUtil;': {'getDeviceIdFromXMLConfig'},
}


def extract(apk_path, libraries):
    sys.path.insert(0, libraries)
    from loguru import logger
    logger.disable('androguard')
    from androguard.core.dex import DEX
    from androguard.core.axml import ARSCParser, AXMLPrinter
    raw = open(apk_path, 'rb').read()
    if hashlib.sha256(raw).hexdigest() != SHA:
        raise ValueError('Pinned APK mismatch')
    methods, references, structs, assets = [], [], [], []
    resource_id = None
    with zipfile.ZipFile(io.BytesIO(raw)) as apk:
        dex = DEX(apk.read('classes.dex'))
        for cls in dex.get_classes():
            owner = cls.get_name()
            if owner == 'Lcom/conexant/libcnxtservice/R$xml;':
                resource_id = next(f.get_init_value().get_value() for f in cls.get_fields() if f.get_name() == 'devicelist')
            if not owner.startswith('Lcom/conexant/') and owner not in EXTRA:
                continue
            if owner in {DEVICE, FEATURE, CONTROLLER} or owner in EXTRA:
                structs.append({'class': owner, 'fields': sorted(f.get_name() + ':' + f.get_descriptor() for f in cls.get_fields())})
            for method in cls.get_methods():
                if not method.get_code():
                    continue
                offset, instructions = 0, []
                for ins in method.get_code().get_bc().get_instructions():
                    instructions.append({'offset': offset, 'opcode': ins.get_name(), 'args': ins.get_output()})
                    offset += ins.get_length()
                if owner == DEVICE or (owner == CONTROLLER and method.get_name() == 'getFeatureConfigFM3') or method.get_name() in EXTRA.get(owner, set()):
                    methods.append({'class': owner, 'method': method.get_name(), 'descriptor': method.get_descriptor(), 'instructions': instructions})
                if owner == DEVICE:
                    continue
                for n, ins in enumerate(instructions):
                    if DEVICE + '->' in ins['args'] or FEATURE + '->' in ins['args']:
                        references.append({'class': owner, 'method': method.get_name(),
                                           'offset': ins['offset'], 'context': instructions[max(0,n-5):n+6]})
        for info in sorted(apk.infolist(), key=lambda i: i.filename):
            if not info.filename.startswith('assets/') or not re.search(r'firmware|freeman|conexant|cnxt|config|\.xml$|\.rom$', info.filename, re.I):
                continue
            data = apk.read(info)
            item = {'file': info.filename, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            if len(data) < 100000 and data.lstrip().startswith(b'<'):
                item['xmlText'] = data.decode('utf-8', errors='replace')
            assets.append(item)
        if resource_id is None:
            raise ValueError('Missing SDK devicelist resource')
        resource_table = ARSCParser(apk.read('resources.arsc'))
        for config, path in resource_table.get_resolved_res_configs(resource_id):
            data = apk.read(path)
            assets.append({'file': path, 'resourceId': resource_id,
                           'resourceName': 'com/conexant/libcnxtservice/R$xml.devicelist',
                           'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                           'xmlText': AXMLPrinter(data).get_xml().decode('utf-8')})
    return {'apkSha256': SHA, 'scope': 'Freeman device/feature/controller bodies and direct Conexant-package references; targeted asset-name inventory.',
            'limits': 'Not firmware disassembly, reflection or Dart dynamic routing. Source names describe app interpretation, not proof all features work on1496. Empty targeted assets do not prove no encoded/server firmware exists.',
            'structs': structs, 'methods': methods, 'references': references, 'assets': assets}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(extract(sys.argv[1], sys.argv[2]), indent=2, ensure_ascii=True))
