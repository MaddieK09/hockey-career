import {leagueStandings,newSeason,botStats,type BotStat,type SeasonSave} from './seasonLeague';
import {findDivision,eligibleDivisions,leagueTitle,type CareerStart,startingPath} from './careerPath';
export interface PlayoffSeries {round:0|1;seedA:string;seedB:string;winsA:number;winsB:number;results:Array<{a:number;b:number;day?:number;played?:boolean}>}
export interface PlayoffSave {version:1;seasonYear:number;bestOf:5|7;series:PlayoffSeries[];champion?:string}
export interface SeasonHistory {seasonYear:number;division:string;teamId:string;champion?:string;clubRank:number;games:number}
export const winsRequired=(p:PlayoffSave)=>Math.floor(p.bestOf/2)+1;
const seed=(v:string)=>{let n=2166136261;for(let i=0;i<v.length;i++)n=Math.imul(n^v.charCodeAt(i),16777619);return n>>>0};
const rand=(x:number)=>{x=(x+0x6d2b79f5)>>>0;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296};
export function createPlayoffs(season:SeasonSave,division:string):PlayoffSave{
 if(season.fixtures.some(f=>f.homeGoals===undefined||f.awayGoals===undefined))throw Error('Complete regular season first.');
 const top=leagueStandings(season).slice(0,4).map(v=>v.team.id);
 return {version:1,seasonYear:Number(season.startDate.slice(0,4)),bestOf:division==='junior'||division==='development'?7:5,
  series:[{round:0,seedA:top[0],seedB:top[3],winsA:0,winsB:0,results:[]},
          {round:0,seedA:top[1],seedB:top[2],winsA:0,winsB:0,results:[]}]};
}
export const winner=(p:PlayoffSave,s:PlayoffSeries):string|undefined=>
 s.winsA>=winsRequired(p)?s.seedA:s.winsB>=winsRequired(p)?s.seedB:undefined;
export function nextSeries(p:PlayoffSave):PlayoffSeries|undefined{
 for(const s of p.series)if(!winner(p,s))return s;
 if(p.series.length===2){
  const a=winner(p,p.series[0]),b=winner(p,p.series[1]);
  if(a&&b)p.series.push({round:1,seedA:a,seedB:b,winsA:0,winsB:0,results:[]});
 }
 return p.series.find(s=>!winner(p,s));
}
export function recordPlayoffGame(p:PlayoffSave,s:PlayoffSeries,a:number,b:number,day?:number,played=false):void{
 if(!p.series.includes(s)||winner(p,s))throw Error('This series has ended.');
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b)throw Error('Playoff game must have a winner.');
 s.results.push({a,b,...(day===undefined?{}:{day}),played});if(a>b)s.winsA++;else s.winsB++;
 if(winner(p,s)&&s.round===1)p.champion=winner(p,s);
}
export function simPlayoffGame(p:PlayoffSave,s:PlayoffSeries,day?:number):void{
 const n=seed(p.seasonYear+'|'+s.seedA+'|'+s.seedB+'|'+s.results.length);
 const a=Math.floor(rand(n)*5),b=Math.floor(rand(n+83)*5);
 recordPlayoffGame(p,s,a===b?a+1:a,b,day);
}
export function simulateRemainingPlayoffs(p:PlayoffSave):void{
 let count=0;while(!p.champion&&count++<28){const s=nextSeries(p);if(!s)break;simPlayoffGame(p,s);}
}
export const isQualified=(p:PlayoffSave,teamId:string):boolean=>
 p.series.slice(0,2).some(s=>s.seedA===teamId||s.seedB===teamId);
export function nextCareerStart(p:CareerStart,birthdate:string):CareerStart{
 const year=p.seasonYear+1;
 if(p.legacy||p.division==='development')return {...p,age:year-Number(birthdate.slice(0,4)),seasonYear:year};
 const age=year-Number(birthdate.slice(0,4));
 const available=eligibleDivisions(age);
 // Until real pro leagues are added, players aging out of junior continue
 // in the fictional development division without becoming ineligible.
 if(!available.length)return {...p,age,seasonYear:year,division:'development',tier:'development',legacy:true};
 let division=available.find(d=>d.id===p.division)??available[0];
 // On ageing out of youth, advance to the next available division;
 // 16/17-year-olds remain in U18 until they choose junior later.
 if(!available.some(d=>d.id===p.division))division=available[0];
 let tier=division.tiers.includes(p.tier)?p.tier:division.id==='junior'?'jrb':division.tiers.includes('aa')?'aa':division.tiers[0];
 return startingPath(birthdate,age,division.id,tier);
}
export function seasonHistory(season:SeasonSave,p:PlayoffSave,start:CareerStart):SeasonHistory{
 const rankings=leagueStandings(season);
 return {seasonYear:p.seasonYear,division:leagueTitle(start),teamId:season.teamId,champion:p.champion,
  clubRank:rankings.findIndex(t=>t.team.id===season.teamId)+1,games:rankings.find(t=>t.team.id===season.teamId)?.gp??0};
}
export function advanceCareerSeason(season:SeasonSave,playoffs:PlayoffSave,start:CareerStart,birthdate:string):{
 season:SeasonSave;start:CareerStart;history:SeasonHistory
}{
 if(!playoffs.champion)throw Error('Finish playoffs before advancing.');
 const history=seasonHistory(season,playoffs,start);
 const following=nextCareerStart(start,birthdate);
 const division=findDivision(following.division);
 const cycles=division?.cycles??8;
 return {history,start:following,season:newSeason(season.teamId,following.seasonYear+'-10-01',cycles)};
}

