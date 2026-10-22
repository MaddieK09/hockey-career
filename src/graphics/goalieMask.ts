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
  const m=add(new THREE.SphereGeometry(1,56,40),material,parent);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;
 };
 const panel=(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,r=.015)=>{
  const m=add(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.3,h*.3,d*.3)),material);m.position.set(x,y,z);return m;
 };
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const cage=new THREE.Group();cage.name='three-dimensional-wire-cage';root.add(cage);
 const wire=(points:THREE.Vector3[],radius=.0048)=>{
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(16,points.length*9),radius,8,false),metalMat,cage);
 };
 // Final fit: mask sits around the face, not out in front of it.
 // The back shell is a compact, sculpted skull wrap with integrated cheek wings.
 const crown=oval(0,.947,-.065,.237,.250,.203,shellMat);
 crown.name='fitted-crown-shell';
 const rear=oval(0,.906,-.153,.208,.181,.112,shellMat);
 rear.name='rear-occipital-protection';
 // An inset front brow follows the forehead rather than forming a floating ring.
 const brow=oval(0,1.073,.097,.181,.048,.102,shellMat);
 brow.name='integrated-brow';
 for(const s of [-1,1]){
  const temple=oval(s*.165,.935,-.007,.063,.151,.157,shellMat);
  temple.rotation.z=-s*.13;
  const cheek=oval(s*.141,.848,.095,.075,.112,.117,shellMat);
  cheek.rotation.z=s*.24;
  const jaw=oval(s*.093,.799,.118,.079,.080,.092,shellMat);
  jaw.rotation.z=s*.32;
  jaw.rotation.x=-.17;
  oval(s*.183,.927,-.084,.011,.075,.085,linerMat);
  // Small vent slots, cutout-style dark insets along the temples.
  for(let i=0;i<3;i++)panel(s*.196,.987+i*.023,-.059,.010,.009,.039,linerMat,.004);
 }
 // Chin protection is tucked into the jaw wings, not stacked on the face.
 const chin=oval(0,.774,.132,.138,.075,.102,shellMat);
 chin.name='integrated-angled-chin-cup';
 chin.rotation.x=-.36;
 const lowerChin=oval(0,.738,.112,.109,.042,.074,shellMat);
 lowerChin.rotation.x=-.40;
 const chinLiner=oval(0,.763,.210,.100,.019,.022,linerMat);
 chinLiner.rotation.x=-.36;
 // Cage profile: reduced projection and curved bar paths follow the shell.
 wire([v(-.163,1.064,.166),v(-.096,1.081,.195),v(0,1.087,.206),v(.096,1.081,.195),v(.163,1.064,.166)],.0065);
 for(const s of [-1,1]){
  wire([v(s*.166,1.063,.168),v(s*.177,.989,.205),v(s*.169,.889,.227),v(s*.116,.806,.215)],.0065);
 }
 for(let row=0;row<5;row++){
  const y=.832+row*.047,spread=.121+.046*Math.sin((row+1)*Math.PI/6);
  const z=.225+(row===2?.015:row===1||row===3?.010:0);
  wire([v(-spread,y,.190),v(-spread*.55,y-.004,z),v(0,y-.007,z+.008),v(spread*.55,y-.004,z),v(spread,y,.190)],.0046);
 }
 for(let i=-2;i<=2;i++){
  const x=i*.054;
  wire([v(x*.88,1.076,.195),v(x,1.001,.230),v(x*.93,.920,.246),v(x*.75,.829,.222)],.0044);
 }
 wire([v(-.118,.821,.207),v(-.061,.798,.224),v(0,.777,.222),v(.061,.798,.224),v(.118,.821,.207)],.0055);
 // A flexible dangler-style throat shield sits directly under the chin.
 const shield=oval(0,.689,.086,.141,.099,.091,padMat);
 shield.rotation.x=-.22;
 shield.name='throat-and-neck-shield';
 oval(0,.635,.026,.135,.075,.113,padMat);
 return root;
}
