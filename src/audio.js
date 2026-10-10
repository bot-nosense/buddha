/* Original synthetic ambience, not temple recordings or religious chanting.
   One graph, created only after a user gesture. Spatial dry sound + diffuse reverb.
   https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices */
'use strict';
class TempleAudio {
  constructor() {
    this.ctx=null; this.enabled=false; this.active=false; this.steps=0;
    this.lastBell=-Infinity; this.sources=new Set();
  }
  async start(settings) {
    this.config={...settings}; this.active=true; this.enabled=settings.sound;
    if (!settings.sound) { this.pause(); return false; }
    if (!this.ctx) this.create();
    this.apply(settings);
    const ctx=this.ctx;
    try { if (ctx.state!=='running') await ctx.resume(); }
    catch(error) { if(ctx!==this.ctx)return false; throw error; }
    if(ctx!==this.ctx)return false;
    if (!this.active || !this.enabled || document.hidden) { await ctx.suspend(); return false; }
    return true;
  }
  create() {
    const AC=window.AudioContext||window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio không khả dụng. Bạn vẫn có thể tham quan không âm thanh.');
    const c=this.ctx=new AC(), master=this.master=c.createGain();
    const limiter=c.createDynamicsCompressor();
    limiter.threshold.value=-10; limiter.knee.value=10; limiter.ratio.value=8;
    master.gain.value=0; master.connect(limiter); limiter.connect(c.destination);
    this.room=c.createConvolver(); const ir=c.createBuffer(2,Math.floor(c.sampleRate*1.8),c.sampleRate);
    let seed=77; const random=()=>{seed=(1664525*seed+1013904223)>>>0; return seed/4294967296*2-1;};
    for(let ch=0;ch<2;ch++){const data=ir.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=random()*Math.pow(1-i/data.length,3)*.4;}
    this.room.buffer=ir; const roomGain=c.createGain();roomGain.gain.value=.22;
    this.room.connect(roomGain);roomGain.connect(master);
    this.wind=c.createGain();this.wind.connect(master);
    const noise=c.createBuffer(1,c.sampleRate*8,c.sampleRate), d=noise.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=random()*.8*Math.min(1,i/300,(d.length-1-i)/300);
    this.noise=noise;
    for(const [x,z] of [[-6,0],[6,-3]]){
      const source=c.createBufferSource(), filter=c.createBiquadFilter(), gain=c.createGain(), p=this.panner([x,3,z]);
      source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=x<0?440:620;
      gain.gain.value=.07;source.connect(filter);filter.connect(gain);gain.connect(p);p.connect(this.wind);
      source.start(0,x<0?0:3.2);
    }
  }
  panner(position) {
    const p=this.ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=2.5;p.rolloffFactor=.8;p.maxDistance=35;
    if(p.positionX){p.positionX.value=position[0];p.positionY.value=position[1];p.positionZ.value=position[2];}
    else p.setPosition(...position);
    return p;
  }
  apply(settings) {
    this.config={...settings};this.enabled=settings.sound;
    if(!this.ctx)return;
    const t=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(settings.sound&&this.active?settings.volume:0,t,.08);
    this.wind.gain.setTargetAtTime(settings.ambience,t,.15);
  }
  listener(state) {
    if(!this.ctx)return;const l=this.ctx.listener,t=this.ctx.currentTime,c=Math.cos(state.pitch),s=Math.sin(state.pitch);
    const front=[Math.sin(state.yaw)*c,s,-Math.cos(state.yaw)*c];
    const up=[-Math.sin(state.yaw)*s,c,Math.cos(state.yaw)*s];
    if(l.positionX){
      for(const [n,v] of Object.entries({positionX:state.x,positionY:state.y,positionZ:state.z,forwardX:front[0],forwardY:front[1],forwardZ:front[2],upX:up[0],upY:up[1],upZ:up[2]}))l[n].setTargetAtTime(v,t,.025);
    }else{l.setPosition(state.x,state.y,state.z);l.setOrientation(...front,...up);}
  }
  track(source,cleanup) {
    const entry={source,done:false,finish:()=>{if(entry.done)return;entry.done=true;this.sources.delete(entry);cleanup();}};
    this.sources.add(entry);source.onended=entry.finish;
  }
  bell(position) {
    if(!this.ctx||!this.enabled||!this.active||this.ctx.state!=='running')return false;
    const c=this.ctx,t=c.currentTime;if(t-this.lastBell<3)return false;this.lastBell=t;
    const p=this.panner(position), bus=c.createGain();bus.gain.value=.24;bus.connect(p);p.connect(this.master);bus.connect(this.room);
    const partials=[[164.8,.42,10],[329.9,.25,8],[431.8,.16,6],[652.4,.08,4],[896,.04,2.5]];
    let pending=partials.length;
    for(const [frequency,level,duration] of partials){
      const o=c.createOscillator(), g=c.createGain();o.frequency.value=frequency;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.02);
      this.track(o,()=>{o.disconnect();g.disconnect();if(--pending===0){bus.disconnect();p.disconnect();}});
    }
    return true;
  }
  footstep(state) {
    if(!this.ctx||!this.enabled||!this.active||!this.config.footsteps||this.ctx.state!=='running'||this.sources.size>12)return;
    const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    const side=this.steps++%2 ? -.14:.14,p=this.panner([state.x+Math.cos(state.yaw)*side,.1,state.z+Math.sin(state.yaw)*side]);
    s.buffer=this.noise;f.type='lowpass';f.frequency.value=380;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
    s.connect(f);f.connect(g);g.connect(p);p.connect(this.master);g.connect(this.room);
    s.start(t,(this.steps*.731)%7.5,.16);
    this.track(s,()=>{s.disconnect();f.disconnect();g.disconnect();p.disconnect();});
  }
  pause() { this.active=false;if(this.ctx&&this.ctx.state!=='closed')this.ctx.suspend().catch(()=>{}); }
  async resume() { if(this.ctx&&this.enabled)return this.start(this.config);return false; }
  reset() {
    this.active=false;this.lastBell=-Infinity;this.steps=0;
    for(const entry of [...this.sources]){try{entry.source.stop();}catch(_){}entry.finish();}
    // Close the old graph so no reverb tail or previous visit can leak into re-entry.
    const ctx=this.ctx;this.ctx=null;
    if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});
  }
  diagnostics() { return {state:this.ctx?.state||'not-started',enabled:this.enabled,voices:this.sources.size,footsteps:this.steps,synthetic:true}; }
}
