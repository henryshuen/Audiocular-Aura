"""Round3 source association/unknown-bit preservation; entirely offline."""
import importlib.util
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('features', ROOT / 'scripts/freedsp/freeman-feature-forensics.py')
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)
evidence = json.loads((ROOT / 'tests/freedsp/fixtures/officialFreemanControlStaticEvidence.json').read_text())


class FreemanTests(unittest.TestCase):
    def test_exact_device_is_named_in_sdk_resource(self):
        asset = next(a for a in evidence['assets'] if 'resourceId' in a)
        config = ET.fromstring(asset['xmlText'])
        family = config.find("device[@device_name='Freeman3']")
        ids = {(int(d.attrib['vendor_id']), int(d.attrib['product_id'])) for d in family}
        self.assertIn((0x35d8, 0x1496), ids)
        self.assertNotIn((0x35d8, 0x1495), ids)

    def test_independent_feature_bits_not_balance_or_gain(self):
        for bit, name in model.NAMES.items():
            result = model.decode_features(bytes(14) + bytes([1 << bit]), bytes(15))
            self.assertEqual([n for n, value in result['available'].items() if value], [name])
            self.assertFalse(any(result['enabled'].values()))
            self.assertFalse(result['featureCtrlEnabled'])
        result = model.decode_features(bytes(14) + b'\x01', bytes(14) + b'\x08')
        self.assertTrue(result['featureCtrlEnabled'])
        self.assertTrue(result['enabled']['DongleLRDetect'])
        self.assertFalse(any(result['available'].values()))

    def test_unclassified_data_is_preserved(self):
        result = model.decode_features(bytes(14) + b'\xc0\xab\xcd', bytes(14) + b'\xc1\xef')
        self.assertEqual(result['unclassifiedAvailabilityBits'], 0xc0)
        self.assertEqual(result['unclassifiedEnabledBits'], 0xc1)
        self.assertEqual(result['unparsedAvailabilityAfter14'], 'abcd')
        self.assertEqual(result['unparsedEnabledAfter14'], 'ef')
        self.assertFalse(any(result['available'].values()))
        self.assertFalse(any(result['enabled'].values()))

    def test_short_buffers_rejected(self):
        with self.assertRaises(ValueError):
            model.decode_features(bytes(14), bytes(15))

    def test_source_fields_support_only_named_feature_map(self):
        method = next(m for m in evidence['methods'] if m['method'] == 'getFeatureConfigFM3' and m['class'].endswith('/FreemanCnxtUsbDevice;'))
        fields = [i['args'].split('->')[-1].split()[0] for i in method['instructions'] if i['opcode'] == 'iput-boolean']
        expected = {'mIsFeatureCtrlEnabled'}
        expected |= {'mIs' + n + suffix for n in model.NAMES.values() for suffix in ['Available', 'Enabled']}
        self.assertEqual(set(fields), expected)


if __name__ == '__main__':
    unittest.main()
