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
  {y:1.070,rx:.218,rz:.204,z:-.043,open:.67},
  {y:1.018,rx:.230,rz:.211,z:-.044,open:1.03},
  {y:.957,rx:.226,rz:.214,z:-.047,open:1.12},
  {y:.895,rx:.215,rz:.204,z:-.047,open:1.08},
  {y:.840,rx:.194,rz:.191,z:-.035,open:.92},
  {y:.804,rx:.165,rz:.171,z:-.016,open:.65},
  {y:.773,rx:.134,rz:.155,z:.002,open:.32},
  {y:.739,rx:.103,rz:.139,z:.014,open:0},
  {y:.702,rx:.065,rz:.114,z:.016,open:0},
  {y:.686,rx:.025,rz:.073,z:.014,open:0}
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
 // The dark face cavity is recessed behind the steel bars.
 const inset=add(new THREE.SphereGeometry(1,40,28),dark);
 inset.position.set(0,.948,.073);inset.scale.set(.155,.156,.103);
 // Chin ventilation and crown air inlets.
 const vent=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{
  const m=add(new THREE.SphereGeometry(1,20,12),dark);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
 };
 for(const s of [-1,1]){
  vent(s*.049,.754,.164,.011,.014,.003);
  vent(s*.051,1.124,.135,.013,.023,.005);
  vent(s*.142,1.080,.101,.009,.021,.004);
 }
 vent(0,.749,.163,.011,.014,.003);
 // Rounded cage profile, with gently bowed vertical and horizontal wires.
 const cage=new THREE.Group();cage.name='rounded-goalie-cage';root.add(cage);
 wire([V(-.168,1.073,.154),V(-.100,1.090,.205),V(0,1.093,.221),V(.100,1.090,.205),V(.168,1.073,.154)],.008,cage);
 for(const s of [-1,1]){
  wire([V(s*.170,1.075,.159),V(s*.187,.989,.207),V(s*.177,.889,.225),V(s*.113,.787,.181)],.007,cage);
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
 wire([V(-.116,.814,.186),V(-.065,.783,.203),V(0,.757,.201),V(.065,.783,.203),V(.116,.814,.186)],.006,cage);
 // Small flexible throat bib follows the pointed shell, without replacing it.
 const bib=add(new THREE.SphereGeometry(1,28,20),padding);
 bib.name='throat-guard';bib.position.set(0,.659,.015);bib.scale.set(.121,.067,.108);
 return root;
}
