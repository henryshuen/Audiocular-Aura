"""Henry-operated temporary Windows HARDWARE level diagnostic; not production.

python -B scripts/freedsp/windows-control-diagnostic.py
python -B scripts/freedsp/windows-control-diagnostic.py --restore SNAPSHOT.json

Only explicit menu actions write. Q explicitly restores both original states.
No CAF/PEQ/Flash, driver replacement, stream, endpoint-volume setter or retries.
Interrupted/failed sessions retain snapshot for explicit --restore recovery.
Remove this validation-only surface during upstream cleanup.
"""
import argparse
import ctypes as c
import importlib.util
import json
import os
from pathlib import Path
import sys
import uuid


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


api = load('windows_audio_reader', 'read-windows-audio.py')
plans = load('windows_audio_plans', 'windows-control-plan.py')


def matching(original, current):
    # Rebind only exact endpoint/adapter/part identities, never default devices.
    if current.get('errors'):
        raise ValueError('Read-only discovery incomplete; no write')
    if not api.exact_adapter(original['adapterId']):
        raise ValueError('Snapshot is not exact FreeDSP')
    found = [e for e in current['endpoints'] if e['flow'] == original['flow']
             and e['endpointId'] == original['endpointId'] and e['adapterId'] == original['adapterId']]
    if len(found) != 1:
        raise ValueError('Original endpoint unavailable or ambiguous')
    old_volume, old_mute = plans.select_controls(original)
    new_volume, new_mute = plans.select_controls(found[0])
    for old, new in [(old_volume, new_volume), (old_mute, new_mute)]:
        if (old['globalId'], old['localId']) != (new['globalId'], new['localId']):
            raise ValueError('Hardware control identity changed')
    for old, new in zip(old_volume['hardwareVolume'], new_volume['hardwareVolume']):
        if any(old[k] != new[k] for k in ['minDb', 'maxDb', 'stepDb']):
            raise ValueError('Hardware range changed')
    return found[0], old_volume, old_mute


def write_action(reader, original, action):
    current = reader.run()
    found, volume_part, mute_part = matching(original, current)
    # Both control pointers are acquired before the first setter.
    enum_iid = api.GUID.parse(api.IDS['Enumerator'])
    clsid = api.GUID.parse('bcde0395-e52f-467c-8e3d-c4579291692e')
    pointer = api.P()
    api.check(reader.ole.CoCreateInstance(c.byref(clsid), None, 23, c.byref(enum_iid), c.byref(pointer)))
    enumerator = reader.own(pointer, 'Enumerator')
    # GetDevice is a documented identity lookup, not a default-endpoint fallback.
    device_ptr = api.P()
    api.check(reader.thunk(enumerator[0], 5, [c.c_wchar_p, c.POINTER(api.P)])(
        enumerator[0], original['endpointId'], c.byref(device_ptr)))
    device = reader.own(device_ptr, 'Device')
    topology = reader.activate(device, 'Topology')
    connector = reader.object(topology, 'GetConnector', 'Connector', 0)
    if reader.string(connector, 'GetDeviceIdConnectedTo') != original['adapterId']:
        raise ValueError('Connected adapter changed')
    connected = reader.object(connector, 'GetConnectedTo', 'Connector')
    part = reader.query(connected, 'Part')
    topo_ptr = api.P()
    api.check(reader.thunk(part[0], 12, [c.POINTER(api.P)])(part[0], c.byref(topo_ptr)))
    adapter_topology = reader.own(topo_ptr, 'Topology')
    controls = {}
    for name, evidence in [('Volume', volume_part), ('Mute', mute_part)]:
        ptr = api.P()
        api.check(reader.thunk(adapter_topology[0], 7, [api.U, c.POINTER(api.P)])(
            adapter_topology[0], evidence['localId'], c.byref(ptr)))
        target = reader.own(ptr, 'Part')
        if reader.string(target, 'GetGlobalId') != evidence['globalId']:
            raise ValueError('Part changed before write')
        controls[name] = reader.activate(target, name)
    # Check the complete action against original bounds before any setter.
    if 'levels' in action:
        if len(action['levels']) != len(volume_part['hardwareVolume']):
            raise ValueError('Wrong channel count')
        for target, baseline in zip(action['levels'], volume_part['hardwareVolume']):
            if not baseline['minDb'] <= target <= baseline['currentDb']:
                raise ValueError('Target above baseline or outside range')
    for channel, target in enumerate(action.get('levels', [])):
        print('%s channel%d -> %.2fdB' % (original['flow'], channel, target), flush=True)
        obj = controls['Volume'][0]
        api.check(reader.thunk(obj, 6, [api.U, api.F, api.P])(obj, channel, target, None))
        actual = reader.scalar(controls['Volume'], 'GetLevel', api.F, channel)
        if abs(actual - target) > 1e-4:
            raise ValueError('Driver level confirmation mismatch; STOP')
    if 'mute' in action:
        obj = controls['Mute'][0]
        print('%s mute -> %s' % (original['flow'], action['mute']), flush=True)
        api.check(reader.thunk(obj, 3, [api.I, api.P])(obj, int(action['mute']), None))
        if bool(reader.scalar(controls['Mute'], 'GetMute', api.I)) != action['mute']:
            raise ValueError('Driver mute confirmation mismatch; STOP')
    print('Driver confirmation PASS; audible/recording behavior still requires Henry.', flush=True)


