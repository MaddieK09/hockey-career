import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {bodyDimensions} from './playerBody';
import type {PlayerAppearance} from '../player/appearance';
import {COLORS, type Equipment} from '../player/equipment';
import type {Position} from '../player/types';

const SKIN:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const EYES:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
type Ring={y:number;rx:number;rz:number;z?:number};

/** Connected tapered mesh instead of a stack of intersecting ball-shaped torso pieces. */
function taperedLoft(rings:Ring[],segments=28):THREE.BufferGeometry {
 const vertices:number[]=[],faces:number[]=[];
 for(const ring of rings)for(let i=0;i<segments;i++){
  const theta=i*2*Math.PI/segments;
  vertices.push(Math.cos(theta)*ring.rx,ring.y,Math.sin(theta)*ring.rz+(ring.z??0));
 }
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
  const a=j*segments+i,b=j*segments+(i+1)%segments,c=(j+1)*segments+i,d=(j+1)*segments+(i+1)%segments;
  faces.push(a,c,b,b,c,d);
 }
 // End caps keep the uniform opaque when viewed below or from above.
 const bottom=vertices.length/3;vertices.push(0,rings[0].y,rings[0].z??0);
 const top=vertices.length/3;const last=rings[rings.length-1];vertices.push(0,last.y,last.z??0);
 for(let i=0;i<segments;i++){faces.push(bottom,i,(i+1)%segments);const start=(rings.length-1)*segments;faces.push(top,start+(i+1)%segments,start+i);}
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

/** A single cohesive, rotatable hockey player for phones and desktop.
 * Mesh is authored here, so no network-only GLB or licensing dependency.
 * Relative proportions are deliberate and the surface materials are shared.
 */
