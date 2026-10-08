"""Offline fixture and malformed-descriptor tests; no device or networking."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parents[2]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


decoder = load('audio_decode', 'scripts/freedsp/parse-usb-audio.py')
reader = load('descriptor_reader', 'scripts/freedsp/collect-usb-descriptors.py')
fixture = json.loads((ROOT / 'tests/freedsp/fixtures/freeDspUsbConfiguration.json').read_text())
raw = bytes.fromhex(fixture['configurations'][0]['hex'])


class DescriptorTests(unittest.TestCase):
    def test_exact_device_and_complete_bytes(self):
        device = bytes.fromhex(fixture['deviceDescriptorHex'])
        self.assertEqual(struct.unpack_from('<HH', device, 8), (0x35D8,0x1496))
        self.assertEqual(len(raw),422)
        self.assertEqual(hashlib.sha256(raw).hexdigest(),fixture['configurations'][0]['sha256'])
        self.assertEqual(decoder.parse_configuration(raw)['headers'][0]['bcdADC'],'0x0200')
        saved=json.loads((ROOT/'tests/freedsp/fixtures/freeDspAudioControlEvidence.json').read_text())
        self.assertEqual(decoder.parse_configuration(raw),saved['configurations'][0])

    def test_playback_controls_not_master_volume(self):
        result = decoder.parse_configuration(raw)
        feature = next(e for e in result['entities'] if e['id']==2)
        self.assertEqual(feature['sources'],[1])
        self.assertEqual([c['label'] for c in feature['channelControls']],['MASTER','LEFT','RIGHT'])
        self.assertEqual([c['volume'] for c in feature['channelControls']],['ABSENT','READ_WRITE','READ_WRITE'])
        self.assertEqual([c['mute'] for c in feature['channelControls']],['READ_WRITE','ABSENT','ABSENT'])
        self.assertEqual([e['id'] for e in result['entities'] if e['kind'] in ['MIXER_UNIT','PROCESSING_UNIT','EXTENSION_UNIT']],[])

    def test_capture_is_separate_mono_route(self):
        entities=decoder.parse_configuration(raw)['entities']
        feature=next(e for e in entities if e['id']==5)
        self.assertEqual(feature['sources'],[4])
        self.assertEqual(len(feature['channelControls']),2)
        self.assertEqual(feature['channelControls'][1]['label'],'LOGICAL_CHANNEL')
        self.assertEqual(next(e for e in entities if e['id']==6)['sources'],[5])

    def test_reserved_permission_is_not_writable(self):
        changed=bytearray(raw)
        changed[69]=8  # FU2 logical1 volume=0b10, reserved.
        self.assertEqual(decoder.parse_configuration(changed)['entities'][2]['channelControls'][1]['volume'],'AMBIGUOUS_RESERVED')

    def test_reject_truncation_and_zero_length(self):
        with self.assertRaises(ValueError): decoder.parse_configuration(raw[:-1])
        changed=bytearray(raw);changed[60]=0
        with self.assertRaises(ValueError): decoder.parse_configuration(changed)

    def test_reject_feature_channel_count_and_ac_total_mismatch(self):
        changed=bytearray(raw);changed[51]=1
        with self.assertRaises(ValueError): decoder.parse_configuration(changed)
        changed=bytearray(raw);changed[32]=0
        with self.assertRaises(ValueError): decoder.parse_configuration(changed)

    def test_descriptor_request_cannot_be_class_or_set(self):
        request=reader.descriptor_request(1,0)
        self.assertEqual(struct.unpack('<IBBHHH',request),(1,0x80,6,0x0200,0,65535))
        for port,index in [(0,0),(1,8),(256,0)]:
            with self.assertRaises(ValueError): reader.descriptor_request(port,index)
        self.assertEqual([c['ioctl'] for c in fixture['calls']],['0x00220448','0x00220410'])


if __name__ == '__main__':
    unittest.main()
