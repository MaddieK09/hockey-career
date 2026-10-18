import type {PlayerAppearance} from '../player/appearance';
export type Part={center:[number,number,number];scale:[number,number,number];color:string};
const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
/** Common scale for anatomy and gear. Length follows height; girth follows mass. */
export function bodyDimensions(p:PlayerAppearance){
 const height=Math.max(.78,Math.min(1.2,(Number(p.heightCm)||180)/180));
 const width=Math.max(.78,Math.min(1.28,Math.sqrt((Number(p.weightKg)||77)/77)));
 return {height,width};
}
/** Rounded, overlapping anatomy; no separated floating joints. */
export function buildPlayerBody(p:PlayerAppearance,helmetOn=false):Part[]{
 const {height,width}=bodyDimensions(p);
 const s=skin[p.skinTone]??skin.Fair,h=hair[p.hairColor]??hair.Brown,e=eyes[p.eyeColor]??eyes.Blue;
 const face=p.faceShape==='Round'?1.10:p.faceShape==='Angular'?.94:p.faceShape==='Square'?1.07:1;
 const a:Part[]=[];
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x*width,y*height,z*width],scale:[sx*width,sy*height,sz*width],color});
 // Pelvis, tapered waist and ribcage overlap to form a single silhouette.
 add(0,-.68,0,.285,.32,.19,'#193a57');
 add(0,-.25,0,.29,.36,.19,'#245d84');
 add(0,.13,0,.35,.35,.215,'#27648d');
 add(0,.35,0,.37,.16,.205,'#27648d');
 for(const side of [-1,1]){
  add(side*.365,.26,0,.155,.19,.17,'#27648d');
  add(side*.395,.015,0,.135,.29,.145,'#27648d');
  add(side*.415,-.28,.005,.124,.16,.13,'#245777');
  add(side*.415,-.52,.012,.112,.25,.118,'#27648d');
  add(side*.415,-.77,.045,.105,.12,.105,s);
  const hip=side*.17;
  add(hip,-.94,0,.17,.27,.18,'#1c344f');
  add(hip,-1.20,.015,.145,.32,.155,'#1b3048');
  add(hip,-1.46,.035,.137,.15,.14,'#203d59');
  add(hip,-1.68,.045,.123,.25,.13,'#1b3048');
  add(hip,-1.91,.13,.15,.12,.25,'#111d2e');
 }
 add(0,.54,0,.132,.17,.13,s);
 const headHeight=p.faceShape==='Round'?.30:.33;
 add(0,.93,.035,.245*face,headHeight,.238,s);
 for(const side of [-1,1]){
  add(side*.247*face,.94,.025,.046,.083,.058,s);
  add(side*.10,.98,.258,.037,.024,.018,'#f0eee8');
  add(side*.10,.98,.275,.019,.02,.012,e);
  add(side*.10,.98,.285,.008,.010,.007,'#1d1c24');
  add(side*.105,1.065,.25,.055,.012,.011,h);
 }
 add(0,.895,.273,.031,.048,.035,s);
 add(0,.782,.236,.068,.010,.013,'#925b58');
 if(p.hairStyle!=='Bald'&&!helmetOn){
  const short=p.hairStyle==='Buzz cut';
  add(0,1.225,-.012,.25*face,short?.05:.10,.24,h);
  if(!short){add(-.13,1.15,.16,.12,.085,.10,h);add(.14,1.15,.13,.11,.08,.09,h);}
  if(['Medium','Long','Ponytail','Curly'].includes(p.hairStyle)){
   add(-.225,1.02,-.08,.08,p.hairStyle==='Long'?.31:.20,.13,h);
   add(.225,1.02,-.08,.08,p.hairStyle==='Long'?.31:.20,.13,h);
  }
  if(p.hairStyle==='Curly')for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;add(Math.cos(angle)*.19,1.27+Math.sin(angle)*.03,Math.sin(angle)*.17,.073,.066,.07,h);}
  if(p.hairStyle==='Ponytail')add(0,.99,-.28,.095,.27,.10,h);
 }
 return a;
}
