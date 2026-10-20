import * as THREE from 'three';
import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import type {Position} from '../player/types';
import {buildHockeyPlayerModel,disposeHockeyPlayerModel} from './hockeyPlayerModel';

/** Mobile-first, lit and rotatable 3D showroom. No custom raw WebGL shader/ball model. */
export function mountPlayer3D(host:HTMLElement,initial:PlayerAppearance,initialEquipment:Equipment,initialPosition:Position){
 let renderer:THREE.WebGLRenderer;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 }catch{
  host.textContent='3D preview is unavailable on this device.';
  return {update:(_p:PlayerAppearance,_e:Equipment,_position:Position)=>{},dispose:()=>{host.replaceChildren();}};
 }
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.18;
 const canvas=renderer.domElement;
 canvas.className='player-3d-canvas';
 canvas.setAttribute('aria-label','Rotatable 3D hockey player with detailed equipment');
 canvas.setAttribute('role','img');
 host.replaceChildren(canvas);

 const scene=new THREE.Scene();
 scene.background=new THREE.Color('#0b1e30');
 scene.add(new THREE.HemisphereLight('#eaf5ff','#213a51',2.05));
 const key=new THREE.DirectionalLight('#fff2e3',2.85);key.position.set(-3.5,5,6);scene.add(key);
 const fill=new THREE.DirectionalLight('#88c9ff',1.05);fill.position.set(4,2,-4);scene.add(fill);
 const rim=new THREE.DirectionalLight('#d1eaff',1.4);rim.position.set(0,4,-5);scene.add(rim);

 // Low-cost studio floor and contact shadow: no expensive dynamic shadows on iPhone.
 const floorMat=new THREE.MeshStandardMaterial({color:'#143148',roughness:.8,metalness:.04});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),floorMat);
 floor.rotation.x=-Math.PI/2;floor.position.y=-2.114;scene.add(floor);
 const shadowMat=new THREE.MeshBasicMaterial({color:'#010b14',transparent:true,opacity:.30,depthWrite:false});
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,48),shadowMat);
 shadow.rotation.x=-Math.PI/2;shadow.scale.set(.86,.58,1);shadow.position.y=-2.110;scene.add(shadow);
 const circleMat=new THREE.MeshBasicMaterial({color:'#5281a0',transparent:true,opacity:.22,depthWrite:false});
 const circle=new THREE.Mesh(new THREE.RingGeometry(1.12,1.13,64),circleMat);
 circle.rotation.x=-Math.PI/2;circle.position.y=-2.109;scene.add(circle);

 const camera=new THREE.PerspectiveCamera(37,1,.1,60);
 let player=buildHockeyPlayerModel(initial,initialEquipment,initialPosition);
 scene.add(player);
 let angle=0,zoom=1,disposed=false,frame=0;
 const positionCamera=()=>{
  camera.position.set(0,-.42,5.9*zoom);
  camera.lookAt(0,-.42,0);
  camera.updateProjectionMatrix();
 };
 const render=()=>{
  if(disposed)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){
   renderer.setSize(w,h,false);
   camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  player.rotation.y=angle;
  positionCamera();renderer.render(scene,camera);
 };
 const requestRender=()=>{if(disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;render();});};
 const observer=new ResizeObserver(requestRender);observer.observe(host);
 const pointers=new Map<number,{x:number;y:number}>();
 const pointerDistance=()=>{
  if(pointers.size<2)return null;
  const [a,b]=[...pointers.values()];
  return Math.hypot(a.x-b.x,a.y-b.y);
 };
 let previousPinch:number|null=null;
 const down=(ev:PointerEvent)=>{
  pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  try{canvas.setPointerCapture(ev.pointerId);}catch{/* No capture on this browser. */}
  previousPinch=pointerDistance();
 };
 const move=(ev:PointerEvent)=>{
  const previous=pointers.get(ev.pointerId);if(!previous)return;
  pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(pointers.size>=2){
   const next=pointerDistance();
   if(previousPinch!==null&&next!==null&&next>0)
    zoom=THREE.MathUtils.clamp(zoom*previousPinch/next,.72,2.3);
   previousPinch=next;
  }else{
   angle+=(ev.clientX-previous.x)*.012;
  }
  requestRender();
 };
 const up=(ev:PointerEvent)=>{pointers.delete(ev.pointerId);previousPinch=pointerDistance();};
 const wheel=(ev:WheelEvent)=>{ev.preventDefault();zoom=THREE.MathUtils.clamp(zoom+ev.deltaY*.001,.72,2.3);requestRender();};
 const reset=()=>{angle=0;zoom=1;requestRender();};
 canvas.addEventListener('pointerdown',down);
 canvas.addEventListener('pointermove',move);
 canvas.addEventListener('pointerup',up);
 canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',wheel,{passive:false});
 canvas.addEventListener('dblclick',reset);
 requestRender();
 return {
  update:(p:PlayerAppearance,e:Equipment,position:Position)=>{
   if(disposed)return;
   const next=buildHockeyPlayerModel(p,e,position);
   next.rotation.y=angle;
   scene.remove(player);
   disposeHockeyPlayerModel(player);
   player=next;scene.add(player);requestRender();
  },
  dispose:()=>{
   if(disposed)return;disposed=true;
   cancelAnimationFrame(frame);observer.disconnect();
   canvas.removeEventListener('pointerdown',down);
   canvas.removeEventListener('pointermove',move);
   canvas.removeEventListener('pointerup',up);
   canvas.removeEventListener('pointercancel',up);
   canvas.removeEventListener('wheel',wheel);
   canvas.removeEventListener('dblclick',reset);
   scene.remove(player);disposeHockeyPlayerModel(player);
   floor.geometry.dispose();floorMat.dispose();
   shadow.geometry.dispose();shadowMat.dispose();
   circle.geometry.dispose();circleMat.dispose();
   renderer.dispose();host.replaceChildren();
  }
 };
}
