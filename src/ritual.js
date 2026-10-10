/* A visible bell stand and one bounded incense effect. No sprites from the network. */
'use strict';
class TempleRitual {
  static addBell(hall) {
    const b=hall.batches[0], m=hall.materials, [x,,z]=DaiDienCore.bellPosition;
    const box=(p,s,material)=>b.add(G.cube,material,p,s);
    box([x,.07,z],[1.24,.14,.80],m.darkStone);
    for(const dx of [-.50,.50])box([x+dx,1.18,z],[.10,2.22,.14],m.darkWood);
    box([x,2.32,z],[1.20,.14,.20],m.wood);
    b.add(G.torus(.10,.023,28,8),m.bronze,[x,2.12,z],[1,1,1],[Math.PI/2,0,0]);
    b.add(G.lathe([[.33,1.05],[.34,1.10],[.30,1.17],[.255,1.73],[.22,1.89],[.12,1.98],[0,2.00]],48),m.bronze,[x,0,z]);
    for(const y of [1.12,1.32,1.73])b.add(G.torus(y>1.5?.255:.31,.012,48,8),m.goldDark,[x,y,z]);
  }
  constructor(gl) {
    this.gl=gl;this.lit=false;this.elapsed=0;this.offered=false;
    const vs=`#version 300 es
      precision highp float;
      uniform mat4 uVP;uniform float uTime,uPixels,uMaxSize;out float vAlpha;flat out int vEmber;
      void main(){
        int id=gl_VertexID;vEmber=id==48?1:0;vec3 p=vec3(0.,1.59,-1.93);float diameter=.013;vAlpha=1.;
        if(id<48){
          float birth=float(id)*.125, age=mod(max(uTime-birth,0.),6.);
          p.y+=age*.14;
          p.x+=sin(age*2.1-uTime*.35)*(.012+age*.009)+sin(float(id)*4.3)*age*.003;
          p.z+=sin(age*1.4+float(id)*2.7)*age*.004;
          diameter=.027+age*.014;
          vAlpha=smoothstep(0.,.3,age)*(1.-smoothstep(3.2,6.,age))*.13*step(birth,uTime);
        }
        gl_Position=uVP*vec4(p,1.);
        gl_PointSize=clamp(diameter*uPixels/max(gl_Position.w,.1),1.,uMaxSize);
      }`;
    const fs=`#version 300 es
      precision highp float;in float vAlpha;flat in int vEmber;out vec4 outColor;
      void main(){
        float r=length(gl_PointCoord*2.-1.);
        if(r>=1.)discard;
        float alpha=pow(1.-r,1.6)*vAlpha;
        outColor=vec4(vEmber==1?vec3(1.,.31,.06):vec3(.72,.71,.68),alpha);
      }`;
    const shaders=[];
    try {
      for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
        const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
      }
      this.program=gl.createProgram();shaders.forEach(s=>gl.attachShader(this.program,s));gl.linkProgram(this.program);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    } finally {shaders.forEach(s=>gl.deleteShader(s));}
    this.vao=gl.createVertexArray();this.maxSize=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
    this.u={};for(const name of ['uVP','uTime','uPixels','uMaxSize'])this.u[name]=gl.getUniformLocation(this.program,name);
  }
  offer() { if(this.offered)return false;this.offered=true;this.lit=true;this.elapsed=0;return true; }
  reset() { this.offered=false;this.lit=false;this.elapsed=0; }
  update(dt) {
    if(!this.lit)return false;
    this.elapsed+=Math.min(Math.max(dt,0),.1);
    if(this.elapsed>=300){this.lit=false;return true;}
    return false;
  }
  draw(eye,target,fov,width,height,smoke) {
    if(!this.lit)return;
    const gl=this.gl;
    const vp=G.M.multiply(G.M.perspective(fov*Math.PI/180,width/height,.07,90),G.M.lookAt(eye,target));
    gl.useProgram(this.program);gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(this.u.uVP,false,vp);gl.uniform1f(this.u.uTime,this.elapsed);
    gl.uniform1f(this.u.uPixels,height/(2*Math.tan(fov*Math.PI/360)));gl.uniform1f(this.u.uMaxSize,this.maxSize);
    // Keep scene depth testing, but smoke must never write depth into the next layer.
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.drawArrays(gl.POINTS,smoke?0:48,smoke?49:1);
    gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
  }
}
