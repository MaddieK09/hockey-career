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
  {y:1.185,rx:.035,rz:.039,z:-.043,open:0},
  {y:1.167,rx:.120,rz:.133,z:-.046,open:0},
  {y:1.122,rx:.188,rz:.183,z:-.045,open:0},
  {y:1.070,rx:.218,rz:.204,z:-.043,open:.43},
  {y:1.018,rx:.230,rz:.211,z:-.044,open:.69},
  {y:.957,rx:.226,rz:.214,z:-.047,open:.77},
  {y:.895,rx:.215,rz:.204,z:-.047,open:.75},
  {y:.840,rx:.192,rz:.192,z:-.029,open:.62},
  {y:.802,rx:.162,rz:.180,z:.001,open:.47},
  // Angled chin projects forward as the jaw narrows, then sweeps down to a point.
  {y:.766,rx:.130,rz:.174,z:.033,open:.28},
  {y:.729,rx:.108,rz:.167,z:.058,open:.08},
  {y:.693,rx:.088,rz:.153,z:.074,open:0},
  {y:.654,rx:.065,rz:.127,z:.081,open:0},
  {y:.622,rx:.041,rz:.091,z:.080,open:0},
  {y:.608,rx:.016,rz:.046,z:.077,open:0}
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
  rim(rings.slice(2,12).map(r=>opening(r,s)),.018);
  // Broad structural cheek/temple ribs fill the gap between shell and grille.
  rim([V(s*.151,1.075,.132),V(s*.175,1.023,.135),V(s*.185,.942,.139),V(s*.174,.862,.145),V(s*.139,.789,.160),V(s*.082,.713,.214)],.026);
 }
 rim([V(-.151,1.075,.132),V(-.085,1.092,.149),V(0,1.095,.156),V(.085,1.092,.149),V(.151,1.075,.132)],.020);
 rim([V(-.118,.777,.186),V(-.068,.718,.219),V(0,.677,.229),V(.068,.718,.219),V(.118,.777,.186)],.020);
 const mountMat=new THREE.MeshStandardMaterial({color:'#aeb9c3',roughness:.34,metalness:.7});
 const mount=(x:number,y:number,z:number)=>{
  const m=add(new THREE.SphereGeometry(.014,16,12),mountMat);
  m.position.set(x,y,z);m.scale.set(1,1,.35);
 };
 for(const s of [-1,1]){
  mount(s*.170,1.071,.164);
  mount(s*.115,.788,.191);
  mount(s*.184,.917,.168);
 }
 // The dark face cavity is recessed behind the steel bars.
 const inset=add(new THREE.SphereGeometry(1,40,28),dark);
 inset.position.set(0,.951,.008);inset.scale.set(.147,.146,.083);
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
 wire([V(-.168,1.073,.154),V(-.100,1.090,.205),V(0,1.093,.221),V(.100,1.090,.205),V(.168,1.073,.154)],.008,cage);
 for(const s of [-1,1]){
  wire([V(s*.170,1.071,.164),V(s*.187,.989,.207),V(s*.184,.917,.168),V(s*.115,.788,.191)],.007,cage);
 }
 for(let row=0;row<5;row++){
  const y=.843+row*.048,span=.125+.050*Math.sin((row+1)*Math.PI/6);
  const front=.227+(row===2?.022:.008);
  wire([V(-span,y,.174),V(-span*.54,y-.006,front),V(0,y-.009,front+.012),V(span*.54,y-.006,front),V(span,y,.174)],.0047,cage);
 }
 for(let i=-2;i<=2;i++){
  const x=i*.057;
  wire([V(x*.88,1.086,.209),V(x,1.016,.254),V(x*.94,.925,.266),V(x*.73,.827,.221)],.0046,cage);
 }
 wire([V(-.116,.814,.186),V(-.083,.764,.213),V(-.049,.715,.231),V(0,.675,.231),V(.049,.715,.231),V(.083,.764,.213),V(.116,.814,.186)],.006,cage);
 // Small flexible throat bib follows the pointed shell, without replacing it.
 const bib=add(new THREE.SphereGeometry(1,28,20),padding);
 bib.name='throat-guard';bib.position.set(0,.578,-.012);bib.scale.set(.115,.058,.095);
 return root;
}
