import type {Position} from '../player/types';
import {visibleAttributes,type AttributeValues,normalizeAttributes} from './careerAttributes';
import type {CareerStart} from './careerPath';
import {dayPlan,type SeasonSave} from './seasonLeague';

export type PotentialTier='Elite'|'High'|'Medium'|'Low';
export type TrainingFocus='balanced'|'skating'|'offense'|'defense'|'goalie';
export interface DevelopmentChange{key:string;from:number;to:number;source:'training'|'offseason'}
export interface DevelopmentReport{
 year:number;startOverall:number;endOverall:number;changes:DevelopmentChange[];
 games:number;points:number;wins:number;summary:string;
}
export interface DevelopmentSave{
 version:1;seed:number;potential:number;tier:PotentialTier;focus:TrainingFocus;
 progress:Record<string,number>;lastDay:number;trainingDays:number;
 startingAttributes:AttributeValues;seasonStartOverall:number;
 scoutingObservations:number;reports:DevelopmentReport[];
}
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
const noise=(seed:number,key:string)=>hash(seed+':'+key)/4294967295;
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));
const tierFor=(n:number):PotentialTier=>n>=91?'Elite':n>=82?'High':n>=72?'Medium':'Low';
export function overallRating(values:AttributeValues,position:Position):number{
 const keys=visibleAttributes(position).map(a=>a.key);
 const weights:Record<string,number>=position==='G'?{
  positioning:3,reflexes:3,reboundControl:2.5,gloveHigh:2,gloveLow:2,
  blockerHigh:2,blockerLow:2,butterfly:2,fiveHole:2,recovery:1.5,postIntegration:1.5
 }:position==='LD'||position==='RD'?{
  defAwareness:3,stickChecking:2.5,shotBlocking:2.5,interceptions:2.5,
  passing:2,edgework:2,acceleration:1.5,topSpeed:1.5,shotPower:1.3
 }:position==='C'?{
  faceoffs:2.5,passing:2.5,offAwareness:2.5,puckControl:2,
  acceleration:2,shotAccuracy:1.8,topSpeed:1.8
 }:{
  topSpeed:2.5,acceleration:2.5,shotAccuracy:2.5,shotPower:2,
  puckControl:2,offAwareness:2,passing:1.8
 };
 let total=0,weight=0;
 for(const key of keys){const w=weights[key]??1;total+=(values[key]??50)*w;weight+=w;}
 return Math.round(total/weight);
}
export function newDevelopment(start:CareerStart,attributes:AttributeValues,identity:string,position:Position):DevelopmentSave{
 const seed=hash(identity+'|'+start.seasonYear+'|'+position);
 const potential=clamp(70+Math.floor(noise(seed,'ceiling')*29),70,98);
 return {version:1,seed,potential,tier:tierFor(potential),focus:'balanced',progress:{},
  lastDay:0,trainingDays:0,startingAttributes:{...attributes},
  seasonStartOverall:overallRating(attributes,position),scoutingObservations:0,reports:[]};
}
export function normalizeDevelopment(raw:unknown,start:CareerStart,attributes:AttributeValues,identity:string,position:Position,seasonDay:number):DevelopmentSave{
 if(!raw||typeof raw!=='object')return {...newDevelopment(start,attributes,identity,position),lastDay:seasonDay};
 const data=raw as Partial<DevelopmentSave>;
 if(data.version!==1||!Number.isFinite(data.seed)||!Number.isFinite(data.potential))return {...newDevelopment(start,attributes,identity,position),lastDay:seasonDay};
 const options:TrainingFocus[]=['balanced','skating','offense','defense','goalie'];
 return {
  ...newDevelopment(start,attributes,identity,position),...data,version:1,
  seed:data.seed!,potential:clamp(Math.floor(data.potential!),70,98),
  tier:tierFor(data.potential!),focus:options.includes(data.focus!)?data.focus!:'balanced',
  progress:{...(data.progress??{})},
  lastDay:clamp(Math.floor(data.lastDay??seasonDay),0,196),
  trainingDays:Math.max(0,Math.floor(data.trainingDays??0)),
  startingAttributes:{...(data.startingAttributes??attributes)},
  reports:Array.isArray(data.reports)?data.reports.map(r=>({...r,changes:[...(r.changes??[])]})):[]
 };
}
export const trainingFocuses=(position:Position):{id:TrainingFocus;label:string}[]=>
 [{id:'balanced',label:'Balanced'}, {id:'skating',label:'Skating'},
 ...(position==='G'?[{id:'goalie' as const,label:'Goaltending'}]:[
  {id:'offense' as const,label:'Offense & puck skills'}, {id:'defense' as const,label:'Defense'}
 ])];
