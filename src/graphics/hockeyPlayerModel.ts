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
 // Goal mask is a dedicated contoured assembly. The skater helmet stays unchanged.
 if(isGoalie){
  const mask=new THREE.Group();mask.name='contoured-goalie-mask';head.add(mask);
  const cage=new THREE.Group();cage.name='curved-cat-eye-cage';mask.add(cage);
  const wire=(points:THREE.Vector3[],radius=.0055)=>{
   mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(10,points.length*6),radius,7,false),color.steel,cage,.35,.62);
  };
  // Low-profile crown and occipital shell. Front is left open for the cage.
  const crown=mesh(new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,1.38),color.shell,mask,.38);
  crown.position.set(0,.955,-.029);crown.scale.set(.224,.250,.213);
  // Contoured cheek and jaw wings narrow toward a protective chin cup.
  for(const s of [-1,1]){
   const cheek=ell(s*.183,.905,.056,.053,.146,.144,color.shell,mask);
   cheek.rotation.z=-s*.19;
   const jaw=panel(s*.125,.799,.128,.124,.105,.170,color.shell,mask,.041);
   jaw.rotation.z=s*.28;
   panel(s*.201,.943,-.040,.018,.075,.067,color.ink,mask,.008);
   for(let i=0;i<3;i++){
    const y=.976+i*.040;
    panel(s*.208,y,-.066,.012,.012,.039,color.ink,mask,.005);
   }
   // Ear and chin straps sit behind the wire cage.
   wire([V(s*.207,.876,.122),V(s*.172,.823,.178),V(s*.107,.781,.208)],.006);
  }
  const chin=ell(0,.767,.150,.134,.078,.114,color.shell,mask);
  chin.rotation.x=-.20;
  panel(0,.754,.243,.169,.022,.019,color.ink,mask,.009);
  // Rounded opening and forward-curving bars, rather than a square grid.
  wire([V(-.176,1.074,.194),V(-.103,1.091,.241),V(0,1.098,.260),V(.103,1.091,.241),V(.176,1.074,.194)],.008);
  for(const s of [-1,1]){
   wire([V(s*.178,1.072,.199),V(s*.203,.989,.238),V(s*.195,.886,.267),V(s*.148,.797,.260)],.008);
  }
  for(let row=0;row<5;row++){
   const y=.834+row*.050;
   const spread=.144+.055*Math.sin((row+1)*Math.PI/6);
   const front=.278+(row===2?.024:row===1||row===3?.015:0);
   wire([V(-spread,y,.230),V(-spread*.53,y-.006,front),V(0,y-.009,front+.010),V(spread*.53,y-.006,front),V(spread,y,.230)]);
  }
  for(let i=-2;i<=2;i++){
   const x=i*.064;
   wire([V(x*.92,1.083,.248),V(x,1.010,.291),V(x*.94,.915,.311),V(x*.76,.826,.274)],.005);
  }
  // Raised centre brow and lower chin rails reinforce the mask profile.
  wire([V(-.151,.810,.242),V(0,.794,.281),V(.151,.810,.242)],.007);
  // Matte chin and side decals are distinct from the metal cage.
  panel(0,1.122,.011,.080,.013,.047,color.ink,mask,.006);
 }else{
  const verts:number[]=[],indices:number[]=[];
  for(let j=0;j<2;j++)for(let i=0;i<=16;i++){const x=(i/16-.5)*.408;verts.push(x,j===0?1.008:.914,.215+.025*(1-Math.pow(2*i/16-1,2)));}
  for(let i=0;i<16;i++)indices.push(i,i+1,i+17,i,i+17,i+16);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
  head.add(new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:'#b3d8ed',transparent:true,opacity:.18,roughness:.14,depthWrite:false,side:THREE.DoubleSide})));
  tube(V(-.205,1.008,.215),V(.205,1.008,.215),.005,color.steel,head);
 }
 if(isGoalie){
  // Separate goalie pad assemblies: face, thigh rise, knee block, sliding edge and boot.
  for(const s of [-1,1]){
   const x=s*.230;
   const pad=new THREE.Group();pad.name=s<0?'left-leg-pad':'right-leg-pad';equipment.add(pad);
   panel(x,-1.520,.165,.337,1.025,.278,color.pad,pad,.034);
   panel(x,-1.505,.313,.289,.934,.030,color.white,pad,.014);
   panel(x-s*.144,-1.53,.332,.046,.951,.045,color.navy,pad,.010);
   panel(x+s*.145,-1.53,.324,.038,.954,.038,color.pad,pad,.010);
   panel(x,-1.087,.333,.302,.150,.057,color.pad,pad,.028);
   panel(x,-1.346,.344,.291,.130,.037,color.white,pad,.018);
   panel(x-s*.185,-1.355,.169,.123,.179,.231,color.white,pad,.019);
   panel(x,-1.990,.291,.299,.064,.105,color.navy,pad,.020);
   for(let i=0;i<6;i++)tube(V(x-.132,-1.17-i*.137,.352),V(x+.132,-1.17-i*.137,.352),.004,color.seam,pad);
   for(let i=0;i<3;i++)panel(x+s*.174,-1.20-i*.28,.14,.022,.045,.234,color.ink,pad,.007);
  }
  // Real catcher silhouette: wrist cuff, thumb wing, finger wing, recessed pocket and crossed web laces.
  const trapper=new THREE.Group();trapper.name='trapper-catcher';equipment.add(trapper);
  const mitt=panel(-.562,-.390,.230,.278,.306,.128,color.glove,trapper,.060);mitt.rotation.z=-.15;
  ell(-.668,-.298,.247,.081,.115,.067,color.glove,trapper);
  ell(-.453,-.470,.244,.091,.110,.064,color.glove,trapper);
  ell(-.561,-.383,.330,.127,.123,.017,color.ink,trapper);
  ell(-.561,-.383,.348,.108,.102,.011,color.white,trapper);
  for(let i=-2;i<=2;i++){
   const y=-.383+i*.035;
   tube(V(-.657,y,.362),V(-.466,y,.362),.0035,color.steel,trapper);
   tube(V(-.657,y,.362),V(-.466,-.383-i*.035,.362),.0025,color.steel,trapper);
  }
  panel(-.565,-.554,.193,.201,.092,.119,color.glove,trapper,.024);
  // Blocker is a large flat board, with its actual gripping glove underneath.
  const blocker=new THREE.Group();blocker.name='blocker-glove';equipment.add(blocker);
  panel(.568,-.396,.219,.204,.209,.137,color.glove,blocker,.034);
  for(let i=0;i<3;i++)panel(.493+i*.075,-.530,.222,.062,.083,.094,color.glove,blocker,.015);
  panel(.568,-.394,.303,.294,.328,.065,color.glove,blocker,.025);
  panel(.568,-.394,.343,.251,.284,.012,color.white,blocker,.010);
  panel(.568,-.394,.353,.217,.247,.009,color.glove,blocker,.010);
  panel(.568,-.570,.226,.212,.087,.122,color.navy,blocker,.021);
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
