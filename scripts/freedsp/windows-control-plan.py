"""Offline bounded diagnostic plans; Windows driver dB, never CAF/raw UAC."""
import math


def select_controls(endpoint):
    if endpoint['flow'] not in ['playback', 'capture']:
        raise ValueError('Unknown endpoint flow')
    adapter = endpoint['adapterId']
    volumes = [p for p in endpoint['parts'] if 'hardwareVolume' in p]
    mutes = [p for p in endpoint['parts'] if 'hardwareMute' in p]
    expected = 2 if endpoint['flow'] == 'playback' else 1
    if len(volumes) != 1 or len(mutes) != 1:
        raise ValueError('Require one hardware Volume and Mute on the endpoint path')
    volume, mute = volumes[0], mutes[0]
    if any(not p['globalId'].startswith(adapter + '/') for p in [volume, mute]):
        raise ValueError('Hardware part belongs to different adapter')
    levels = volume['hardwareVolume']
    if len(levels) != expected or [v['channel'] for v in levels] != list(range(expected)):
        raise ValueError('Unexpected channel layout')
    for level in levels:
        values = [level[k] for k in ['currentDb', 'minDb', 'maxDb', 'stepDb']]
        if not all(math.isfinite(v) for v in values):
            raise ValueError('Nonfinite control values')
        if not level['minDb'] <= level['currentDb'] <= level['maxDb'] or level['stepDb'] <= 0:
            raise ValueError('Invalid current/range')
    return volume, mute


def attenuated(level, db=3):
    # Choose a whole number of reported steps; never exceed3dB attenuation.
    steps = math.floor((db + 1e-7) / level['stepDb'])
    if steps < 1:
        raise ValueError('Reported step is too coarse for modest attenuation')
    target = level['currentDb'] - steps * level['stepDb']
    if target < level['minDb'] - 1e-6:
        raise ValueError('Baseline too close to minimum; do not raise it automatically')
    return target


def actions(endpoint):
    volume, mute = select_controls(endpoint)
    original = [v['currentDb'] for v in volume['hardwareVolume']]
    result = {'restore': {'levels': original, 'mute': mute['hardwareMute']}}
    if endpoint['flow'] == 'playback':
        if mute['hardwareMute']:
            result['blocked'] = 'Playback baseline is muted; no automatic unmute'
            return result
        try:
            low = [attenuated(v) for v in volume['hardwareVolume']]
        except ValueError as error:
            result['blocked'] = str(error)
            return result
        result['attenuate-left'] = {'levels': [low[0], original[1]]}
        result['attenuate-right'] = {'levels': [original[0], low[1]]}
        result['center'] = {'levels': original}
    else:
        level = volume['hardwareVolume'][0]
        target = -12
        if level['minDb'] <= target <= level['currentDb']:
            result['mic-down'] = {'levels': [target]}
        else:
            result['attenuationBlocked'] = '-12dB is outside range or above saved baseline; no write'
        result['mic-mute'] = {'mute': True}
        result['mic-unmute'] = {'mute': False}
    return result
