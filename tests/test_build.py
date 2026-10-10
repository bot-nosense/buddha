"""Static/build checks; Python standard library only."""
import importlib.util
import re
import unittest
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'build.py')
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class Elements(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.local=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        if tag=='script' and 'src' in attrs:self.local.append(attrs['src'])
        if tag=='link' and attrs.get('rel')=='stylesheet':self.local.append(attrs['href'])

class BuildTests(unittest.TestCase):
    def setUp(self):self.html=(ROOT/'index.html').read_text();self.dom=Elements(self.html)
    def test_unique_ids(self):self.assertEqual(len(self.dom.ids),len(set(self.dom.ids)))
    def test_static_references_are_local_existing_files(self):
        self.assertEqual(len(self.dom.local),7)
        for ref in self.dom.local:self.assertTrue(ref.startswith('src/') and (ROOT/ref).is_file())
    def test_literal_app_ids_exist(self):
        app=(ROOT/'src/app.js').read_text()
        for id in re.findall(r"\$\('([\w-]+)'\)",app):self.assertIn(id,self.dom.ids)
    def test_dynamic_settings_ids_exist(self):
        for key in ['fov','sensitivity','speed','volume','ambience']:
            self.assertIn(key,self.dom.ids);self.assertIn(key+'Out',self.dom.ids)
        for key in ['shadows','touch','sound','footsteps','smoke']:self.assertIn(key+'Toggle',self.dom.ids)
    def test_single_file_is_deterministic_and_self_contained(self):
        a=builder.build();self.assertEqual(a,builder.build());self.assertEqual(Elements(a).local,[])
        self.assertIn('class TempleRitual',a);self.assertIn('const DaiDienCore',a)
    def test_no_runtime_external_requests(self):
        for js in (ROOT/'src').glob('*.js'):
            code=js.read_text()
            self.assertNotRegex(code,r'\b(fetch|XMLHttpRequest|WebSocket)\s*\(')
    def test_engine_and_script_order(self):
        self.assertEqual(self.dom.local[1:],[f'src/{n}.js' for n in builder.ASSETS])

if __name__=='__main__':unittest.main()
