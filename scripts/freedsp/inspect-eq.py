"""Pinned APK static RAM/EQ evidence. Never executes APK/ELF code.
Optional research dependencies: androguard4.1.3, pyelftools0.32, capstone5.0.6.
python inspect-eq.py official.apk > officialRamStaticEvidence.json
"""
import hashlib
import io
import json
import struct
import sys
import zipfile
from loguru import logger
logger.disable("androguard")
from androguard.core.dex import DEX
from elftools.elf.elffile import ELFFile
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM

APK_SHA = "04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5"
LIB = "lib/arm64-v8a/libcxaudiodsplib_embca_jni.so"
JAVA = {
    "FreemanCnxtUsbDevice;": {"setEQParam", "setFreeman3EQ", "getCurSampleRate", "setFreeman3EQEnabled", "setEQCFGIsBypass", "switchEQMode", "getEQEnabled", "setEQEnabled", "canUpdate", "setDefaultAvailable", "getFreeman3EQConfig"},
    "FreemanSession;": {"executeCommand", "bldCmdSetEQ", "bldCmdSwitchEQMode"},
    "FreemanController;": {"setEQParam", "switchEQMode"},
    "SvcModClient;": {"getUsbEQ", "getUsb"},
    "UsbDeviceHandler;": {"handleSySendEqParams", "handleSySelectEqPreset"},
    "CnxtUsbConstants;": {"<clinit>"},
    "Eq2Coeff;": {"CxAudioConvertEqParams2Coeffs"},
}


def extract(path):
    with open(path, "rb") as source:
        raw = source.read()
    if hashlib.sha256(raw).hexdigest() != APK_SHA:
        raise ValueError("APK hash differs from reviewed artifact")
    with zipfile.ZipFile(io.BytesIO(raw)) as apk:
        lib = apk.read(LIB)
        elf = ELFFile(io.BytesIO(lib))
        cs = Cs(CS_ARCH_ARM64, CS_MODE_ARM)

        def at(address, size):
            for section in elf.iter_sections():
                if section["sh_type"] != "SHT_NOBITS" and section["sh_addr"] <= address < section["sh_addr"] + section["sh_size"]:
                    return section.data()[address - section["sh_addr"]:address - section["sh_addr"] + size]
            raise ValueError("Unmapped static address")

        functions = []
        for symbol in elf.get_section_by_name(".dynsym").iter_symbols():
            if symbol["st_size"] and any(s in symbol.name for s in ["CxAudioConvertEqParams2Coeffs", "CxAudioConvertCoeffs2EqParams", "EqDesignFx", "EqFxToFloat", "convertEQParamFromJni", "convertCoeffsToJni"]):
                address, size = symbol["st_value"], symbol["st_size"]
                functions.append({"name": symbol.name, "address": address, "bytes": size, "instructions": [f"{i.address:04x}: {i.mnemonic} {i.op_str}".rstrip() for i in cs.disasm(at(address, size), address)]})
        for name, address, end in [("JNI coefficient callback", 0x27F4, 0x2940), ("float design internal", 0x31B0, 0x3510), ("five-coefficient quantizer internal", 0x63AC, 0x6B80)]:
            functions.append({"name": name, "address": address, "bytes": end - address, "instructions": [f"{i.address:04x}: {i.mnemonic} {i.op_str}".rstrip() for i in cs.disasm(at(address, end - address), address)]})
        plt = elf.get_section_by_name(".plt")
        relocations = elf.get_section_by_name(".rela.plt")
        symbols = elf.get_section(relocations["sh_link"])
        calls = {hex(plt["sh_addr"] + 32 + 16 * n): symbols.get_symbol(rel["r_info_sym"]).name for n, rel in enumerate(relocations.iter_relocations())}
        jni = []
        for address in range(0xF038, 0xF098, 24):
            name, signature, callback = struct.unpack("<QQQ", at(address, 24))
            jni.append({"name": at(name, 150).split(b"\0")[0].decode(), "signature": at(signature, 100).split(b"\0")[0].decode(), "callback": callback})
        methods = []
        rate_data = None
        for cls in DEX(apk.read("classes.dex")).get_classes():
            tail = cls.get_name().split("/")[-1]
            if tail not in JAVA:
                continue
            for method in cls.get_methods():
                if method.get_name() not in JAVA[tail] or not method.get_code():
                    continue
                instructions, offset = [], 0
                for instruction in method.get_code().get_bc().get_instructions():
                    instructions.append(f"{offset}: {instruction.get_name()} {instruction.get_output()}".rstrip())
                    if tail == "CnxtUsbConstants;" and instruction.get_name() == "fill-array-data-payload":
                        rate_data = list(struct.unpack("<11i", instruction.get_data()))
                    offset += instruction.get_length()
                methods.append({"class": cls.get_name(), "name": method.get_name(), "descriptor": method.get_descriptor(), "registers": method.get_code().get_registers_size(), "instructions": instructions})
        return {"source": "https://download.moondroplab.com/moondroplink/android-release.apk", "apkSha256": APK_SHA, "library": LIB, "librarySha256": hashlib.sha256(lib).hexdigest(), "toolVersions": {"androguard": "4.1.3", "pyelftools": "0.32", "capstone": "5.0.6"}, "jniMethods": jni, "pltCallTargets": calls, "doubleConstants": {hex(a): struct.unpack("<d", at(a, 8))[0] for a in [0x1578, 0x1580, 0x15A8, 0x15B8, 0x15C0]}, "freqSampleRate": rate_data, "javaMethods": methods, "nativeFunctions": functions, "limits": ["Static source evidence; no APK/native execution", "Dart AOT UI scheduling not reconstructed", "Logical native quantizer traced; portable helper models candidate intervals, not exact selected LSBs", "Nine-band live mapping and descriptor support for IDs4/5 unknown"]}


if __name__ == "__main__":
    print(json.dumps(extract(sys.argv[1]), ensure_ascii=False, indent=2))
