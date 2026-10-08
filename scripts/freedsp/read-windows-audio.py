"""Read-only Windows Core Audio/DeviceTopology evidence for exact35D8:1496.

No setters, streams, raw USB/KS requests, driver changes or CAF imports.
Vtable slots/signatures verified against Microsoft win32metadata SDK headers.
Enumerates endpoint identity first; reads controls only for matching adapter.
Values are driver/Core Audio dB, NOT raw UAC CUR/RANGE replies or FU IDs.
"""
import ctypes as c
from datetime import datetime, timezone
import json
import re
import sys
import uuid

P, U, I, F = c.c_void_p, c.c_uint32, c.c_int32, c.c_float


class GUID(c.Structure):
    _fields_ = [('data1', U), ('data2', c.c_uint16), ('data3', c.c_uint16), ('data4', c.c_ubyte * 8)]

    @classmethod
    def parse(cls, value):
        return cls.from_buffer_copy(uuid.UUID(value).bytes_le)


IDS = {
    'Enumerator': 'a95664d2-9614-4f35-a746-de8db63617e6',
    'Topology': '2a07407e-6497-4a18-9787-32f79bd0d98f',
    'Part': 'ae2de0e4-5bca-4f2d-aa46-5d13f8fdb3a9',
    'Volume': '7fb7b48f-531d-44a2-bcb3-5ad5a134b3dc',
    'Mute': 'df45aeea-b74a-4b6b-afad-2366b6aa012e',
    'EndpointVolume': '5cdf2c82-841e-4546-9722-0cf74078229a',
}
# Each interface exposes only audited read/query/lifecycle entries. No writes.
SLOTS = {
    'Enumerator': {'EnumAudioEndpoints': (3, [I, U, c.POINTER(P)])},
    'Collection': {'GetCount': (3, [c.POINTER(U)]), 'Item': (4, [U, c.POINTER(P)])},
    'Device': {'Activate': (3, [c.POINTER(GUID), U, P, c.POINTER(P)]), 'GetId': (5, [c.POINTER(P)])},
    'Topology': {'GetConnector': (4, [U, c.POINTER(P)])},
    'Connector': {'GetConnectedTo': (8, [c.POINTER(P)]), 'GetDeviceIdConnectedTo': (10, [c.POINTER(P)])},
    'Part': {'GetName': (3, [c.POINTER(P)]), 'GetLocalId': (4, [c.POINTER(U)]),
             'GetGlobalId': (5, [c.POINTER(P)]), 'GetSubType': (7, [c.POINTER(GUID)]),
             'EnumPartsIncoming': (10, [c.POINTER(P)]), 'EnumPartsOutgoing': (11, [c.POINTER(P)]),
             'Activate': (13, [U, c.POINTER(GUID), c.POINTER(P)])},
    'PartsList': {'GetCount': (3, [c.POINTER(U)]), 'GetPart': (4, [U, c.POINTER(P)])},
    'Volume': {'GetChannelCount': (3, [c.POINTER(U)]),
               'GetLevelRange': (4, [U, c.POINTER(F), c.POINTER(F), c.POINTER(F)]),
               'GetLevel': (5, [U, c.POINTER(F)])},
    'Mute': {'GetMute': (4, [c.POINTER(I)])},
    'EndpointVolume': {'GetChannelCount': (5, [c.POINTER(U)]),
                       'GetMasterVolumeLevel': (8, [c.POINTER(F)]),
                       'GetChannelVolumeLevel': (12, [U, c.POINTER(F)]),
                       'GetMute': (15, [c.POINTER(I)]),
                       'QueryHardwareSupport': (19, [c.POINTER(U)]),
                       'GetVolumeRange': (20, [c.POINTER(F), c.POINTER(F), c.POINTER(F)])},
}


def exact_adapter(value):
    return bool(re.search(r'vid_35d8&pid_1496(?:[&#\\]|$)', value, re.I))


def check(hr):
    if hr < 0:
        raise OSError('HRESULT 0x%08X' % (hr & 0xffffffff))


