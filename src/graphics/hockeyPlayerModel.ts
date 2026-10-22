import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bodyDimensions } from './playerBody';
import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import {COLORS} from '../player/equipment';
import type {Position} from '../player/types';

/**
 * V3 authorable hockey character: separate player rigs, continuous lofted
 * clothing, position-specific equipment, and shared disposable materials.
 * GLB-ready: each major part lives in a named equipment group.
 */
const SKIN:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const HAIR:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const EYES:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
type Ring={y:number;rx:number;rz:number;z?:number};

function loft(rings:Ring[],n=32):THREE.BufferGeometry {
 const vertices:number[]=[],indices:number[]=[];
 for(const r of rings) for(let i=0;i<n;i++){const t=i*2*Math.PI/n;vertices.push(Math.cos(t)*r.rx,r.y,Math.sin(t)*r.rz+(r.z??0));}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;indices.push(a,c,b,b,c,d);}
 const bottom=vertices.length/3;vertices.push(0,rings[0].y,rings[0].z??0);
 const last=rings[rings.length-1],top=vertices.length/3;vertices.push(0,last.y,last.z??0);
 for(let i=0;i<n;i++){indices.push(bottom,i,(i+1)%n);const j=(rings.length-1)*n;indices.push(top,j+(i+1)%n,j+i);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildHockeyPlayerModel(p:PlayerAppearance,e:Equipment,position:Position):THREE.Group{
 const root=new THREE.Group();root.name='hockey-character-v3';
 const body=new THREE.Group();body.name=position==='G'?'goalie-rig':'skater-rig';root.add(body);
 const {height,width}=bodyDimensions(p);body.scale.set(width,height,width);
 const isGoalie=position==='G';
 const color={shirt:COLORS[e.jersey],shell:COLORS[e.helmet],glove:COLORS[e.gloves],pad:COLORS[e.pads],skin:SKIN[p.skinTone]??SKIN.Fair,hair:HAIR[p.hairColor]??HAIR.Brown,eye:EYES[p.eyeColor]??EYES.Blue,navy:'#17283c',ink:'#111b2b',white:'#f1f4f7',steel:'#abb9c6',seam:'#8193a9'};
 const mats=new Map<string,THREE.MeshStandardMaterial>();
 const material=(hex:string,roughness=.83,metalness=0)=>{const key=hex+'/'+roughness+'/'+metalness;let m=mats.get(key);if(!m){m=new THREE.MeshStandardMaterial({color:hex,roughness,metalness});mats.set(key,m);}return m;};
 const group=(name:string)=>{const g=new THREE.Group();g.name=name;body.add(g);return g;};
 const jersey=group('jersey-and-shoulder-pads'),head=group('head-and-helmet'),legs=group('pants-and-skates'),equipment=group(isGoalie?'goalie-equipment':'skater-equipment');
 const mesh=(g:THREE.BufferGeometry,c:string,parent:THREE.Group,rough=.83,metal=0)=>{const x=new THREE.Mesh(g,material(c,rough,metal));x.castShadow=true;x.receiveShadow=true;parent.add(x);return x;};
 const ell=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c:string,parent:THREE.Group)=>{const m=mesh(new THREE.SphereGeometry(1,24,18),c,parent);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;};
 const panel=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c:string,parent:THREE.Group,r=.02,rough=.72)=>{const m=mesh(new RoundedBoxGeometry(sx,sy,sz,3,Math.min(r,sx*.25,sy*.25,sz*.25)),c,parent,rough);m.position.set(x,y,z);return m;};
 const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const tube=(a:THREE.Vector3,b:THREE.Vector3,r:number,c:string,parent:THREE.Group)=>mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a,b),1,r,8,false),c,parent,.5,.12);
 const tapered=(a:THREE.Vector3,b:THREE.Vector3,ra:number,rb:number,c:string,parent:THREE.Group)=>{const d=b.clone().sub(a);const m=mesh(new THREE.CylinderGeometry(rb,ra,d.length(),20,1),c,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m;};
 // The jersey is a connected cloth-like shape, not an assembly of capsules.
 mesh(loft([{y:-.64,rx:.273,rz:.197,z:.01},{y:-.55,rx:.289,rz:.208,z:.01},{y:-.36,rx:.283,rz:.206},{y:-.09,rx:isGoalie?.327:.296,rz:isGoalie?.251:.211},{y:.24,rx:isGoalie?.366:.325,rz:isGoalie?.267:.223},{y:.37,rx:.328,rz:.219},{y:.48,rx:.205,rz:.146}]),color.shirt,jersey,.98);
 // Upper-body yoke and cloth trims.
 mesh(loft([{y:.42,rx:.205,rz:.153},{y:.465,rx:.174,rz:.129},{y:.487,rx:.122,rz:.101}]),color.navy,jersey);
 mesh(loft([{y:-.659,rx:.275,rz:.199},{y:-.632,rx:.281,rz:.208}]),color.white,jersey);
 const crest=panel(0,.08,.248,.168,.168,.017,color.navy,jersey,.04);
 crest.rotation.z=Math.PI/4;
 panel(0,.08,.263,.075,.075,.008,color.white,jersey,.022);
 mesh(loft([{y:-.89,rx:.238,rz:.188},{y:-.74,rx:.276,rz:.208},{y:-.56,rx:.278,rz:.198}]),color.navy,legs);
 for(const s of [-1,1]){
  const shoulder=V(s*.318,.315,.005),elbow=V(s*(isGoalie?.470:.402),isGoalie?-.052:-.113,.038),wrist=V(s*(isGoalie?.565:.423),isGoalie?-.405:-.455,isGoalie?.18:.077);
  // The sleeves remain anatomical in profile; sleeve cuffs follow the wrists.
  tapered(shoulder,elbow,isGoalie?.150:.128,.108,color.shirt,jersey);
  tapered(elbow,wrist,.109,.085,color.shirt,jersey);
  ell(s*.333,.308,.001,.139,.117,.132,color.shirt,jersey);
  panel(s*(isGoalie?.538:.416),isGoalie?-.302:-.35,isGoalie?.16:.136,.174,.028,.025,color.white,jersey,.009);
  tube(V(s*.218,.405,.158),V(s*.335,.296,.153),.004,color.seam,jersey);
  tube(V(s*.293,.29,-.157),V(s*.282,-.43,-.16),.004,color.seam,jersey);
  const x=s*(isGoalie?.195:.173),kneeX=s*(isGoalie?.230:.184),ankleX=s*(isGoalie?.24:.184);
  tapered(V(x,-.73,0),V(kneeX,-1.36,.048),.150,.121,color.navy,legs);
  tapered(V(kneeX,-1.36,.048),V(ankleX,-1.86,.085),.118,.095,isGoalie?color.navy:color.shirt,legs);
  if(!isGoalie){panel(kneeX,-1.49,.168,.211,.118,.035,color.white,legs,.025);panel(kneeX,-1.65,.167,.216,.045,.038,color.white,legs,.012);}
  // Skate boot shaped as heel / tongue / toe, with a separate steel runner.
  panel(ankleX,-1.958,.165,.220,.16,.405,color.ink,legs,.045);
  panel(ankleX,-1.906,.33,.146,.085,.075,color.navy,legs,.018);
  panel(ankleX,-1.842,-.022,.149,.15,.097,color.navy,legs,.02);
  for(let i=0;i<4;i++)tube(V(ankleX-.052,-1.873-i*.025,.38),V(ankleX+.052,-1.873-i*.025,.38),.0035,color.white,legs);
  panel(ankleX,-2.066,.156,.155,.019,.407,color.steel,legs,.008,.27);
  for(const z of [-.01,.32])panel(ankleX,-2.038,z,.105,.046,.028,color.ink,legs,.008);
 }
 const faceShape=p.faceShape==='Round'?1.06:p.faceShape==='Angular'?.94:p.faceShape==='Square'?1.04:1;
 ell(0,.558,0,.095,.14,.092,color.skin,head);
 ell(0,.897,.0,.191*faceShape,.244,.183,color.skin,head);
 ell(0,.751,.094,.132*faceShape,.08,.11,color.skin,head);
 for(const s of [-1,1]){
  ell(s*.183*faceShape,.906,.005,.027,.047,.043,color.skin,head);
  ell(s*.081,.945,.172,.031,.014,.012,'#e2d9d1',head);
  ell(s*.081,.945,.183,.017,.014,.008,color.eye,head);
  ell(s*.081,.947,.190,.007,.008,.005,color.ink,head);
  tube(V(s*.050,.990,.178),V(s*.118,.989,.163),.006,color.hair,head);
 }
 ell(0,.851,.194,.023,.045,.035,color.skin,head);
 panel(0,.772,.178,.073,.009,.011,'#955e5c',head,.004);
 // Complete shell rim with a genuine open face and goalie-only wire cage.
 const cap=mesh(new THREE.SphereGeometry(1,36,20,0,Math.PI*2,0,1.25),color.shell,head,.46);
 cap.position.set(0,.947,-.01);cap.scale.set(.221,.255,.216);
 for(const s of [-1,1]){
  panel(s*.195,.926,.002,.056,.16,.149,color.shell,head,.024,.45);
  tube(V(s*.192,.872,.129),V(s*.125,.785,.191),.009,color.ink,head);
  for(let i=0;i<3;i++)panel(s*.144,1.118-i*.024,-.081,.059,.007,.009,color.ink,head,.002);
 }
 if(isGoalie){
  for(let i=-3;i<=3;i++)tube(V(i*.055,1.040,.223),V(i*.052,.785,.232),.005,color.steel,head);
  for(let i=0;i<5;i++){const y=.804+i*.054;tube(V(-.182,y,.238),V(.182,y,.238),.005,color.steel,head);}
  panel(0,.780,.228,.287,.023,.026,color.shell,head,.006);
 }else{
  const verts:number[]=[],indices:number[]=[];
  for(let j=0;j<2;j++)for(let i=0;i<=16;i++){const x=(i/16-.5)*.408;verts.push(x,j===0?1.008:.914,.215+.025*(1-Math.pow(2*i/16-1,2)));}
  for(let i=0;i<16;i++)indices.push(i,i+1,i+17,i,i+17,i+16);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
  head.add(new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:'#b3d8ed',transparent:true,opacity:.18,roughness:.14,depthWrite:false,side:THREE.DoubleSide})));
  tube(V(-.205,1.008,.215),V(.205,1.008,.215),.005,color.steel,head);
 }
 if(isGoalie){
  // Tall flat-front pads, with articulated knee blocks and binding sides.
  for(const s of [-1,1]){
   const x=s*.230;
   panel(x,-1.520,.165,.331,1.01,.272,color.pad,equipment,.033);
   panel(x,-1.503,.311,.278,.912,.023,color.white,equipment,.012);
   panel(x+s*.133,-1.52,.329,.037,.957,.027,color.navy,equipment,.01);
   panel(x,-1.098,.328,.287,.118,.031,color.pad,equipment,.023);
   for(let i=0;i<6;i++)tube(V(x-.133,-1.16-i*.137,.335),V(x+.133,-1.16-i*.137,.335),.004,color.seam,equipment);
   panel(x,-1.990,.29,.293,.04,.078,color.navy,equipment,.011);
  }
  // Catch glove is a pocket, blocker is a broad angular slab.
  ell(-.562,-.395,.234,.178,.156,.105,color.glove,equipment);
  ell(-.562,-.395,.329,.142,.122,.016,color.ink,equipment);
  ell(-.562,-.395,.345,.117,.096,.012,color.white,equipment);
  for(let i=-2;i<=2;i++)tube(V(-.675,-.40+i*.029,.359),V(-.45,-.40+i*.029,.359),.003,color.steel,equipment);
  panel(.568,-.395,.249,.236,.258,.114,color.glove,equipment,.024);
  panel(.568,-.395,.313,.211,.217,.017,color.white,equipment,.009);
  const shaft=e.stick==='White'?'#f4f4f2':e.stick==='Natural'?'#c09b67':color.ink;
  tube(V(.595,-.35,.32),V(.627,-1.18,.34),.021,shaft,equipment);
  panel(.625,-1.477,.34,.082,.60,.053,shaft,equipment,.011);
  panel(.471,-1.948,.35,.386,.068,.082,shaft,equipment,.018);
 }else{
  for(const s of [-1,1]){
   panel(s*.426,-.461,.102,.175,.212,.196,color.glove,equipment,.045);
   for(let i=0;i<3;i++)tube(V(s*.348,-.490+i*.041,.209),V(s*.506,-.490+i*.041,.209),.004,color.white,equipment);
  }
  const shaft=e.stick==='White'?'#f4f4f2':e.stick==='Natural'?'#c09b67':color.ink;
  tube(V(.505,-.452,.245),V(.553,-1.913,.25),.020,shaft,equipment);
  const blade=panel(.411,-1.957,.26,.310,.058,.078,shaft,equipment,.015);blade.rotation.z=-.06;
 }
 return root;
}
export function disposeHockeyPlayerModel(root:THREE.Group):void{
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 root.traverse(x=>{if(x instanceof THREE.Mesh){geometries.add(x.geometry);(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>materials.add(m));}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
