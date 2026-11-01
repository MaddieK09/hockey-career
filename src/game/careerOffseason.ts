import type {Position} from '../player/types';
import {visibleAttributes,type AttributeValues} from './careerAttributes';
import {dateAt,type SeasonSave} from './seasonLeague';
import {type DevelopmentSave,type DevelopmentChange} from './careerDevelopment';

export type OffseasonActivity='recovery'|'conditioning'|'skill-camp'|'preseason'|'rest';
export interface OffseasonLog {
 day:number;date:string;activity:OffseasonActivity;label:string;changes:DevelopmentChange[];
}
export interface OffseasonSave{
 version:1;lastDay:number;trainingDays:number;restDays:number;gains:number;
 recent:OffseasonLog[];
}
export interface OffseasonSummary{
 year:number;trainingDays:number;restDays:number;attributePoints:number;
 startOverall:number;endOverall:number;
}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
const noise=(s:string)=>hash(s)/4294967295;
/** Oct 1 through the following September 30, accounting for leap years. */
export function lastDayOfCareerYear(startDate:string):number{
 const next=Number(startDate.slice(0,4))+1;
 return Math.round((Date.parse(next+'-10-01T12:00:00Z')-Date.parse(startDate+'T12:00:00Z'))/86400000)-1;
}
export function careerDayFromDate(date:string,startDate:string):number{
 const n=Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(startDate+'T12:00:00Z'))/86400000);
 return Number.isFinite(n)?clamp(n,0,lastDayOfCareerYear(startDate)):0;
}
export function newOffseason(lastDay=196):OffseasonSave{
 return {version:1,lastDay,trainingDays:0,restDays:0,gains:0,recent:[]};
}
export function normalizeOffseason(raw:unknown,currentDay:number):OffseasonSave{
 const x=raw as Partial<OffseasonSave>|null;
 if(!x||x.version!==1||!Number.isFinite(x.lastDay))return newOffseason(Math.max(196,currentDay));
 return {version:1,lastDay:Math.max(196,Math.floor(x.lastDay!)),
  trainingDays:Math.max(0,Math.floor(x.trainingDays??0)),restDays:Math.max(0,Math.floor(x.restDays??0)),
  gains:Math.max(0,Math.floor(x.gains??0)),
  recent:Array.isArray(x.recent)?x.recent.slice(-30).map(e=>({...e,changes:[...(e.changes??[])]})):[]
 };
}
/** A recovery week after the final, then regular conditioning/skills in
 * summer and a more intensive preseason camp in September. Weekend rest
 * remains meaningful. Training focus is shared with the Development tab. */
export function offseasonActivity(season:SeasonSave,day:number,championshipDay:number):OffseasonActivity{
 if(day<=championshipDay)return 'rest';
 if(day<=championshipDay+7)return 'recovery';
 const date=dateAt(season,day),month=Number(date.slice(5,7));
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();
 if(weekday===0||weekday===6)return 'rest';
 if(month===9)return 'preseason';
 return weekday===1||weekday===4?'conditioning':'skill-camp';
}
const related=(category:string,focus:string):boolean=>
 focus==='balanced'||(focus==='skating'&&category==='Skating')||
 (focus==='goalie'&&category==='Goalkeeping')||
 (focus==='offense'&&(category==='Puck Skills'||category==='Shooting'))||
 (focus==='defense'&&(category==='Defense'||category==='Physical'));
export function trainOffseasonDay(save:OffseasonSave,dev:DevelopmentSave,attributes:AttributeValues,
 season:SeasonSave,position:Position,age:number,day:number,championshipDay:number):OffseasonLog|null{
 const end=lastDayOfCareerYear(season.startDate);
 if(day<=save.lastDay||day> end)return null;
 // Calendar simulation advances exactly one day. For old saves opened in
 // the middle of summer, only unprocessed future dates award development.
 const activity=offseasonActivity(season,day,championshipDay);
 const changes:DevelopmentChange[]=[];
 if(activity==='rest'||activity==='recovery')save.restDays++;
 else{
  save.trainingDays++;dev.trainingDays++;
  const available=visibleAttributes(position).filter(a=>related(a.category,dev.focus));
  const count=activity==='preseason'?3:activity==='skill-camp'?3:2;
  const keys=new Set<string>();
  for(let i=0;i<count;i++){
   const idx=Math.floor(noise(dev.seed+':'+season.startDate+':'+day+':'+i)*available.length);
   if(available[idx])keys.add(available[idx].key);
  }
  for(const key of keys){
   const rating=attributes[key]??50;
   if(rating>=99||rating>=dev.potential+2)continue;
   const factor=age<=12?1.20:age<=17?1.05:age<=22?.90:.45;
   const emphasis=dev.focus==='balanced'?.85:1.18;
   const base=activity==='preseason'?.38:activity==='skill-camp'?.34:.28;
   const gain=factor*emphasis*(base+noise(dev.seed+':'+key+':'+day)*.12);
   dev.progress[key]=(dev.progress[key]??0)+gain;
   if(dev.progress[key]>=1){
    dev.progress[key]-=1;
    const from=rating;attributes[key]=Math.min(99,rating+1);
    dev.trainingGains[key]=(dev.trainingGains[key]??0)+1;
    save.gains++;changes.push({key,from,to:attributes[key],source:'training'});
   }
  }
 }
 save.lastDay=day;
 const label=activity==='recovery'?'Post-playoff recovery':activity==='rest'?'Rest day':
  activity==='preseason'?'Preseason training camp':activity==='conditioning'?'Strength and skating':'Skill development camp';
 const log:OffseasonLog={day,date:dateAt(season,day),activity,label,changes};
 save.recent.push(log);if(save.recent.length>30)save.recent.shift();
 return log;
}
export function latestOffseasonLog(save:OffseasonSave,day:number):OffseasonLog|undefined{
 return save.recent.find(x=>x.day===day);
}
