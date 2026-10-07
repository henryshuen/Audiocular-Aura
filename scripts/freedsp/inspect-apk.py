"""Static evidence extraction only. Never installs, loads or executes APK code.

Optional research tool: Python with androguard==4.1.3. No project dependency.
Usage: python inspect-apk.py path/to/official.apk > officialApkStaticEvidence.json
Only the pinned official artifact is accepted. All offsets are DEX byte offsets.
"""
import hashlib
import json
import sys
import zipfile

from loguru import logger
logger.disable("androguard")
from androguard.core.axml import AXMLPrinter
from androguard.core.dex import DEX

EXPECTED = "04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5"
TARGETS = {
    "CnxtUsbCommand;": {
        "getUSBMessage": [0, 4, 8, 12, 16, 32, 38, 42, 46, 54, 58, 64, 68, 120, 170, 178, 182, 186, 190, 198, 212, 228, 244],
        "fromUSBMessage": [10, 14, 26, 64, 68, 88, 92, 132, 232, 238, 254, 258],
    },
    "UsbHelper;": {"sendHIDReport": None, "receiveHIDReport": None},
    "CafCmdHelper;": {
        "getCafId": None, "getCmd": None,
        "sendCmd": [14, 22, 26, 28, 32, 38, 50, 52, 110, 114, 116, 120, 124, 196],
        "writeGolemCmdToDevice": None,
        "isExecuteSuccess": None,
    },
    "FreemanCnxtUsbDevice;": {
        "setFreeman3EQ": [126, 130, 164, 168, 176, 184, 196, 204, 212, 216, 224, 228, 234, 238, 246, 250, 258, 262, 270, 286, 290, 302],
        "setFreeman3EQEnabled": [0, 4, 10, 14, 30, 34, 48],
        "setEQCFGIsBypass": [2, 6, 12, 28, 32, 44],
        "saveEQParamsToFlash": [64, 68, 148, 156, 174, 184, 188, 198, 206, 208, 232, 540, 544, 786, 792, 802, 806, 812, 816, 822, 828, 832, 836, 842, 846, 854, 858, 866, 906, 954, 1022, 1026, 1030, 1042, 1054],
        "switchEQMode": None, "getFwVersion": None,
        "setEQParam": [14, 22, 26, 38, 70, 92, 110, 172, 236, 242, 248],
    },
    "CommonUtil;": {"from2ByteToInt": None, "formatByteToLong": None, "shiftEQBandForFreeman3": None},
    "Eq2Coeff;": {"CxAudioConvertEqParams2Coeffs": None, "native_cxaudio_convert_eqparams_2_coeffs": None},
}


def extract(path):
    raw = open(path, "rb").read()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED:
        raise ValueError("APK SHA256 does not match the reviewed official artifact")
    with zipfile.ZipFile(path) as apk:
        manifest = AXMLPrinter(apk.read("AndroidManifest.xml")).get_xml_obj()
        android = "{http://schemas.android.com/apk/res/android}"
        dex_bytes = apk.read("classes.dex")
        dex = DEX(dex_bytes)
        methods = []
        fields = {}
        for cls in dex.get_classes():
            if not cls.get_name().startswith("Lcom/conexant/"):
                continue
            tail = cls.get_name().split("/")[-1]
            if tail not in TARGETS:
                continue
            if tail == "CnxtUsbCommand;":
                fields[cls.get_name()] = {f.get_name(): f.get_descriptor() for f in cls.get_fields()}
            for method in cls.get_methods():
                if method.get_name() not in TARGETS[tail]:
                    continue
                selected = TARGETS[tail][method.get_name()]
                instructions = []
                offset = 0
                code = method.get_code()
                if code:
                    for instruction in code.get_bc().get_instructions():
                        if selected is None or offset in selected:
                            instructions.append({"offset": offset, "op": instruction.get_name(), "args": instruction.get_output()})
                        offset += instruction.get_length()
                methods.append({"class": cls.get_name(), "name": method.get_name(), "descriptor": method.get_descriptor(), "access": method.get_access_flags_string(), "registers": code.get_registers_size() if code else None, "codeBytes": offset, "instructions": instructions})
        mapping = AXMLPrinter(apk.read("res/qc.xml")).get_xml().decode("utf8")
        natives = {n: {"bytes": apk.getinfo(n).file_size, "sha256": hashlib.sha256(apk.read(n)).hexdigest()} for n in apk.namelist() if n.startswith("lib/arm64-v8a/") and any(s in n for s in ["CxAudioHid", "cxaudiodsplib"])}
        return {"source": "https://download.moondroplab.com/moondroplink/android-release.apk", "sourcePage": "https://moondroplab.com/cn/moondrop-link", "retrievedDate": "2026-10-07", "apkBytes": len(raw), "apkSha256": digest, "package": manifest.get("package"), "versionCode": manifest.get(android + "versionCode"), "versionName": manifest.get(android + "versionName"), "dexSha256": hashlib.sha256(dex_bytes).hexdigest(), "deviceMappingResource": "res/qc.xml", "deviceMappingXml": mapping, "fields": fields, "nativeLibraries": natives, "methods": methods, "limitations": ["Static instructions, not execution or USB capture", "Current APK differs from unversioned July2026 dump", "Selected instruction excerpts; full method remains in pinned APK", "No native coefficient arithmetic recovered"]}


if __name__ == "__main__":
    print(json.dumps(extract(sys.argv[1]), ensure_ascii=False, indent=2))
