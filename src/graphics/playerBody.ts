import type {PlayerAppearance} from '../player/appearance';
export type Part={center:[number,number,number];scale:[number,number,number];color:string};
const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
export function bodyDimensions(p:PlayerAppearance){
 const height=Math.max(.78,Math.min(1.2,(Number(p.heightCm)||180)/180));
 const width=Math.max(.78,Math.min(1.28,Math.sqrt((Number(p.weightKg)||77)/77)));
 return {height,width};
}
/** Overlapping ellipsoids create a continuous silhouette under modular equipment. */
export function buildPlayerBody(p:PlayerAppearance,helmetOn=false):Part[]{
 const {height,width}=bodyDimensions(p),s=skin[p.skinTone]??skin.Fair,h=hair[p.hairColor]??hair.Brown,e=eyes[p.eyeColor]??eyes.Blue;
 const face=p.faceShape==='Round'?1.10:p.faceShape==='Angular'?.94:p.faceShape==='Square'?1.07:1;
 const a:Part[]=[];
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>a.push({center:[x*width,y*height,z*width],scale:[sx*width,sy*height,sz*width],color});
 add(0,-.66,0,.28,.31,.20,'#193a57');add(0,-.24,0,.30,.39,.22,'#245d84');
 add(0,.15,0,.37,.39,.245,'#27648d');add(0,.37,0,.39,.17,.24,'#27648d');
 for(const side of [-1,1]){
  add(side*.38,.29,0,.175,.205,.19,'#27648d');
  add(side*.40,.04,0,.15,.32,.16,'#27648d');
  add(side*.415,-.28,.005,.13,.21,.145,'#245777');
  add(side*.425,-.52,.015,.12,.24,.13,'#27648d');
  add(side*.425,-.75,.045,.115,.12,.115,s);
  const hip=side*.17;
  add(hip,-.96,0,.175,.32,.19,'#1c344f');
  add(hip,-1.22,.015,.155,.32,.17,'#1b3048');
  add(hip,-1.48,.035,.145,.17,.15,'#203d59');
  add(hip,-1.68,.045,.13,.27,.145,'#1b3048');
  add(hip,-1.91,.13,.16,.12,.26,'#111d2e');
 }
 add(0,.54,0,.14,.18,.14,s);
 add(0,.94,.035,.245*face,p.faceShape==='Round'?.30:.33,.238,s);
 for(const side of [-1,1]){
  add(side*.247*face,.94,.025,.045,.083,.06,s);
  add(side*.10,.98,.258,.038,.024,.018,'#f0eee8');
  add(side*.10,.98,.275,.019,.02,.012,e);
  add(side*.10,.98,.285,.008,.01,.007,'#1d1c24');
  add(side*.105,1.065,.25,.055,.012,.011,h);
 }
 add(0,.895,.273,.031,.048,.035,s);add(0,.782,.236,.068,.01,.013,'#925b58');
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
