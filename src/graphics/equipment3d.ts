import type {Part} from './playerBody';
import {bodyDimensions} from './playerBody';
import type {PlayerAppearance} from '../player/appearance';
import {COLORS,Equipment} from '../player/equipment';
import type {Position} from '../player/types';
/** Gear shares the anatomy coordinate system, including height and mass scaling. */
export function equipmentParts(e:Equipment,position:Position,p?:PlayerAppearance):Part[]{
 const {height,width}=p?bodyDimensions(p):{height:1,width:1};
 const a:Part[]=[];
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x*width,y*height,z*width],scale:[sx*width,sy*height,sz*width],color});
 const goalie=position==='G',jersey=COLORS[e.jersey],helmet=COLORS[e.helmet],gloves=COLORS[e.gloves],pads=COLORS[e.pads];
 const trim='#d5e0e9',dark='#182431',blade='#9eabb6';
 // Uniform covers the underlying torso and follows the player's build.
 add(0,.10,.01,goalie?.395:.35,.38,goalie?.28:.225,jersey);
 add(0,.33,.01,goalie?.42:.39,.14,.23,jersey);
 add(0,-.30,.025,.29,.27,.21,jersey);
 add(0,-.67,.025,.31,.21,.23,jersey);
 for(const side of [-1,1]){
  add(side*.38,.24,.025,goalie?.19:.16,.18,.185,jersey);
  add(side*.40,-.04,.025,goalie?.16:.14,.29,.165,jersey);
  add(side*.42,-.38,.035,.135,.22,.15,jersey);
  add(side*.42,-.69,.10,goalie?.15:.13,.16,.15,gloves);
  add(side*.17,-.98,.02,.18,.28,.20,jersey);
  if(goalie){
   // Overlapping knee/thigh pad and boot pad give a broad continuous profile.
   add(side*.17,-1.37,.145,.20,.35,.22,pads);
   add(side*.17,-1.69,.15,.205,.30,.23,pads);
   add(side*.17,-1.54,.34,.17,.44,.05,pads);
   for(let j=0;j<4;j++)add(side*.17,-1.30-j*.16,.394,.16,.012,.012,trim);
   add(side*.17,-1.81,.31,.15,.055,.08,dark);
  }else{
   add(side*.17,-1.42,.05,.145,.29,.16,jersey);
   add(side*.17,-1.68,.08,.14,.16,.15,trim);
  }
  add(side*.17,-1.91,.15,.155,.12,.28,dark);
  add(side*.17,-2.015,.15,.14,.024,.27,blade);
 }
 // Helmet shell wraps the top and sides of the face; mask bars stay forward.
 add(0,1.19,-.015,.267,.115,.258,helmet);
 for(const side of [-1,1]){
  add(side*.24,1.04,.012,.067,.155,.17,helmet);
  add(side*.18,1.16,-.13,.075,.12,.15,helmet);
 }
 if(goalie){
  add(0,1.045,.29,.205,.21,.026,trim);
  for(let i=-2;i<=2;i++)add(i*.075,1.04,.323,.009,.19,.013,dark);
  for(let j=0;j<5;j++)add(0,.88+j*.082,.334,.204,.008,.012,dark);
  // Catcher is a broad pocket, blocker a flat rectangular board.
  add(-.42,-.70,.18,.17,.19,.15,gloves);
  add(-.42,-.72,.29,.18,.15,.04,trim);
  add(.42,-.70,.18,.18,.19,.16,gloves);
  add(.42,-.71,.28,.145,.13,.025,trim);
 }else{
  add(0,1.04,.28,.20,.05,.023,trim);
 }
 const stick=e.stick==='White'?'#e5e9ed':e.stick==='Natural'?'#b99164':'#252b33';
 add(.46,-1.31,.18,.025,.57,.025,stick);
 add(.46,-1.77,.18,.025,.34,.025,stick);
 add(.34,-2.035,.18,.17,.033,.05,stick);
 return a;
}
