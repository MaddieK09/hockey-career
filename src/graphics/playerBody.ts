import type {PlayerAppearance} from '../player/appearance';
export type Part={center:[number,number,number];scale:[number,number,number];color:string};
const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
/** All dimensions are relative to a 180 cm player. Overlapping joint geometry prevents detached limbs. */
export function buildPlayerBody(p:PlayerAppearance, helmetOn=false):Part[]{
 const height=Number.isFinite(p.heightCm)?Math.max(.78,Math.min(1.2,p.heightCm/180)):1;
 const mass=Number.isFinite(p.weightKg)?Math.max(.78,Math.min(1.27,Math.sqrt(p.weightKg/77))):1;
 const s=skin[p.skinTone]??skin.Fair,h=hair[p.hairColor]??hair.Brown,e=eyes[p.eyeColor]??eyes.Blue;
 const face=p.faceShape==='Round'?1.12:p.faceShape==='Angular'?.91:p.faceShape==='Square'?1.09:1;
 const a:Part[]=[];const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x,y*height,z],scale:[sx,sy*height,sz],color});
 // A connected athletic silhouette: hips, waist, chest and shoulders overlap.
 add(0,-.44,0,.28*mass,.35,.19*mass,'#1c3f5d');
 add(0,.03,0,.34*mass,.48,.21*mass,'#27648d');
 add(0,.31,0,.40*mass,.21,.22*mass,'#27648d');
 add(0,-.77,0,.31*mass,.23,.20*mass,'#193a57');
 for(const side of [-1,1]){
  const shoulder=side*.41*mass,elbow=side*.47*mass,wrist=side*.47*mass;
  add(shoulder,.20,0,.17,.20,.18,'#27648d');
  add(shoulder,-.07,0,.145,.34,.145,'#27648d');
  add(elbow,-.38,.005,.13,.15,.135,'#245777');
  add(elbow,-.56,.012,.115,.24,.12,'#27648d');
  add(wrist,-.80,.035,.11,.13,.105,s);
  const hip=side*.175*mass;
  add(hip,-.93,0,.175*mass,.23,.19*mass,'#1c344f');
  add(hip,-1.16,.02,.155*mass,.30,.17*mass,'#1b3048');
  add(hip,-1.40,.04,.145,.15,.15,'#203d59');
  add(hip,-1.62,.045,.13,.25,.14,'#1b3048');
  add(hip,-1.88,.14,.155,.12,.27,'#111d2e');
 }
 // Neck and face, with ears, cheeks and smaller eyes.
 add(0,.55,0,.14,.21,.135,s);
 const headHeight=p.faceShape==='Round'?.31:.35;
 add(0,.97,.03,.265*face,headHeight,.25,s);
 for(const side of [-1,1]){
  add(side*.267*face,.97,.025,.055,.09,.065,s);
  add(side*.105,1.01,.257,.044,.028,.02,'#f0eee8');
  add(side*.105,1.01,.275,.021,.022,.013,e);
  add(side*.105,1.01,.285,.009,.012,.007,'#1d1c24');
  add(side*.112,1.085,.257,.062,.017,.014,h);
 }
 add(0,.935,.275,.036,.058,.045,s);
 add(0,.803,.238,.074,.012,.018,'#925b58');
 if(p.hairStyle!=='Bald'&&!helmetOn){
  const short=p.hairStyle==='Buzz cut';
  add(0,1.274,-.012,.272*face,short?.065:.12,.247,h);
  if(!short){add(-.13,1.19,.17,.13,.10,.11,h);add(.15,1.19,.13,.115,.095,.10,h);}
  if(['Medium','Long','Ponytail','Curly'].includes(p.hairStyle)){
   add(-.24,1.06,-.08,.09,p.hairStyle==='Long'?.34:.23,.14,h);
   add(.24,1.06,-.08,.09,p.hairStyle==='Long'?.34:.23,.14,h);
  }
  if(p.hairStyle==='Curly')for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;add(Math.cos(angle)*.21,1.33+Math.sin(angle)*.035,Math.sin(angle)*.18,.08,.075,.08,h);}
  if(p.hairStyle==='Ponytail')add(0,1.03,-.30,.10,.31,.11,h);
 }
 return a;
}
