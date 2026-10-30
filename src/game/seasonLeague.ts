import {LEAGUE_TEAMS,getTeam,type LeagueTeam} from './fictionalLeague';

/** Self-contained fictional league season. All dates are ISO UTC calendar days:
 * no browser timezone conversions, network requests or external team data. */
export interface Fixture {
 id:string;day:number;homeId:string;awayId:string;
 homeGoals?:number;awayGoals?:number;played?:boolean;
}
export interface SeasonSave {version:2;startDate:string;day:number;teamId:string;fixtures:Fixture[]}
export interface TeamStanding {team:LeagueTeam;gp:number;w:number;l:number;gf:number;ga:number;pts:number;diff:number}
export interface BotStat {id:string;name:string;teamId:string;position:'F'|'D'|'G';gp:number;goals:number;assists:number;points:number;saves:number;wins:number;shotsAgainst:number;goalsAgainst:number;shutouts:number}
const firstNames=['Evan','Mason','Leo','Theo','Owen','Nolan','Finn','Alex','Riley','Jordan','Carter','Max','Jamie','Dylan','Quinn','Parker'];
const lastNames=['Mercer','Vale','Bennett','Voss','Reed','Cole','Frost','Hale','Rowan','Brooks','Price','Keller','Stone','Mills','Hayes','Ward'];
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const scoreSeed=(id:string)=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0;};
const rand=(n:number)=>{let x=(n+0x6D2B79F5)>>>0;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
const offsetDate=(iso:string,days:number)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
export const dateAt=(season:SeasonSave,day:number)=>offsetDate(season.startDate,day);
/** Full regular season runs from October 1 through April 15, inclusive. */
export const SEASON_START_DATE='2026-10-01';
export const SEASON_END_DATE='2027-04-15';
export const MAX_SEASON_DAY=196;
export const ROUNDS_PER_SEASON=56;
export type DayActivity='game'|'training'|'rest';
export interface DayPlan {day:number;kind:DayActivity;fixture?:Fixture}

export function seasonDay(iso:string,start:string):number{
 const a=Date.parse(iso+'T12:00:00Z'),b=Date.parse(start+'T12:00:00Z');
 return Number.isFinite(a)&&Number.isFinite(b)?clamp(Math.round((a-b)/86400000),0,MAX_SEASON_DAY):0;
}
export function newSeason(teamId:string,startDate=SEASON_START_DATE,cycles=8):SeasonSave{
 // Youth leagues play shorter calendars; junior and legacy leagues play 56 games.
 const numberOfCycles=[4,6,8].includes(cycles)?cycles:8;
 const ids=LEAGUE_TEAMS.map(t=>t.id);
 // Eight round-robin cycles: 56 games per team, with four home/four away
 // meetings against each opponent. Each round plays on its own calendar day,
 // usually 3-4 days after the preceding one, leaving training/rest days.
 const fixtures:Fixture[]=[];
 for(let cycle=0;cycle<numberOfCycles;cycle++){
  const order=[...ids];
  for(let round=0;round<7;round++){
   const globalRound=cycle*7+round;
   const day=Math.round(globalRound*MAX_SEASON_DAY/(numberOfCycles*7-1));
   for(let i=0;i<4;i++){
    const a=order[i],b=order[7-i];
    const swap=(round+i+cycle)%2===1;
    fixtures.push({id:'R'+globalRound+'-'+i,day,
     homeId:swap?b:a,awayId:swap?a:b});
   }
   order.splice(1,0,order.pop()!);
  }
 }
 return {version:2,startDate,day:0,teamId:getTeam(teamId).id,fixtures};
}
/** Migrate PR100 prototype saves without wiping any played or simulated score.
 * Their old calendar dates are remapped to the longer season's fixture rounds.
 * Older seasons have 56 fixtures rather than 224.
 */
export function normalizeSeason(raw:unknown,teamId:string):SeasonSave{
 if(!raw||typeof raw!=='object')return newSeason(teamId);
 const s=raw as Omit<Partial<SeasonSave>,'version'> & {version?:number};
 if(!Array.isArray(s.fixtures)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s.startDate??''))return newSeason(teamId);
 if(s.version===2&&[112,168,224].includes(s.fixtures.length)){
  return {...s,version:2,startDate:s.startDate!,day:clamp(Math.floor(Number(s.day)||0),0,MAX_SEASON_DAY),
   teamId:getTeam(teamId).id,fixtures:s.fixtures.map(f=>({...f}))};
 }
 if(s.version===1&&s.fixtures.length===56){
  const year=Number(s.startDate!.slice(0,4))||2026;
  const next=newSeason(teamId,year+'-10-01');
  const previous=new Map(s.fixtures.map(f=>[f.id,f]));
  let latestCompleted=0;
  for(const f of next.fixtures){
   const old=previous.get(f.id);
   if(!old||old.homeId!==f.homeId||old.awayId!==f.awayId||
      !Number.isFinite(old.homeGoals)||!Number.isFinite(old.awayGoals))continue;
   f.homeGoals=old.homeGoals;f.awayGoals=old.awayGoals;f.played=old.played;
   latestCompleted=Math.max(latestCompleted,f.day);
  }
  // Preserve completed results without advancing beyond an unplayed fixture.
  next.day=latestCompleted;
  return next;
 }
 return newSeason(teamId);
}
/** Each club has games on the same league-wide match dates. Between games,
 * practice/training is a calendar placeholder only (no gameplay or XP).
 * The day after a match and every seventh off-day are designated rest days.
 */
