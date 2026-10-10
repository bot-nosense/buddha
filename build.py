#!/usr/bin/env python3
"""Build an optional, offline single-file edition using only Python's stdlib.

The checked-in index.html runs directly alongside src/. This command inlines
its local assets into dist/index.html. No downloads, minifiers, or npm needed.
"""
from __future__ import annotations
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ('engine', 'scene', 'core', 'audio', 'ritual', 'app')


def build() -> str:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    replacements = {'<link rel="stylesheet" href="src/style.css">':
                    '<style>\n' + (ROOT / 'src/style.css').read_text(encoding='utf-8') + '\n</style>'}
    for name in ASSETS:
        code = (ROOT / f'src/{name}.js').read_text(encoding='utf-8')
        # An HTML parser sees closing script tags even inside JS strings.
        if '</script' in code.lower():
            raise ValueError(f'Unsafe inline script terminator in src/{name}.js')
        replacements[f'<script src="src/{name}.js"></script>'] = '<script>\n' + code + '\n</script>'
    for marker, value in replacements.items():
        if html.count(marker) != 1:
            raise ValueError(f'Expected exactly one asset reference: {marker}')
        html = html.replace(marker, value)
    return html


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/index.html')
    args = parser.parse_args()
    if args.output.resolve() == (ROOT / 'index.html').resolve():
        parser.error('Refusing to overwrite the source index.html. Choose dist/index.html.')
    html = build()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding='utf-8', newline='\n')
    print(f'Built {args.output}: {len(html.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    main()
