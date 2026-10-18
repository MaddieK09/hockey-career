import * as THREE from 'three';
import {COLORS, type Equipment} from '../player/equipment';
import type {Position} from '../player/types';

/** Hockey gear overlay for imported humanoid preview.
 * Coordinates are normalized to a 2-unit tall model, centred at the origin.
 * Prototype geometry is deliberately separate from the licensed character mesh.
 */
export function createHockeyEquipment(e:Equipment,position:Position,externalPads=false):THREE.Group{
 const group=new THREE.Group();
 const goalie=position==='G';
 const jersey=COLORS[e.jersey],helmet=COLORS[e.helmet],gloves=COLORS[e.gloves],pads=COLORS[e.pads];
 const dark='#172331',silver='#c7d3dc';
 const material=(color:string,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:.65,metalness});
 const piece=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,rounded=true)=>{
  const mesh=new THREE.Mesh(rounded?new THREE.SphereGeometry(1,16,12):new THREE.BoxGeometry(1,1,1),material(color));
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);group.add(mesh);return mesh;
 };
 // Model coordinates: head at +.8, skates at -.95; camera looks toward +Z.
 piece(0,.18,.04,.33,.38,.21,jersey);
 piece(0,-.18,.04,.27,.23,.19,jersey);
 piece(0,-.43,.02,.29,.16,.19,jersey);
 for(const s of [-1,1]){
  piece(s*.33,.27,0,.15,.18,.16,jersey);
  piece(s*.39,.02,.02,.12,.29,.13,jersey);
  piece(s*.4,-.22,.09,.135,.14,.12,gloves);
  piece(s*.145,-.56,.03,.135,.20,.15,jersey);
  if(goalie){
   if(!externalPads){piece(s*.145,-.77,.16,.15,.26,.19,pads,false);
   piece(s*.145,-.80,.27,.12,.21,.025,silver,false);
   piece(s*.145,-.63,.285,.13,.018,.025,pads,false);
   piece(s*.145,-.92,.285,.13,.018,.025,pads,false);}
  }else{
   piece(s*.145,-.77,.03,.115,.20,.125,jersey);
   piece(s*.145,-.86,.14,.11,.09,.09,silver);
  }
  piece(s*.145,-.96,.13,.13,.08,.22,dark);
  piece(s*.145,-1.015,.13,.12,.012,.21,silver,false);
 }
 // Helmet shell and face opening / goalie cage.
 piece(0,.82,-.015,.22,.17,.21,helmet);
 for(const s of [-1,1])piece(s*.19,.76,.025,.055,.11,.12,helmet);
 if(goalie){
  for(let i=-2;i<=2;i++)piece(i*.075,.77,.215,.006,.16,.008,silver,false);
  for(let j=0;j<4;j++)piece(0,.65+j*.075,.225,.19,.006,.008,silver,false);
  piece(-.4,-.22,.17,.14,.15,.12,gloves);
  piece(.4,-.22,.17,.14,.15,.12,gloves);
 }else{
  piece(0,.72,.205,.17,.025,.015,silver,false);
 }
 const stick=e.stick==='White'?'#e8eef2':e.stick==='Natural'?'#ba9466':dark;
 piece(.52,-.55,.18,.019,.51,.02,stick,false);
 piece(.43,-1.04,.18,.12,.025,.04,stick,false);
 return group;
}