export function dayPlan(s:SeasonSave,day:number,teamId=s.teamId):DayPlan{
 const d=clamp(Math.floor(day),0,MAX_SEASON_DAY);
 const fixture=s.fixtures.find(f=>f.day===d&&(f.homeId===teamId||f.awayId===teamId));
 if(fixture)return {day:d,kind:'game',fixture};
 const playedYesterday=s.fixtures.some(f=>f.day===d-1&&(f.homeId===teamId||f.awayId===teamId));
 return {day:d,kind:playedYesterday||d%7===6?'rest':'training'};
}
function simulateScore(f:Fixture):[number,number]{
 const seed=scoreSeed(f.id+'|'+f.homeId+'|'+f.awayId),strengthA=scoreSeed(f.homeId)%7,strengthB=scoreSeed(f.awayId)%7;
 const a=clamp(Math.floor(rand(seed)*5+strengthA*.15),0,7);
 const b=clamp(Math.floor(rand(seed+1)*5+strengthB*.15),0,7);
 // No unresolved ties in this prototype: treat regulation ties as overtime
 // wins but preserve the full-game W/L table.
 return a===b?(rand(seed+2)>.5?[a+1,b]:[a,b+1]):[a,b];
}
export function simulateThrough(s:SeasonSave,day:number):{games:number;userGames:number;wins:number;losses:number}{
 const cutoff=clamp(Math.floor(day),s.day,MAX_SEASON_DAY);
 let games=0,userGames=0,wins=0,losses=0;
 for(const f of s.fixtures){
  if(f.day>cutoff||f.homeGoals!==undefined)continue;
  const [home,away]=simulateScore(f);
  f.homeGoals=home;f.awayGoals=away;f.played=false;games++;
  if(f.homeId===s.teamId||f.awayId===s.teamId){
   userGames++;
   const victory=(f.homeId===s.teamId?home>away:away>home);
   if(victory)wins++;else losses++;
  }
 }
 s.day=cutoff;
 return {games,userGames,wins,losses};
}
export function nextUserFixture(s:SeasonSave):Fixture|undefined{
 return s.fixtures.find(f=>f.homeGoals===undefined&&(f.homeId===s.teamId||f.awayId===s.teamId));
}
export function recordUserResult(s:SeasonSave,f:Fixture,playerGoals:number,opponentGoals:number):void{
 if(f.homeGoals!==undefined)throw Error('Fixture has already been played');
 if(f.homeId!==s.teamId&&f.awayId!==s.teamId)throw Error('Not a player fixture');
 const home=f.homeId===s.teamId;
 f.homeGoals=home?playerGoals:opponentGoals;f.awayGoals=home?opponentGoals:playerGoals;f.played=true;
 s.day=Math.max(s.day,f.day);
}
export function leagueStandings(s:SeasonSave):TeamStanding[]{
 const table=new Map(LEAGUE_TEAMS.map(t=>[t.id,{team:t,gp:0,w:0,l:0,gf:0,ga:0,pts:0,diff:0}]));
 for(const f of s.fixtures){
  if(f.homeGoals===undefined||f.awayGoals===undefined)continue;
  const a=table.get(f.homeId)!,b=table.get(f.awayId)!;
  a.gp++;b.gp++;a.gf+=f.homeGoals;a.ga+=f.awayGoals;b.gf+=f.awayGoals;b.ga+=f.homeGoals;
  if(f.homeGoals>f.awayGoals){a.w++;a.pts+=2;b.l++;}else{b.w++;b.pts+=2;a.l++;}
 }
 return [...table.values()].map(t=>({...t,diff:t.gf-t.ga})).sort((a,b)=>b.pts-a.pts||b.diff-a.diff||b.gf-a.gf||a.team.city.localeCompare(b.team.city));
}
export function botStats(s:SeasonSave):BotStat[]{
 const players:BotStat[]=[];
 for(const [ti,t] of LEAGUE_TEAMS.entries()){
  for(let i=0;i<6;i++){
   const n=ti*6+i;players.push({id:t.id+'-'+i,name:firstNames[n%firstNames.length]+' '+lastNames[(n*7+3)%lastNames.length],
    teamId:t.id,position:i===5?'G':i>=3?'D':'F',gp:0,goals:0,assists:0,points:0,saves:0,wins:0,shotsAgainst:0,goalsAgainst:0,shutouts:0});
  }
 }
 const byTeam=(id:string)=>players.filter(p=>p.teamId===id);
 for(const f of s.fixtures){
  if(f.homeGoals===undefined||f.awayGoals===undefined)continue;
  for(const [teamId,goals,against,victory] of [[f.homeId,f.homeGoals,f.awayGoals,f.homeGoals>f.awayGoals],[f.awayId,f.awayGoals,f.homeGoals,f.awayGoals>f.homeGoals]] as [string,number,number,boolean][]){
   const roster=byTeam(teamId),seed=scoreSeed(f.id+teamId);
   for(const p of roster)p.gp++;
   for(let goal=0;goal<goals;goal++){
    const scorer=roster[Math.floor(rand(seed+goal*17)*5)];
    const helper=roster[Math.floor(rand(seed+goal*17+7)*5)];
    scorer.goals++;scorer.points++;
    if(helper!==scorer){helper.assists++;helper.points++;}
   }
   const goalie=roster[5];const saves=Math.max(5,17+Math.floor(rand(seed+31)*14)-against);
   goalie.saves+=saves;goalie.shotsAgainst+=saves+against;
   goalie.goalsAgainst+=against;
   if(against===0)goalie.shutouts++;
   if(victory)goalie.wins++;
  }
 }
 return players;
}
