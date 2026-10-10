/* Spatial design, 12.5 x 16 m interior, 9 m ceiling.
   The Buddha is an ORIGINAL PROCEDURAL BLOCKOUT, not a scanned/sculpted final asset.
   Replace buildBuddha() for a subsequent art-production pass. */
'use strict';
function buildHall(){
  const {mat,cube,sphere,cylinder,torus,lathe,tube,surface,Batch,V}=G;
  const solid=new Batch(),shell=new Batch();
  const m={
    floor:mat('#d8d1c0',.52,0,1),wall:mat('#e3ddcd',.86,0,2),stone:mat('#d3c9b4',.64,0,2),
    lightStone:mat('#ece5d6',.57,0,2),darkStone:mat('#a79b83',.68,0,2),
    wood:mat('#ae8a60',.58,0,3),darkWood:mat('#6f553b',.63,0,3),beam:mat('#c0a079',.7,0,3),
    bronze:mat('#967647',.44,.72),gold:mat('#c8a359',.53,.60),goldLight:mat('#cba85e',.52,.60),
    goldDark:mat('#aa8846',.58,.55),hair:mat('#a18547',.57,.58),eye:mat('#917340',.65,.3),
    glass:mat('#fff4d9',.78,0,0,.6),window:mat('#ecf1e8',1,0,0,.47),
    lamp:mat('#ffe6ab',.63,0,0,2.2),cushion:mat('#baa07e',.97,0,5),green:mat('#687957',.85),
    ink:mat('#665642',.8),black:mat('#4f483e',.75),ivory:mat('#e6dfce',.52)
  };
  const add=(g,ma,p=[0,0,0],s=[1,1,1],r=[0,0,0],cast=true)=>(cast?solid:shell).add(g,ma,p,s,r);
  const box=(p,s,ma=m.stone,cast=true,r=[0,0,0])=>add(cube,ma,p,s,r,cast);
  const ell=(p,s,ma=m.gold,r=[0,0,0],seg=36,rings=22)=>add(sphere(seg,rings),ma,p,s,r);
  const cyl=(p,rt,rb,h,ma=m.stone,seg=40)=>add(cylinder(rt,rb,h,seg),ma,p);
  const line=(points,r,ma=m.gold,flatten=1,segments=40,sides=10)=>add(tube(points,r,segments,sides,flatten),ma);
  const ring=(p,R,r,ma=m.gold,rot=[0,0,0])=>add(torus(R,r,88,10),ma,p,[1,1,1],rot);

  // Floor and envelope. Shell geometry is excluded from the sun shadow pass:
  // the prototype uses an artistic indirect-light approximation, not baked GI.
  box([0,-.11,0],[12.5,.22,16],m.floor,false);
  box([0,4.5,-8.13],[12.9,9,.26],m.wall,false);
  box([-4.48,4.5,8.13],[3.54,9,.26],m.wall,false);
  box([4.48,4.5,8.13],[3.54,9,.26],m.wall,false);
  box([0,7.0,8.13],[5.4,4,.26],m.wall,false);
  box([0,2.6,8.48],[5.4,5.2,.10],m.window,false);
  // Entrance door frame, restrained Asian timber construction.
  for(const x of [-2.73,2.73])box([x,2.6,8.0],[.20,5.2,.30],m.darkWood);
  box([0,5.22,8.0],[5.65,.24,.30],m.darkWood);
  for(const x of [-2.46,2.46])box([x,2.4,8.28],[.20,4.8,.13],m.wood);
  box([0,5.8,8.0],[3.5,.42,.12],m.darkWood);
  // Side wall plinths, clerestory, and windows with actual mullion geometry.
  for(const sx of [-1,1]){
    box([sx*6.39,.56,0],[.28,1.12,16],m.stone,false);
    box([sx*6.39,8.01,0],[.28,1.98,16],m.wall,false);
    box([sx*6.20,.15,0],[.12,.28,16],m.darkStone,false);
    box([sx*6.2,1.12,0],[.15,.11,16],m.lightStone);
    const centres=[-6.,-2.,2.,6.];
    for(const z of [-8,-4,0,4,8])box([sx*6.37,4.1,z],[.30,6.0,.46],m.wall,false);
    for(const z of centres){
      box([sx*6.51,4.1,z],[.06,5.85,3.52],m.window,false);
      for(const zz of [z-1.65,z+1.65])box([sx*6.18,4.1,zz],[.16,5.95,.09],m.wood);
      for(const yy of [1.18,4.52,6.99])box([sx*6.18,yy,z],[.16,.10,3.40],m.wood);
      for(let i=-3;i<=3;i++)box([sx*6.18,4.15,z+i*.44],[.13,5.72,.035],m.beam);
      for(let i=0;i<5;i++)box([sx*6.18,4.74+i*.44,z],[.13,.035,3.35],m.beam);
      box([sx*6.02,.53,z],[.08,.72,3.35],m.lightStone,false);
      for(const zz of [z-1.55,z+1.55])box([sx*5.98,.53,zz],[.04,.62,.022],m.bronze);
    }
  }
  // Quiet timber ceiling: real beams, open skylight panels rather than glow effects.
  box([0,9.12,0],[12.9,.24,16.3],m.wood,false);
  for(const x of [-5.8,-4.7,-3.2,3.2,4.7,5.8])box([x,8.8,0],[.22,.4,16],m.beam);
  for(let z=-7.8;z<=8;z+=2.6){
    box([0,8.70,z],[12.6,.46,.20],m.wood);
    for(let x=-5.8;x<=5.8;x+=1.45)box([x,8.93,z+1.24],[.035,.08,2.30],m.darkWood);
  }
  box([0,8.97,-2.6],[5.8,.06,6.75],m.window,false);
  for(const x of [-2.98,2.98])box([x,8.70,-2.6],[.15,.40,7.1],m.wood);
  for(let z=-6.1;z<1.;z+=.8)box([0,8.89,z],[5.8,.08,.065],m.beam);
  for(let x=-2.8;x<=2.8;x+=.70)box([x,8.89,-2.6],[.045,.08,6.7],m.beam);
  // Six slender, tall structural columns. Their feet provide scale references.
  const columnPositions=[];
  for(const x of [-4.7,4.7])for(const z of [-5.8,-.2,5.4]){
    columnPositions.push([x,z]);
    box([x,.11,z],[.83,.22,.83],m.stone);
    box([x,.24,z],[.69,.08,.69],m.lightStone);
    cyl([x,.42,z],.31,.34,.34,m.lightStone);
    cyl([x,4.18,z],.245,.30,7.2,m.lightStone,48);
    cyl([x,.67,z],.306,.306,.065,m.bronze);
    cyl([x,7.77,z],.32,.26,.12,m.bronze);
    cyl([x,7.97,z],.39,.32,.29,m.stone);
    box([x,8.23,z],[.84,.23,.68],m.beam);
    box([x,8.40,z],[1.14,.14,.72],m.wood);
    box([x,8.53,z],[1.56,.12,.78],m.beam);
    box([x,8.62,z],[.22,.15,1.25],m.beam);
  }
  for(const x of [-4.7,4.7])box([x,8.3,-.1],[.38,.36,15.2],m.beam);
  // Back wall, inset panels and a single focal recess.
  box([0,4.25,-7.94],[6.90,7.80,.09],m.lightStone,false);
  for(const x of [-3.54,3.54])box([x,4.22,-7.82],[.055,7.88,.04],m.bronze);
  for(const y of [.28,8.17])box([0,y,-7.82],[7.15,.055,.04],m.bronze);
  for(const sx of [-1,1]){
    for(let i=0;i<10;i++)box([sx*(3.87+i*.208),4.1,-7.87],[.045,7.62,.07],m.beam,false);
  }
  // Altar zone: 6 x 5 m, surrounded by a continuous walkable aisle.
  box([0,.135,-3.9],[6,.27,5],m.darkStone);
  box([0,.32,-3.9],[5.90,.11,4.90],m.lightStone);
  box([0,.411,-3.9],[5.75,.075,4.75],m.stone);
  box([0,.466,-3.9],[5.80,.035,4.80],m.bronze);
  box([0,.10,-1.24],[3.6,.20,.45],m.stone);
  box([0,.22,-1.48],[3.35,.24,.28],m.lightStone);
  // Recessed bronze aisle inlay, not a carpet stretching up to the statue.
  for(const x of [-2.8,2.8])box([x,.004,3.4],[.014,.007,8.4],m.bronze,false);
  box([0,.004,7.6],[5.62,.007,.014],m.bronze,false);
  for(const x of [-2.2,2.2])for(const z of [1.1,3.25]){
    box([x,.07,z],[.66,.14,.62],m.cushion);
    box([x,.145,z],[.62,.015,.58],m.cushion);
  }
  // Two low benches, discrete and deliberately outside the central sightline.
  const benches=[];
  for(const x of [-5.35,5.35]){
    const z=2.5;benches.push({x,z,hx:.33,hz:1.05});
    box([x,.47,z],[.66,.12,2.1],m.wood);
    for(const zz of [z-.82,z+.82])box([x,.23,zz],[.47,.46,.13],m.darkWood);
    for(const xx of [x-.28,x+.28])box([xx,.548,z],[.015,.015,2.0],m.bronze);
  }
  // A bronze lantern pair with diffused, warm material and small actual geometry.
  for(const x of [-3.6,3.6]){
    const z=-1.15;cyl([x,.07,z],.29,.32,.14,m.darkStone);cyl([x,.55,z],.046,.074,.92,m.bronze);
    cyl([x,1.04,z],.15,.09,.10,m.bronze);box([x,1.35,z],[.26,.52,.26],m.glass);
    for(const a of [-1,1])for(const b of [-1,1])box([x+a*.153,1.35,z+b*.153],[.033,.61,.033],m.bronze);
    box([x,1.65,z],[.43,.05,.43],m.bronze);box([x,1.05,z],[.38,.05,.38],m.bronze);
    add(cylinder(.0,.30,.15,4),m.bronze,[x,1.75,z],[1,1,1],[0,Math.PI/4,0]);
    ell([x,1.88,z],[.045,.066,.045],m.bronze,undefined,16,10);
    ell([x,1.32,z],[.035,.105,.035],m.lamp,undefined,12,8);
  }
  // A low offering console, kept in front of the plinth so the statue remains clear.
  box([0,.80,-1.93],[2.9,.13,.58],m.darkWood);
  for(const x of [-1.26,1.26])box([x,.62,-1.93],[.10,.34,.42],m.darkWood);
  box([0,.875,-1.93],[2.92,.025,.59],m.bronze);
  cyl([0,1.01,-1.93],.14,.19,.24,m.bronze);
  for(const x of [-.055,0,.055])cyl([x,1.36,-1.93],.006,.006,.46,m.darkWood,8);
  for(const sx of [-1,1]){
    const x=sx*1.08;cyl([x,.966,-1.93],.086,.12,.16,m.ivory);cyl([x,1.09,-1.93],.055,.08,.12,m.ivory);
    for(let i=0;i<4;i++){const xx=x+(i-1.5)*.055,zz=-1.93+Math.sin(i)*.06,yy=1.42+i%2*.12;
      line([[x,1.11,-1.93],[xx,yy-.14,zz],[xx,yy,zz]],.005,m.green,1,10,5);
      ell([xx,yy,zz],[.047,.065,.045],m.ivory,undefined,12,8);
    }
  }
  buildBuddha();
  function buildBuddha(){
    const z0=-4.15;
    const badd=(geo,ma,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0])=>add(geo,ma,[pos[0],pos[1],pos[2]+z0],scale,rot);
    const be=(p,s,ma=m.gold,r=[0,0,0],se=40,ri=24)=>badd(sphere(se,ri),ma,p,s,r);
    const bl=(points,r,ma=m.gold,flatten=1,segments=48,sides=12)=>badd(tube(points,r,segments,sides,flatten),ma);
    // Lotus throne: restrained overlapping petals rather than excessive decoration.
    badd(lathe([[0,.48],[1.60,.48],[1.67,.52],[1.67,.60],[1.54,.67],[1.57,.77],[1.68,.91],[1.58,1.13],[1.43,1.23],[0,1.23]],80),m.goldDark);
    for(let tier=0;tier<2;tier++)for(let i=0;i<28;i++){
      const a=(i+tier*.5)/28*Math.PI*2,r=tier?1.42:1.48;
      const petal=surface(18,18,(u,v)=>{const an=u*Math.PI*2,rr=Math.pow(Math.max(.000001,Math.sin(Math.PI*v)),.85)*(1.22-.50*v);return [Math.cos(an)*.19*rr,v*.43,Math.sin(an)*.098*rr+.09*v*v];},true);
      badd(petal,tier?m.goldLight:m.gold,[Math.sin(a)*r,.58+tier*.25,Math.cos(a)*r],[1,1,1],[0,a,0]);
    }
    for(const y of [.55,.67,1.16])badd(torus(y>1?1.47:1.62,.028,100,10),m.goldLight,[0,y,0]);
    // Silhouette of crossed legs, both knees contained on the lotus seat.
    be([0,1.40,.10],[1.48,.35,.73],m.gold);
    be([-.86,1.48,.08],[.70,.30,.63],m.gold,[0,-.10,-.05]);
    be([.86,1.48,.08],[.70,.30,.63],m.gold,[0,.10,.05]);
    bl([[-1.37,1.45,.33],[-.94,1.40,.68],[-.32,1.46,.73],[.36,1.52,.47],[.73,1.65,.26]],t=>.19+.085*Math.sin(Math.PI*t),m.goldLight,.78,64,20);
    bl([[1.36,1.45,.28],[.87,1.45,.65],[.28,1.54,.70],[-.31,1.65,.54],[-.57,1.72,.43]],t=>.16+.07*Math.sin(Math.PI*t),m.gold,.78,64,20);
    be([-.48,1.77,.47],[.31,.11,.14],m.goldLight,[.15,.08,-.06]);
    for(let i=0;i<5;i++)be([-.69+i*.064,1.787,.563],[.037,.034,.064],m.goldLight,undefined,14,10);
    // Continuous shaped torso, a single parametric surface with subtle fabric folds.
    const profile=[[1.60,.65,.37],[1.82,.68,.43],[2.10,.61,.41],[2.40,.58,.40],[2.72,.62,.42],[3.02,.71,.42],[3.24,.78,.36],[3.40,.73,.28],[3.54,.44,.235],[3.62,.25,.225]];
    function pr(y){
      let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;
      const a=profile[k],b=profile[k+1],prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+2)];
      const h=b[0]-a[0],t=Math.max(0,Math.min(1,(y-a[0])/h)),t2=t*t,t3=t2*t;
      return [1,2].map(j=>{const m0=(b[j]-prev[j])/(b[0]-prev[0]),m1=(next[j]-a[j])/(next[0]-a[0]);return (2*t3-3*t2+1)*a[j]+(t3-2*t2+t)*h*m0+(-2*t3+3*t2)*b[j]+(t3-t2)*h*m1;});
    }
    badd(surface(80,80,(u,v)=>{
      const y=1.60+v*2.02,[rx,rz]=pr(y),a=u*Math.PI*2;let x=Math.sin(a)*rx,z=Math.cos(a)*rz;
      if(z>0&&x>(2.9-y)*.35-.08){z+=.014*Math.sin(y*22.+x*8.)*Math.sin(a*2.+.7);}
      return[x,y,z];
    }),m.gold);
    // Robe edge draped over the figure's left shoulder, across the torso.
    bl([[.47,3.53,.17],[.52,3.32,.33],[.28,2.99,.433],[-.08,2.64,.424],[-.43,2.21,.413],[-.59,1.84,.40]],.037,m.goldLight,1,60,10);
    for(let i=0;i<5;i++){
      const off=i*.060;
      bl([[.69,3.30-off,.23],[.62,2.96-off,.31],[.45,2.65-off,.363],[.15,2.26-off,.407],[-.27,1.88-off*.6,.426]],.014,m.goldDark,1,50,8);
    }
    // Neck, head, and quiet, closed-eye expression.
    be([0,3.64,0],[.246,.25,.226],m.goldLight);
    be([0,4.16,-.012],[.427,.575,.371],m.goldLight,undefined,64,48);
    // Ears: elongated lobes and recessed inner forms, all in the same metal family.
    for(const sx of [-1,1]){
      be([sx*.448,4.13,-.016],[.101,.273,.096],m.goldLight,[0,0,sx*-.055]);
      be([sx*.473,4.16,.068],[.039,.172,.027],m.goldDark,undefined,24,16);
      be([sx*.446,3.947,.026],[.072,.113,.081],m.goldLight,undefined,24,16);
      const x=sx*.165;
      bl([[x-sx*.096,4.222,.336],[x,4.195,.358],[x+sx*.106,4.219,.313]],.009,m.eye,1,28,8);
      bl([[x-sx*.106,4.31,.324],[x,4.333,.333],[x+sx*.112,4.296,.282]],.009,m.goldDark,1,28,8);
      // Cheek volume is part of the continuous oval head, avoiding separate lobes.
    }
    // Nose and lips are deliberately understated at blockout fidelity.
    be([0,4.145,.359],[.041,.130,.045],m.goldLight,undefined,30,20);
    be([0,4.072,.404],[.053,.043,.047],m.goldLight,undefined,28,20);
    for(const sx of [-1,1])be([sx*.047,4.052,.38],[.029,.024,.028],m.goldLight,undefined,24,16);
    bl([[-.113,3.985,.320],[-.056,3.973,.347],[0,3.982,.357],[.056,3.973,.347],[.113,3.985,.320]],.009,m.goldDark,1,32,8);
    be([0,3.957,.335],[.083,.022,.025],m.goldLight,undefined,28,14);
    be([0,4.397,.323],[.018,.020,.016],m.goldLight,undefined,16,12);
    // Hair cap and regular, small curls: procedural placement, not a texture billboard.
    badd(surface(56,24,(u,v)=>{const a=u*Math.PI*2,b=v*1.19;return[.452*Math.sin(b)*Math.cos(a),4.17+.586*Math.cos(b),-.012+.38*Math.sin(b)*Math.sin(a)];},true),m.hair);
    for(let j=1;j<=9;j++){
      const b=j/9*1.19,count=Math.max(8,Math.round(46*Math.sin(b)));
      for(let i=0;i<count;i++){
        const a=(i+j%2*.5)/count*Math.PI*2;
        be([.454*Math.sin(b)*Math.cos(a),4.17+.585*Math.cos(b),-.012+.383*Math.sin(b)*Math.sin(a)],[.033,.033,.033],m.hair,undefined,8,7);
      }
    }
    be([0,4.73,-.034],[.179,.206,.158],m.hair,undefined,36,24);
    for(let j=0;j<4;j++)for(let i=0;i<15-j*2;i++){
      const a=i/(15-j*2)*Math.PI*2,r=.155*(1-j*.15);be([r*Math.cos(a),4.75+j*.038,-.034+r*.82*Math.sin(a)],[.027,.029,.026],m.goldDark,undefined,8,7);
    }
    be([0,4.928,-.034],[.053,.073,.052],m.goldDark,undefined,24,14);
    // Both arms, natural seated gesture: right hand over the knee; left hand in lap.
    bl([[-.65,3.37,.02],[-.88,3.10,.015],[-.98,2.62,.06],[-1.13,2.16,.21],[-1.23,1.91,.40]],t=>.20-.08*t,m.goldLight,1,64,20);
    be([-1.245,1.79,.49],[.15,.20,.083],m.goldLight,[.21,-.09,-.12]);
    for(let i=0;i<4;i++){
      const x=-1.36+i*.067;bl([[x,1.82,.53],[x+.01,1.65,.56],[x+.025,1.56+.024*Math.abs(i-1.5),.525]],.025,m.goldLight,1,20,10);
    }
    bl([[-1.13,1.90,.51],[-1.072,1.76,.51],[-1.10,1.70,.53]],.032,m.goldLight,1,22,10);
    bl([[.67,3.38,.015],[.86,3.08,.02],[1.01,2.58,.10],[.97,2.23,.29],[.66,2.04,.49],[.22,1.94,.56]],t=>.21-.115*t,m.gold,1,72,20);
    be([.10,1.94,.57],[.26,.07,.13],m.goldLight,[0,-.10,.07]);
    for(let i=0;i<4;i++)bl([[.10,1.957,.485+i*.055],[-.12,1.965,.49+i*.055],[-.22,1.977,.50+i*.049]],.023,m.goldLight,1,22,10);
    bl([[.23,2.01,.48],[.085,2.052,.44],[-.015,2.02,.46]],.032,m.goldLight,1,22,10);
    // Shallow engraved robe arcs on the folded legs.
    for(let i=0;i<4;i++){
      const k=i*.053;bl([[-1.14,1.29+k,.51],[-.59,1.26+k,.745],[0,1.28+k,.792],[.69,1.31+k,.64]],.012,m.goldDark,1,52,8);
    }
    // Physical bronze halo, not an emissive or supernatural lighting effect.
    badd(torus(2.025,.031,144,10),m.bronze,[0,3.28,-.99],[1,1,1],[Math.PI/2,0,0]);
    badd(torus(2.105,.012,144,8),m.bronze,[0,3.28,-.99],[1,1,1],[Math.PI/2,0,0]);
    for(const x of [-.76,.76])badd(cylinder(.019,.022,.80,12),m.bronze,[x,.90,-.99]);
  }
  return {batches:[solid,shell],columns:columnPositions,benches,dimensions:{width:12.5,depth:16,height:9},materials:m};
}
