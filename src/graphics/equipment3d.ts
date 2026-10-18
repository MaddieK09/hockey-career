import type {Part} from './playerBody';
import {COLORS,Equipment} from '../player/equipment';
import type {Position} from '../player/types';
export function equipmentParts(e:Equipment,position:Position):Part[]{
 const a:Part[]=[];const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x,y,z],scale:[sx,sy,sz],color});
 add(0,.03,.012,.357,.46,.232,COLORS[e.jersey]);add(0,.33,.012,.405,.19,.235,COLORS[e.jersey]);
 add(0,1.28,0,.292,.13,.274,COLORS[e.helmet]);
 for(const side of [-1,1]){
  add(side*.41,.12,.01,.19,.19,.20,COLORS[e.jersey]);
  add(side*.43,-.13,.01,.157,.27,.16,COLORS[e.jersey]);
  add(side*.47,-.77,.045,.14,.15,.13,COLORS[e.gloves]);
  add(side*.175,-1.90,.16,.17,.14,.28,'#171d27');
  add(side*.175,-2.03,.16,.17,.025,.28,'#b6c5d0');
  if(position==='G')add(side*.175,-1.46,.16,.18,.48,.21,COLORS[e.pads]);
 }
 if(position==='G'){add(0,1.03,.284,.225,.19,.038,'#bfc9d0');for(let i=-2;i<=2;i++)add(i*.078,1.04,.32,.011,.16,.014,'#313c4a');}
 const stick=e.stick==='White'?'#e5e9ed':e.stick==='Natural'?'#b99164':'#252b33';
 add(.63,-.84,.20,.025,1.03,.025,stick);add(.51,-1.88,.20,.16,.035,.045,stick);
 return a;
}
