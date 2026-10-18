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

 // Fewer, deliberately overlapping volumes: no disconnected bead-like joints.
 add(0,-.49,0,.30,.43,.225,'#214967');
 add(0,.02,0,.345,.43,.245,'#27648d');
 // Layer the clavicles and waist to create a more natural taper.
 add(0,.39,.015,.285,.135,.225,'#27648d');
 add(0,-.53,.025,.245,.24,.205,'#214967');
 add(0,.31,0,.355,.24,.24,'#27648d');
 add(0,-.79,0,.295,.23,.215,'#193a57');
 for(const side of [-1,1]){
  const hip=side*.165;
  add(side*.352,.245,0,.175,.205,.18,'#27648d');
  add(side*.388,-.07,0,.146,.39,.155,'#27648d');
  add(side*.398,-.48,.018,.123,.28,.13,'#245777');
  add(side*.408,-.70,.035,.105,.115,.115,s);
  add(hip,-1.09,0,.177,.41,.19,'#1c344f');
  add(hip,-1.52,.025,.137,.42,.155,'#1b3048');
  add(hip,-1.89,.12,.155,.125,.24,'#111d2e');
 }
 add(0,.54,0,.125,.16,.125,s);
 // Neck, jaw, ears and facial features use the same proportion system.
 add(0,.92,.035,.24*face,p.faceShape==='Round'?.31:.335,.23,s);
 add(0,.76,.115,.175*face,.115,.16,s);
 for(const side of [-1,1]){
  add(side*.236*face,.94,.015,.037,.075,.05,s);
  add(side*.097,.97,.252,.042,.022,.012,'#e9e6e0');
  add(side*.097,.97,.267,.021,.018,.009,e);
  add(side*.097,.97,.275,.009,.009,.006,'#24232a');
  add(side*.105,1.045,.246,.06,.013,.012,h);
 }
 add(0,.885,.267,.028,.052,.032,s);
 // Small cheek and jaw planes soften the flat face without increasing eye size.
 for(const side of [-1,1]){add(side*.145,.84,.125,.085,.095,.115,s);}
 add(0,.785,.239,.072,.012,.013,'#925b58');
 if(p.hairStyle!=='Bald'&&!helmetOn){
  const buzz=p.hairStyle==='Buzz cut';
  add(0,1.205,-.025,.249*face,buzz?.046:.10,.238,h);
  if(!buzz){add(-.115,1.15,.13,.12,.07,.10,h);add(.115,1.15,.13,.12,.07,.10,h);}
  if(['Medium','Long','Ponytail','Curly'].includes(p.hairStyle)){
   const length=p.hairStyle==='Long'?.29:.19;
   add(-.22,1.01,-.085,.075,length,.12,h);
   add(.22,1.01,-.085,.075,length,.12,h);
  }
  if(p.hairStyle==='Curly')for(let i=0;i<15;i++){const t=i*Math.PI*2/15;add(Math.cos(t)*.175,1.26+Math.sin(t)*.035,Math.sin(t)*.16,.065,.056,.063,h);}
  if(p.hairStyle==='Ponytail')add(0,.97,-.28,.085,.26,.09,h);
 }
 return a;
}
