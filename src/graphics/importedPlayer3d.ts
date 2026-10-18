import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import type {Position} from '../player/types';
import {mountPlayer3D} from './player3d';
import {createHockeyEquipment} from './importedHockeyGear';

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
 let gear:THREE.Group|null=null;
 let gearHeight=1;
 let gearCenter=new THREE.Vector3();
 let externalPads:THREE.Group|null=null;
 let modelBounds=new THREE.Vector3(1,2,1);
 const clearGear=()=>{if(!gear)return;gear.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const m=Array.isArray(obj.material)?obj.material:[obj.material];m.forEach(mat=>mat.dispose());}});gear.parent?.remove(gear);gear=null;};
 const refreshGear=()=>{if(!model)return;clearGear();gear=createHockeyEquipment(e,position,externalPads!==null);gear.scale.setScalar(gearHeight/2);gear.position.copy(gearCenter);model.add(gear);if(externalPads)externalPads.visible=position==='G';};
 let disposed=false,angle=0,zoom=1;
 let observer:ResizeObserver|null=null;
 let canvas:HTMLCanvasElement|null=null;
 let loadGeneration=0;
 let mixer:THREE.AnimationMixer|null=null;
 let animationFrame=0;
 const clock=new THREE.Clock();
 const assetUrl=`${import.meta.env.BASE_URL}models/player.glb`;
 const showFallback=()=>{
  if(disposed)return;
  observer?.disconnect();observer=null;
  cancelAnimationFrame(animationFrame);animationFrame=0;
  renderer?.dispose();renderer?.domElement.remove();renderer=null;
  if(fallback)return;
  fallback=mountPlayer3D(host,p,e,position);
 };
 // Only attempt the imported model when it has actually been installed.
 fetch(assetUrl,{method:'HEAD'}).then(response=>{
  if(disposed)return;
  if(!response.ok){showFallback();return;}
  scene=new THREE.Scene();
  scene.background=new THREE.Color('#0e2236');
  scene.add(new THREE.HemisphereLight(0xe8f2ff,0x253a55,2.0));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(-3,5,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0x9fc8ff,1.2);rim.position.set(4,3,-4);scene.add(rim);
  camera=new THREE.PerspectiveCamera(36,1,.01,100);
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{showFallback();return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  canvas=renderer.domElement;canvas.className='player-3d-canvas';
  canvas.setAttribute('aria-label','Imported 3D player preview');
  host.replaceChildren(canvas);
  const resize=()=>{if(!renderer||!camera)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();setFraming();};
  const render=()=>{if(disposed||!renderer||!scene||!camera)return;if(model)model.rotation.y=angle;renderer.render(scene,camera);};
  let modelSize=1;
  const setFraming=()=>{if(!model||!camera)return;const aspect=Math.max(.3,camera.aspect);const verticalFov=THREE.MathUtils.degToRad(camera.fov);const horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*aspect);const fitDistance=Math.max(modelBounds.y/(2*Math.tan(verticalFov/2)),modelBounds.x/(2*Math.tan(horizontalFov/2)));camera.position.set(0,0,fitDistance*1.13*zoom);camera.lookAt(0,0,0);camera.near=.01;camera.far=Math.max(100,modelSize*40);camera.updateProjectionMatrix();};
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
  const generation=++loadGeneration;
  new GLTFLoader().load(assetUrl,gltf=>{
   if(generation!==loadGeneration)return;
   if(disposed)return;
   model=gltf.scene;
   // Reset the rig to its bind/rest pose: a static creator must not show a walking frame.
   model.traverse(obj=>{if(obj instanceof THREE.SkinnedMesh)obj.skeleton.pose();});
   model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model);
   const center=bounds.getCenter(new THREE.Vector3());
   const size=bounds.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.y)||size.y<.01){showFallback();return;}
   model.position.sub(center); // Center the mesh, without moving its skeleton bones.
   gearHeight=size.y;gearCenter=center.clone();refreshGear();
   modelSize=Math.max(size.y,size.x*1.6,size.z*1.6);
   // Include equipment in the fit, so skates and the stick are never clipped.
   const combined=new THREE.Box3().setFromObject(model);
   modelBounds=combined.getSize(new THREE.Vector3());
   scene?.add(model);
   // Optional licensed hockey-specific pads can replace the prototype leg pads.
   const padsUrl=`${import.meta.env.BASE_URL}models/goalie-pads.glb`;
   new GLTFLoader().load(padsUrl,padsGltf=>{
    if(disposed||generation!==loadGeneration||!model)return;
    externalPads=padsGltf.scene;
    const padsBounds=new THREE.Box3().setFromObject(externalPads);
    const padsSize=padsBounds.getSize(new THREE.Vector3());
    if(padsSize.y>.001){
     externalPads.scale.setScalar((gearHeight*.35)/padsSize.y);
     externalPads.position.set(gearCenter.x,gearCenter.y-gearHeight*.34,gearCenter.z+gearHeight*.09);
     model.add(externalPads);refreshGear();
     modelBounds=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());setFraming();
    }
   },undefined,()=>{/* Optional pads missing: keep prototype pads. */});
   // Do not autoplay unrelated walking or running clips in a static player creator.
   // No animation playback in the creator. Animations are retained in the GLB for future gameplay.
   const tick=()=>{if(disposed||!renderer)return;animationFrame=requestAnimationFrame(tick);if(mixer)mixer.update(Math.min(clock.getDelta(),.05));render();};
   setFraming();tick();
  },undefined,()=>showFallback());
 }).catch(()=>showFallback());
 return {
  update:(nextP:PlayerAppearance,nextE:Equipment,nextPosition:Position)=>{
   p=nextP;e=nextE;position=nextPosition;
   fallback?.update(p,e,position);
   refreshGear();
   if(model){model.updateMatrixWorld(true);modelBounds=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());}
   // Appearance morph targets still require a compatible custom character asset.
  },
  dispose:()=>{disposed=true;loadGeneration++;cancelAnimationFrame(animationFrame);observer?.disconnect();fallback?.dispose();mixer?.stopAllAction();clearGear();model?.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials)material.dispose();}});renderer?.dispose();host.replaceChildren();}
 };
}
