import type {Position} from '../player/types';
import type {Fixture} from './seasonLeague';
import type {CareerPositionStats} from './careerPositionStats';
import {emptyPositionStats,applyCareerResult,applySimulatedCareerFixture} from './careerPositionStats';
export interface SeasonGameStat {fixtureId:string;goals:number;assists:number;saves:number;shotsAgainst:number;goalsAgainst:number;won:boolean;simulated:boolean}
export interface SeasonPlayerLedger {version:1;year:number;games:SeasonGameStat[]}
export const newSeasonLedger=(year:number):SeasonPlayerLedger=>({version:1,year,games:[]});
export function normalizeSeasonLedger(raw:unknown,year:number):SeasonPlayerLedger{
 if(!raw||typeof raw!=='object')return newSeasonLedger(year);
 const x=raw as Partial<SeasonPlayerLedger>;
 if(x.version!==1||x.year!==year||!Array.isArray(x.games))return newSeasonLedger(year);
 return {version:1,year,games:x.games.filter(g=>g&&typeof g.fixtureId==='string').map(g=>({...g}))};
}
export const ledgerHas=(s:SeasonPlayerLedger,id:string)=>s.games.some(g=>g.fixtureId===id);
export function addSimulatedStat(s:SeasonPlayerLedger,fixture:Fixture,position:Position,teamId:string):boolean{
 if(ledgerHas(s,fixture.id)||fixture.homeGoals===undefined||fixture.awayGoals===undefined)return false;
 const derived=emptyPositionStats();applySimulatedCareerFixture(derived,position,fixture,teamId);
 const own=fixture.homeId===teamId?fixture.homeGoals:fixture.awayGoals;
 const opposition=fixture.homeId===teamId?fixture.awayGoals:fixture.homeGoals;
 s.games.push({fixtureId:fixture.id,goals:derived.goals,assists:derived.assists,saves:derived.saves,
  shotsAgainst:derived.shotsAgainst,goalsAgainst:position==='G'?opposition:0,won:own>opposition,simulated:true});
 return true;
}
export function addPlayedStat(s:SeasonPlayerLedger,id:string,position:Position,own:number,other:number,
 contributions:{goals:number;assists:number;saves:number;shotsAgainst:number}):boolean{
 if(ledgerHas(s,id))return false;
 const stats=emptyPositionStats();
 applyCareerResult(stats,position,own,other,contributions,false);
 s.games.push({fixtureId:id,goals:stats.goals,assists:stats.assists,saves:stats.saves,
  shotsAgainst:stats.shotsAgainst,goalsAgainst:stats.goalsAgainst,won:own>other,simulated:false});
 return true;
}
export function ledgerTotals(s:SeasonPlayerLedger):Pick<CareerPositionStats,'gp'|'wins'|'goals'|'assists'|'saves'|'shotsAgainst'|'goalsAgainst'|'shutouts'>{
 return s.games.reduce((a,g)=>{
  a.gp++;a.wins+=Number(g.won);a.goals+=g.goals;a.assists+=g.assists;a.saves+=g.saves;
  a.shotsAgainst+=g.shotsAgainst;a.goalsAgainst+=g.goalsAgainst;
  a.shutouts+=Number(g.shotsAgainst>0&&g.goalsAgainst===0);return a;
 },{gp:0,wins:0,goals:0,assists:0,saves:0,shotsAgainst:0,goalsAgainst:0,shutouts:0});
}