export function buildHockeyPlayerModel(p:PlayerAppearance,e:Equipment,position:Position):THREE.Group {
 const root=new THREE.Group(),figure=new THREE.Group();root.add(figure);
 const {height,width}=bodyDimensions(p);
 // Height and weight modify the figure, not the camera, ice or controls.
 figure.scale.set(width,height,width);
 const goalie=position==='G';
 const mats=new Map<string,THREE.MeshStandardMaterial>();
 const torsoMaterial=new THREE.MeshStandardMaterial({color:COLORS[e.jersey],roughness:.93,metalness:0});
 // Hockey cloth is deliberately matte, while plastic shells and steel retain specular highlights.
 const mat=(color:string,metalness=0,roughness=.72)=>{
  const key=`${color}/${metalness}/${roughness}`;let m=mats.get(key);
  if(!m){m=new THREE.MeshStandardMaterial({color,metalness,roughness});mats.set(key,m);}return m;
 };
 const uniform=COLORS[e.jersey],helmet=COLORS[e.helmet],gloves=COLORS[e.gloves],pads=COLORS[e.pads];
 const skin=SKIN[p.skinTone]??SKIN.Fair,eyes=EYES[p.eyeColor]??EYES.Blue;
 const ink='#172638',navy='#102335',white='#e7eef4',stripe='#d9e3ec',steel='#a7becd';
 const mesh=(geo:THREE.BufferGeometry,color:string,metalness=0,roughness=.72,parent=figure)=>{
  const m=new THREE.Mesh(geo,mat(color,metalness,roughness));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>{
  const m=mesh(new THREE.SphereGeometry(1,24,16),color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;
 };
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,r=.028,metalness=0)=>{
  const shape=new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.35,h*.35,d*.35));
  const m=mesh(shape,color,metalness);m.position.set(x,y,z);return m;
 };
 const limb=(start:THREE.Vector3,end:THREE.Vector3,top:number,bottom:number,color:string)=>{
  const direction=new THREE.Vector3().subVectors(end,start);
  const m=mesh(new THREE.CylinderGeometry(top,bottom,direction.length(),20,1),color);
  m.position.copy(start).add(end).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return m;
 };
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const line=(a:THREE.Vector3,b:THREE.Vector3,color:string,radius=.008)=>{
  const curve=new THREE.LineCurve3(a,b);
  return mesh(new THREE.TubeGeometry(curve,1,radius,6,false),color,.45,.39);
 };

 // Raised seams and small segmented panels break the mannequin-like flat surfaces.
 const seam=(a:THREE.Vector3,b:THREE.Vector3)=>line(a,b,'#a6bdce',.0045);
 // Anatomically tapered uniform: broad shoulders, cinched waist, structured hem.
 mesh(taperedLoft([
  {y:-.62,rx:.252,rz:.185,z:.01},{y:-.56,rx:.280,rz:.203,z:.01},
  {y:-.31,rx:.290,rz:.215},{y:.05,rx:goalie?.335:.310,rz:goalie?.252:.217},
  {y:.32,rx:goalie?.363:.338,rz:.221},{y:.47,rx:.224,rz:.151}
 ]),uniform);
 // Shoulder yoke, collar and jersey side seams sit on the actual tapered body.
 for(const s of [-1,1]){
  seam(v(s*.222,.425,.145),v(s*.338,.29,.155));
  seam(v(s*.294,.27,.137),v(s*.290,-.43,.145));
 }
 mesh(taperedLoft([{y:-.87,rx:.241,rz:.177},{y:-.76,rx:.278,rz:.199},{y:-.56,rx:.277,rz:.195}]),navy);
 box(0,-.55,.202,.49,.035,.016,stripe,.008);
 box(0,-.30,.215,.56,.018,.013,white,.005);
 // Loose bottom hem extends past the shoulder-pad taper.
 box(0,-.606,.177,.495,.025,.024,uniform,.009);
 for(const s of [-1,1]){
  box(s*.254,-.49,.08,.022,.23,.075,navy,.01);
  box(s*.17,.34,.166,.11,.022,.017,stripe,.006);
 }
 box(0,.405,.144,.24,.045,.09,navy,.019);
 box(0,.402,.220,.18,.017,.015,stripe,.007);
 // Team-neutral crest: tiny ice-rink emblem rather than an unlicensed NHL logo.
 oval(0,.12,.236,.105,.105,.012,navy);
 oval(0,.12,.251,.078,.078,.009,white);
 box(0,.12,.261,.111,.017,.009,uniform,.004);

 // Seamless padded sleeves and tapered arm volumes.
 for(const side of [-1,1]){
  const s=side,shoulder=v(s*.335,.315,.014),elbow=v(s*.402,-.115,.02);
  const wrist=v(s*(goalie?.49:.432),goalie?-.47:-.49,.09);
  oval(s*.345,.299,.009,goalie?.168:.145,.133,.15,uniform);
  limb(shoulder,elbow,goalie?.16:.139,goalie?.138:.114,uniform);
  limb(elbow,wrist,.119,.091,uniform);
  oval(s*.400,-.098,.02,.110,.090,.115,uniform);
  box(s*.415,-.218,.151,.22,.028,.02,stripe,.008);
  box(s*.415,-.260,.145,.205,.014,.02,navy,.006);
  // Hip, articulated thigh, knee and a continuous sock/skate profile.
  const hip=v(s*.17,-.75,0),knee=v(s*.188,-1.36,.049),ankle=v(s*.19,-1.88,.09);
  oval(s*.17,-.781,0,.143,.13,.156,navy);
  limb(hip,knee,.158,.123,navy);
  oval(s*.188,-1.35,.04,.122,.105,.136,navy);
  limb(knee,ankle,.129,.10,goalie?navy:uniform);
  if(!goalie){
   box(s*.188,-1.53,.175,.245,.15,.045,white,.025);
   box(s*.188,-1.66,.173,.235,.048,.047,stripe,.018);
  }
  // Skate shells, laces, blades and exposed steel rails.
  const boot=box(s*.196,-1.955,.17,.225,.155,.405,navy,.045);
  boot.rotation.x=-.09;
  box(s*.196,-1.912,.355,.172,.083,.041,ink,.022);
  for(let j=0;j<4;j++)box(s*.196,-1.875-j*.026,.383,.105,.008,.008,stripe,.003);
  // Boot heel cup and tendon guard connect the boot to the sock.
  box(s*.196,-1.850,-.010,.170,.15,.082,ink,.024);
  box(s*.196,-2.068,.175,.172,.019,.402,steel,.008,.78);
  for(const z of [.02,.30])box(s*.196,-2.037,z,.125,.045,.034,ink,.007);
 }

 // Neck/head: subtle nose, eye sockets and cheeks, no googly-eyes.
 oval(0,.548,0,.107,.173,.106,skin);
 const face=p.faceShape==='Round'?1.065:p.faceShape==='Square'?1.055:p.faceShape==='Angular'?.95:1;
 oval(0,.908,.007,.197*face,.257,.194,skin);
 oval(0,.747,.095,.139*face,.092,.107,skin);
 for(const s of [-1,1]){
  oval(s*.197*face,.901,.01,.031,.061,.048,skin);
  oval(s*.087,.952,.182,.039,.017,.013,'#dbd1c7');
  oval(s*.087,.952,.195,.018,.015,.008,eyes);
  oval(s*.087,.953,.202,.008,.010,.005,ink);
  oval(s*.091,1.004,.181,.048,.008,.008,'#69594f');
 }
 oval(0,.846,.198,.025,.049,.036,skin);
 oval(0,.811,.215,.034,.015,.019,skin);
 box(0,.762,.180,.078,.010,.012,'#99665d',.005);

 // Hard-shell helmet with a real face opening, side guards, chin strap.
 const crown=mesh(new THREE.SphereGeometry(1,32,18,0,Math.PI*2,0,1.37),helmet,0,.43);
 crown.position.set(0,.922,-.008);crown.scale.set(.232,.277,.224);
 for(const s of [-1,1]){
  const guard=box(s*.204,.936,-.013,.059,.172,.158,helmet,.031);
  guard.rotation.z=s*.12;
  box(s*.205,.912,.122,.045,.074,.030,ink,.013);
  line(v(s*.212,.868,.140),v(s*.133,.807,.202),ink,.010);
 }
 // Ventilation slots and helmet shell ribs read correctly at three-quarter angles.
 for(const s of [-1,1]){
  for(let i=0;i<3;i++){
   const vent=box(s*.160,1.113-i*.023,-.095,.065,.008,.012,ink,.003);
   vent.rotation.z=s*.16;
  }
 }
 // Visor and cage distinguish skaters from goaltenders at a glance.
 if(goalie){
  for(let i=-2;i<=2;i++)line(v(i*.073,1.044,.250),v(i*.064,.790,.244),steel,.008);
  for(let i=0;i<5;i++){
   const y=.818+i*.060,spread=.184+(y-.818)*.065;
   line(v(-spread,y,.245),v(spread,y,.245),steel,.007);
  }
  line(v(-.203,1.038,.224),v(-.160,.793,.225),helmet,.015);
  line(v(.203,1.038,.224),v(.160,.793,.225),helmet,.015);
  box(0,.786,.247,.30,.020,.027,helmet,.007);
 }else{
  // A translucent visor follows the curvature of the brow.
  const vertices:number[]=[],indices:number[]=[];
  for(let row=0;row<2;row++)for(let i=0;i<=12;i++){
   const u=i/12,x=(u-.5)*.425;
   vertices.push(x,row===0?1.007:.912,.231+.032*(1-Math.pow(2*u-1,2)));
  }
  for(let i=0;i<12;i++){indices.push(i,i+1,i+13,i,i+13,i+12);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const visor=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:'#a7d5ed',transparent:true,opacity:.22,roughness:.12,metalness:.04,side:THREE.DoubleSide,depthWrite:false}));
  figure.add(visor);
  line(v(-.210,1.010,.230),v(.210,1.010,.230),steel,.006);
 }

 if(goalie){
  // Squared, segmented modern goalie pads; these are NOT marshmallow ellipsoids.
  for(const s of [-1,1]){
   const x=s*.185;
   box(x,-1.525,.158,.320,1.020,.266,pads,.035);
   box(x,-1.508,.302,.275,.914,.022,white,.012);
   for(let i=0;i<6;i++)box(x,-1.17-i*.138,.338,.286,.010,.012,steel,.004);
   box(x+s*.130,-1.53,.331,.055,.950,.024,pads,.014);
   box(x,-1.098,.328,.276,.135,.031,pads,.031);
   // External knee roll, toe binding and inner sliding edge.
   box(x+s*.125,-1.54,.324,.028,.920,.030,navy,.012);
   box(x,-1.993,.284,.290,.042,.086,navy,.012);
   for(let j=0;j<4;j++)box(x,-1.26-j*.18,.344,.230,.006,.008,navy,.003);
  }
  // Left: rounded catcher pocket with lace/detail. Right: broad flat blocker.
  oval(-.50,-.488,.155,.205,.166,.110,gloves);
  oval(-.50,-.488,.254,.162,.125,.016,ink);
  oval(-.50,-.488,.269,.128,.100,.010,white);
  for(let i=-2;i<=2;i++)line(v(-.65,-.49+i*.032,.279),v(-.35,-.49+i*.032,.279),steel,.004);
  box(.515,-.475,.185,.258,.262,.122,gloves,.029);
  box(.515,-.475,.253,.230,.217,.016,white,.008);
  box(.515,-.475,.270,.202,.170,.013,gloves,.011);
 }else{
  for(const s of [-1,1]){
   oval(s*.432,-.500,.090,.120,.136,.130,gloves);
   box(s*.442,-.495,.202,.175,.175,.028,gloves,.032);
   for(let i=0;i<3;i++)line(v(s*.465,-.555+i*.047,.225),v(s*.505,-.555+i*.047,.225),stripe,.004);
  }
 }

 // A full-length stick, correctly connected from glove height to the ice.
 const stick=e.stick==='White'?'#e8eef2':e.stick==='Natural'?'#b99462':'#20262f';
 line(v(.50,-.47,.245),v(.56,-1.94,.255),stick,.022);
 const blade=box(.420,-1.974,.264,.315,.048,.071,stick,.015);
 blade.rotation.z=-.08;
 box(.50,-.52,.246,.045,.13,.045,gloves,.017);
 // Subtle jersey stitching and sleeve trim on the rear of the player.
 for(const s of [-1,1]){
  seam(v(s*.290,.30,-.148),v(s*.278,-.39,-.151));
  box(s*.408,-.245,-.145,.211,.019,.014,stripe,.005);
 }
 // A faint vertical centre seam avoids a completely blank back.
 seam(v(0,.34,-.224),v(0,-.53,-.201));
 return root;
}

/** Release all GPU allocations on edit, mode switch, and navigating away. */
export function disposeHockeyPlayerModel(group:THREE.Group):void {
 const geometries=new Set<THREE.BufferGeometry>();
 const materials=new Set<THREE.Material>();
 group.traverse(obj=>{
  if(obj instanceof THREE.Mesh){
   geometries.add(obj.geometry);
   for(const mat of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(mat);
  }
 });
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
