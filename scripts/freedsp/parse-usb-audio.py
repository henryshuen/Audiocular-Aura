"""Offline UAC2 descriptor decoding. Does not open devices or send requests."""
import argparse
import hashlib
import json
from pathlib import Path
import struct


def permission(bitmap, selector):
    return ['ABSENT', 'READ_ONLY', 'AMBIGUOUS_RESERVED', 'READ_WRITE'][(bitmap >> (2 * (selector - 1))) & 3]


def parse_configuration(data):
    if len(data) < 9 or data[:2] != b'\x09\x02' or struct.unpack_from('<H', data, 2)[0] != len(data):
        raise ValueError('Invalid configuration total length')
    records, interfaces, entities, headers = [], [], [], []
    current = None
    offset = 0
    while offset < len(data):
        if offset + 2 > len(data) or data[offset] < 2 or offset + data[offset] > len(data):
            raise ValueError(f'Truncated/invalid descriptor at {offset}')
        raw = data[offset:offset + data[offset]]
        kind = raw[1]
        records.append({'offset': offset, 'hex': raw.hex(), 'type': kind})
        if kind == 4:
            if len(raw) != 9:
                raise ValueError('Invalid interface descriptor')
            current = {'number': raw[2], 'alternate': raw[3], 'endpoints': raw[4],
                       'class': raw[5], 'subclass': raw[6], 'protocol': raw[7]}
            interfaces.append(current)
        elif kind == 0x24 and current and current['class'] == 1 and current['subclass'] == 1:
            if len(raw) < 4 or current['protocol'] != 0x20:
                raise ValueError('Only validated UAC2 AudioControl decoding is implemented')
            subtype = raw[2]
            entity = {'id': raw[3], 'interface': current['number'], 'offset': offset, 'hex': raw.hex()}
            if subtype == 1:
                if len(raw) != 9:
                    raise ValueError('Invalid UAC2 AC header')
                version = struct.unpack_from('<H', raw, 3)[0]
                if version != 0x0200:
                    raise ValueError('Unsupported AudioControl version')
                headers.append({'interface': current['number'], 'bcdADC': '0x0200',
                                'category': raw[5], 'totalLength': struct.unpack_from('<H', raw, 6)[0],
                                'offset': offset})
            elif subtype == 2:
                if len(raw) != 17:
                    raise ValueError('Invalid UAC2 input terminal')
                entity.update(kind='INPUT_TERMINAL', terminalType=f'0x{struct.unpack_from("<H",raw,4)[0]:04X}',
                              associatedTerminal=raw[6], clock=raw[7], channels=raw[8],
                              channelConfig=f'0x{struct.unpack_from("<I",raw,9)[0]:08X}', sources=[])
                entities.append(entity)
            elif subtype == 3:
                if len(raw) != 12:
                    raise ValueError('Invalid UAC2 output terminal')
                entity.update(kind='OUTPUT_TERMINAL', terminalType=f'0x{struct.unpack_from("<H",raw,4)[0]:04X}',
                              associatedTerminal=raw[6], sources=[raw[7]], clock=raw[8])
                entities.append(entity)
            elif subtype == 6:
                if len(raw) < 10 or (len(raw)-6) % 4:
                    raise ValueError('Invalid UAC2 Feature Unit length')
                controls = [struct.unpack_from('<I', raw, i)[0] for i in range(5,len(raw)-1,4)]
                entity.update(kind='FEATURE_UNIT', sources=[raw[4]], stringIndex=raw[-1],
                              channelControls=[{'channel': n, 'bitmap': f'0x{v:08X}',
                                                'mute': permission(v,1), 'volume': permission(v,2),
                                                'bass': permission(v,3), 'mid': permission(v,4),
                                                'treble': permission(v,5), 'inputGain': permission(v,11)}
                                               for n,v in enumerate(controls)])
                entities.append(entity)
            elif subtype == 0x0A:
                if len(raw) != 8:
                    raise ValueError('Invalid clock source')
                entity.update(kind='CLOCK_SOURCE', sources=[], attributes=raw[4], controls=raw[5])
                entities.append(entity)
            else:
                entity.update(kind={4:'MIXER_UNIT',5:'SELECTOR_UNIT',7:'EFFECT_UNIT',8:'PROCESSING_UNIT',
                                    9:'EXTENSION_UNIT'}.get(subtype, f'UNKNOWN_SUBTYPE_{subtype}'))
                entities.append(entity)
        offset += len(raw)
    for header in headers:
        first = header['offset']
        end = next((r['offset'] for r in records if r['offset'] > first and r['type'] != 0x24), len(data))
        if end-first != header['totalLength']:
            raise ValueError('AudioControl class-specific total length mismatch')
    if len({(e['interface'],e['id']) for e in entities}) != len(entities):
        raise ValueError('Duplicate AudioControl entity ID')
    for feature in [e for e in entities if e['kind'] == 'FEATURE_UNIT']:
        source = next((e for e in entities if e['interface']==feature['interface'] and e['id']==feature['sources'][0]),None)
        if source and source['kind'] == 'INPUT_TERMINAL':
            if len(feature['channelControls']) != source['channels'] + 1:
                raise ValueError('Feature Unit controls do not match source channel count')
            feature['sourceChannelConfig'] = source['channelConfig']
            for control in feature['channelControls']:
                control['label'] = 'MASTER' if control['channel']==0 else (
                    {1:'LEFT',2:'RIGHT'}.get(control['channel'],'LOGICAL_CHANNEL')
                    if source['channelConfig']=='0x00000003' and source['channels']==2 else 'LOGICAL_CHANNEL')
    return {'configurationValue': data[5], 'interfaceCount': data[4], 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(), 'headers': headers,
            'interfaces': interfaces, 'entities': entities, 'records': records,
            'limits': 'Described topology does not expose CAF PEQ location or prove DSP preamp/headroom; no current/range reads.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fixture')
    args = parser.parse_args()
    evidence = json.loads(Path(args.fixture).read_text(encoding='utf-8'))
    results = [parse_configuration(bytes.fromhex(item['hex'])) for item in evidence['configurations']]
    print(json.dumps({'source': args.fixture, 'configurations': results}, indent=2))
