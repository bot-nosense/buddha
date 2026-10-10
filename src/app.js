/* Đại điện 1.1 — enter, offer incense, contemplate, leave. No objectives or scores. */
'use strict';
(() => {
  const $=id=>document.getElementById(id), canvas=$('scene'), Core=DaiDienCore;
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const touch=matchMedia('(pointer:coarse)').matches, storageKey='dai-dien-v1.1-settings';
  let saved=null;
  try { saved=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('dai-dien-v1-settings')||'null'); } catch(_) {}
  const settings=Core.settings(saved,touch), audio=new TempleAudio(), gate=new Core.FrameGate(settings.fps);
  const state={x:0,y:1.65,z:6.55,yaw:0,pitch:.16,vx:0,vz:0,started:false,quiet:false,
    dirty:true,panel:null,capturing:false,lost:false,transition:false,moving:false};
  const poses={
    entrance:{p:[0,1.65,6.55],t:[0,3.42,-4.15],label:'Lối vào đại điện'},
    contemplate:{p:[0,1.65,.24],t:[0,2.70,-4.15],label:'Phía trước tượng Phật'},
    rear:{p:[0,1.65,-7.12],t:[0,3.05,-4.15],label:'Lối phía sau tượng'}
  };
  const keys=new Set();let hall,renderer,ritual,drag=null,joy=null,joyVec=[0,0];
  let last=performance.now(),lastHUD=0,frames=0,stepDistance=0,poseTimer,toastTimer,hintTimer,returnFocus;
  const smokeEnabled=()=>settings.smoke&&!motionQuery.matches;
  const canControl=()=>state.started&&!state.panel&&!state.capturing&&!state.lost&&!state.transition&&!document.hidden;
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch(_){} }
  function toast(message,ms=3500){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),ms);}
  function soundError(error){toast(error.message||'Âm thanh chưa sẵn sàng. Có thể tiếp tục không âm thanh.');}
  function startSound(){audio.start(settings).then(()=>audio.listener(state)).catch(soundError);}
  function release(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function resetInput(){keys.clear();joy=null;joyVec=[0,0];drag=null;state.vx=state.vz=0;state.moving=false;stepDistance=0;$('stick').style.transform='translate(0,0)';}
  function cancelTransition(){clearTimeout(poseTimer);state.transition=false;$('fade').classList.remove('on');}
  function requestLock(){
    if(settings.touch||!canControl()||state.quiet||!canvas.requestPointerLock)return;
    try{const result=canvas.requestPointerLock();if(result?.catch)result.catch(()=>toast('Giữ chuột trái và kéo để nhìn; WASD để đi lại.'));}
    catch(_){toast('Giữ chuột trái và kéo để nhìn; WASD để đi lại.');}
  }
  function view(){const c=Math.cos(state.pitch);return [state.x+Math.sin(state.yaw)*c,state.y+Math.sin(state.pitch),state.z-Math.cos(state.yaw)*c];}
  function render(){
    if(!renderer||state.lost)return;
    const eye=[state.x,state.y,state.z], target=view();renderer.render(eye,target,settings.fov);
    ritual.draw(eye,target,settings.fov,canvas.width,canvas.height,smokeEnabled());state.dirty=false;frames++;
  }
  function resolution(){
    if(!renderer||state.capturing||state.lost)return;
    const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),dpr=devicePixelRatio||1;
    let scale;
    if(settings.quality==='low')scale=Math.min(1,Math.sqrt(1280*720/(w*h)));
    else if(settings.quality==='balanced')scale=Math.min(dpr,1.5,Math.sqrt(2560*1440/(w*h)));
    else if(settings.quality==='sharp')scale=Math.min(Math.max(dpr,1.5),2,Math.sqrt(3200*1800/(w*h)));
    else scale=Math.min(3840/Math.max(w,h),Math.sqrt(3840*2160/(w*h)),4);
    const gl=renderer.gl,max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);scale=Math.min(scale,max/w,max/h);
    renderer.resize(Math.max(1,Math.floor(w*scale)),Math.max(1,Math.floor(h*scale)));state.dirty=true;
    $('qualityDetail').textContent=`${canvas.width} × ${canvas.height} px thực tế. 4K không đồng nghĩa vật liệu hay mô hình đã chân thực.`;
    $('resolutionLabel').textContent=`${canvas.width} × ${canvas.height} · mục tiêu ${settings.fps} FPS`;
  }
  function syncSettings(){
    for(const key of ['quality','fps'])document.querySelectorAll(`[data-${key}]`).forEach(b=>{const selected=b.dataset[key]===String(settings[key]);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    for(const key of ['fov','sensitivity','speed','volume','ambience']){
      $(key).value=settings[key];$(key+'Out').value=key==='fov'?`${settings[key]}°`:key==='speed'?`${settings[key].toFixed(2)} m/s`:key==='sensitivity'?`${settings[key].toFixed(1)}×`:`${Math.round(settings[key]*100)}%`;
    }
    for(const key of ['shadows','touch','sound','footsteps','smoke'])$(key+'Toggle').checked=settings[key];
    $('welcomeSound').checked=settings.sound;$('lightSelect').value=settings.light;
    document.body.classList.toggle('touch-controls',settings.touch);
    $('motionNote').hidden=!motionQuery.matches;
    if(renderer){renderer.warm=settings.light==='warm'?.65:0;renderer.exposure=settings.light==='warm'?.98:1.04;renderer.shadowOn=settings.shadows;}
    audio.apply(settings);state.dirty=true;
  }
  function setQuiet(enabled){
    if(!state.started)return;cancelTransition();closePanels();release();resetInput();state.quiet=enabled;
    document.body.classList.toggle('ui-hidden',enabled);
    $('quietBtn').setAttribute('aria-pressed',String(enabled));
    if(enabled)$('unhideBtn').focus();else canvas.focus({preventScroll:true});
  }
  function closePanels(restoreFocus=false){
    const was=state.panel;state.panel=null;
    for(const id of ['settings','info']){$(id+'Panel').hidden=true;$(id+'Btn').setAttribute('aria-expanded','false');}
    $('backdrop').hidden=true;$('chrome').inert=false;canvas.inert=false;resetInput();
    if(restoreFocus&&was&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  }
  function togglePanel(id){
    if(state.capturing||state.lost)return;
    const was=state.panel===id;closePanels();if(was)return;
    cancelTransition();release();returnFocus=document.activeElement;state.panel=id;
    $('chrome').inert=true;canvas.inert=true;$('backdrop').hidden=false;
    $(id+'Panel').hidden=false;$(id+'Btn').setAttribute('aria-expanded','true');
    $(id+'Panel').querySelector('button').focus();
  }
  function enter(lock=true){
    if(!renderer||state.lost||state.capturing)return;
    closePanels();state.started=true;document.body.classList.add('started');$('welcome').hidden=true;
    startSound();if(lock)requestLock();canvas.focus({preventScroll:true});state.dirty=true;
    $('hint').hidden=false;clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('hint').hidden=true,9000);
  }
  function applyPose(which){
    const {p:[x,y,z],t:[tx,ty,tz]}=poses[which];
    Object.assign(state,{x,y,z,yaw:Math.atan2(tx-x,-(tz-z)),pitch:Math.atan2(ty-y,Math.hypot(tx-x,tz-z)),dirty:true});
    $('locationLabel').textContent=poses[which].label;audio.listener(state);updateHUD();drawMap();
  }
  function setPose(which,animate=true){
    if(!state.started||!Object.hasOwn(poses,which)||state.capturing||state.lost)return;
    closePanels();setQuiet(false);cancelTransition();release();resetInput();
    const finish=()=>{applyPose(which);cancelTransition();canvas.focus({preventScroll:true});};
    if(animate&&!motionQuery.matches){state.transition=true;$('fade').classList.add('on');poseTimer=setTimeout(finish,150);}else finish();
  }
  function leave(){
    if(!state.started||state.capturing)return;
    closePanels();cancelTransition();release();resetInput();audio.reset();ritual.reset();
    state.started=false;state.quiet=false;document.body.classList.remove('started','ui-hidden');
    $('quietBtn').setAttribute('aria-pressed','false');$('welcome').hidden=false;
    $('welcomeNote').textContent='Bạn đã rời đại điện. Có thể trở lại bất cứ lúc nào.';
    $('hint').hidden=true;clearTimeout(hintTimer);clearTimeout(toastTimer);$('toast').classList.remove('show');
    applyPose('entrance');$('startBtn').focus();
  }
  function canExit(){return state.started&&state.z>6.3&&Math.abs(state.x)<2.5&&Math.cos(state.yaw)<-.55;}
  function interact(){
    if(!canControl()||state.quiet)return;
    if(canExit()){leave();return;}
    if(!Core.canOffer(state)){toast('Đến gần bàn hương và hướng nhìn về phía tượng.');return;}
    if(!ritual.offer()){toast('Hương đã được thắp trong lần chiêm bái này.');return;}
    resetInput();state.dirty=true;updateHUD();toast('Hương đã thắp. Bạn có thể dừng lại trong tĩnh lặng.',4500);
  }
  function updateHUD(){
    const near=state.started&&!state.panel&&!state.transition&&!state.quiet&&Core.canOffer(state),exit=canExit();
    if(near||exit)$('hint').hidden=true;
    $('ritualPrompt').hidden=!(near||exit)||!state.started||!!state.panel||state.quiet;
    $('interactBtn').disabled=near&&ritual.offered&&!exit;
    $('interactText').textContent=exit?'Rời đại điện':ritual.offered?'Hương đã thắp':'Thắp hương';
    $('ritualNote').textContent=exit?'Kết thúc lần chiêm bái này.':'Tương tác tượng trưng · không lưu hay tính điểm';
    if(state.moving)$('locationLabel').textContent=state.z<-6.65?'Lối phía sau tượng':Math.abs(state.x)>3.3&&state.z<-.8?'Lối bên tượng Phật':state.z<1.2?'Phía trước tượng Phật':'Trong đại điện';
  }
  function walkable(x,z){return Core.walkable(x,z,hall);}
  function move(dt){
    if(!canControl()||state.quiet)return;
    const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joyVec[1];
    const right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joyVec[0];
    const distance=Core.step(state,{forward:Math.abs(forward)<.035?0:forward,right:Math.abs(right)<.035?0:right},dt,settings.speed,walkable);
    state.moving=distance>.00001;
    if(state.moving){state.dirty=true;stepDistance+=distance;if(stepDistance>=.58){audio.footstep(state);stepDistance%=.58;}}
  }
  function aim(dx,dy){
    if(!canControl())return;
    state.yaw+=dx*.0022*settings.sensitivity;state.pitch=Core.clamp(state.pitch-dy*.0022*settings.sensitivity,-1.32,1.40);state.dirty=true;
  }
  function drawMap(){
    if($('mapWrap').classList.contains('collapsed'))return;
    const c=$('minimap'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
    const pos=(x,z)=>[20+(x+6.25)/12.5*180,12+(z+8)/16*228];
    ctx.strokeStyle='#a9997d';ctx.lineWidth=1.5;ctx.strokeRect(20,12,180,228);
    const [ax,az]=pos(-3,-6.4),[bx,bz]=pos(3,-1.4);ctx.fillStyle='#d6c7aa';ctx.fillRect(ax,az,bx-ax,bz-az);
    ctx.fillStyle='#786544';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('TƯỢNG PHẬT',110,(az+bz)/2+4);
    for(const [x,z]of hall.columns){const [px,py]=pos(x,z);ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();}
    const [px,py]=pos(state.x,state.z);ctx.save();ctx.translate(px,py);ctx.rotate(state.yaw);
    ctx.fillStyle='#b3935860';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,21,-Math.PI/2-.4,-Math.PI/2+.4);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle='#775c31';ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();
    ctx.fillText('LỐI VÀO',110,255);
  }
  function tick(now){
    const dt=Math.min(Math.max((now-last)/1000,0),.1);last=now;
    if(!document.hidden&&!state.lost&&!state.capturing){
      move(dt);
      if(state.started){const expired=ritual.update(dt);if(expired||ritual.lit&&smokeEnabled())state.dirty=true;}
      if(state.dirty&&gate.ready(now)){render();audio.listener(state);}
      if(now-lastHUD>160){updateHUD();drawMap();lastHUD=now;}
    }
    requestAnimationFrame(tick);
  }
  async function bell(){
    if(!state.started||state.lost)return;
    if(!settings.sound){toast('Âm thanh đang tắt. Bật trong cài đặt để nghe chuông.');return;}
    try{const ready=await audio.start(settings);audio.listener(state);if(!ready||!state.started||document.hidden)return;
      if(!audio.bell(Core.bellPosition))toast('Để tiếng chuông ngân thêm một chút.');
    }catch(error){soundError(error);}
  }
  async function capture(){
    if(!renderer||state.capturing||state.lost)return;
    if(renderer.gl.getParameter(renderer.gl.MAX_RENDERBUFFER_SIZE)<3840){toast('GPU chưa hỗ trợ khung hình rộng 3840 px.');return;}
    cancelTransition();release();resetInput();state.capturing=true;$('photoBtn').disabled=true;toast('Đang tạo ảnh 4K…',25000);
    await new Promise(r=>setTimeout(r,40));
    try{
      if(state.lost)throw new Error('Kết nối GPU bị gián đoạn.');
      renderer.resize(3840,2160);render();
      const blob=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Quá thời gian tạo ảnh.')),20000);canvas.toBlob(b=>{clearTimeout(timer);b?resolve(b):reject(new Error('Không tạo được PNG.'));},'image/png');});
      const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='dai-dien-4k-'+Date.now()+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      toast('Đã tạo PNG 3840 × 2160, không kèm giao diện.');
    }catch(error){toast('Chụp ảnh thất bại: '+error.message);}
    finally{state.capturing=false;$('photoBtn').disabled=false;resolution();render();last=performance.now();}
  }
  function fail(error){
    state.lost=true;cancelTransition();release();resetInput();audio.reset();
    $('splash').hidden=false;$('splashTitle').textContent='Chưa mở được đại điện';$('splashMessage').textContent=error.message||String(error);$('loaderLine').hidden=true;$('reloadBtn').hidden=false;
  }
  function bind(){
    $('startBtn').onclick=()=>enter(true);$('walkBtn').onclick=()=>{setQuiet(false);requestLock();canvas.focus();};
    $('contemplateBtn').onclick=()=>setPose('contemplate');$('rearBtn').onclick=()=>setPose('rear');$('homeBtn').onclick=()=>setPose('entrance');
    $('quietBtn').onclick=()=>setQuiet(true);$('unhideBtn').onclick=()=>setQuiet(false);$('exitBtn').onclick=leave;
    $('interactBtn').onclick=interact;$('bellBtn').onclick=bell;$('photoBtn').onclick=capture;
    $('settingsBtn').onclick=()=>togglePanel('settings');$('infoBtn').onclick=()=>togglePanel('info');
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closePanels(true));$('backdrop').onclick=()=>closePanels(true);
    $('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Trình duyệt chưa hỗ trợ toàn màn hình.');}catch(_){toast('Toàn màn hình chưa được cho phép.');}};
    $('mapToggle').onclick=()=>{const collapsed=$('mapWrap').classList.toggle('collapsed');$('mapToggle').setAttribute('aria-expanded',String(!collapsed));$('mapToggle').lastElementChild.textContent=collapsed?'＋':'−';drawMap();};
    for(const key of ['quality','fps'])document.querySelectorAll(`[data-${key}]`).forEach(b=>b.onclick=()=>{settings[key]=key==='fps'?Number(b.dataset[key]):b.dataset[key];gate.set(settings.fps);syncSettings();resolution();save();});
    for(const key of ['fov','sensitivity','speed','volume','ambience'])$(key).oninput=e=>{settings[key]=Number(e.target.value);syncSettings();save();};
    for(const key of ['shadows','touch','sound','footsteps','smoke'])$(key+'Toggle').onchange=e=>{
      settings[key]=e.target.checked;if(key==='touch'){release();resetInput();}syncSettings();save();
      if(key==='sound'){if(state.started&&settings.sound)startSound();else audio.pause();}
    };
    $('welcomeSound').onchange=e=>{settings.sound=e.target.checked;syncSettings();save();};
    $('lightSelect').onchange=e=>{settings.light=e.target.value;syncSettings();save();};
    document.addEventListener('pointerlockchange',()=>{document.body.classList.toggle('locked',document.pointerLockElement===canvas);resetInput();});
    document.addEventListener('pointerlockerror',()=>toast('Giữ chuột trái và kéo để nhìn quanh.'));
    document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)aim(e.movementX,e.movementY);});
    canvas.addEventListener('pointerdown',e=>{
      if(!canControl()||document.pointerLockElement===canvas||e.pointerType==='mouse'&&e.button!==0)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});e.preventDefault();
    });
    canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){const m=e.pointerType==='touch'?1.4:1;aim((e.clientX-drag.x)*m,(e.clientY-drag.y)*m);drag.x=e.clientX;drag.y=e.clientY;}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const pad=$('touchpad');
    const updateJoy=e=>{const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,max=r.width*.31,d=Math.max(max,Math.hypot(dx,dy));joyVec=[dx/d,dy/d];$('stick').style.transform=`translate(${joyVec[0]*max}px,${joyVec[1]*max}px)`;};
    pad.addEventListener('pointerdown',e=>{if(joy!==null||!canControl()||state.quiet)return;joy=e.pointerId;pad.setPointerCapture(e.pointerId);updateJoy(e);e.preventDefault();});
    pad.addEventListener('pointermove',e=>{if(joy===e.pointerId){updateJoy(e);e.preventDefault();}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(joy===e.pointerId){joy=null;joyVec=[0,0];$('stick').style.transform='translate(0,0)';}});
    document.addEventListener('keydown',e=>{
      if(e.code==='Escape'){if(state.panel)closePanels(true);else if(state.quiet)setQuiet(false);cancelTransition();resetInput();return;}
      if(state.panel){
        if(e.code==='Tab'){const els=[...$(state.panel+'Panel').querySelectorAll('button,input,select')].filter(x=>!x.disabled),first=els[0],end=els.at(-1);
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}
        return;
      }
      if(!state.started||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,select,textarea'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(canControl()&&!state.quiet)keys.add(e.code);return;}
      if(e.repeat||state.capturing)return;
      const actions={KeyE:interact,KeyB:bell,KeyR:()=>setPose('entrance'),KeyP:capture,KeyH:()=>setQuiet(!state.quiet)};
      if(actions[e.code]){e.preventDefault();actions[e.code]();}
    });
    document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',resetInput);
    document.addEventListener('visibilitychange',()=>{resetInput();last=performance.now();gate.set(settings.fps);if(document.hidden)audio.pause();else{state.dirty=true;if(state.started)audio.resume().catch(soundError);}});
    window.addEventListener('pagehide',()=>{resetInput();audio.reset();});
    window.addEventListener('pageshow',()=>{last=performance.now();state.dirty=true;if(state.started)audio.resume().catch(soundError);});
    window.addEventListener('resize',resolution);document.addEventListener('fullscreenchange',resolution);
    motionQuery.addEventListener('change',()=>{syncSettings();state.dirty=true;});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('Kết nối GPU bị gián đoạn. Tải lại trang; chọn mức Nhẹ khi cần.'));});
    canvas.addEventListener('webglcontextrestored',()=>{$('splashMessage').textContent='GPU đã sẵn sàng. Tải lại trang để dựng lại không gian.';});
  }
  $('reloadBtn').onclick=()=>location.reload();
  async function boot(){
    try{
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      hall=buildHall();TempleRitual.addBell(hall);renderer=new G.Renderer(canvas,hall.batches);ritual=new TempleRitual(renderer.gl);
      syncSettings();resolution();bind();render();$('splash').hidden=true;
      window.DaiDien=Object.freeze({version:'1.1.0',
        getState:()=>({x:state.x,y:state.y,z:state.z,yaw:state.yaw,pitch:state.pitch,started:state.started,quiet:state.quiet,incense:ritual.offered,incenseLit:ritual.lit}),
        getDiagnostics:()=>({triangles:renderer.triangles,drawCalls:hall.batches.length+(ritual.lit?1:0),buffer:[canvas.width,canvas.height],webglError:renderer.gl.getError(),quality:settings.quality,targetFPS:settings.fps,walkingSpeed:Math.hypot(state.vx,state.vz),renderedFrames:frames,externalNetworkDependencies:0,smokeParticles:ritual.lit&&smokeEnabled()?48:0,reducedMotion:motionQuery.matches,audio:audio.diagnostics()}),
        isWalkable:walkable,reset:()=>setPose('entrance',false),goTo:id=>setPose(id,false)});
      requestAnimationFrame(tick);
    }catch(error){fail(error);}
  }
  boot();
})();
