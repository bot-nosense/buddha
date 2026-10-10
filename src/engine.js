/* Dai Dien V1 — minimal, dependency-free WebGL2 renderer.
   Units are metres. World axes: +Y up, +Z towards the entrance.
   Static geometry is merged into a small number of indexed GPU batches. */
'use strict';
const G = (() => {
  const V = {
    add: (a,b) => a.map((x,i)=>x+b[i]), sub: (a,b)=>a.map((x,i)=>x-b[i]),
    mul: (a,s)=>a.map(x=>x*s), dot: (a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),
    cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
    norm:a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);},
    mix:(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t),
  };
  const M = {
    multiply(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;},
    perspective(fov,aspect,n,f){const t=1/Math.tan(fov/2);return new Float32Array([t/aspect,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]);},
    ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);},
    lookAt(eye,target,up=[0,1,0]){const z=V.norm(V.sub(eye,target)),x=V.norm(V.cross(up,z)),y=V.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V.dot(x,eye),-V.dot(y,eye),-V.dot(z,eye),1]);}
  };
  const color = hex => [16,8,0].map(s => (((typeof hex==='string'?parseInt(hex.replace('#',''),16):hex)>>s)&255)/255);
  const mat = (hex,rough=.65,metal=0,type=0,emission=0) => ({color:color(hex),params:[rough,metal,type,emission]});
  const cube = (()=>{
    const p=[],n=[],idx=[];
    const faces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]];
    for(const [nn,pp]of faces){let o=p.length/3;for(const v of pp){p.push(...v);n.push(...nn);}idx.push(o,o+1,o+2,o,o+2,o+3);}return {p,n,idx};
  })();
  function surface(nu,nv,fn,flip=false){
    const p=[],n=[],idx=[];const eps=.00015;
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
      const u=i/nu,v=j/nv,a=fn(u,v),du=V.sub(fn(u+eps,v),fn(u-eps,v)),dv=V.sub(fn(u,v+eps),fn(u,v-eps));
      p.push(...a);n.push(...V.mul(V.norm(V.cross(du,dv)),flip?-1:1));
    }
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){let a=j*(nu+1)+i,b=a+nu+1;idx.push(a,b,a+1,b,b+1,a+1);}return {p,n,idx};
  }
  const sphereCache=new Map();
  function sphere(seg=36,rings=24){
    let key=seg+','+rings;if(sphereCache.has(key))return sphereCache.get(key);
    const p=[],n=[],idx=[];
    for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){
      const a=i/seg*Math.PI*2,b=j/rings*Math.PI;const nn=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];p.push(...nn);n.push(...nn);
    }
    for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){let a=j*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g={p,n,idx};sphereCache.set(key,g);return g;
  }
  function lathe(profile,seg=48){
    const p=[],n=[],idx=[];
    for(let j=0;j<profile.length;j++){
      const prev=profile[Math.max(0,j-1)],next=profile[Math.min(profile.length-1,j+1)];const dr=next[0]-prev[0],dy=next[1]-prev[1];
      for(let i=0;i<=seg;i++){let a=i/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(profile[j][0]*c,profile[j][1],profile[j][0]*s);n.push(...V.norm([dy*c,-dr,dy*s]));}
    }
    for(let j=0;j<profile.length-1;j++)for(let i=0;i<seg;i++){let a=j*(seg+1)+i,b=a+seg+1;idx.push(a,a+1,b,a+1,b+1,b);}return {p,n,idx};
  }
  function cylinder(rt,rb,h,seg=40){return lathe([[0,-h/2],[rb,-h/2],[rb,-h/2+.001],[rt,h/2-.001],[rt,h/2],[0,h/2]],seg);}
  function torus(R,r,seg=72,tube=10){return surface(seg,tube,(u,v)=>{const a=u*Math.PI*2,b=v*Math.PI*2;return [(R+r*Math.cos(b))*Math.cos(a),r*Math.sin(b),(R+r*Math.cos(b))*Math.sin(a)];},true);}
  function catmull(points,t){
    const st=Math.max(0,Math.min(.999999,t))*(points.length-1),i=Math.floor(st),u=st-i;
    const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
    return [0,1,2].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u));
  }
  function tube(points,radius=.03,segments=40,sides=10,flatten=1){
    const p=[],n=[],idx=[];
    for(let j=0;j<=segments;j++){
      const t=j/segments,c=catmull(points,t),tangent=V.norm(V.sub(catmull(points,Math.min(.999999,t+.001)),catmull(points,Math.max(0,t-.001))));
      const axis=V.norm(V.cross(tangent,Math.abs(tangent[1])>.95?[1,0,0]:[0,1,0])),b=V.norm(V.cross(tangent,axis));
      let r=typeof radius==='function'?radius(t):radius;
      for(let i=0;i<=sides;i++){let a=i/sides*Math.PI*2,nn=V.add(V.mul(axis,Math.cos(a)),V.mul(b,Math.sin(a)));const delta=[nn[0]*r,nn[1]*r*flatten,nn[2]*r];p.push(...V.add(c,delta));n.push(...V.norm([nn[0],nn[1]/flatten,nn[2]]));}
    }
    for(let j=0;j<segments;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;idx.push(a,b,a+1,b,b+1,a+1);}return {p,n,idx};
  }
  function rotate(v,r){let[x,y,z]=v;const[cx,sx,cy,sy,cz,sz]=[Math.cos(r[0]),Math.sin(r[0]),Math.cos(r[1]),Math.sin(r[1]),Math.cos(r[2]),Math.sin(r[2])];[y,z]=[y*cx-z*sx,y*sx+z*cx];[x,z]=[x*cy+z*sy,-x*sy+z*cy];return[x*cz-y*sz,x*sz+y*cz,z];}
  class Batch{
    constructor(){this.vertices=[];this.indices=[];}
    add(geo,material,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
      const offset=this.vertices.length/13;
      for(let i=0;i<geo.p.length;i+=3){let p=rotate([geo.p[i]*scale[0],geo.p[i+1]*scale[1],geo.p[i+2]*scale[2]],rot);let n=V.norm(rotate([geo.n[i]/scale[0],geo.n[i+1]/scale[1],geo.n[i+2]/scale[2]],rot));this.vertices.push(p[0]+pos[0],p[1]+pos[1],p[2]+pos[2],...n,...material.color,...material.params);}
      for(const i of geo.idx)this.indices.push(i+offset);
    }
    upload(gl){
      this.count=this.indices.length;this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);
      this.vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.STATIC_DRAW);
      this.ebo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ebo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(this.indices),gl.STATIC_DRAW);
      const stride=13*4;[[0,3,0],[1,3,3],[2,3,6],[3,4,9]].forEach(([i,size,off])=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,off*4);});
      gl.bindVertexArray(null);this.vertices=null;this.indices=null;
    }
    draw(gl){if(!this.count)return;gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_INT,0);}
  }
  const VS=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
  layout(location=2) in vec3 aColor;layout(location=3) in vec4 aMaterial;
  uniform mat4 uViewProjection;uniform mat4 uLightMatrix;
  out vec3 vPosition;out vec3 vNormal;out vec3 vColor;out vec4 vMaterial;out vec4 vShadow;
  void main(){vPosition=aPosition;vNormal=aNormal;vColor=aColor;vMaterial=aMaterial;vShadow=uLightMatrix*vec4(aPosition,1.);gl_Position=uViewProjection*vec4(aPosition,1.);}`;
  const FS=`#version 300 es
  precision highp float;
  in vec3 vPosition;in vec3 vNormal;in vec3 vColor;in vec4 vMaterial;in vec4 vShadow;
  uniform vec3 uEye;uniform vec3 uSunDir;uniform vec3 uSunColor;uniform float uExposure;uniform float uWarm;
  uniform sampler2D uShadow;uniform vec2 uShadowSize;uniform float uShadowOn;
  out vec4 fragColor;
  const float PI=3.14159265;
  float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float shadow(vec3 N){
    if(uShadowOn<.5)return 1.;vec3 sc=vShadow.xyz/vShadow.w*.5+.5;
    if(sc.x<0.||sc.x>1.||sc.y<0.||sc.y>1.||sc.z>1.)return 1.;
    float bias=max(.00035*(1.-dot(N,uSunDir)),.00011),sum=0.;
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uShadow,sc.xy+vec2(float(x),float(y))/uShadowSize).r;sum+=(sc.z-bias<=d)?1.:.30;}
    return sum/9.;
  }
  vec3 fresnel(float cosT,vec3 F0){return F0+(1.-F0)*pow(1.-cosT,5.);}
  vec3 brdf(vec3 L,vec3 radiance,vec3 N,vec3 V,vec3 albedo,float rough,float metallic){
    vec3 H=normalize(V+L);float NoL=max(dot(N,L),0.),NoV=max(dot(N,V),.001),NoH=max(dot(N,H),0.),HoV=max(dot(H,V),0.);
    float a=rough*rough,a2=a*a,den=NoH*NoH*(a2-1.)+1.;float D=a2/max(PI*den*den,.0001);
    float k=(rough+1.)*(rough+1.)/8.;float gg=NoV/(NoV*(1.-k)+k)*NoL/max(NoL*(1.-k)+k,.0001);
    vec3 F=fresnel(HoV,mix(vec3(.04),albedo,metallic));vec3 spec=D*gg*F/max(4.*NoV*NoL,.001);
    return ((1.-F)*(1.-metallic)*albedo/PI+spec)*radiance*NoL;
  }
  vec3 env(vec3 r){
    float up=smoothstep(-.3,.9,r.y);vec3 c=mix(vec3(.22,.16,.10),vec3(.86,.91,.96),up);
    c+=vec3(1.0,.93,.76)*pow(max(dot(r,normalize(vec3(-.65,.38,.2))),0.),18.)*.85;
    c+=vec3(1.0,.98,.90)*pow(max(dot(r,normalize(vec3(.2,.88,.05))),0.),28.)*1.4;
    return c;
  }
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  void main(){
    vec3 N=normalize(vNormal),V=normalize(uEye-vPosition),albedo=pow(vColor,vec3(2.2));
    float rough=vMaterial.x,metal=vMaterial.y,type=vMaterial.z,emission=vMaterial.w;
    if(type>.5&&type<1.5){
      vec2 uv=(vPosition.xz+vec2(6.25,8.))/1.25;vec2 f=fract(uv),line=min(f,1.-f);vec2 fw=max(fwidth(uv),vec2(.0008));
      float seam=1.-min(smoothstep(.006,.006+fw.x,line.x),smoothstep(.006,.006+fw.y,line.y));
      float tile=hash(vec3(floor(uv),3.));float grain=noise(vPosition*vec3(6.,1.,20.));
      albedo*=.89+tile*.14+grain*.07;albedo=mix(albedo,albedo*.66,seam*.75);rough+=grain*.025;
    }else if(type>1.5&&type<2.5){float st=noise(vPosition*vec3(7.,24.,5.));albedo*=.94+.08*st;}
    else if(type>2.5&&type<3.5){float grain=sin(vPosition.x*100.+vPosition.z*80.+noise(vPosition*vec3(7.,.3,6.))*13.);albedo*=.94+.035*grain+.04*noise(vPosition*4.);}
    else if(type>4.5&&type<5.5){albedo*=.93+.1*hash(floor(vPosition*220.));}
    float ao=1.;if(vPosition.y<.12){vec2 d=max(abs(vPosition.xz-vec2(0.,-3.9))-vec2(3.,2.5),vec2(0.));ao*=1.-.20*exp(-length(d)*4.);
      for(int i=0;i<6;i++){float x=(i<3)?-4.7:4.7;float z=-5.8+float(i%3)*5.6;float dst=length(vPosition.xz-vec2(x,z));ao*=1.-.17*exp(-max(dst-.34,0.)*5.);}}
    float NoV=max(dot(N,V),.01);vec3 F0=mix(vec3(.04),albedo,metal),Fr=fresnel(NoV,F0);
    float hemi=.5+.5*N.y;vec3 irradiance=mix(vec3(.46,.36,.27),vec3(.98,1.01,1.05),hemi)*.62;
    vec3 c=albedo*(1.-metal)*irradiance*ao;
    vec3 refl=env(reflect(-V,N));c+=refl*mix(F0,Fr,.42)*(1.-rough*.52)*ao;
    c+=brdf(uSunDir,uSunColor*2.8,N,V,albedo,rough,metal)*shadow(N);
    c+=brdf(normalize(vec3(.4,.5,1.)),vec3(.85,.78,.62)*.6,N,V,albedo,rough,metal);
    for(int i=0;i<2;i++){vec3 lp=vec3(i==0?-3.6:3.6,1.5,-1.15);vec3 ld=lp-vPosition;float dis=dot(ld,ld);c+=brdf(normalize(ld),vec3(1.,.53,.17)*3.5/(1.+dis),N,V,albedo,rough,metal);}
    c+=albedo*emission;
    c*=mix(vec3(1.),vec3(1.08,.91,.76),uWarm);
    c=aces(c*uExposure);c=pow(c,vec3(1./2.2));fragColor=vec4(c,1.);
  }`;
  const SHADOW_VS=`#version 300 es
  precision highp float;layout(location=0) in vec3 aPosition;uniform mat4 uLightMatrix;void main(){gl_Position=uLightMatrix*vec4(aPosition,1.);}`;
  const SHADOW_FS=`#version 300 es
  precision highp float;void main(){}`;
  function program(gl,vs,fs){
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const info=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('Shader: '+info);}return s;};
    const v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs),p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
  }
  class Renderer{
    constructor(canvas,batches){
      this.canvas=canvas;this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
      if(!this.gl)throw new Error('Không khởi tạo được WebGL 2. Hãy bật tăng tốc đồ họa hoặc thử trình duyệt khác.');
      const gl=this.gl;this.program=program(gl,VS,FS);this.shadowProgram=program(gl,SHADOW_VS,SHADOW_FS);
      this.u={};for(const n of ['uViewProjection','uLightMatrix','uEye','uSunDir','uSunColor','uExposure','uWarm','uShadow','uShadowSize','uShadowOn'])this.u[n]=gl.getUniformLocation(this.program,n);
      this.shadowMatrixLocation=gl.getUniformLocation(this.shadowProgram,'uLightMatrix');
      this.batches=batches;for(const batch of batches)batch.upload(gl);
      this.sunPos=[-9,14,9];this.sunTarget=[0,2,-2];this.sunDir=V.norm(V.sub(this.sunPos,this.sunTarget));
      this.lightMatrix=M.multiply(M.ortho(-12,12,-12,12,1,42),M.lookAt(this.sunPos,this.sunTarget));
      this.exposure=1.04;this.warm=0;this.shadowOn=true;this.shadowSize=2048;
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
      this.makeShadow();this.renderShadow();
    }
    makeShadow(){
      const gl=this.gl;if(this.shadowTexture)gl.deleteTexture(this.shadowTexture);if(this.shadowFBO)gl.deleteFramebuffer(this.shadowFBO);
      this.shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      this.shadowFBO=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadowTexture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('GPU không hỗ trợ bộ đệm bóng đổ.');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    renderShadow(){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(this.shadowProgram);gl.uniformMatrix4fv(this.shadowMatrixLocation,false,this.lightMatrix);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,2.);this.batches[0].draw(gl);gl.disable(gl.POLYGON_OFFSET_FILL);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
    resize(w,h){this.canvas.width=Math.max(1,Math.round(w));this.canvas.height=Math.max(1,Math.round(h));}
    render(eye,target,fov=62){
      const gl=this.gl,w=this.canvas.width,h=this.canvas.height;if(gl.isContextLost())return;
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(.89,.88,.84,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
      const vp=M.multiply(M.perspective(fov*Math.PI/180,w/h,.07,90),M.lookAt(eye,target));
      gl.uniformMatrix4fv(this.u.uViewProjection,false,vp);gl.uniformMatrix4fv(this.u.uLightMatrix,false,this.lightMatrix);gl.uniform3fv(this.u.uEye,eye);gl.uniform3fv(this.u.uSunDir,this.sunDir);gl.uniform3fv(this.u.uSunColor,[1.,.94,.81]);
      gl.uniform1f(this.u.uExposure,this.exposure);gl.uniform1f(this.u.uWarm,this.warm);gl.uniform1f(this.u.uShadowOn,this.shadowOn?1:0);gl.uniform2f(this.u.uShadowSize,this.shadowSize,this.shadowSize);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);gl.uniform1i(this.u.uShadow,0);
      for(const batch of this.batches)batch.draw(gl);gl.bindVertexArray(null);
    }
    get triangles(){return this.batches.reduce((s,b)=>s+b.count/3,0);}
  }
  return {V,M,mat,color,cube,sphere,surface,lathe,cylinder,torus,tube,catmull,rotate,Batch,Renderer};
})();
