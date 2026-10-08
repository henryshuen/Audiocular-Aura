"""Offline exact-device transport incompatibility and numeric semantics."""
import importlib.util
import json
import struct
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('pregain', ROOT / 'scripts/freedsp/pregain-forensics.py')
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)


class PregainTests(unittest.TestCase):
    def test_exact_freedsp_has_no_spv_endpoint_pair(self):
        fixture = json.loads((ROOT / 'tests/freedsp/fixtures/freeDspUsbConfiguration.json').read_text())
        self.assertEqual((fixture['vid'], fixture['pid']), ('0x35D8', '0x1496'))
        self.assertEqual(model.spv_hid_candidates(bytes.fromhex(fixture['configurations'][0]['hex'])), [])

    def test_audio_out_cannot_complete_hid_pair(self):
        raw = bytes.fromhex('09040300010300000007058303400007'
                            '0904010101010220000705010d200101')
        self.assertEqual(model.spv_hid_candidates(raw), [])

    def test_real_interrupt_pair_would_qualify(self):
        raw = bytes.fromhex('0904030002030000000705830340000707050303400007')
        result = model.spv_hid_candidates(raw)
        self.assertEqual((result[0]['in'], result[0]['out']), ([0x83], [3]))

    def test_signed_q88_examples_and_resolution(self):
        for db, expected in [(0, '0000'), (-1.5, '80fe'), (-9.5, '80f6'), (1 / 256, '0100')]:
            raw = model.q88_example(db)
            self.assertEqual(raw.hex(), expected)
            self.assertEqual(model.decode_q88(raw), db)
        self.assertEqual(model.q88_example(-.5 / 256).hex(), '0000')
        self.assertNotEqual(model.q88_example(-1.5), (-150).to_bytes(2, 'little', signed=True))

    def test_malformed_descriptor_stops(self):
        for raw in [b'\x00\x04', b'\x09\x04', b'\x02\x04']:
            with self.assertRaises(ValueError):
                model.spv_hid_candidates(raw)

    def test_raw_aot_direct_calls_support_selected_chain(self):
        fixture = json.loads((ROOT / 'tests/freedsp/fixtures/officialPregainAotEvidence.json').read_text())
        cases = [('USB debug read', 0x952994, 0x71c960),
                 ('FlutterNative.setSpvPreGain', 0x71388c, 0xb7f35c)]
        for label, site, target in cases:
            function = next(f for f in fixture['functions'] if f['label'] == label)
            word = struct.unpack_from('<I', bytes.fromhex(function['hex']), site - function['address'])[0]
            self.assertEqual(word >> 26, 0b100101)  # ARM64 BL, independently decoded.
            immediate = word & 0x3ffffff
            if immediate & 0x2000000:
                immediate -= 0x4000000
            self.assertEqual(site + immediate * 4, target)

    def test_native_signed_load_and_scale_are_not_ble_hundredths(self):
        fixture = json.loads((ROOT / 'tests/freedsp/fixtures/officialPregainProtocolEvidence.json').read_text())
        read = next(f for f in fixture['functions'] if f['name'].endswith('_readQ88'))
        instructions = {(i['mnemonic'], i['operands']) for i in read['instructions']}
        self.assertIn(('ldrsh', 'w21, [x0, w21, uxtw]'), instructions)
        self.assertIn(('scvtf', 'd0, w21, #8'), instructions)


if __name__ == '__main__':
    unittest.main()
