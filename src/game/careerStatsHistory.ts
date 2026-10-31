import type {Position} from '../player/types';
import type {SeasonPlayerLedger,SeasonGameStat} from './seasonPlayerLedger';
import {ledgerTotals} from './seasonPlayerLedger';
import type {CareerPositionStats} from './careerPositionStats';

export type StatsScope='regular'|'playoffs'|'combined';
export interface PlayerStatsSummary{
 gp:number;wins:number;losses:number;goals:number;assists:number;points:number;
 saves:number;shotsAgainst:number;goalsAgainst:number;shutouts:number;
 savePct:number|null;gaa:number|null;played:number;simulated:number;
}
export interface PlayoffStatLedger extends SeasonPlayerLedger {kind:'playoffs'}
export const newPlayoffLedger=(year:number):PlayoffStatLedger=>({
 version:1,year,kind:'playoffs',games:[]
});
export function normalizePlayoffLedger(raw:unknown,year:number):PlayoffStatLedger{
 const x=raw as Partial<PlayoffStatLedger>|undefined;
 if(!x||x.version!==1||x.year!==year||!Array.isArray(x.games))return newPlayoffLedger(year);
 return {version:1,year,kind:'playoffs',games:x.games.filter(g=>g&&typeof g.fixtureId==='string').map(g=>({...g}))};
}
export function addPlayoffResult(s:PlayoffStatLedger,id:string,stats:Omit<SeasonGameStat,'fixtureId'>):boolean{
 if(s.games.some(g=>g.fixtureId===id))return false;
 s.games.push({...stats,fixtureId:id});return true;
}
export function seasonSummary(ledger:SeasonPlayerLedger|undefined,minutesPerGame=60):PlayerStatsSummary{
 const games=ledger?.games??[];
 const t=ledgerTotals({version:1,year:ledger?.year??0,games});
 const losses=games.filter(g=>!g.won).length;
 const played=games.filter(g=>!g.simulated).length,simulated=games.length-played;
 return {gp:t.gp,wins:t.wins,losses,goals:t.goals,assists:t.assists,points:t.goals+t.assists,
  saves:t.saves,shotsAgainst:t.shotsAgainst,goalsAgainst:t.goalsAgainst,shutouts:t.shutouts,
  savePct:t.shotsAgainst>0?t.saves/t.shotsAgainst:null,
  gaa:t.gp>0?t.goalsAgainst*60/(t.gp*minutesPerGame):null,
  played,simulated};
}
export function combineSummaries(items:readonly PlayerStatsSummary[]):PlayerStatsSummary{
 const sum=(key:keyof PlayerStatsSummary)=>items.reduce((n,i)=>n+(typeof i[key]==='number'?i[key] as number:0),0);
 const gp=sum('gp'),saves=sum('saves'),shotsAgainst=sum('shotsAgainst');
 const goalsAgainst=sum('goalsAgainst');
 return {gp,wins:sum('wins'),losses:sum('losses'),goals:sum('goals'),assists:sum('assists'),
  points:sum('points'),saves,shotsAgainst,goalsAgainst,shutouts:sum('shutouts'),
  savePct:shotsAgainst>0?saves/shotsAgainst:null,
  // Combine GAA by minutes-weighted goals against, not averaging yearly GAA.
  gaa:null,played:sum('played'),simulated:sum('simulated')};
}
export function careerSummary(stats:CareerPositionStats,position:Position):PlayerStatsSummary{
 const goalie=position==='G';
 return {gp:stats.gp,wins:stats.wins,losses:stats.losses,goals:stats.goals,assists:stats.assists,
  points:stats.goals+stats.assists,saves:stats.saves,shotsAgainst:stats.shotsAgainst,
  goalsAgainst:stats.goalsAgainst,shutouts:stats.shutouts,
  savePct:goalie&&stats.shotsAgainst>0?stats.saves/stats.shotsAgainst:null,
  gaa:goalie&&stats.minutesPlayed>0?stats.goalsAgainst*60/stats.minutesPlayed:null,
  played:stats.playedGames,simulated:stats.simulatedGames};
}
export function statTableSummary(position:Position,summary:PlayerStatsSummary):{label:string;value:string}[]{
 const n=(v:number)=>String(v);
 const common=[{label:'Games played',value:n(summary.gp)},{label:'Wins',value:n(summary.wins)},
  {label:'Losses',value:n(summary.losses)},{label:'Played / sim',value:summary.played+' / '+summary.simulated}];
 if(position==='G')return [...common,{label:'Saves',value:n(summary.saves)},
  {label:'Shots faced',value:n(summary.shotsAgainst)},
  {label:'SV%',value:summary.savePct===null?'—':(summary.savePct*100).toFixed(1)+'%'},
  {label:'GAA',value:summary.gaa===null?'—':summary.gaa.toFixed(2)},
  {label:'Shutouts',value:n(summary.shutouts)}];
 return [...common,{label:'Goals',value:n(summary.goals)},{label:'Assists',value:n(summary.assists)},
  {label:'Points',value:n(summary.points)},
  {label:'Points / game',value:summary.gp?(summary.points/summary.gp).toFixed(2):'—'}];
}
