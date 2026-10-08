"""Offline model of pinned getFeatureConfigFM3; not a packet sender.

Inputs are app-helper buffers with its byte14 indexing, NOT raw USB captures.
Only source-named bits are decoded. Unknown bytes/bits remain explicit.
"""
NAMES = {1: 'Diagnose', 2: 'HiFiFM', 3: 'DongleLRDetect', 4: 'LPM', 5: 'EQInFW'}


def decode_features(availability, enabled):
    if len(availability) < 15 or len(enabled) < 15:
        raise ValueError('Helper buffer lacks byte14')
    a, e = availability[14], enabled[14]
    return {'featureCtrlEnabled': bool(a & 1),
            'available': {name: bool(a & (1 << bit)) for bit, name in NAMES.items()},
            'enabled': {name: bool(e & (1 << bit)) for bit, name in NAMES.items()},
            'unclassifiedAvailabilityBits': a & 0xc0,
            'unclassifiedEnabledBits': e & 0xc1,
            'unparsedAvailabilityAfter14': availability[15:].hex(),
            'unparsedEnabledAfter14': enabled[15:].hex()}
