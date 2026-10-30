import {leagueStandings,botStats,type SeasonSave} from './seasonLeague';
import type {CareerPositionStats} from './careerPositionStats';
import type {Position} from '../player/types';
import type {PlayoffSave} from './careerPlayoffs';
export type AwardId='league-champion'|'regular-champion'|'playoff-finalist'|'first-win'|'ten-wins'|'shutout'|'first-point'|'scoring-title'|'goalie-wins-title'|'goalie-saves-title';
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
  'goalie-saves-title':['League Saves Leader','🧤']
 };
 const id=award+':'+(award==='first-win'||award==='ten-wins'||award==='shutout'||award==='first-point'?'career':year);
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
 if(position==='G'){
  if(stats.shutouts>0&&giveAward(box,'shutout',year,league,'Record a shutout'))total++;
 }else if(stats.goals+stats.assists>0&&giveAward(box,'first-point',year,league,'Record your first point'))total++;
 return total;
}
export function awardSeason(box:TrophyCase,season:SeasonSave,post:PlayoffSave,position:Position,playerStats:CareerPositionStats,league:string):number{
 if(!post.champion)throw Error('Playoffs are not complete');
 const year=Number(season.startDate.slice(0,4)),rankings=leagueStandings(season),club=season.teamId;
 let n=0;
 const grant=(award:AwardId,detail:string)=>{if(giveAward(box,award,year,league,detail))n++;};
 if(post.champion===club)grant('league-champion','Won the postseason championship');
 if(rankings[0]?.team.id===club)grant('regular-champion','Finished first in league standings');
 const final=post.series.find(s=>s.round===1);
 if(final&&(final.seedA===club||final.seedB===club)&&post.champion!==club)grant('playoff-finalist','Reached the championship final');
 // These are approximate player awards from career stats, rather than
 // fabricated season totals. Reserved for future true per-season stat ledgers.
 // Team trophies and career milestones are fully backed by recorded results.
 void position;void playerStats;void botStats;
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