/** Fictional postseason dates, relative to Oct 1. The first semifinal game is
 * April 19 (day 200), games occur every three days, and the final starts in
 * mid-May (day 227). Both semifinal series play on the same dates.
 */
export const PLAYOFF_START_DAY=200;
export const PLAYOFF_FINAL_START_DAY=227;
export const PLAYOFF_GAP_DAYS=3;
export const PLAYOFF_LAST_DAY=245;
export interface PlayoffCalendarGame {
 day:number;series:PlayoffSeries;homeId:string;awayId:string;gameIndex:number;
 scoreA?:number;scoreB?:number;played:boolean;
}
export const playoffGameDay=(round:0|1,gameIndex:number):number=>
 (round===0?PLAYOFF_START_DAY:PLAYOFF_FINAL_START_DAY)+gameIndex*PLAYOFF_GAP_DAYS;
export const playoffGameId=(s:PlayoffSeries,gameIndex:number):string=>
 'PO-'+s.round+'-'+s.seedA+'-'+s.seedB+'-'+gameIndex;
export function calendarPlayoffGames(p:PlayoffSave):PlayoffCalendarGame[]{
 const entries:PlayoffCalendarGame[]=[];
 for(const s of p.series){
  s.results.forEach((r,i)=>entries.push({
   day:r.day??playoffGameDay(s.round,i),series:s,homeId:s.seedA,awayId:s.seedB,
   gameIndex:i,scoreA:r.a,scoreB:r.b,played:r.played===true
  }));
  if(!winner(p,s)){
   const index=s.results.length;
   entries.push({day:playoffGameDay(s.round,index),series:s,
    homeId:s.seedA,awayId:s.seedB,gameIndex:index,played:false});
  }
 }
 return entries.sort((a,b)=>a.day-b.day||a.series.round-b.series.round||a.series.seedA.localeCompare(b.series.seedA));
}
export interface NewPlayoffGame {series:PlayoffSeries;day:number;index:number;a:number;b:number}
/** Return each newly generated game so career XP and individual stats can be
 * credited exactly once. No scheduling before the required date. */
export function simulatePlayoffDay(p:PlayoffSave,day:number):NewPlayoffGame[]{
 const events:NewPlayoffGame[]=[];
 if(p.champion||day<PLAYOFF_START_DAY)return events;
 nextSeries(p);
 // The first two series share dates. The final is created once both finish.
 const eligible=p.series.filter(s=>!winner(p,s)&&playoffGameDay(s.round,s.results.length)<=day);
 for(const s of eligible){
  const index=s.results.length;
  const scheduledDay=playoffGameDay(s.round,index);
  simPlayoffGame(p,s,scheduledDay);
  const r=s.results[index];
  events.push({series:s,day:scheduledDay,index,a:r.a,b:r.b});
 }
 nextSeries(p);
 return events;
}
export function simulatePlayoffThrough(p:PlayoffSave,targetDay:number):NewPlayoffGame[]{
 const events:NewPlayoffGame[]=[];
 for(let day=PLAYOFF_START_DAY;day<=Math.min(targetDay,PLAYOFF_LAST_DAY);day++)
  events.push(...simulatePlayoffDay(p,day));
 return events;
}
/** Playoff player stats use the same six established fictional bot identities
 * as regular-season leaderboards, but all counters begin at zero.
 * These are derived from saved series scores, not independent random results.
 */
export function playoffBotStats(season:SeasonSave,p:PlayoffSave):BotStat[]{
 const players=botStats(season).map(b=>({...b,gp:0,goals:0,assists:0,points:0,saves:0,wins:0,shotsAgainst:0,goalsAgainst:0,shutouts:0}));
 const hashed=(text:string)=>{let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0};
 for(const series of p.series){
  series.results.forEach((r,index)=>{
   for(const [teamId,goals,against,won] of [
    [series.seedA,r.a,r.b,r.a>r.b],[series.seedB,r.b,r.a,r.b>r.a]
   ] as [string,number,number,boolean][]){
    const roster=players.filter(x=>x.teamId===teamId);
    if(roster.length!==6)continue;
    roster.forEach(x=>x.gp++);
    const seed=hashed(playoffGameId(series,index)+teamId);
    for(let goal=0;goal<goals;goal++){
     const scorer=roster[(seed+goal*13)%5];
     const passer=roster[(seed+goal*13+3)%5];
     scorer.goals++;scorer.points++;
     if(scorer!==passer){passer.assists++;passer.points++;}
    }
    const goalie=roster[5],saves=18+(hashed('S'+seed+index)%16);
    goalie.saves+=saves;goalie.shotsAgainst+=saves+against;
    goalie.goalsAgainst+=against;if(won)goalie.wins++;
    if(against===0)goalie.shutouts++;
   }
  });
 }
 return players.filter(x=>x.gp>0);
}
