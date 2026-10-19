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
 const stripe='#f1f4f7';
 // Rounded jersey and chest protection; broader shoulders for goaltenders.
 add(0,.07,.01,goalie?.34:.31,.40,goalie?.245:.21,jersey);
 add(0,.34,.015,goalie?.355:.325,.105,.21,jersey);
 // Subtle jersey yoke and side panels separate the uniform from the body.
 add(0,.385,.16,goalie?.30:.285,.045,.10,jersey);
 add(0,-.30,.025,.285,.24,.20,jersey);
 add(0,-.67,.025,.275,.18,.20,jersey);
 // Front-facing jersey bands, collar and hem make the uniform legible at phone size.
 add(0,.435,.192,.175,.023,.032,trim);
 add(0,-.225,.225,.277,.018,.019,stripe);
 add(0,-.277,.22,.28,.012,.018,dark);
 add(0,-.49,.22,.24,.012,.018,stripe);
 if(goalie){add(0,.14,.25,.31,.27,.085,jersey);add(0,-.08,.29,.27,.13,.07,jersey);add(0,.42,.20,.28,.095,.08,trim);}
 for(const side of [-1,1]){
  add(side*.38,.26,.025,goalie?.16:.14,.19,.155,jersey);
  add(side*.39,.08,.174,goalie?.12:.105,.16,.02,jersey);
  add(side*.405,-.09,.025,goalie?.135:.12,.32,.14,jersey);
  // Sleeve banding follows the arm instead of floating over the chest.
  add(side*.409,-.22,.161,.115,.019,.017,stripe);
  add(side*.415,-.44,.035,.12,.21,.13,jersey);
  add(side*.42,-.68,.10,goalie?.135:.12,.14,.135,gloves);
  add(side*.17,-.99,.02,.15,.25,.17,jersey);
  if(goalie){
   add(side*.17,-1.36,.15,.19,.34,.19,pads);
   add(side*.17,-1.69,.15,.19,.28,.19,pads);
   add(side*.17,-1.53,.37,.17,.43,.04,pads);add(side*.17,-1.53,.432,.14,.38,.012,trim);
   for(let j=0;j<5;j++)add(side*.17,-1.26-j*.145,.425,.16,.008,.01,trim);
   // Knee break and vertical outside roll help identify the goalie pad shape.
   add(side*.17,-1.38,.431,.17,.03,.018,trim);
   add(side*.17+side*.19,-1.53,.36,.028,.39,.035,pads);
   add(side*.17,-1.82,.31,.17,.06,.085,dark);
  }else{
   add(side*.17,-1.42,.05,.13,.28,.14,jersey);
   add(side*.17,-1.68,.08,.125,.16,.13,trim);
   add(side*.17,-1.71,.225,.11,.06,.02,shadow);
  }
  add(side*.17,-1.91,.15,.14,.10,.25,dark);
  add(side*.17,-2.015,.15,.13,.018,.25,blade);
  // Distinct steel runner under each boot, visible in profile and from the front.
  add(side*.17,-2.045,.16,.105,.012,.23,'#e0e8ee');
  add(side*.17,-1.945,.385,.105,.045,.025,dark);
 }
 // Helmet and ear guards; keep the eyes visible beneath the skater visor.
 add(0,1.19,-.015,.255,.095,.245,helmet);
 for(const side of [-1,1]){add(side*.24,1.04,.012,.06,.13,.15,helmet);add(side*.18,1.16,-.13,.06,.10,.13,helmet);}
 if(goalie){
  add(0,1.045,.29,.215,.22,.027,trim);
  add(0,.855,.288,.16,.035,.025,helmet);
  // Mask rim, vertical bars and horizontal crossbars form a readable goalie cage.
  add(0,1.045,.313,.224,.228,.012,helmet);
  for(let i=-2;i<=2;i++)add(i*.079,1.04,.326,.009,.19,.014,dark);
  for(let j=0;j<5;j++)add(0,.88+j*.082,.338,.21,.008,.013,dark);
  // Catch glove (left) has a broad pocket; blocker (right) has a squared face.
  add(-.42,-.70,.18,.18,.165,.13,gloves);
  add(-.42,-.72,.31,.155,.14,.04,trim);
  add(-.42,-.72,.356,.125,.105,.012,dark);
  add(.42,-.70,.18,.16,.15,.13,gloves);
  add(.42,-.71,.31,.155,.16,.035,trim);
  add(.42,-.71,.348,.137,.14,.014,gloves);
  add(-.42,-.73,.372,.11,.10,.008,dark);
  add(.42,-.73,.367,.13,.11,.008,dark);
 }else{
  add(0,1.04,.28,.21,.052,.024,trim);add(0,1.065,.307,.18,.042,.011,'#9ab6c7');
  add(0,.97,.288,.19,.012,.012,blade);
  // Side straps visually connect the visor to the helmet shell.
  for(const side of [-1,1])add(side*.217,1.015,.208,.017,.032,.06,dark);
 }
 const stick=e.stick==='White'?'#e5e9ed':e.stick==='Natural'?'#b99164':'#252b33';
 // Hockey stick shaft extends from the lower glove to the ice; blade sweeps inward.
 add(.51,-1.15,.23,.022,.66,.022,stick);
 add(.51,-1.72,.23,.022,.48,.022,stick);
 add(.34,-2.02,.23,.21,.027,.055,stick);
 return a;
}
