"""Static strings from the pinned APK; never execute target code.

Usage: python -B scripts/freedsp/inspect-gain-limits.py PINNED_APK
String evidence is NOT proof of a slider callback, firmware range or limiter.
"""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

SHA = '04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5'


def inspect(path):
    raw = Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != SHA:
        raise ValueError('Pinned APK mismatch')
    with zipfile.ZipFile(path) as apk:
        data = apk.read('lib/arm64-v8a/libapp.so')
    terms = ['-16dB', '-18dB', '\u589e\u76ca\u7bc4\u570d\uff1a',
             'gain range', 'Gain range', 'minGain', 'maxGain',
             'limiter', 'headroom', 'preGain', 'setSpvPreGain']
    findings = []
    for term in terms:
        for encoding in ['utf-8', 'utf-16-le']:
            pattern = re.escape(term.encode(encoding))
            if term == 'limiter' and encoding == 'utf-8':
                pattern = rb'(?<![A-Za-z])' + pattern + rb'(?![A-Za-z])'
            matches = list(re.finditer(pattern, data))
            entries = []
            for match in matches[:8]:
                start = max(0, match.start() - 24)
                if encoding == 'utf-16-le':
                    start += (match.start() - start) % 2
                entries.append({'fileOffset': match.start(), 'context':
                                data[start:match.end()+70].decode(encoding, 'replace')})
            findings.append({'term': term, 'encoding': encoding,
                             'matchCount': len(matches), 'entries': entries})
    return {'apkSha256': SHA, 'libappSha256': hashlib.sha256(data).hexdigest(),
            'category': 'Primary static string bytes; unassigned call sites',
            'limitations': 'Offsets are file offsets, not function addresses. Strings do not prove execution, exact-device routing, slider enforcement or hardware capability.',
            'findings': findings}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(inspect(sys.argv[1]), ensure_ascii=True, indent=2))
