/* Interaction layer. No network calls, external assets, build tools or backend required. */
'use strict';
(() => {
  const $=id=>document.getElementById(id),canvas=$('scene');
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initiallyTouch=matchMedia('(pointer:coarse)').matches;
  const defaults={quality:initiallyTouch?'low':'balanced',fov:initiallyTouch?70:62,sensitivity:1,light:'day',shadows:true,touch:initiallyTouch};
  let settings={...defaults};
  try{const saved=JSON.parse(localStorage.getItem('dai-dien-v1-settings')||'null');if(saved&&typeof saved==='object'){
    if(['low','balanced','sharp','ultra'].includes(saved.quality))settings.quality=saved.quality;
    if(Number.isFinite(saved.fov))settings.fov=clamp(saved.fov,45,85);
    if(Number.isFinite(saved.sensitivity))settings.sensitivity=clamp(saved.sensitivity,.4,1.8);
    if(['day','warm'].includes(saved.light))settings.light=saved.light;
    if(typeof saved.shadows==='boolean')settings.shadows=saved.shadows;
    if(typeof saved.touch==='boolean')settings.touch=initiallyTouch||saved.touch;
  }}catch(_){}
  const state={x:0,y:1.65,z:6.55,yaw:0,pitch:.16,started:false,dirty:true,panel:null,capturing:false,lost:false,moving:false};
  const keys=new Set();let hall,renderer,last=performance.now(),toastTimer,hideHintTimer,drag=null,joy=null,joyVec=[0,0],lastMap=0,audioCtx=null,lastBell=-10000,transitionTimer;
  const pose={entrance:{p:[0,1.65,6.55],t:[0,3.42,-4.15],label:'Lối vào đại điện'},contemplate:{p:[0,1.65,.6],t:[0,3.35,-4.15],label:'Phía trước tượng Phật'},rear:{p:[0,1.65,-7.12],t:[0,3.05,-4.15],label:'Lối phía sau tượng'}};
  function toast(text,ms=3800){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),ms);}
  function save(){try{localStorage.setItem('dai-dien-v1-settings',JSON.stringify(settings));}catch(_){} }
  function fail(err){console.error(err);state.lost=true;$('splash').hidden=false;$('splashTitle').textContent='Chưa mở được đại điện';$('splashMessage').textContent=err.message||String(err);$('loaderLine').hidden=true;$('reloadBtn').hidden=false;}
  $('reloadBtn').addEventListener('click',()=>location.reload());
  function view(){const c=Math.cos(state.pitch);return [state.x+Math.sin(state.yaw)*c,state.y+Math.sin(state.pitch),state.z-Math.cos(state.yaw)*c];}
  function render(){if(renderer&&!state.lost){renderer.render([state.x,state.y,state.z],view(),settings.fov);state.dirty=false;}}
  function resolution(){
    if(!renderer||state.capturing)return;
    const w=innerWidth,h=innerHeight,dpr=devicePixelRatio||1;
    let scale;
    if(settings.quality==='low')scale=Math.min(1,Math.sqrt(1280*720/(w*h)));
    else if(settings.quality==='balanced')scale=Math.min(dpr,1.5,Math.sqrt(2560*1440/(w*h)));
    else if(settings.quality==='sharp')scale=Math.min(Math.max(dpr,1.5),2,Math.sqrt(3200*1800/(w*h)));
    else scale=Math.min(3840/Math.max(w,h),Math.sqrt(3840*2160/(w*h)),4);
    const gl=renderer.gl,max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    scale=Math.min(scale,max/w,max/h);
    renderer.resize(Math.max(1,Math.floor(w*scale)),Math.max(1,Math.floor(h*scale)));state.dirty=true;
    const names={low:'Nhẹ',balanced:'Cân bằng',sharp:'Sắc nét',ultra:'4K'};
    $('resolutionLabel').textContent=`${canvas.width.toLocaleString('vi-VN')} × ${canvas.height.toLocaleString('vi-VN')} px · ${names[settings.quality]}`;
    $('qualityDetail').textContent=`Khung hình hiện tại: ${canvas.width} × ${canvas.height} px. ${settings.quality==='ultra'?'Giữ đúng tỷ lệ màn hình; cạnh dài tối đa 3840 px.':'Đổi mức cao hơn khi cần xem chi tiết.'}`;
  }
  function syncSettings(){
    document.querySelectorAll('[data-quality]').forEach(b=>{b.classList.toggle('selected',b.dataset.quality===settings.quality);b.setAttribute('aria-pressed',String(b.dataset.quality===settings.quality));});
    $('lightSelect').value=settings.light;$('fov').value=settings.fov;$('fovOut').value=`${settings.fov}°`;
    $('sensitivity').value=settings.sensitivity;$('sensitivityOut').value=settings.sensitivity.toFixed(1).replace('.',',')+'×';
    $('shadowToggle').checked=settings.shadows;$('touchToggle').checked=settings.touch;document.body.classList.toggle('touch-controls',settings.touch);
    if(renderer){renderer.warm=settings.light==='warm'?.65:0;renderer.exposure=settings.light==='warm'?.98:1.04;renderer.shadowOn=settings.shadows;state.dirty=true;}
  }
  function release(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function requestLock(){
    if(settings.touch||state.panel||!canvas.requestPointerLock)return;
    try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{toast('Kéo chuột để nhìn quanh; WASD vẫn dùng để di chuyển.');});}catch(_){toast('Kéo chuột để nhìn quanh; WASD vẫn dùng để di chuyển.');}
  }
  function closePanels(){state.panel=null;$('settingsPanel').hidden=true;$('infoPanel').hidden=true;$('settingsBtn').setAttribute('aria-expanded','false');$('infoBtn').setAttribute('aria-expanded','false');keys.clear();}
  function togglePanel(id){
    const was=state.panel===id;closePanels();if(was)return;
    release();state.panel=id;$(id+'Panel').hidden=false;$(id+'Btn').setAttribute('aria-expanded','true');$(id+'Panel').querySelector('button').focus();resetTouch();
  }
  function start(lock=true){
    if(state.lost||!renderer)return;
    closePanels();state.started=true;document.body.classList.add('started');$('welcome').hidden=true;$('hint').hidden=false;
    clearTimeout(hideHintTimer);hideHintTimer=setTimeout(()=>$('hint').hidden=true,14000);
    if(lock)requestLock();canvas.focus({preventScroll:true});state.dirty=true;
  }
  function setPose(which,animate=true){
    if(!renderer||state.capturing||state.lost)return;
    start(false);release();keys.clear();resetTouch();
    const target=pose[which];
    function move(){
      const [x,y,z]=target.p,[tx,ty,tz]=target.t;Object.assign(state,{x,y,z,yaw:Math.atan2(tx-x,-(tz-z)),pitch:Math.atan2(ty-y,Math.hypot(tx-x,tz-z)),dirty:true});
      $('locationLabel').textContent=target.label;setActive(which==='contemplate'?'contemplateBtn':which==='rear'?'rearBtn':'homeBtn');drawMap();render();
      $('fade').classList.remove('on');
    }
    clearTimeout(transitionTimer);
    if(animate&&!reduceMotion){$('fade').classList.add('on');transitionTimer=setTimeout(move,140);}else move();
  }
  function setActive(id){for(const b of ['walkBtn','contemplateBtn','rearBtn','homeBtn'])$(b).classList.toggle('active',b===id);}
  function circleRect(x,z,cx,cz,hx,hz,r){const dx=x-clamp(x,cx-hx,cx+hx),dz=z-clamp(z,cz-hz,cz+hz);return dx*dx+dz*dz<r*r;}
  function walkable(x,z){
    const r=.23;
    if(Math.abs(x)>6.25-r||Math.abs(z)>8-r)return false;
    if(circleRect(x,z,0,-3.9,3,2.5,r))return false;
    if(circleRect(x,z,0,-1.24,1.8,.225,r))return false;
    for(const [cx,cz]of hall.columns)if(circleRect(x,z,cx,cz,.415,.415,r))return false;
    for(const b of hall.benches)if(circleRect(x,z,b.x,b.z,b.hx,b.hz,r))return false;
    for(const cx of [-3.6,3.6])if(Math.hypot(x-cx,z+1.15)<r+.32)return false;
    return true;
  }
  function move(dt){
    if(!state.started||state.panel||state.capturing||state.lost||document.hidden)return;
    const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joyVec[1];
    const right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joyVec[0];
    const len=Math.hypot(forward,right);if(len<.035){state.moving=false;return;}
    const norm=Math.max(1,len),speed=(keys.has('ShiftLeft')||keys.has('ShiftRight'))?2.25:1.50;
    const dx=(Math.sin(state.yaw)*forward+Math.cos(state.yaw)*right)/norm*speed*dt;
    const dz=(-Math.cos(state.yaw)*forward+Math.sin(state.yaw)*right)/norm*speed*dt;
    // Axis-separated collision resolution permits sliding, with substeps to avoid tunnelling.
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
    for(let i=0;i<n;i++){if(walkable(state.x+dx/n,state.z))state.x+=dx/n;if(walkable(state.x,state.z+dz/n))state.z+=dz/n;}
    state.dirty=true;state.moving=true;setActive('walkBtn');
  }
  function aim(dx,dy){state.yaw+=dx*.0022*settings.sensitivity;state.pitch=clamp(state.pitch-dy*.0022*settings.sensitivity,-1.32,1.40);state.dirty=true;}
  function drawMap(){
    if($('mapWrap').classList.contains('collapsed'))return;
    const c=$('minimap'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
    const x0=24,y0=14,ww=212,hh=271;
    const pos=(x,z)=>[x0+(x+6.25)/12.5*ww,y0+(z+8)/16*hh];
    ctx.strokeStyle='#a9997d';ctx.lineWidth=1.8;ctx.beginPath();ctx.roundRect(x0,y0,ww,hh,8);ctx.stroke();
    const [ax,az]=pos(-3,-6.4),[bx,bz]=pos(3,-1.4);ctx.fillStyle='#d6c7aa';ctx.strokeStyle='#b8a586';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(ax,az,bx-ax,bz-az,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#9a8158';ctx.font='11px -apple-system,Arial';ctx.textAlign='center';ctx.fillText('TƯỢNG PHẬT',130,(az+bz)/2+4);
    for(const [x,z]of hall.columns){const [px,py]=pos(x,z);ctx.beginPath();ctx.arc(px,py,3.5,0,Math.PI*2);ctx.fillStyle='#b6a384';ctx.fill();}
    ctx.strokeStyle='#e9e1d0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(109,y0+hh);ctx.lineTo(151,y0+hh);ctx.stroke();
    ctx.fillStyle='#a28d6d';ctx.font='10px Arial';ctx.fillText('LỐI VÀO',130,307);
    const [px,py]=pos(state.x,state.z);
    ctx.save();ctx.translate(px,py);ctx.rotate(state.yaw);ctx.fillStyle='#b3935840';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,24,-Math.PI/2-.40,-Math.PI/2+.40);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle='#866a37';ctx.strokeStyle='#fff9ec';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,4.7,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  function tick(now){
    const dt=Math.min((now-last)/1000,.055);last=now;move(dt);
    if(!document.hidden&&!state.capturing){if(state.dirty)render();if(now-lastMap>120){drawMap();lastMap=now;
      if(state.started){const front=state.z<.9&&state.z>-1.3&&Math.abs(state.x)<3.2;$('nearLabel').hidden=!front;
        if(state.moving)$('locationLabel').textContent=state.z<-6.65?'Lối phía sau tượng':Math.abs(state.x)>3.3&&state.z<-.8?'Lối bên tượng Phật':state.z<1.2?'Phía trước tượng Phật':'Trong đại điện';}
    }}requestAnimationFrame(tick);
  }
  async function capture(){
    if(!renderer||state.capturing||state.lost)return;
    const gl=renderer.gl,max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);if(max<3840){toast('GPU này không hỗ trợ bộ đệm ảnh rộng 3840 px.');return;}
    release();keys.clear();resetTouch();state.capturing=true;$('photoBtn').disabled=true;toast('Đang tạo ảnh 4K…',20000);
    // Allow UI update before the one-off high-resolution render.
    await new Promise(resolve=>setTimeout(resolve,50));
    const old=[canvas.width,canvas.height];
    try{
      renderer.resize(3840,2160);renderer.render([state.x,state.y,state.z],view(),settings.fov);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Không tạo được ảnh PNG.')),'image/png'));
      const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='dai-dien-4k-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.png';a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      toast('Đã tạo ảnh PNG 3840 × 2160, không kèm giao diện.');
    }catch(err){toast('Chụp ảnh thất bại: '+err.message);console.error(err);}
    finally{renderer.resize(...old);state.capturing=false;$('photoBtn').disabled=false;resolution();render();}
  }
  async function bell(){
    const now=performance.now();if(now-lastBell<1500){toast('Tiếng chuông vẫn đang ngân.');return;}lastBell=now;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Trình duyệt không hỗ trợ âm thanh.');
      if(!audioCtx)audioCtx=new AC();await audioCtx.resume();
      const t=audioCtx.currentTime;const gain=audioCtx.createGain();gain.gain.value=.15;gain.connect(audioCtx.destination);
      const partials=[[220,.26,8],[440.2,.16,6.5],[577.5,.1,5],[873,.06,3.5],[1195,.035,2.5]];let pending=partials.length;
      for(const [freq,level,duration]of partials){const osc=audioCtx.createOscillator(),env=audioCtx.createGain();osc.type='sine';osc.frequency.value=freq;env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(level,t+.018);env.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(env);env.connect(gain);osc.start(t);osc.stop(t+duration+.1);osc.onended=()=>{osc.disconnect();env.disconnect();if(--pending===0)gain.disconnect();};}
      toast('Một tiếng chuông. Một khoảng lặng.',2500);
    }catch(err){toast(err.message);}
  }
  function resetTouch(){joy=null;joyVec=[0,0];$('stick').style.transform='translate(0,0)';drag=null;}
  function bind(){
    $('startBtn').addEventListener('click',()=>start(true));$('walkBtn').addEventListener('click',()=>{start(true);setActive('walkBtn');});
    $('contemplateBtn').addEventListener('click',()=>setPose('contemplate'));$('rearBtn').addEventListener('click',()=>setPose('rear'));$('homeBtn').addEventListener('click',()=>setPose('entrance'));$('photoBtn').addEventListener('click',capture);
    $('settingsBtn').addEventListener('click',()=>togglePanel('settings'));$('infoBtn').addEventListener('click',()=>togglePanel('info'));$('bellBtn').addEventListener('click',bell);
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{const id=state.panel;closePanels();if(id)$(id+'Btn').focus();}));
    $('unhideBtn').addEventListener('click',()=>document.body.classList.remove('ui-hidden'));
    $('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Trình duyệt này chưa hỗ trợ toàn màn hình.');}catch(_){toast('Không thể mở toàn màn hình trong trình xem hiện tại.');}});
    $('mapHead').addEventListener('click',()=>{const c=$('mapWrap').classList.toggle('collapsed');$('mapToggle').setAttribute('aria-expanded',String(!c));$('mapToggle').setAttribute('aria-label',c?'Mở bản đồ':'Thu gọn bản đồ');drawMap();});
    document.querySelectorAll('[data-quality]').forEach(b=>b.addEventListener('click',()=>{settings.quality=b.dataset.quality;syncSettings();resolution();save();}));
    $('lightSelect').addEventListener('change',e=>{settings.light=e.target.value;syncSettings();save();});
    $('fov').addEventListener('input',e=>{settings.fov=Number(e.target.value);syncSettings();save();});
    $('sensitivity').addEventListener('input',e=>{settings.sensitivity=Number(e.target.value);syncSettings();save();});
    $('shadowToggle').addEventListener('change',e=>{settings.shadows=e.target.checked;syncSettings();save();});
    $('touchToggle').addEventListener('change',e=>{settings.touch=e.target.checked;release();resetTouch();syncSettings();save();});
    document.addEventListener('pointerlockchange',()=>{document.body.classList.toggle('locked',document.pointerLockElement===canvas);keys.clear();if(document.pointerLockElement!==canvas&&state.started){$('hint').hidden=false;clearTimeout(hideHintTimer);hideHintTimer=setTimeout(()=>$('hint').hidden=true,10000);}});
    document.addEventListener('pointerlockerror',()=>toast('Dùng cách kéo chuột để nhìn quanh.'));
    document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!state.panel&&!state.capturing)aim(e.movementX,e.movementY);});
    canvas.addEventListener('pointerdown',e=>{
      if(state.panel){closePanels();return;}if(!renderer||state.capturing)return;
      if(!state.started)start(false);
      if(document.pointerLockElement===canvas)return;
      if(e.pointerType==='mouse'&&e.button!==0)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});e.preventDefault();
    });
    canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId&&!state.panel){const mult=e.pointerType==='touch'?1.5:1;aim((e.clientX-drag.x)*mult,(e.clientY-drag.y)*mult);drag.x=e.clientX;drag.y=e.clientY;}});
    const endDrag=e=>{if(drag&&drag.id===e.pointerId)drag=null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const pad=$('touchpad');
    const updateJoy=e=>{const r=pad.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.31,d=Math.max(max,Math.hypot(dx,dy));joyVec=[dx/d,dy/d];$('stick').style.transform=`translate(${joyVec[0]*max}px,${joyVec[1]*max}px)`;};
    pad.addEventListener('pointerdown',e=>{if(joy!==null)return;joy=e.pointerId;pad.setPointerCapture(e.pointerId);updateJoy(e);e.preventDefault();});
    pad.addEventListener('pointermove',e=>{if(joy===e.pointerId){updateJoy(e);e.preventDefault();}});
    const endJoy=e=>{if(joy===e.pointerId){joy=null;joyVec=[0,0];$('stick').style.transform='translate(0,0)';}};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>pad.addEventListener(ev,endJoy));
    document.addEventListener('keydown',e=>{
      if(e.code==='Escape'){closePanels();keys.clear();return;}
      if(state.panel){
        if(e.code==='Tab'){const els=[...$(state.panel+'Panel').querySelectorAll('button,input,select')].filter(x=>!x.disabled);const first=els[0],lastEl=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastEl.focus();}else if(!e.shiftKey&&document.activeElement===lastEl){e.preventDefault();first.focus();}}return;
      }
      if(e.target.matches('input,select,textarea'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){
        e.preventDefault();if(!state.started)start(false);keys.add(e.code);return;
      }
      if(e.repeat)return;
      if(e.code==='KeyR'){e.preventDefault();setPose('entrance');}else if(e.code==='KeyP'){e.preventDefault();capture();}
      else if(e.code==='KeyH'){e.preventDefault();release();document.body.classList.toggle('ui-hidden');}
      else if(e.code==='KeyB'){e.preventDefault();bell();}
    });
    document.addEventListener('keyup',e=>keys.delete(e.code));
    window.addEventListener('blur',()=>{keys.clear();resetTouch();});
    document.addEventListener('visibilitychange',()=>{keys.clear();resetTouch();last=performance.now();if(!document.hidden)state.dirty=true;else if(audioCtx)audioCtx.suspend();});
    window.addEventListener('resize',resolution);document.addEventListener('fullscreenchange',resolution);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();release();keys.clear();fail(new Error('Kết nối GPU bị gián đoạn. Hãy tải lại trang; chọn mức “Nhẹ” khi cần.'));});
    canvas.addEventListener('webglcontextrestored',()=>{$('splashMessage').textContent='GPU đã sẵn sàng. Bấm “Tải lại trang” để dựng lại không gian.';});
  }
  async function boot(){
    try{
      // Two paint opportunities let the loading state appear before geometry generation.
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      hall=buildHall();renderer=new G.Renderer(canvas,hall.batches);syncSettings();resolution();bind();
      if(initiallyTouch){$('mapWrap').classList.add('collapsed');$('mapToggle').setAttribute('aria-expanded','false');$('mapToggle').setAttribute('aria-label','Mở bản đồ');}
      render();drawMap();$('splash').hidden=true;
      window.DaiDien=Object.freeze({version:'1.0.0',getState:()=>({x:state.x,y:state.y,z:state.z,yaw:state.yaw,pitch:state.pitch,started:state.started}),getDiagnostics:()=>({triangles:renderer.triangles,drawCalls:hall.batches.length,buffer:[canvas.width,canvas.height],webglError:renderer.gl.getError(),quality:settings.quality,networkDependencies:0}),isWalkable:(x,z)=>walkable(x,z),reset:()=>setPose('entrance',false),goTo:(id)=>{if(Object.hasOwn(pose,id))setPose(id,false);}});
      requestAnimationFrame(tick);
    }catch(err){fail(err);}
  }
  boot();
})();
