import type {Part} from './playerBody';
import {bodyDimensions} from './playerBody';
import type {PlayerAppearance} from '../player/appearance';
import {COLORS,Equipment} from '../player/equipment';
import type {Position} from '../player/types';
/** Independent equipment pieces; all positions share the same scaled body coordinates. */
export function equipmentParts(e:Equipment,position:Position,p?:PlayerAppearance):Part[]{
 const {height,width}=p?bodyDimensions(p):{height:1,width:1};
 const a:Part[]=[];
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x*width,y*height,z*width],scale:[sx*width,sy*height,sz*width],color});
 const goalie=position==='G',jersey=COLORS[e.jersey],helmet=COLORS[e.helmet],gloves=COLORS[e.gloves],pads=COLORS[e.pads];
 const trim='#d5e0e9',dark='#182431',blade='#9eabb6',shadow='#10293e';
 // Rounded jersey and chest protection; broader shoulders for goaltenders.
 add(0,.07,.01,goalie?.405:.355,.46,goalie?.30:.235,jersey);
 add(0,.34,.015,goalie?.425:.39,.145,.245,jersey);
 add(0,-.30,.025,.315,.31,.22,jersey);
 add(0,-.67,.025,.30,.23,.235,jersey);
 if(goalie){add(0,.14,.25,.31,.27,.085,jersey);add(0,-.08,.29,.27,.13,.07,jersey);add(0,.42,.20,.28,.095,.08,trim);}
 for(const side of [-1,1]){
  add(side*.38,.26,.025,goalie?.205:.17,.22,.195,jersey);
  add(side*.405,-.09,.025,goalie?.17:.145,.37,.17,jersey);
  add(side*.415,-.44,.035,.145,.25,.15,jersey);
  add(side*.42,-.68,.10,goalie?.16:.145,.17,.16,gloves);
  add(side*.17,-.99,.02,.185,.29,.205,jersey);
  if(goalie){
   add(side*.17,-1.36,.15,.225,.36,.25,pads);
   add(side*.17,-1.69,.15,.225,.31,.25,pads);
   add(side*.17,-1.53,.37,.19,.46,.055,pads);add(side*.17,-1.53,.432,.155,.40,.016,trim);
   for(let j=0;j<5;j++)add(side*.17,-1.26-j*.145,.425,.185,.009,.012,trim);
   add(side*.17,-1.82,.31,.17,.06,.085,dark);
  }else{
   add(side*.17,-1.42,.05,.155,.30,.17,jersey);
   add(side*.17,-1.68,.08,.145,.17,.16,trim);
   add(side*.17,-1.71,.225,.13,.07,.025,shadow);
  }
  add(side*.17,-1.91,.15,.16,.125,.28,dark);
  add(side*.17,-2.015,.15,.14,.024,.27,blade);
 }
 // Helmet and ear guards; keep the eyes visible beneath the skater visor.
 add(0,1.19,-.015,.275,.125,.265,helmet);
 for(const side of [-1,1]){add(side*.24,1.04,.012,.07,.155,.18,helmet);add(side*.18,1.16,-.13,.075,.12,.15,helmet);}
 if(goalie){
  add(0,1.045,.29,.215,.22,.027,trim);
  for(let i=-2;i<=2;i++)add(i*.079,1.04,.326,.009,.19,.014,dark);
  for(let j=0;j<5;j++)add(0,.88+j*.082,.338,.21,.008,.013,dark);
  add(-.42,-.70,.18,.22,.21,.18,gloves);
  add(-.42,-.72,.31,.19,.17,.045,trim);
  add(.42,-.70,.18,.23,.21,.18,gloves);
  add(.42,-.71,.31,.17,.16,.03,trim);
 }else{
  add(0,1.04,.28,.21,.052,.024,trim);add(0,1.065,.307,.18,.042,.011,'#9ab6c7');
  add(0,.97,.288,.19,.012,.012,blade);
 }
 const stick=e.stick==='White'?'#e5e9ed':e.stick==='Natural'?'#b99164':'#252b33';
 add(.47,-1.31,.18,.025,.57,.025,stick);
 add(.47,-1.77,.18,.025,.34,.025,stick);
 add(.34,-2.035,.18,.17,.033,.05,stick);
 return a;
}
