import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import type {Position} from '../player/types';
import {mountPlayer3D} from './player3d';

/** An optional, licensed GLB asset is stored at public/models/player.glb.
 * Until an asset is installed, the current procedural preview stays usable.
 * Asset must be upright, with a compatible animation skeleton for future work.
 */
export function mountImportedPlayer3D(host:HTMLElement,p:PlayerAppearance,e:Equipment,position:Position){
 let fallback:ReturnType<typeof mountPlayer3D>|null=null;
 let renderer:THREE.WebGLRenderer|null=null;
 let scene:THREE.Scene|null=null;
 let camera:THREE.PerspectiveCamera|null=null;
 let model:THREE.Group|null=null;
 let disposed=false,request=0,angle=0,zoom=1;
 let observer:ResizeObserver|null=null;
 let canvas:HTMLCanvasElement|null=null;
 const assetUrl=`${import.meta.env.BASE_URL}models/player.glb`;
 const showFallback=()=>{
  if(disposed)return;
  observer?.disconnect();observer=null;
  renderer?.dispose();renderer?.domElement.remove();renderer=null;
  fallback=mountPlayer3D(host,p,e,position);
 };
 // Only attempt the imported model when it has actually been installed.
 fetch(assetUrl,{method:'HEAD'}).then(response=>{
  if(!response.ok||disposed){showFallback();return;}
  scene=new THREE.Scene();
  scene.background=new THREE.Color('#0e2236');
  scene.add(new THREE.HemisphereLight(0xe8f2ff,0x253a55,2.0));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(-3,5,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0x9fc8ff,1.2);rim.position.set(4,3,-4);scene.add(rim);
  camera=new THREE.PerspectiveCamera(36,1,.01,100);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  canvas=renderer.domElement;canvas.className='player-3d-canvas';
  canvas.setAttribute('aria-label','Imported 3D player preview');
  host.replaceChildren(canvas);
  const resize=()=>{if(!renderer||!camera)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const render=()=>{if(disposed||!renderer||!scene||!camera)return;if(model)model.rotation.y=angle;renderer.render(scene,camera);};
  const setFraming=()=>{if(!model||!camera)return;const bounds=new THREE.Box3().setFromObject(model);const size=bounds.getSize(new THREE.Vector3());const center=bounds.getCenter(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)return;const radius=Math.max(size.y,size.x*1.8,size.z*1.8);camera.position.set(center.x,center.y,radius*1.9*zoom);camera.lookAt(center);camera.near=Math.max(.01,radius*.01);camera.far=Math.max(100,radius*30);camera.updateProjectionMatrix();};
  const pointers=new Map<number,{x:number;y:number}>();
  const dist=()=>{const pts=[...pointers.values()];return pts.length<2?null:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);};
  let pinch:number|null=null;
  const down=(event:PointerEvent)=>{pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas?.setPointerCapture(event.pointerId);pinch=dist();};
  const move=(event:PointerEvent)=>{const prev=pointers.get(event.pointerId);if(!prev)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1){angle+=(event.clientX-prev.x)*.012;}else{const next=dist();if(next&&pinch)zoom=THREE.MathUtils.clamp(zoom*pinch/next,.65,2.5);pinch=next;setFraming();}render();};
  const up=(event:PointerEvent)=>{pointers.delete(event.pointerId);pinch=dist();};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom+event.deltaY*.001,.65,2.5);setFraming();render();},{passive:false});
  canvas.addEventListener('dblclick',()=>{angle=0;zoom=1;setFraming();render();});
  observer=new ResizeObserver(()=>{resize();render();});observer.observe(host);resize();
  new GLTFLoader().load(assetUrl,gltf=>{
   if(disposed)return;
   model=gltf.scene;
   const bounds=new THREE.Box3().setFromObject(model);
   const center=bounds.getCenter(new THREE.Vector3());
   model.position.sub(center); // Center imported asset at the origin.
   scene?.add(model);
   setFraming();render();
  },undefined,()=>showFallback());
 }).catch(()=>showFallback());
 return {
  update:(nextP:PlayerAppearance,nextE:Equipment,nextPosition:Position)=>{
   p=nextP;e=nextE;position=nextPosition;
   fallback?.update(p,e,position);
   // Imported meshes require separate equipment attachment and morph targets.
  },
  dispose:()=>{disposed=true;cancelAnimationFrame(request);observer?.disconnect();fallback?.dispose();renderer?.dispose();host.replaceChildren();}
 };
}
