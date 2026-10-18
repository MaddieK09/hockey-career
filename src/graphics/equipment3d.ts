import type {Part} from './playerBody';
import {COLORS,Equipment} from '../player/equipment';
import type {Position} from '../player/types';

/** Modular, low-poly equipment shapes. Coordinates match playerBody's standing pose. */
export function equipmentParts(e:Equipment,position:Position):Part[]{
 const a:Part[]=[];
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x,y,z],scale:[sx,sy,sz],color});
 const isGoalie=position==='G';
 const jersey=COLORS[e.jersey],helmet=COLORS[e.helmet],gloves=COLORS[e.gloves],pads=COLORS[e.pads];
 const trim='#d5e0e9',dark='#182431',blade='#9eabb6';
 // Chest protector / shoulder silhouette and uniform layers.
 add(0,.05,.025,isGoalie?.405:.36,.43,isGoalie?.29:.235,jersey);
 add(0,.35,.012,isGoalie?.47:.405,.17,.245,jersey);
 add(0,-.43,.035,.31,.24,.22,jersey);
 for(const side of [-1,1]){
  add(side*.41,.20,.025,isGoalie?.225:.185,.205,.20,jersey);
  add(side*.44,-.13,.025,isGoalie?.18:.15,.29,.17,jersey);
  add(side*.46,-.46,.04,.135,.19,.15,jersey);
  add(side*.47,-.77,.08,isGoalie?.16:.14,.15,.15,gloves);
  // Pants, stockings, boot and narrow metal skate blade.
  add(side*.175,-1.08,.02,.18,.30,.195,jersey);
  if(isGoalie){
   add(side*.175,-1.48,.16,.20,.43,.22,pads);
   add(side*.175,-1.50,.35,.125,.36,.045,pads);
   for(let j=0;j<3;j++)add(side*.175,-1.27-j*.17,.405,.145,.018,.016,trim);
  }else{
   add(side*.175,-1.53,.06,.14,.25,.15,jersey);
   add(side*.175,-1.76,.08,.14,.13,.14,trim);
  }
  add(side*.175,-1.89,.16,.16,.12,.29,dark);
  add(side*.175,-2.01,.16,.16,.025,.27,blade);
  add(side*.175,-2.035,.16,.11,.018,.30,trim);
 }
 // Helmet covers scalp/hair; front cage floats just in front of the face.
 add(0,1.235,-.015,.288,.125,.277,helmet);
 add(-.245,1.08,.012,.065,.145,.16,helmet);
 add(.245,1.08,.012,.065,.145,.16,helmet);
 if(isGoalie){
  add(0,1.045,.292,.225,.225,.033,trim);
  for(let i=-2;i<=2;i++)add(i*.077,1.05,.333,.010,.19,.015,dark);
  for(let j=0;j<4;j++)add(0,.91+j*.086,.346,.218,.010,.012,dark);
  // Goalie-specific blocker (stick hand) and catcher.
  add(-.48,-.75,.20,.19,.17,.13,gloves);
  add(-.48,-.76,.305,.16,.14,.035,trim);
  add(.48,-.75,.19,.17,.20,.17,gloves);
 }else{
  add(0,1.06,.298,.20,.055,.025,trim);
 }
 const stick=e.stick==='White'?'#e5e9ed':e.stick==='Natural'?'#b99164':'#252b33';
 // Stick shaft meets right glove; blade lies just above the ice.
 add(.49,-1.30,.17,.027,.56,.027,stick);
 add(.49,-1.77,.17,.027,.35,.027,stick);
 add(.38,-2.035,.18,.17,.035,.055,stick);
 return a;
}