class Reader:
    def __init__(self):
        self.refs = []
        self.ole = c.WinDLL('ole32')
        self.ole.CoInitializeEx.argtypes = [P, U]
        self.ole.CoInitializeEx.restype = I
        self.ole.CoCreateInstance.argtypes = [c.POINTER(GUID), P, U, c.POINTER(GUID), c.POINTER(P)]
        self.ole.CoCreateInstance.restype = I
        self.ole.CoTaskMemFree.argtypes = [P]
        check(self.ole.CoInitializeEx(None, 0))

    def own(self, pointer, interface):
        if not pointer.value:
            raise ValueError('Null interface')
        self.refs.append(pointer)
        return pointer, interface

    def thunk(self, pointer, slot, types, result=I):
        table = c.cast(pointer, c.POINTER(c.POINTER(P))).contents
        return c.WINFUNCTYPE(result, P, *types)(table[slot])

    def call(self, obj, method, *args):
        pointer, interface = obj
        slot, types = SLOTS[interface][method]
        check(self.thunk(pointer, slot, types)(pointer, *args))

    def query(self, obj, interface):
        result, iid = P(), GUID.parse(IDS[interface])
        check(self.thunk(obj[0], 0, [c.POINTER(GUID), c.POINTER(P)])(obj[0], c.byref(iid), c.byref(result)))
        return self.own(result, interface)

    def object(self, obj, method, interface, *args):
        result = P()
        self.call(obj, method, *args, c.byref(result))
        return self.own(result, interface)

    def activate(self, obj, interface):
        iid = GUID.parse(IDS[interface])
        if obj[1] == 'Part':
            return self.object(obj, 'Activate', interface, 23, c.byref(iid))
        return self.object(obj, 'Activate', interface, c.byref(iid), 23, None)

    def string(self, obj, method):
        result = P()
        self.call(obj, method, c.byref(result))
        try:
            return c.wstring_at(result) if result.value else ''
        finally:
            self.ole.CoTaskMemFree(result)

    def scalar(self, obj, method, typ=U, *args):
        result = typ()
        self.call(obj, method, *args, c.byref(result))
        return result.value

    def level(self, obj, channel, endpoint=False):
        value = self.scalar(obj, 'GetChannelVolumeLevel' if endpoint else 'GetLevel', F, channel)
        result = {'channel': channel, 'currentDb': value}
        lo, hi, step = F(), F(), F()
        if not endpoint:
            self.call(obj, 'GetLevelRange', channel, c.byref(lo), c.byref(hi), c.byref(step))
            result.update(minDb=lo.value, maxDb=hi.value, stepDb=step.value)
        return result

    def parts(self, connector):
        queue = [self.query(connector, 'Part')]
        visited, result = set(), []
        while queue:
            part = queue.pop(0)
            local = self.scalar(part, 'GetLocalId')
            if local in visited:
                continue
            if len(visited) >= 64:
                raise ValueError('Topology bound exceeded')
            visited.add(local)
            item = {'localId': local, 'ksNodeId': local & 0xffff,
                    'name': self.string(part, 'GetName'), 'globalId': self.string(part, 'GetGlobalId')}
            for interface in ['Volume', 'Mute']:
                try:
                    control = self.activate(part, interface)
                    if interface == 'Volume':
                        count = self.scalar(control, 'GetChannelCount')
                        if count > 8:
                            raise ValueError('Channel bound exceeded')
                        item['hardwareVolume'] = [self.level(control, i) for i in range(count)]
                    else:
                        item['hardwareMute'] = bool(self.scalar(control, 'GetMute', I))
                except OSError as error:
                    item[interface + 'InterfaceResult'] = str(error)
            result.append(item)
            for direction in ['EnumPartsIncoming', 'EnumPartsOutgoing']:
                try:
                    parts = self.object(part, direction, 'PartsList')
                    count = self.scalar(parts, 'GetCount')
                    if count > 64:
                        raise ValueError('Part count exceeded')
                    queue += [self.object(parts, 'GetPart', 'Part', i) for i in range(count)]
                except OSError as error:
                    item[direction + 'Result'] = str(error)
        return result

    def run(self):
        clsid = GUID.parse('bcde0395-e52f-467c-8e3d-c4579291692e')
        iid, ptr = GUID.parse(IDS['Enumerator']), P()
        check(self.ole.CoCreateInstance(c.byref(clsid), None, 23, c.byref(iid), c.byref(ptr)))
        enumerator = self.own(ptr, 'Enumerator')
        matches, errors = [], []
        for flow, name in [(0, 'playback'), (1, 'capture')]:
            collection = self.object(enumerator, 'EnumAudioEndpoints', 'Collection', flow, 1)
            count = self.scalar(collection, 'GetCount')
            if count > 128:
                raise ValueError('Endpoint count exceeded')
            for index in range(count):
                device = self.object(collection, 'Item', 'Device', index)
                endpoint_id = self.string(device, 'GetId')
                try:
                    topology = self.activate(device, 'Topology')
                    connector = self.object(topology, 'GetConnector', 'Connector', 0)
                    adapter = self.string(connector, 'GetDeviceIdConnectedTo')
                    if not exact_adapter(adapter):
                        continue
                    item = {'flow': name, 'endpointId': endpoint_id, 'adapterId': adapter}
                    matches.append(item)
                    connected = self.object(connector, 'GetConnectedTo', 'Connector')
                    item['parts'] = self.parts(connected)
                    volume = self.activate(device, 'EndpointVolume')
                    item['endpointHardwareSupportMask'] = self.scalar(volume, 'QueryHardwareSupport')
                    channels = self.scalar(volume, 'GetChannelCount')
                    if channels > 8:
                        raise ValueError('Endpoint channels exceeded')
                    item['endpointChannels'] = [self.level(volume, i, True) for i in range(channels)]
                    item['endpointMute'] = bool(self.scalar(volume, 'GetMute', I))
                    lo, hi, step = F(), F(), F()
                    self.call(volume, 'GetVolumeRange', c.byref(lo), c.byref(hi), c.byref(step))
                    item['endpointRange'] = {'minDb': lo.value, 'maxDb': hi.value, 'stepDb': step.value}
                except OSError as error:
                    errors.append({'endpointId': endpoint_id, 'flow': name, 'error': str(error)})
        return {'capturedUtc': datetime.now(timezone.utc).isoformat(), 'vid': '0x35D8', 'pid': '0x1496',
                'safety': 'Read-only COM getters, exact connected adapter guard; no setters, raw USB/KS, CAF, stream, driver or settings changes.',
                'limits': 'Windows part/node IDs are not USB Feature Unit IDs; dB/ranges are driver values, not raw UAC CUR/RANGE. Does not establish PEQ placement or write behavior.',
                'endpoints': matches, 'errors': errors}

    def close(self):
        for pointer in reversed(self.refs):
            self.thunk(pointer, 2, [], U)(pointer)
        self.ole.CoUninitialize()


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    reader = Reader()
    try:
        print(json.dumps(reader.run(), indent=2, allow_nan=False))
    finally:
        reader.close()
