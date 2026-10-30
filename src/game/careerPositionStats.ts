import type {Position} from '../player/types';
import type {Fixture} from './seasonLeague';

export interface CareerPositionStats {
 version:1;
 gp:number;wins:number;losses:number;
 goals:number;assists:number;
 saves:number;shotsAgainst:number;goalsAgainst:number;shutouts:number;
 teamGoalsFor:number;teamGoalsAgainst:number;
 playedGames:number;simulatedGames:number;
}
export const emptyPositionStats=():CareerPositionStats=>({
 version:1,gp:0,wins:0,losses:0,goals:0,assists:0,
 saves:0,shotsAgainst:0,goalsAgainst:0,shutouts:0,
 teamGoalsFor:0,teamGoalsAgainst:0,playedGames:0,simulatedGames:0
});
const hash=(value:string):number=>{
 let h=2166136261;
 for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);
 return h>>>0;
};
export function normalizePositionStats(raw:unknown,legacy?:{games:number;wins:number;losses:number;goals:number;assists:number;saves:number}):CareerPositionStats{
 if(raw&&typeof raw==='object'&&(raw as Partial<CareerPositionStats>).version===1){
  const o=raw as CareerPositionStats;
  const clean=emptyPositionStats();
  for(const key of Object.keys(clean) as (keyof CareerPositionStats)[]){
   if(key==='version')continue;
   (clean as unknown as Record<string,number>)[key]=Number.isFinite(o[key])?Math.max(0,Math.floor(o[key])):0;
  }
  return clean;
 }
 // Retain old career counters after upgrading; unknown historical goalie
 // shots-against are not fabricated, so SV% remains unavailable until new games.
 const s=emptyPositionStats();
 if(legacy){
  s.gp=legacy.games;s.playedGames=legacy.games;
  s.wins=legacy.wins;s.losses=legacy.losses;
  s.goals=legacy.goals;s.assists=legacy.assists;s.saves=legacy.saves;
 }
 return s;
}
export function applyCareerResult(
 stats:CareerPositionStats,position:Position,
 ownGoals:number,otherGoals:number,
 contributions:{goals?:number;assists?:number;saves?:number;shotsAgainst?:number},
 simulated:boolean
):void{
 stats.gp++;if(ownGoals>otherGoals)stats.wins++;else if(ownGoals<otherGoals)stats.losses++;
 stats.teamGoalsFor+=ownGoals;stats.teamGoalsAgainst+=otherGoals;
 if(simulated)stats.simulatedGames++;else stats.playedGames++;
 if(position==='G'){
  const saves=Math.max(0,Math.floor(contributions.saves??0));
  const faced=Math.max(otherGoals+saves,Math.floor(contributions.shotsAgainst??0));
  stats.saves+=saves;stats.shotsAgainst+=faced;stats.goalsAgainst+=otherGoals;
  if(otherGoals===0)stats.shutouts++;
 }else{
  stats.goals+=Math.max(0,Math.floor(contributions.goals??0));
  stats.assists+=Math.max(0,Math.floor(contributions.assists??0));
 }
}
/** Deterministic simulated contributions are projections, not event-by-event
 * play-by-play. Same fixture + position produces identical stats after reload. */
export function applySimulatedCareerFixture(stats:CareerPositionStats,position:Position,fixture:Fixture,teamId:string):void{
 if(fixture.homeGoals===undefined||fixture.awayGoals===undefined)return;
 const own=fixture.homeId===teamId?fixture.homeGoals:fixture.awayGoals;
 const against=fixture.homeId===teamId?fixture.awayGoals:fixture.homeGoals;
 const seed=hash(fixture.id+'|'+teamId+'|'+position);
 if(position==='G'){
  const attempts=18+(seed%15);
  const faced=Math.max(attempts,against+5);
  applyCareerResult(stats,position,own,against,{saves:faced-against,shotsAgainst:faced},true);
 }else{
  // Skater participation depends on role; defensive scoring skews assists,
  // while forwards have more opportunities to finish a play.
  const rate=position==='C'?5:position==='LD'||position==='RD'?9:4;
  const goals=own>0&&seed%rate===0?1:0;
  const assists=own>goals&&((seed>>>9)%3===0)?1:0;
  applyCareerResult(stats,position,own,against,{goals,assists},true);
 }
}
export const savePercentage=(s:CareerPositionStats):number|null=>
 s.shotsAgainst>0?s.saves/s.shotsAgainst:null;
export const goalsAgainstAverage=(s:CareerPositionStats):number|null=>
 s.gp>0?s.goalsAgainst/s.gp:null;
export function statCards(position:Position,s:CareerPositionStats):{label:string;value:string}[]{
 const n=(x:number)=>String(x);
 if(position==='G')return [
  {label:'Wins',value:n(s.wins)},{label:'Saves',value:n(s.saves)},
  {label:'Save %',value:savePercentage(s)===null?'—':(savePercentage(s)!*100).toFixed(1)+'%'},
  {label:'GAA',value:goalsAgainstAverage(s)===null?'—':goalsAgainstAverage(s)!.toFixed(2)}
 ];
 if(position==='C')return [
  {label:'Goals',value:n(s.goals)},{label:'Assists',value:n(s.assists)},
  {label:'Points',value:n(s.goals+s.assists)},{label:'PTS / GP',value:s.gp?((s.goals+s.assists)/s.gp).toFixed(2):'—'}
 ];
 if(position==='LD'||position==='RD')return [
  {label:'Assists',value:n(s.assists)},{label:'Points',value:n(s.goals+s.assists)},
  {label:'Goals',value:n(s.goals)},{label:'Team GD',value:(s.teamGoalsFor-s.teamGoalsAgainst)>0?'+ '+(s.teamGoalsFor-s.teamGoalsAgainst):n(s.teamGoalsFor-s.teamGoalsAgainst)}
 ];
 return [
  {label:'Goals',value:n(s.goals)},{label:'Points',value:n(s.goals+s.assists)},
  {label:'Assists',value:n(s.assists)},{label:'G / GP',value:s.gp?(s.goals/s.gp).toFixed(2):'—'}
 ];
}
