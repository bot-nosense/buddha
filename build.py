#!/usr/bin/env python3
"""Build a self-contained HTML file. Python 3 only, no third-party packages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
html = (ROOT / 'src/template.html').read_text(encoding='utf-8')
for token, filename in [('STYLE','style.css'),('ENGINE','engine.js'),('SCENE','scene.js'),('APP','app.js')]:
    text = (ROOT / 'src' / filename).read_text(encoding='utf-8')
    # No strings in these source files contain literal closing script tags.
    html = html.replace(f'/*__{token}__*/', text)
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print(f'Built {ROOT / "index.html"}: {len(html.encode("utf-8")):,} bytes')
