import {ledgerTotals,type SeasonPlayerLedger} from './seasonPlayerLedger';
import {leagueStandings,botStats,type SeasonSave} from './seasonLeague';
import type {CareerPositionStats} from './careerPositionStats';
import type {Position} from '../player/types';
import type {PlayoffSave} from './careerPlayoffs';
export type AwardId='league-champion'|'regular-champion'|'playoff-finalist'|'first-win'|'ten-wins'|'shutout'|'first-point'|'scoring-title'|'goalie-wins-title'|'goalie-saves-title'|'goal-title'|'assist-title'|'goalie-save-percentage-title'|'twenty-five-wins'|'fifty-wins'|'twenty-five-goals'|'fifty-points'|'one-hundred-games'|'five-shutouts';
export interface Trophy {id:string;award:AwardId;title:string;year:number;league:string;detail:string;icon:string}
export interface TrophyCase {version:1;items:Trophy[]}
export const emptyTrophyCase=():TrophyCase=>({version:1,items:[]});
export function normalizeTrophyCase(raw:unknown):TrophyCase{
 if(!raw||typeof raw!=='object'||!Array.isArray((raw as TrophyCase).items))return emptyTrophyCase();
 const entries=(raw as TrophyCase).items.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string');
 return {version:1,items:[...new Map(entries.map(x=>[x.id,x])).values()]};
}
export function giveAward(box:TrophyCase,award:AwardId,year:number,league:string,detail:string):boolean{
 const meta:Record<AwardId,[string,string]>={
  'league-champion':['League Champion','🏆'],
  'regular-champion':['Regular Season Champions','🥇'],
  'playoff-finalist':['Playoff Finalist','🥈'],
  'first-win':['First Career Win','⭐'],
  'ten-wins':['Ten Career Wins','🌟'],
  'shutout':['First Shutout','🧤'],
  'first-point':['First Career Point','🏒'],
  'scoring-title':['League Scoring Champion','🏅'],
  'goalie-wins-title':['League Wins Leader','🥅'],
  'goalie-saves-title':['League Saves Leader','🧤'],
  'goal-title':['League Goals Leader','🎯'],
  'assist-title':['League Assists Leader','🎟️'],
  'goalie-save-percentage-title':['League Save Percentage Leader','🥅'],
  'twenty-five-wins':['25 Career Wins','🏅'],
  'fifty-wins':['50 Career Wins','🏆'],
  'twenty-five-goals':['25 Career Goals','🎯'],
  'fifty-points':['50 Career Points','🌟'],
  'one-hundred-games':['100 Games Played','💯'],
  'five-shutouts':['Five Career Shutouts','🧤']
 };
 const id=award+':'+(award==='first-win'||award==='ten-wins'||award==='shutout'||award==='first-point'||award==='twenty-five-wins'||award==='fifty-wins'||award==='twenty-five-goals'||award==='fifty-points'||award==='one-hundred-games'||award==='five-shutouts'?'career':year);
 if(box.items.some(t=>t.id===id))return false;
 const [title,icon]=meta[award];
 box.items.push({id,award,title,year,league,detail,icon});
 return true;
}
/** Career milestones are awarded once, regardless of whether the game was
 * played or simulated. Season awards are awarded when the year ends. */
export function checkMilestoneAwards(box:TrophyCase,stats:CareerPositionStats,position:Position,year:number,league:string):number{
 let total=0;
 if(stats.wins>=1&&giveAward(box,'first-win',year,league,'Win your first career game'))total++;
 if(stats.wins>=10&&giveAward(box,'ten-wins',year,league,'Win ten career games'))total++;
 if(stats.wins>=25&&giveAward(box,'twenty-five-wins',year,league,'Win 25 career games'))total++;
 if(stats.wins>=50&&giveAward(box,'fifty-wins',year,league,'Win 50 career games'))total++;
 if(stats.gp>=100&&giveAward(box,'one-hundred-games',year,league,'Reach 100 games played'))total++;
 if(position==='G'){
  if(stats.shutouts>0&&giveAward(box,'shutout',year,league,'Record a shutout'))total++;
  if(stats.shutouts>=5&&giveAward(box,'five-shutouts',year,league,'Record five shutouts'))total++;
 }else{
  if(stats.goals+stats.assists>0&&giveAward(box,'first-point',year,league,'Record your first point'))total++;
  if(stats.goals>=25&&giveAward(box,'twenty-five-goals',year,league,'Score 25 career goals'))total++;
  if(stats.goals+stats.assists>=50&&giveAward(box,'fifty-points',year,league,'Record 50 career points'))total++;
 }
 return total;
}
export function awardSeason(box:TrophyCase,season:SeasonSave,post:PlayoffSave,position:Position,playerStats:CareerPositionStats,league:string,ledger?:SeasonPlayerLedger):number{
 if(!post.champion)throw Error('Playoffs are not complete');
 const year=Number(season.startDate.slice(0,4)),rankings=leagueStandings(season),club=season.teamId;
 let n=0;
 const grant=(award:AwardId,detail:string)=>{if(giveAward(box,award,year,league,detail))n++;};
 if(post.champion===club)grant('league-champion','Won the postseason championship');
 if(rankings[0]?.team.id===club)grant('regular-champion','Finished first in league standings');
 const final=post.series.find(s=>s.round===1);
 if(final&&(final.seedA===club||final.seedB===club)&&post.champion!==club)grant('playoff-finalist','Reached the championship final');
 // Individual awards only use this season's ledger, never lifetime totals.
 // Compare against bot totals recorded from the same fixture results.
 if(ledger&&ledger.year===year){
  const stats=ledgerTotals(ledger),rivals=botStats(season).filter(x=>x.teamId!==club);
  const top=(score:number,compare:(p:ReturnType<typeof botStats>[number])=>number)=>
   stats.gp>0&&score>0&&rivals.every(p=>score>compare(p));
  const skaters=rivals.filter(x=>x.position!=='G'),goalies=rivals.filter(x=>x.position==='G');
  if(position==='G'){
   if(top(stats.wins,p=>goalies.includes(p)?p.wins:0))grant('goalie-wins-title','Most goalie wins in the league');
   if(top(stats.saves,p=>goalies.includes(p)?p.saves:0))grant('goalie-saves-title','Most saves in the league');
   // Bot records currently lack shots faced. Avoid a fake league SV% award.
  }else{
   if(top(stats.goals+stats.assists,p=>skaters.includes(p)?p.points:0))grant('scoring-title','Led the league in points');
   if(top(stats.goals,p=>skaters.includes(p)?p.goals:0))grant('goal-title','Led the league in goals');
   if(top(stats.assists,p=>skaters.includes(p)?p.assists:0))grant('assist-title','Led the league in assists');
  }
 }
 void playerStats;
 return n;
}
/** Played XP formula is centralized so simulated games can earn exactly 10%
 * of the equivalent contribution-based amount, rounded to whole XP.
 */
export const playedGameXP=(goals:number,assists:number,saves:number,won:boolean):number=>
 40+Math.max(0,goals)*35+Math.max(0,assists)*20+Math.max(0,saves)*10+(won?30:0);
export const simulatedGameXP=(goals:number,assists:number,saves:number,won:boolean):number=>
 Math.round(playedGameXP(goals,assists,saves,won)*.10);
export const levelFromXP=(xp:number):number=>1+Math.floor(Math.max(0,xp)/200);
