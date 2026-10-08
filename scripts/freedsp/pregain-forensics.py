"""Offline interpretations for research only; no transport or runtime imports."""
import math
import struct


def spv_hid_candidates(configuration):
    """Model Lju2.j's HID interrupt IN+OUT requirement, not VID/PID dispatch."""
    interfaces, current = [], None
    cursor = 0
    while cursor < len(configuration):
        size = configuration[cursor]
        if size < 2 or cursor + size > len(configuration):
            raise ValueError('Malformed descriptor')
        record = configuration[cursor:cursor + size]
        if record[1] == 4:
            if size < 9:
                raise ValueError('Short interface')
            current = {'number': record[2], 'alternate': record[3],
                       'class': record[5], 'in': [], 'out': []}
            interfaces.append(current)
        elif record[1] == 5:
            if size < 7:
                raise ValueError('Short endpoint')
            if current and record[3] & 3 == 3:
                current['in' if record[2] & 128 else 'out'].append(record[2])
        cursor += size
    return [i for i in interfaces if i['class'] == 3 and i['in'] and i['out']]


def q88_example(gain):
    """Native floor(x*256+.5) illustration, bounded to signed16 for analysis.

    This bound is an offline arithmetic constraint, NOT a device gain limit.
    """
    if not math.isfinite(gain):
        raise ValueError('Nonfinite gain')
    value = math.floor(gain * 256 + .5)
    return struct.pack('<h', value)


def decode_q88(raw):
    return struct.unpack('<h', raw)[0] / 256