def run(reader, args):
    if args.restore:
        snapshot = json.loads(Path(args.restore).read_text(encoding='utf-8'))
        endpoints = snapshot['endpoints']
    else:
        snapshot = reader.run()
        endpoints = snapshot['endpoints']
        if snapshot.get('errors') or sorted(e['flow'] for e in endpoints) != ['capture', 'playback']:
            raise ValueError('Require exactly one exact playback and capture endpoint')
        for endpoint in endpoints:
            plans.select_controls(endpoint)
        directory = Path(os.environ['LOCALAPPDATA']) / 'AuraPEQ/control-diagnostic'
        directory.mkdir(parents=True, exist_ok=True)
        saved = directory / ('original-' + uuid.uuid4().hex + '.json')
        saved.write_text(json.dumps(snapshot, indent=2, allow_nan=False) + '\n', encoding='utf-8')
        print('Original state saved BEFORE writes: ' + str(saved))
        print('Recovery: python -B scripts/freedsp/windows-control-diagnostic.py --restore "' + str(saved) + '"')
    if sorted(e['flow'] for e in endpoints) != ['capture', 'playback']:
        raise ValueError('Snapshot must contain exactly one playback and capture endpoint')
    by_flow = {e['flow']: e for e in endpoints}
    available = {flow: plans.actions(e) for flow, e in by_flow.items()}
    if args.restore:
        for endpoint in endpoints:
            write_action(reader, endpoint, plans.actions(endpoint)['restore'])
        return
    for flow, choices in available.items():
        print(flow + ': ' + json.dumps(choices))
    print('APO OFF; normal music only; low Windows volume. No test tones.')
    print('Commands: attenuate-left, center, attenuate-right; mic-down, mic-mute, mic-unmute, mic-restore.')
    print('Q = explicitly restore both saved original states and exit. Ctrl+C/error: STOP, no automatic retry/rollback; use saved recovery command.')
    while True:
        command = input('Explicit action (Q restores/exits): ').strip().lower()
        if command == 'q':
            for endpoint in endpoints:
                write_action(reader, endpoint, available[endpoint['flow']]['restore'])
            return
        flow = 'capture' if command.startswith('mic-') else 'playback'
        key = 'restore' if command == 'mic-restore' else command
        action = available[flow].get(key)
        if not isinstance(action, dict):
            print('Unavailable action; no write. ' + available[flow].get('blocked', ''))
            continue
        write_action(reader, by_flow[flow], action)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--restore', help='Explicitly restore previously saved original values')
    args = parser.parse_args()
    reader = api.Reader()
    try:
        run(reader, args)
    except (OSError, ValueError, KeyboardInterrupt, EOFError) as error:
        print('STOP: ' + str(error) + '; retain original snapshot for explicit recovery.', file=sys.stderr)
        sys.exit(1)
    finally:
        reader.close()
