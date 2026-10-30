import type {Position} from '../player/types';
export type AttributeCategory='Skating'|'Shooting'|'Puck Skills'|'Defense'|'Physical'|'Goalkeeping';
export interface AttributeDefinition {key:string;label:string;category:AttributeCategory;positions:'all'|'skater'|'goalie';description:string}
export const ATTRIBUTES:readonly AttributeDefinition[]=[
 ['acceleration','Acceleration','Skating','all','Speed from a standing start'],['topSpeed','Top speed','Skating','all','Maximum skating velocity'],
 ['agility','Agility','Skating','all','Changing direction'],['balance','Balance','Skating','all','Stability under pressure'],
 ['edgework','Edge control','Skating','all','Turning and controlled stops'],['stamina','Stamina','Skating','all','Sustained pace'],
 ['shotPower','Shot power','Shooting','skater','Shot speed'],['shotAccuracy','Shot accuracy','Shooting','skater','Shot placement'],
 ['wristShot','Wrist shot','Shooting','skater','Quick wrist releases'],['slapShot','Slap shot','Shooting','skater','Heavy slap shots'],
 ['oneTimer','One-timers','Shooting','skater','Quick shots off a pass'],['deking','Deking','Puck Skills','skater','Beat opponents with skill'],
 ['passing','Passing','Puck Skills','skater','Pass accuracy'],['puckControl','Puck control','Puck Skills','skater','Stickhandling'],
 ['faceoffs','Faceoffs','Puck Skills','skater','Win faceoff draws'],['offAwareness','Offensive awareness','Puck Skills','skater','Find scoring areas'],
 ['stickChecking','Stick checking','Defense','skater','Disrupt puck carriers'],['pokeChecking','Poke checking','Defense','skater','Reach and timing of poke checks'],
 ['shotBlocking','Shot blocking','Defense','skater','Block attempts'],['defAwareness','Defensive awareness','Defense','skater','Defensive positioning'],
 ['interceptions','Interceptions','Defense','skater','Read passing lanes'],['bodyChecking','Body checking','Physical','skater','Contact'],
 ['strength','Strength','Physical','all','Strength and positioning'],['discipline','Discipline','Physical','all','Avoid penalties'],
 ['reflexes','Reflexes','Goalkeeping','goalie','React to shots'],['gloveHigh','Glove high','Goalkeeping','goalie','High glove saves'],
 ['gloveLow','Glove low','Goalkeeping','goalie','Low glove saves'],['blockerHigh','Blocker high','Goalkeeping','goalie','High blocker saves'],
 ['blockerLow','Blocker low','Goalkeeping','goalie','Low blocker saves'],['fiveHole','Five-hole','Goalkeeping','goalie','Close the five-hole'],
 ['reboundControl','Rebound control','Goalkeeping','goalie','Limit second chances'],['positioning','Positioning','Goalkeeping','goalie','Angle and crease depth'],
 ['butterfly','Butterfly technique','Goalkeeping','goalie','Butterfly timing'],['postIntegration','VH / RVH technique','Goalkeeping','goalie','Post integration'],
 ['puckPlaying','Puck playing','Goalkeeping','goalie','Outlet passing'],['recovery','Recovery','Goalkeeping','goalie','Rise after saves']
 ].map(([key,label,category,positions,description])=>({key,label,category:category as AttributeCategory,positions:positions as AttributeDefinition['positions'],description}));
export type AttributeValues=Record<string,number>;
const clamp=(n:number)=>Math.max(1,Math.min(99,Math.floor(n)));
export function visibleAttributes(position:Position):AttributeDefinition[]{
 return ATTRIBUTES.filter(a=>a.positions==='all'||a.positions===(position==='G'?'goalie':'skater'));
}
export function defaultAttributes(position:Position,legacy:{speed:number;shot:number;handling:number;defense:number}):AttributeValues{
 const values:AttributeValues={};
 for(const def of ATTRIBUTES){
  const base=def.category==='Skating'?legacy.speed:
   def.category==='Shooting'?legacy.shot:
   def.category==='Puck Skills'?legacy.handling:
   def.category==='Defense'?legacy.defense:
   def.category==='Goalkeeping'?Math.round((legacy.defense+legacy.handling)/2):
   Math.round((legacy.speed+legacy.defense)/2);
  values[def.key]=clamp(base);
 }
 if(position==='G')values.positioning=clamp(legacy.defense);
 return values;
}
export function normalizeAttributes(raw:unknown,position:Position,legacy:{speed:number;shot:number;handling:number;defense:number}):AttributeValues{
 const defaults=defaultAttributes(position,legacy);
 if(!raw||typeof raw!=='object')return defaults;
 const values=raw as Record<string,unknown>;
 for(const def of ATTRIBUTES)if(typeof values[def.key]==='number'&&Number.isFinite(values[def.key]))defaults[def.key]=clamp(values[def.key] as number);
 return defaults;
}
export function upgradeAttribute(values:AttributeValues,key:string,points:number):boolean{
 if(!ATTRIBUTES.some(a=>a.key===key)||points<1||values[key]===undefined||values[key]>=99)return false;
 values[key]=Math.min(99,values[key]+1);return true;
}
const avg=(values:AttributeValues,keys:string[]):number=>Math.round(keys.reduce((sum,key)=>sum+(values[key]??50),0)/keys.length);
export function matchRatings(values:AttributeValues,position:Position):{speed:number;shot:number;handling:number;defense:number}{
 if(position==='G')return {
  speed:avg(values,['acceleration','agility','edgework','recovery','balance']),
  shot:avg(values,['puckPlaying','passing','reflexes']),
  handling:avg(values,['puckPlaying','reboundControl','gloveHigh','blockerHigh']),
  defense:avg(values,['positioning','reflexes','fiveHole','butterfly','gloveLow','gloveHigh','blockerLow','blockerHigh','postIntegration','reboundControl'])
 };
 return {
  speed:avg(values,['acceleration','topSpeed','agility','edgework','stamina']),
  shot:avg(values,['shotPower','shotAccuracy','wristShot','slapShot','oneTimer']),
  handling:avg(values,['puckControl','passing','deking','faceoffs','offAwareness']),
  defense:avg(values,['stickChecking','pokeChecking','shotBlocking','defAwareness','interceptions','bodyChecking'])
 };
}
