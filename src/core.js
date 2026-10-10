/* Pure movement / timing rules, shared by the browser and dependency-free Node tests. */
'use strict';
const DaiDienCore = (() => {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const altar = Object.freeze({x: 0, y: 1.59, z: -1.93});
  const bellPosition = Object.freeze([-3.8, 1.6, 4.4]);
  function settings(saved = {}, touch = false) {
    const s = saved && typeof saved === 'object' ? saved : {};
    const number = (key, fallback, lo, hi) => Number.isFinite(s[key]) ? clamp(s[key], lo, hi) : fallback;
    const boolean = (key, fallback) => typeof s[key] === 'boolean' ? s[key] : fallback;
    return {
      quality: ['low','balanced','sharp','ultra'].includes(s.quality) ? s.quality : touch ? 'low' : 'balanced',
      fps: s.fps === 60 ? 60 : 30,
      fov: number('fov', touch ? 65 : 58, 45, 85),
      sensitivity: number('sensitivity', .8, .4, 1.8),
      speed: number('speed', .95, .6, 1.4),
      light: s.light === 'warm' ? 'warm' : 'day',
      shadows: boolean('shadows', true), touch: touch || boolean('touch', false),
      sound: boolean('sound', true), volume: number('volume', .45, 0, 1),
      ambience: number('ambience', .65, 0, 1), footsteps: boolean('footsteps', true),
      smoke: boolean('smoke', true)
    };
  }
  function circleRect(x, z, cx, cz, hx, hz, radius = .23) {
    const dx = x - clamp(x, cx - hx, cx + hx), dz = z - clamp(z, cz - hz, cz + hz);
    return dx * dx + dz * dz < radius * radius;
  }
  function walkable(x, z, hall) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    if (Math.abs(x) > 6.02 || Math.abs(z) > 7.77) return false;
    if (circleRect(x,z,0,-3.9,3,2.5) || circleRect(x,z,0,-1.24,1.8,.225)) return false;
    for (const [cx,cz] of hall.columns) if (circleRect(x,z,cx,cz,.415,.415)) return false;
    for (const b of hall.benches) if (circleRect(x,z,b.x,b.z,b.hx,b.hz)) return false;
    for (const cx of [-3.6,3.6]) if (Math.hypot(x-cx,z+1.15) < .55) return false;
    // The new bell stand has a physical footprint, not an invisible sound source.
    if (circleRect(x,z,bellPosition[0],bellPosition[2],.62,.40)) return false;
    return true;
  }
  function step(state, input, dt, speed, isWalkable) {
    if (!(dt > 0) || !Number.isFinite(dt)) return 0;
    dt = Math.min(dt, .1); // Drop long stalls; never teleport after a hidden tab.
    const norm = Math.max(1, Math.hypot(input.forward, input.right));
    const tx = (Math.sin(state.yaw)*input.forward + Math.cos(state.yaw)*input.right) / norm * speed;
    const tz = (-Math.cos(state.yaw)*input.forward + Math.sin(state.yaw)*input.right) / norm * speed;
    const rate = input.forward || input.right ? 7 : 11, decay = Math.exp(-rate * dt);
    // Integrate exponential acceleration analytically, independent of render FPS.
    const dx = tx*dt + (state.vx-tx)*(1-decay)/rate;
    const dz = tz*dt + (state.vz-tz)*(1-decay)/rate;
    state.vx = tx+(state.vx-tx)*decay; state.vz = tz+(state.vz-tz)*decay;
    if (Math.hypot(state.vx,state.vz) < .0001) state.vx = state.vz = 0;
    const x = state.x, z = state.z, n = Math.max(1, Math.ceil(Math.hypot(dx,dz)/.05));
    for (let i=0; i<n; i++) {
      if (isWalkable(state.x+dx/n,state.z)) state.x += dx/n; else state.vx = 0;
      if (isWalkable(state.x,state.z+dz/n)) state.z += dz/n; else state.vz = 0;
    }
    return Math.hypot(state.x-x,state.z-z);
  }
  function canOffer(state) {
    const dx=altar.x-state.x, dz=altar.z-state.z, d=Math.hypot(dx,dz);
    return state.started && state.z > -1 && d <= 2.3 && d > .01 &&
      (Math.sin(state.yaw)*dx-Math.cos(state.yaw)*dz)/d > .65 && Math.abs(state.pitch) < 1.15;
  }
  class FrameGate {
    constructor(fps=30) { this.set(fps); }
    set(fps) { this.interval = 1000/(fps===60 ? 60 : 30); this.next = null; }
    ready(now) {
      if (this.next === null) { this.next=now+this.interval; return true; }
      if (now+.5 < this.next) return false;
      this.next += Math.max(1,Math.floor((now+.5-this.next)/this.interval)+1)*this.interval;
      return true;
    }
  }
  return Object.freeze({clamp, altar, bellPosition, settings, circleRect, walkable, step, canOffer, FrameGate});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = DaiDienCore;
