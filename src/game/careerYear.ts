import type {Fixture,SeasonSave} from './seasonLeague';
import {MAX_SEASON_DAY,dateAt} from './seasonLeague';
import {nextSeries,simPlayoffGame,winner,type PlayoffSave,type PlayoffSeries} from './careerPlayoffs';

const hash=(text:string):number=>{
 let h=2166136261;
 for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
 return h>>>0;
};
/** Dates are relative to October 1. Two semifinal series run alongside
 * each other from April 18; the final begins May 14. These dates fit both
 * best-of-five and best-of-seven formats, including leap-year careers. */
export const SEMIFINAL_START=199;
export const FINAL_START=225;
export const PLAYOFF_GAME_GAP=3;
export const CAREER_YEAR_LAST_MONTH=9;
export const careerLastDay=(season:SeasonSave):number=>{
 const year=Number(season.startDate.slice(0,4));
 const end=Date.UTC(year+1,8,30,12);
 const start=Date.parse(season.startDate+'T12:00:00Z');
 return Math.round((end-start)/86400000);
};
export const playoffDate=(round:0|1,gameIndex:number):number=>
 (round===0?SEMIFINAL_START:FINAL_START)+PLAYOFF_GAME_GAP*gameIndex;
export interface PostseasonCalendarGame {
 day:number;series:PlayoffSeries;gameIndex:number;id:string;homeId:string;awayId:string;
 homeGoals?:number;awayGoals?:number;
}
export const playoffFixtureId=(year:number,series:PlayoffSeries,index:number):string=>
 'POST-'+year+'-'+series.round+'-'+series.seedA+'-'+series.seedB+'-'+index;
export function playoffCalendarGames(post:PlayoffSave):PostseasonCalendarGame[]{
 const matches:PostseasonCalendarGame[]=[];
 for(const series of post.series){
  const limit=post.bestOf;
  for(let i=0;i<series.results.length;i++){
   const score=series.results[i];
   matches.push({day:playoffDate(series.round,i),series,gameIndex:i,
    id:playoffFixtureId(post.seasonYear,series,i),
    homeId:series.seedA,awayId:series.seedB,homeGoals:score.a,awayGoals:score.b});
  }
  if(!winner(post,series)&&series.results.length<limit){
   const i=series.results.length;
   matches.push({day:playoffDate(series.round,i),series,gameIndex:i,
    id:playoffFixtureId(post.seasonYear,series,i),homeId:series.seedA,awayId:series.seedB});
  }
 }
 return matches.sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
}
/** Run only games whose calendar dates have arrived. No series is simulated
 * instantly to completion. Repeated visits to the same day are idempotent. */
export function simulatePostseasonDay(post:PlayoffSave,day:number):PostseasonCalendarGame[]{
 const added:PostseasonCalendarGame[]=[];
 for(let guard=0;guard<20;guard++){
  nextSeries(post);
  const due=playoffCalendarGames(post).filter(g=>g.homeGoals===undefined&&g.day<=day);
  if(!due.length)break;
  for(const scheduled of due){
   if(winner(post,scheduled.series))continue;
   simPlayoffGame(post,scheduled.series);
   const result=scheduled.series.results[scheduled.gameIndex];
   if(result)added.push({...scheduled,homeGoals:result.a,awayGoals:result.b});
  }
 }
 return added;
}
export function calendarGameToFixture(g:PostseasonCalendarGame):Fixture{
 return {id:g.id,day:g.day,homeId:g.homeId,awayId:g.awayId,
  homeGoals:g.homeGoals,awayGoals:g.awayGoals,played:false};
}
/** Fixture-based deterministic league playoff stat lines. These are fictional
 * AI lines derived from saved playoff scores, independent of UI rendering. */
export interface PlayoffBotLine {
 id:string;name:string;teamId:string;position:'F'|'D'|'G';
 gp:number;goals:number;assists:number;points:number;saves:number;shotsAgainst:number;goalsAgainst:number;wins:number;
}
export function playoffBotStats(post:PlayoffSave,players:readonly {id:string;name:string;teamId:string;position:'F'|'D'|'G'}[]):PlayoffBotLine[]{
 const entries=new Map(players.map(p=>[p.id,{...p,gp:0,goals:0,assists:0,points:0,saves:0,shotsAgainst:0,goalsAgainst:0,wins:0}]));
 for(const f of playoffCalendarGames(post)){
  if(f.homeGoals===undefined||f.awayGoals===undefined)continue;
  for(const [teamId,goals,against] of [[f.homeId,f.homeGoals,f.awayGoals],[f.awayId,f.awayGoals,f.homeGoals]] as [string,number,number][]){
   const roster=[...entries.values()].filter(p=>p.teamId===teamId);
   const skaters=roster.filter(p=>p.position!=='G');
   const goalie=roster.find(p=>p.position==='G');
   if(!skaters.length||!goalie)continue;
   for(const p of roster)p.gp++;
   const h=hash(f.id+'|'+teamId);
   for(let i=0;i<goals;i++){
    const scorer=skaters[(h+i*13)%skaters.length];
    const helper=skaters[(h+i*29+2)%skaters.length];
    scorer.goals++;scorer.points++;
    if(helper!==scorer){helper.assists++;helper.points++;}
   }
   const saves=Math.max(8,21+(h%14)-against);
   goalie.saves+=saves;goalie.shotsAgainst+=saves+against;goalie.goalsAgainst+=against;
   if(goals>against)goalie.wins++;
  }
 }
 return [...entries.values()].filter(p=>p.gp>0);
}
export function isOffseasonDay(day:number,post?:PlayoffSave):boolean{
 return day>MAX_SEASON_DAY&&!!post?.champion&&
  !playoffCalendarGames(post).some(g=>g.day===day&&g.homeGoals!==undefined);
}
export function nextSeasonDate(season:SeasonSave):string{
 return dateAt(season,careerLastDay(season)+1);
}
