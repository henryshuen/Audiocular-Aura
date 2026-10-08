"""Offline plans, identity/range guards and read-only ABI; no COM/device calls."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[2]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts/freedsp' / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


reader = load('read_model', 'read-windows-audio.py')
plan = load('plans', 'windows-control-plan.py')
diagnostic = load('diagnostic', 'windows-control-diagnostic.py')
fixture = json.loads((ROOT / 'tests/freedsp/fixtures/freeDspWindowsAudioEvidence.json').read_text())


class WindowsAudioTests(unittest.TestCase):
    def test_failed_discovery_stops_before_any_com_write(self):
        current = copy.deepcopy(fixture)
        current['errors'] = ['incomplete discovery']
        fake = Mock()
        fake.run.return_value = current
        with self.assertRaises(ValueError):
            diagnostic.write_action(fake, fixture['endpoints'][0], {'levels': [-74, -74]})
        fake.thunk.assert_not_called()
        fake.ole.CoCreateInstance.assert_not_called()

    def test_exact_guard_excludes_unrelated_or_longer_pid(self):
        self.assertTrue(reader.exact_adapter(fixture['endpoints'][0]['adapterId']))
        for identity in ['usb#vid_35d8&pid_14960&mi_00', 'usb#vid_35d8&pid_1497&mi_00', 'realtek']:
            self.assertFalse(reader.exact_adapter(identity))

    def test_live_fixture_is_hardware_read_evidence_not_raw_uac(self):
        self.assertEqual(fixture['errors'], [])
        for endpoint in fixture['endpoints']:
            volume, mute = plan.select_controls(endpoint)
            self.assertEqual(endpoint['endpointHardwareSupportMask'], 3)
            for level in volume['hardwareVolume']:
                self.assertEqual((level['minDb'], level['maxDb'], level['stepDb']), (-74, 0, .5))
        self.assertIn('not USB Feature Unit IDs', fixture['limits'])

    def test_current_muted_minimum_playback_blocks_attenuation(self):
        actions = plan.actions(fixture['endpoints'][0])
        self.assertIn('blocked', actions)
        self.assertNotIn('attenuate-left', actions)
        self.assertEqual(actions['restore'], {'levels': [-74, -74], 'mute': True})

    def test_stereo_plans_attenuate_only_selected_channel_and_restore_asymmetry(self):
        endpoint = copy.deepcopy(fixture['endpoints'][0])
        volume, mute = plan.select_controls(endpoint)
        mute['hardwareMute'] = False
        for level, db in zip(volume['hardwareVolume'], [-20, -21]):
            level['currentDb'] = db
        actions = plan.actions(endpoint)
        self.assertEqual(actions['attenuate-left']['levels'], [-23, -21])
        self.assertEqual(actions['attenuate-right']['levels'], [-20, -24])
        self.assertEqual(actions['center']['levels'], [-20, -21])
        self.assertEqual(actions['restore']['mute'], False)

    def test_mic_plan_preserves_original_and_has_no_boost(self):
        actions = plan.actions(fixture['endpoints'][1])
        self.assertEqual(actions['mic-down'], {'levels': [-3]})
        self.assertEqual(actions['mic-mute'], {'mute': True})
        self.assertEqual(actions['mic-unmute'], {'mute': False})
        self.assertEqual(actions['restore'], {'levels': [0], 'mute': False})

    def test_identity_range_or_ambiguity_changes_stop(self):
        for alteration in ['identity', 'range', 'duplicate']:
            current = copy.deepcopy(fixture)
            endpoint = current['endpoints'][0]
            volume, _ = plan.select_controls(endpoint)
            if alteration == 'identity':
                volume['localId'] += 1
            elif alteration == 'range':
                volume['hardwareVolume'][0]['stepDb'] = 1
            else:
                current['endpoints'].append(copy.deepcopy(endpoint))
            with self.assertRaises(ValueError):
                diagnostic.matching(fixture['endpoints'][0], current)

    def test_snapshot_channels_or_nonfinite_ranges_rejected(self):
        endpoint = copy.deepcopy(fixture['endpoints'][1])
        endpoint['parts'][2]['hardwareVolume'][0]['currentDb'] = float('nan')
        with self.assertRaises(ValueError):
            plan.select_controls(endpoint)

    def test_read_only_slots_match_audited_sdk_and_exclude_setters(self):
        abi = json.loads((ROOT / 'tests/freedsp/fixtures/windowsAudioReadAbiEvidence.json').read_text())
        for interface, methods in reader.SLOTS.items():
            self.assertEqual({name: slot for name, (slot, _) in methods.items()},
                             abi['interfaces'][interface]['auditedReadSlots'])
            self.assertFalse(any(name.startswith(('Set', 'Connect', 'Disconnect')) for name in methods))
        self.assertEqual(abi['manualDiagnosticSlots']['Volume']['SetLevel'], 6)
        self.assertEqual(abi['manualDiagnosticSlots']['Mute']['SetMute'], 3)


if __name__ == '__main__':
    unittest.main()