function fitsFocus(category:string,focus:TrainingFocus){
 return focus==='balanced'||(focus==='skating'&&category==='Skating')||
  (focus==='goalie'&&category==='Goalkeeping')||
  (focus==='offense'&&(category==='Shooting'||category==='Puck Skills'))||
  (focus==='defense'&&(category==='Defense'||category==='Physical'));
}
function youthFactor(age:number){
 if(age<=12)return 1.30;if(age<=15)return 1.18;if(age<=19)return 1;
 if(age<=24)return .70;if(age<=30)return .28;return .09;
}
export function processTrainingThrough(dev:DevelopmentSave,attributes:AttributeValues,
 season:SeasonSave,position:Position,age:number,targetDay:number):DevelopmentChange[]{
 const end=clamp(Math.floor(targetDay),dev.lastDay,196);
 const changes:DevelopmentChange[]=[];
 const defs=visibleAttributes(position);
 for(let day=dev.lastDay+1;day<=end;day++){
  if(dayPlan(season,day).kind!=='training')continue;
  dev.trainingDays++;
  // Training advances 1–2 targeted skills a day; each attribute gains
  // fractional progress which periodically converts into a +1 rating.
  const options=defs.filter(a=>fitsFocus(a.category,dev.focus));
  const first=Math.floor(noise(dev.seed,season.startDate+':'+day+':one')*options.length);
  const second=Math.floor(noise(dev.seed,season.startDate+':'+day+':two')*options.length);
  for(const index of new Set([first,second])){
   const def=options[index];if(!def)continue;
   const value=attributes[def.key]??50;
   if(value>=99||value>=dev.potential+2)continue;
   const modifier=dev.focus==='balanced'?.72:1.12;
   const progress=modifier*youthFactor(age)*(0.23+noise(dev.seed,def.key+':'+day)*.15);
   dev.progress[def.key]=(dev.progress[def.key]??0)+progress;
   if(dev.progress[def.key]>=1){
    dev.progress[def.key]-=1;
    const before=attributes[def.key];
    attributes[def.key]=Math.min(99,before+1);
    changes.push({key:def.key,from:before,to:attributes[def.key],source:'training'});
   }
  }
 }
 dev.lastDay=end;return changes;
}
export function offseasonDevelopment(dev:DevelopmentSave,attributes:AttributeValues,position:Position,
 age:number,seasonYear:number,performance:{games:number;points:number;wins:number}):DevelopmentReport{
 const startRating=dev.seasonStartOverall;
 const changes:DevelopmentChange[]=[];
 const available=visibleAttributes(position);
 const performanceFactor=performance.games>0?clamp(
  (performance.points+performance.wins*.45)/performance.games,0,2):0;
 const bonusCount=age<=19?2:age<=24?1:0;
 for(let i=0;i<bonusCount;i++){
  const pick=Math.floor(noise(dev.seed,'offseason:'+seasonYear+':'+i)*available.length);
  const key=available[pick].key;
  const value=attributes[key]??50;
  if(value>=dev.potential||value>=99)continue;
  if(noise(dev.seed,'breakout:'+seasonYear+':'+i)>.53+performanceFactor*.10)continue;
  attributes[key]=value+1;changes.push({key,from:value,to:value+1,source:'offseason'});
 }
 const endRating=overallRating(attributes,position);
 const delta=endRating-startRating;
 const summary=delta>2?'Breakout development':delta>0?'Steady progress':delta===0?'Maintained development':'Development plateau';
 const report:DevelopmentReport={year:seasonYear,startOverall:startRating,endOverall:endRating,
  changes,games:performance.games,points:performance.points,wins:performance.wins,summary};
 dev.reports.push(report);
 dev.seasonStartOverall=endRating;dev.startingAttributes={...attributes};
 dev.trainingDays=0;dev.lastDay=0;dev.progress={};return report;
}
/** Scouts initially know a wide potential range, with a progressively
 * narrower estimate after real games / seasons. Exact hidden ceiling is
 * deliberately not returned by this public-facing helper. */
export function scoutingEstimate(dev:DevelopmentSave):{label:string;min:number;max:number;confidence:string}{
 const observations=Math.max(0,dev.scoutingObservations);
 const radius=observations>=40?3:observations>=20?6:observations>=8?10:16;
 const offset=Math.round((noise(dev.seed,'scout')-.5)*radius);
 const estimate=clamp(dev.potential+offset,65,99);
 return {label:observations>=20?tierFor(estimate):'Uncertain',
  min:clamp(estimate-radius,60,99),max:clamp(estimate+radius,60,99),
  confidence:observations>=40?'High':observations>=20?'Moderate':'Low'};
}
