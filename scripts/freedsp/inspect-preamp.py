"""Pinned offline preamp research: call sites, native declarations, ELF/string leads.

python inspect-preamp.py APK PYTHON_LIBRARY_DIRECTORY [--follow-pcm]
python inspect-preamp.py APK PYTHON_LIBRARY_DIRECTORY --freeman-cache M2D_EXTRA_METHODS_JSON
Never executes APK/native code; no USB/device imports. Reuses M2T for reviewed
Freeman method bodies; this pass follows non-CAF/Audio API boundaries instead.
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

SHA = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'
raw = open(sys.argv[1], 'rb').read()
if hashlib.sha256(raw).hexdigest() != SHA:
    raise ValueError('APK hash mismatch')
if len(sys.argv) > 4 and sys.argv[3] == '--freeman-cache':
    cached = json.load(open(sys.argv[4], encoding='utf-8'))
    calls = []
    for method in cached:
        instructions = method.get('instructions', [])
        for n, instruction in enumerate(instructions):
            if not re.search(r'CafCmdHelper;->(?:getCmd|getMsgByCmd)\(', instruction['args']):
                continue
            register = instruction['args'].split(',')[0]
            constants = [i for i in instructions[:n] if i['op'].startswith('const') and i['args'].startswith(register + ',')]
            calls.append({'method': method['name'], 'offset': instruction['offset'],
                          'commandConstant': constants[-1]['args'] if constants else None,
                          'call': instruction['args'], 'context': instructions[max(0,n-9):n+1]})
    print(json.dumps({'apkSha256': SHA, 'cacheSha256': hashlib.sha256(open(sys.argv[4], 'rb').read()).hexdigest(),
                      'limitations': 'Cached M2D extraction; nearest textual constant only, not branch-aware dataflow or exhaustive firmware command map.',
                      'calls': calls, 'buttonMethods': [m for m in cached if m['name'] in ['handleHidBtnState', 'onKeyEvent']]}, indent=2))
    sys.exit(0)
if len(sys.argv) > 3 and sys.argv[3] == '--follow-pcm':
    from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
    methods, symbols, functions, pcm_calls, plt_targets = [], [], [], [], []
    with zipfile.ZipFile(io.BytesIO(raw)) as apk:
        for cls in DEX(apk.read('classes.dex')).get_classes():
            owner = cls.get_name()
            for method in cls.get_methods():
                if not method.get_code():
                    continue
                body = list(method.get_code().get_bc().get_instructions())
                has_pcm_gain = any('PcmMixer' in i.get_output() and '->setGlobalGain(' in i.get_output() for i in body)
                selected = has_pcm_gain or method.get_name() in {'setMasterGain', 'getMasterGain', 'setGlobalGain'} or (
                    ('PcmMixer' in owner or 'AudioPcmMixer' in owner) and method.get_name() in {'handleMethod', 'mix', 'process', 'write'})
                if not selected:
                    continue
                offset, instructions = 0, []
                for ins in body:
                    instructions.append({'offset': offset, 'opcode': ins.get_name(), 'args': ins.get_output()})
                    if 'PcmMixer' in ins.get_output() and '->setGlobalGain(' in ins.get_output():
                        pcm_calls.append({'class': owner, 'method': method.get_name(), 'offset': offset, 'call': ins.get_output()})
                    offset += ins.get_length()
                methods.append({'class': owner, 'method': method.get_name(), 'descriptor': method.get_descriptor(), 'instructions': instructions})
        data = apk.read('lib/arm64-v8a/libpcmmixer-lib.so')
        elf = ELFFile(io.BytesIO(data))
        dyn = elf.get_section_by_name('.dynsym')
        plt = elf.get_section_by_name('.plt')
        relocations = elf.get_section_by_name('.rela.plt')
        for n, relocation in enumerate(relocations.iter_relocations()):
            plt_targets.append({'address': plt['sh_addr'] + 32 + n * 16,
                                'symbol': dyn.get_symbol(relocation['r_info_sym']).name})
        for symbol in dyn.iter_symbols():
            if re.search(r'gain|mix', symbol.name, re.I):
                symbols.append(symbol.name)
            if not ('PcmMixerNative_setGlobalGain' in symbol.name or symbol.name == 'pcm_mixer_set_globle_gain') or not symbol['st_size']:
                continue
            address, size = symbol['st_value'], symbol['st_size']
            for section in elf.iter_sections():
                if section['sh_type'] != 'SHT_NOBITS' and section['sh_addr'] <= address < section['sh_addr'] + section['sh_size']:
                    code = section.data()[address-section['sh_addr']:address-section['sh_addr']+size]
                    functions.append({'name': symbol.name, 'address': address, 'size': size, 'instructions': [f'{i.address:x}: {i.mnemonic} {i.op_str}' for i in Cs(CS_ARCH_ARM64, CS_MODE_ARM).disasm(code,address)]})
                    break
    print(json.dumps({'apkSha256': SHA, 'scope': 'Targeted PCM/master gain Java methods, callers and native setter after boundary scan; static only.', 'methods': methods, 'pcmGainCallers': pcm_calls, 'pcmSymbols': sorted(symbols), 'functions': functions, 'pltTargets': plt_targets}, indent=2))
    sys.exit(0)
api = re.compile(r'->(?:controlTransfer|getRawDescriptors|setStreamVolume|setVolume|setMasterVolume|setMicrophoneMute|adjustStreamVolume)\(')
names = re.compile(r'pre.?amp|master.*gain|global.*gain|volume|attenuat|feature.?unit|mixer.?unit|extension.?unit', re.I)
lead = re.compile(rb'[\x20-\x7e]{0,70}(?:preamp|pregain|mastergain|globalgain|volumecontrol|featureunit|feature unit|GET_CUR|SET_CUR|attenuat|bUnitID|bmControls)[\x20-\x7e]{0,100}', re.I)
dexes, calls, declarations, strings, native = [], [], [], [], []
with zipfile.ZipFile(io.BytesIO(raw)) as apk:
    for path in sorted(apk.namelist()):
        if not re.fullmatch(r'classes\d*\.dex', path):
            continue
        dex = DEX(apk.read(path))
        dexes.append({'file': path, 'classes': len(dex.get_classes())})
        for value in dex.get_strings():
            if names.search(value) and ('preamp' in value.lower() or 'master' in value.lower() or 'conexant' in value.lower() or 'feature' in value.lower()):
                strings.append({'dex': path, 'value': value})
        for cls in dex.get_classes():
            owner = cls.get_name()
            for method in cls.get_methods():
                if 'native' in method.get_access_flags_string() and owner.startswith('Lcom/conexant/'):
                    declarations.append({'class': owner, 'method': method.get_name(), 'descriptor': method.get_descriptor()})
                if not method.get_code():
                    continue
                instructions, offset = [], 0
                for ins in method.get_code().get_bc().get_instructions():
                    instructions.append({'offset': offset, 'opcode': ins.get_name(), 'args': ins.get_output()})
                    offset += ins.get_length()
                for n, ins in enumerate(instructions):
                    if ins['opcode'].startswith('invoke') and api.search(ins['args']):
                        calls.append({'dex': path, 'class': owner, 'method': method.get_name(), 'descriptor': method.get_descriptor(),
                                      'call': ins, 'instructions': instructions if 'controlTransfer(' in ins['args'] else instructions[max(0,n-6):n+3]})
    for path in sorted(apk.namelist()):
        if not path.startswith('lib/arm64-v8a/') or not path.endswith('.so'):
            continue
        data = apk.read(path)
        elf = ELFFile(io.BytesIO(data))
        section = elf.get_section_by_name('.dynsym')
        symbols = sorted({s.name for s in section.iter_symbols() if names.search(s.name)}) if section else []
        hits = sorted({m.group().decode('ascii') for m in lead.finditer(data)})
        native.append({'file': path, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                       'controlSymbols': symbols, 'controlStrings': hits})
print(json.dumps({'apkSha256': SHA, 'scope': 'All DEX call sites for USB controlTransfer/raw descriptors and Android volume APIs; all Conexant native declarations; all arm64 ELF symbols and targeted ASCII strings.',
                  'limitations': 'Static call/name/string evidence; no firmware, raw USB configuration descriptor, dynamic Dart AOT call graph, JNI execution or hardware probe. OS volume need not be DSP preamp.',
                  'dexes': dexes, 'boundaryCalls': calls, 'conexantNativeDeclarations': declarations,
                  'dexControlStrings': strings, 'arm64Libraries': native}, indent=2))
