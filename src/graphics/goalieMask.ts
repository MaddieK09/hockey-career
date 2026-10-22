import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Self-contained goalie mask asset authored in metres relative to the player rig.
 * A curved shell and cage are built as actual meshes, not a square helmet overlay.
 * All GPU resources are disposed by disposeHockeyPlayerModel's group traversal.
 */
export function createGoalieMask(shellColor:string):THREE.Group {
 const root=new THREE.Group();root.name='goalie-mask-asset';
 const shellMat=new THREE.MeshStandardMaterial({color:shellColor,roughness:.48,metalness:.06});
 const linerMat=new THREE.MeshStandardMaterial({color:'#142332',roughness:.96});
 const metalMat=new THREE.MeshStandardMaterial({color:'#c4cbd3',roughness:.28,metalness:.76});
 const padMat=new THREE.MeshStandardMaterial({color:'#253444',roughness:.91});
 const add=(geometry:THREE.BufferGeometry,material:THREE.Material,parent:THREE.Group=root)=>{
  const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,material:THREE.Material,parent:THREE.Group=root)=>{
  const m=add(new THREE.SphereGeometry(1,36,22),material,parent);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;
 };
 const panel=(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,r=.015)=>{
  const m=add(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.3,h*.3,d*.3)),material);m.position.set(x,y,z);return m;
 };
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const cage=new THREE.Group();cage.name='three-dimensional-wire-cage';root.add(cage);
 const wire=(points:THREE.Vector3[],radius=.0048)=>{
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(16,points.length*9),radius,8,false),metalMat,cage);
 };
 // Skull-following rear and crown: broader than the face, deep enough to wrap the occiput.
 oval(0,.944,-.057,.229,.244,.205,shellMat);
 // The front brow is a solid arc; leave the lower face open behind the cage.
 const brow=add(new THREE.TorusGeometry(.173,.027,10,36,Math.PI),shellMat);
 brow.position.set(0,1.055,.147);brow.rotation.z=Math.PI;
 for(const side of [-1,1]){
  const s=side;
  // Thin, sloped shell wings hug cheeks; avoid oversized spherical ear cups.
  const cheek=oval(s*.165,.885,.065,.065,.139,.129,shellMat);
  cheek.rotation.z=-s*.18;
  const jaw=oval(s*.111,.800,.135,.078,.081,.096,shellMat);
  jaw.rotation.z=s*.23;
  // Liner and rear straps show from profile without leaving a bare neck.
  oval(s*.175,.925,-.077,.013,.083,.093,linerMat);
  panel(s*.190,1.003,-.035,.010,.012,.050,linerMat,.004);
  panel(s*.194,1.029,-.032,.010,.012,.048,linerMat,.004);
  panel(s*.195,1.054,-.025,.010,.011,.044,linerMat,.004);
 }
 // Chin cup and padded lower rim visually meet the chest/neck protector.
 oval(0,.765,.146,.140,.073,.105,shellMat);
 oval(0,.750,.209,.101,.030,.032,linerMat);
 // The wirework curves forward in three dimensions; no straight square grille.
 wire([v(-.170,1.070,.185),v(-.105,1.090,.219),v(0,1.094,.233),v(.105,1.090,.219),v(.170,1.070,.185)],.007);
 for(const s of [-1,1]){
  wire([v(s*.174,1.070,.183),v(s*.181,.993,.220),v(s*.173,.889,.254),v(s*.117,.802,.239)],.007);
 }
 for(let row=0;row<5;row++){
  const y=.831+row*.049,spread=.125+.047*Math.sin((row+1)*Math.PI/6);
  const z=.252+(row===2?.021:row===1||row===3?.014:0);
  wire([v(-spread,y,.207),v(-spread*.55,y-.004,z),v(0,y-.008,z+.009),v(spread*.55,y-.004,z),v(spread,y,.207)]);
 }
 for(let i=-2;i<=2;i++){
  const x=i*.056;
  wire([v(x*.88,1.080,.225),v(x,1.002,.261),v(x*.92,.919,.281),v(x*.74,.827,.250)]);
 }
 wire([v(-.126,.810,.226),v(0,.790,.258),v(.126,.810,.226)],.0065);
 // A padded throat bib is a separate model part, tucked below the chin.
 const bib=oval(0,.686,.062,.159,.102,.118,padMat);bib.name='padded-throat-guard';
 return root;
}
