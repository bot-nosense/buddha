"""Optional Playwright smoke checks. --inline tests the single-file build without
verifying file/HTTP loading. Install Playwright separately; no runtime dependency.
"""
import argparse, importlib.util, json, struct
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
a=argparse.ArgumentParser(description=__doc__)
a.add_argument('--chromium',default='/usr/bin/chromium');a.add_argument('--inline',action='store_true');a.add_argument('--headed',action='store_true');a.add_argument('--software-gl',action='store_true');a.add_argument('--output',type=Path,default=ROOT/'qa-artifacts')
args=a.parse_args();args.output.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];requests=[]
report={'mode':'inline single-file build' if args.inline else 'file navigation','checks':checks,'errors':errors,'externalRequests':requests}
def check(name,ok):
    checks.append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    assert ok,name
def diag(p):return p.evaluate('DaiDien.getDiagnostics()')
def state(p):return p.evaluate('DaiDien.getState()')
def load(p):
    p.on('pageerror',lambda e:errors.append(str(e)))
    p.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
    if args.inline:p.set_content(builder.build())
    else:p.goto((ROOT/'index.html').as_uri())
    p.wait_for_function("window.DaiDien || !document.getElementById('reloadBtn').hidden",timeout=25000)
    assert p.evaluate('!!window.DaiDien'),p.locator('#splashMessage').inner_text()
def enter(p):p.click('#startBtn');p.evaluate('document.exitPointerLock?.()');p.wait_for_timeout(250)
try:
 with sync_playwright() as pw:
    flags=['--no-sandbox']+(['--use-angle=gl','--ignore-gpu-blocklist'] if args.software_gl else [])
    b=pw.chromium.launch(executable_path=args.chromium,headless=not args.headed,args=flags);report['browser']=b.version
    c=b.new_context(viewport={'width':1280,'height':800},accept_downloads=True);p=c.new_page();load(p)
    report['gpu']=p.evaluate("()=>{let g=document.querySelector('#scene').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)}")
    check('Boot WebGL2 / 30 FPS target',diag(p)['webglError']==0 and diag(p)['targetFPS']==30)
    check('No autoplay before entry',diag(p)['audio']['state']=='not-started');p.screenshot(path=str(args.output/'welcome.png'))
    p.uncheck('#welcomeSound');enter(p);check('Audio opt-out works',state(p)['started'] and diag(p)['audio']['state']=='not-started')
    z=state(p)['z'];p.keyboard.down('KeyW');p.wait_for_timeout(800);p.keyboard.up('KeyW');p.wait_for_timeout(400);check('WASD moves camera',state(p)['z']<z-.1)
    p.wait_for_function('DaiDien.getDiagnostics().walkingSpeed < .0001',timeout=10000);z=state(p)['z'];p.wait_for_timeout(350);check('No stuck input after release',abs(state(p)['z']-z)<.002)
    p.click('#settingsBtn');p.check('#soundToggle');p.wait_for_timeout(300);check('Audio can be enabled after entry',diag(p)['audio']['state']=='running')
    p.click('[data-fps="60"]');check('60 FPS selectable',diag(p)['targetFPS']==60)
    p.click('[data-fps="30"]');p.click('[data-quality="low"]');check('Quality changes buffer',diag(p)['quality']=='low')
    check('Modal isolates background',p.evaluate("document.getElementById('chrome').inert && document.getElementById('scene').inert"))
    p.keyboard.press('Escape');check('Escape closes modal',p.locator('#settingsPanel').is_hidden())
    p.evaluate("DaiDien.goTo('contemplate')");p.wait_for_timeout(300);p.click('#interactBtn');p.wait_for_timeout(300)
    check('Offering creates bounded smoke',state(p)['incense'] and diag(p)['smokeParticles']==48 and diag(p)['webglError']==0)
    p.keyboard.press('KeyE');check('Offering cannot be spammed',p.locator('#interactBtn').is_disabled())
    check('Hint does not overlap ritual prompt',p.locator('#hint').is_hidden())
    p.click('#quietBtn');z=state(p)['z'];p.keyboard.down('KeyW');p.wait_for_timeout(300);p.keyboard.up('KeyW');check('Quiet mode holds position',state(p)['quiet'] and state(p)['z']==z and p.locator('#unhideBtn').is_visible())
    p.keyboard.press('Escape');check('Quiet mode can be exited',not state(p)['quiet'])
    p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(600);check('Reduced motion disables smoke',diag(p)['smokeParticles']==0 and state(p)['incense'])
    frames=diag(p)['renderedFrames'];p.wait_for_timeout(350);check('Static view avoids redraws',diag(p)['renderedFrames']==frames)
    p.click('#bellBtn');p.wait_for_timeout(200);check('Bell creates audio voices',diag(p)['audio']['voices']>0)
    p.screenshot(path=str(args.output/'contemplate.png'))
    with p.expect_download(timeout=30000) as result:p.click('#photoBtn')
    image=args.output/'capture.png';result.value.save_as(str(image));data=image.read_bytes();check('4K PNG export',data[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24])==(3840,2160))
    p.wait_for_function("!document.getElementById('photoBtn').disabled");check('Photo restores interactive buffer',diag(p)['buffer']!=[3840,2160])
    p.click('#exitBtn');check('Exit resets incense and audio',not state(p)['started'] and not state(p)['incense'] and diag(p)['audio']['state']=='not-started' and diag(p)['audio']['voices']==0)
    enter(p);p.evaluate("DaiDien.goTo('contemplate')");p.wait_for_timeout(300);p.click('#interactBtn');check('Re-entry permits fresh offering',state(p)['incense'] and diag(p)['audio']['state']=='running');c.close()
    c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1);p=c.new_page();load(p);enter(p)
    check('Mobile touch controls and low preset',p.locator('#touchpad').is_visible() and diag(p)['quality']=='low')
    session=c.new_cdp_session(p);r=p.locator('#touchpad').bounding_box();z=state(p)['z'];x=r['x']+52;y=r['y']+52
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-30}]});p.wait_for_timeout(650);session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});check('Touch joystick moves camera',state(p)['z']<z-.1)
    yaw=state(p)['yaw'];session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':300,'y':330}]});session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':250,'y':330}]});session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});check('Touch dragging changes view',abs(state(p)['yaw']-yaw)>.05)
    p.screenshot(path=str(args.output/'mobile-portrait.png'));p.set_viewport_size({'width':844,'height':390});p.wait_for_timeout(350);r=p.locator('.dock').bounding_box();check('Landscape UI fits viewport',r['x']>=0 and r['y']>=0 and r['x']+r['width']<=845 and r['y']+r['height']<=391);p.screenshot(path=str(args.output/'mobile-landscape.png'))
    p.evaluate("document.getElementById('scene').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");p.wait_for_function("!document.getElementById('reloadBtn').hidden");check('GPU loss presents reload recovery',p.locator('#splash').is_visible() and diag(p)['audio']['state']=='not-started')
    check('No uncaught JavaScript errors',not errors);check('No external runtime requests',not requests);c.close();b.close()
finally:
 report['passed']=sum(x['passed'] for x in checks);report['failed']=sum(not x['passed'] for x in checks)
 report['limitations']=['Not a real Mac/Safari/iPhone/Android test or hardware FPS benchmark.','Audio graph tested, not subjective listening quality.']
 if args.inline:report['limitations'].append('File/HTTP loading, native localStorage persistence and hosting not verified in inline mode.')
 (args.output/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
