"""Windows descriptor-only reader; no CAF, class/vendor requests or device writes.

Supply the parent hub PnP instance and port from read-only PnP properties.
Uses Microsoft's USBView hub IOCTL pattern; verifies exact VID/PID before
requesting configurations. No driver replacement, reset or WinUSB binding.
"""
import argparse
import ctypes as c
from ctypes import wintypes as w
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import struct
import uuid


CONNECTION_INFO = 0x220448
GET_DESCRIPTOR = 0x220410


def descriptor_request(port, index, size=65535):
    if not 1 <= port <= 255 or not 0 <= index < 8 or not 9 <= size <= 65535:
        raise ValueError('Invalid bounded configuration descriptor request')
    # USB_DESCRIPTOR_REQUEST: ULONG port + USB setup packet; configuration only.
    return struct.pack('<IBBHHH', port, 0x80, 6, 0x0200 | index, 0, size)


def read_descriptors(hub_instance, port):
    if not 1 <= port <= 255:
        raise ValueError('Invalid USB port')
    setup = c.WinDLL('setupapi', use_last_error=True)
    kernel = c.WinDLL('kernel32', use_last_error=True)

    class Interface(c.Structure):
        _fields_ = [('cbSize', w.DWORD), ('guid', c.c_byte * 16),
                    ('flags', w.DWORD), ('reserved', c.c_void_p)]

    setup.SetupDiGetClassDevsW.argtypes = [c.c_void_p, w.LPCWSTR, c.c_void_p, w.DWORD]
    setup.SetupDiGetClassDevsW.restype = c.c_void_p
    setup.SetupDiEnumDeviceInterfaces.argtypes = [c.c_void_p, c.c_void_p, c.c_void_p, w.DWORD, c.c_void_p]
    setup.SetupDiGetDeviceInterfaceDetailW.argtypes = [c.c_void_p, c.c_void_p, c.c_void_p, w.DWORD, c.c_void_p, c.c_void_p]
    setup.SetupDiDestroyDeviceInfoList.argtypes = [c.c_void_p]
    kernel.CreateFileW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, c.c_void_p, w.DWORD, w.DWORD, c.c_void_p]
    kernel.CreateFileW.restype = c.c_void_p
    kernel.CloseHandle.argtypes = [c.c_void_p]
    kernel.DeviceIoControl.argtypes = [c.c_void_p, w.DWORD, c.c_void_p, w.DWORD,
                                      c.c_void_p, w.DWORD, c.c_void_p, c.c_void_p]
    guid = (c.c_byte * 16).from_buffer_copy(uuid.UUID('f18a0e88-c30c-11d0-8815-00a0c906bed8').bytes_le)
    invalid = c.c_void_p(-1).value
    devices = setup.SetupDiGetClassDevsW(c.byref(guid), None, None, 0x12)
    if devices == invalid:
        raise c.WinError(c.get_last_error())
    paths = []
    try:
        for index in range(128):
            interface = Interface()
            interface.cbSize = c.sizeof(interface)
            if not setup.SetupDiEnumDeviceInterfaces(devices, None, c.byref(guid), index, c.byref(interface)):
                error = c.get_last_error()
                if error == 259:
                    break
                raise c.WinError(error)
            required = w.DWORD()
            setup.SetupDiGetDeviceInterfaceDetailW(devices, c.byref(interface), None, 0, c.byref(required), None)
            if not 8 <= required.value <= 65536:
                raise ValueError('Invalid interface detail size')
            detail = c.create_string_buffer(required.value)
            struct.pack_into('<I', detail, 0, 8 if c.sizeof(c.c_void_p) == 8 else 6)
            if not setup.SetupDiGetDeviceInterfaceDetailW(devices, c.byref(interface), detail, required, None, None):
                raise c.WinError(c.get_last_error())
            path = c.wstring_at(c.addressof(detail) + 4)
            if path.lower().startswith('\\\\?\\' + hub_instance.replace('\\', '#').lower() + '#'):
                paths.append(path)
    finally:
        setup.SetupDiDestroyDeviceInfoList(devices)
    if len(paths) != 1:
        raise ValueError(f'Expected exactly one specified parent hub; found {len(paths)}')
    # Hub handle access flags permit IOCTL submission, not USB data OUT transfers.
    handle = kernel.CreateFileW(paths[0], 0xC0000000, 3, None, 3, 0, None)
    if handle == invalid:
        raise c.WinError(c.get_last_error())
    calls = []
    try:
        def ioctl(code, header, size):
            if code not in (CONNECTION_INFO, GET_DESCRIPTOR):
                raise ValueError('IOCTL outside descriptor-only allowlist')
            if code == GET_DESCRIPTOR and header != descriptor_request(port, header[6]):
                raise ValueError('Only configuration GET_DESCRIPTOR is permitted')
            buffer = c.create_string_buffer(size)
            c.memmove(buffer, header, len(header))
            count = w.DWORD()
            if not kernel.DeviceIoControl(handle, code, buffer, size, buffer, size, c.byref(count), None):
                raise c.WinError(c.get_last_error())
            if count.value > size:
                raise ValueError('Invalid returned length')
            calls.append({'ioctl': f'0x{code:08X}', 'requestHex': header.hex(), 'returnedBytes': count.value})
            return bytes(buffer[:count.value])

        connection = ioctl(CONNECTION_INFO, struct.pack('<I', port), 4096)
        device = connection[4:22]
        if len(device) != 18 or device[:2] != b'\x12\x01' or struct.unpack_from('<HH', device, 8) != (0x35D8, 0x1496):
            raise ValueError('Port is not exact FreeDSP 35D8:1496; no descriptor requests sent')
        if not 1 <= device[17] <= 8:
            raise ValueError('Invalid configuration count')
        configurations = []
        for index in range(device[17]):
            response = ioctl(GET_DESCRIPTOR, descriptor_request(port, index), 12 + 65535)
            data = response[12:]
            if len(data) < 9 or data[:2] != b'\x09\x02' or struct.unpack_from('<H', data, 2)[0] != len(data):
                raise ValueError('Configuration descriptor truncated or malformed')
            configurations.append({'index': index, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                                   'hex': data.hex()})
        return {'capturedUtc': datetime.now(timezone.utc).isoformat(), 'vid': '0x35D8', 'pid': '0x1496',
                'source': 'Windows USB hub IOCTL; exact device verified using enumerated device descriptor',
                'safety': 'Standard configuration GET_DESCRIPTOR only; no CAF/class/vendor/SET requests, no endpoint volume change',
                'port': port, 'deviceDescriptorHex': device.hex(), 'currentConfiguration': connection[22],
                'configurations': configurations, 'calls': calls}
    finally:
        kernel.CloseHandle(handle)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--hub-instance', required=True)
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = read_descriptors(args.hub_instance, args.port)
    Path(args.output).write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ('vid', 'pid', 'currentConfiguration')}))
    print('Captured configurations:', [i['bytes'] for i in result['configurations']])
