import * as THREE from 'three';

/** Modern goalie mask: a single continuous tapered shell with a true open
 * face aperture, rounded cage and pointed chin. Local coordinates match the
 * existing hockey player rig; no external licensed assets are required.
 */
export function createGoalieMask(shellColor:string):THREE.Group {
 const root=new THREE.Group();root.name='goalie-mask-asset';
 const shellMat=new THREE.MeshStandardMaterial({color:shellColor,roughness:.37,metalness:.06,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:'#101923',roughness:.93});
 const steel=new THREE.MeshStandardMaterial({color:'#bfc7ce',roughness:.29,metalness:.8});
 const padding=new THREE.MeshStandardMaterial({color:'#273849',roughness:.9});
 const add=(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Group=root)=>{
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const wire=(points:THREE.Vector3[],radius=.005,parent:THREE.Group=root)=>{
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*12),radius,8,false),steel,parent);
 };
 // Each ring describes the actual continuous helmet profile, from the
 // aerodynamic crown down to the forward-tapered chin. A varying front
 // aperture keeps the face open without overlapping oval helmet pieces.
 const rings=[
  // Full, closed crown.
  {y:1.192,rx:.030,rz:.037,z:-.041,open:0},
  {y:1.174,rx:.125,rz:.127,z:-.042,open:0},
  {y:1.128,rx:.193,rz:.190,z:-.043,open:0},
  {y:1.078,rx:.221,rz:.220,z:-.037,open:.35},
  // The ONLY open area is the eye/cage window. Solid shell surrounds it.
  {y:1.038,rx:.238,rz:.244,z:-.025,open:.62},
  {y:.990,rx:.237,rz:.252,z:-.021,open:.70},
  {y:.943,rx:.231,rz:.247,z:-.017,open:.63},
  {y:.900,rx:.223,rz:.240,z:-.011,open:.45},
  {y:.857,rx:.211,rz:.233,z:.002,open:.21},
  // Continuous cheek and jaw protection closes under the cage.
  {y:.826,rx:.192,rz:.226,z:.022,open:0},
  {y:.787,rx:.166,rz:.218,z:.042,open:0},
  {y:.751,rx:.139,rz:.205,z:.057,open:0},
  // Long tapered chin is part of the SAME shell, not a hanging oval.
  {y:.714,rx:.113,rz:.181,z:.078,open:0},
  {y:.678,rx:.084,rz:.150,z:.088,open:0},
  {y:.640,rx:.052,rz:.115,z:.091,open:0},
  {y:.619,rx:.016,rz:.067,z:.091,open:0}
 ];
 const n=64,verts:number[]=[],indices:number[]=[];
 for(const ring of rings){
  for(let i=0;i<=n;i++){
   const t=ring.open+(Math.PI*2-ring.open*2)*i/n;
   verts.push(Math.sin(t)*ring.rx,ring.y,Math.cos(t)*ring.rz+ring.z);
  }
 }
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
  const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(indices);g.computeVertexNormals();
 const shell=add(g,shellMat);shell.name='one-piece-tapered-goalie-shell';
 // The opening's left and right edges are genuine parts of the shell.
 // Reinforced rails connect the brow to the long chin; cage mounts bolt onto
 // these rails instead of floating in space in front of the face.
 const rimMat=new THREE.MeshStandardMaterial({color:shellColor,roughness:.42,metalness:.04});
 const rim=(points:THREE.Vector3[],radius:number)=>{
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),44,radius,10,false),rimMat);
 };
 const opening=(r:typeof rings[number],side:number)=>{
  const t=side*r.open;
  return V(Math.sin(t)*r.rx,r.y,Math.cos(t)*r.rz+r.z);
 };
 for(const s of [-1,1]){
  rim(rings.slice(3,10).map(r=>opening(r,s)),.020);
  // Structural cheek pieces connect the wire mounting points to the solid face shell.
  rim([V(s*.153,1.073,.174),V(s*.173,1.025,.179),V(s*.166,.946,.188),V(s*.139,.890,.201),V(s*.080,.852,.229)],.023);
 }
 rim([V(-.151,1.077,.171),V(-.085,1.089,.183),V(0,1.092,.191),V(.085,1.089,.183),V(.151,1.077,.171)],.019);
 rim([V(-.113,.830,.240),V(-.070,.819,.250),V(0,.814,.253),V(.070,.819,.250),V(.113,.830,.240)],.021);
 const mountMat=new THREE.MeshStandardMaterial({color:'#aeb9c3',roughness:.34,metalness:.7});
 const mount=(x:number,y:number,z:number)=>{
  const m=add(new THREE.SphereGeometry(.014,16,12),mountMat);
  m.position.set(x,y,z);m.scale.set(1,1,.35);
 };
 for(const s of [-1,1]){
  mount(s*.151,1.077,.171);
  mount(s*.080,.852,.229);
  mount(s*.139,.890,.201);
 }
 // The dark face cavity is recessed behind the steel bars.
 const inset=add(new THREE.SphereGeometry(1,40,28),dark);
 inset.position.set(0,.977,.103);inset.scale.set(.136,.103,.106);
 // Chin ventilation and crown air inlets.
 const vent=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{
  const m=add(new THREE.SphereGeometry(1,20,12),dark);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
 };
 for(const s of [-1,1]){
  vent(s*.051,.687,.221,.010,.014,.004);
  vent(s*.051,1.124,.135,.013,.023,.005);
  vent(s*.142,1.080,.101,.009,.021,.004);
 }
 vent(0,.666,.222,.010,.013,.004);
 // Rounded cage profile, with gently bowed vertical and horizontal wires.
 const cage=new THREE.Group();cage.name='rounded-goalie-cage';root.add(cage);
 wire([V(-.151,1.077,.171),V(-.090,1.096,.227),V(0,1.101,.244),V(.090,1.096,.227),V(.151,1.077,.171)],.008,cage);
 for(const s of [-1,1]){
  wire([V(s*.151,1.077,.171),V(s*.181,1.008,.238),V(s*.158,.929,.255),V(s*.080,.852,.229)],.007,cage);
 }
 for(let row=0;row<5;row++){
  const y=.867+row*.046,span=.112+.049*Math.sin((row+1)*Math.PI/6);
  const front=.227+(row===2?.022:.008);
  wire([V(-span,y,.217),V(-span*.54,y-.006,front+.022),V(0,y-.009,front+.034),V(span*.54,y-.006,front+.022),V(span,y,.217)],.0047,cage);
 }
 for(let i=-2;i<=2;i++){
  const x=i*.057;
  wire([V(x*.88,1.095,.228),V(x,1.026,.270),V(x*.94,.947,.277),V(x*.73,.859,.249)],.0046,cage);
 }
 wire([V(-.080,.852,.229),V(-.048,.832,.264),V(0,.829,.271),V(.048,.832,.264),V(.080,.852,.229)],.006,cage);
 // Small flexible throat bib follows the pointed shell, without replacing it.
 const bib=add(new THREE.SphereGeometry(1,28,20),padding);
 bib.name='throat-guard';bib.position.set(0,.578,-.012);bib.scale.set(.115,.058,.095);
 return root;
}
