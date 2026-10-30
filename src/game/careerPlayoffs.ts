import {leagueStandings,newSeason,type SeasonSave} from './seasonLeague';
import {findDivision,eligibleDivisions,leagueTitle,type CareerStart,startingPath} from './careerPath';
export interface PlayoffSeries {round:0|1;seedA:string;seedB:string;winsA:number;winsB:number;results:Array<{a:number;b:number}>}
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
export function recordPlayoffGame(p:PlayoffSave,s:PlayoffSeries,a:number,b:number):void{
 if(!p.series.includes(s)||winner(p,s))throw Error('This series has ended.');
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b)throw Error('Playoff game must have a winner.');
 s.results.push({a,b});if(a>b)s.winsA++;else s.winsB++;
 if(winner(p,s)&&s.round===1)p.champion=winner(p,s);
}
export function simPlayoffGame(p:PlayoffSave,s:PlayoffSeries):void{
 const n=seed(p.seasonYear+'|'+s.seedA+'|'+s.seedB+'|'+s.results.length);
 const a=Math.floor(rand(n)*5),b=Math.floor(rand(n+83)*5);
 recordPlayoffGame(p,s,a===b?a+1:a,b);
}
export function simulateRemainingPlayoffs(p:PlayoffSave):void{
 let count=0;while(!p.champion&&count++<28){const s=nextSeries(p);if(!s)break;simPlayoffGame(p,s);}
}
export function isQualified(p:PlayoffSave,teamId:string):boolean=>
 p.series.slice(0,2).some(s=>s.seedA===teamId||s.seedB===teamId);
export function nextCareerStart(p:CareerStart,birthdate:string):CareerStart{
 const year=p.seasonYear+1;
 if(p.legacy||p.division==='development')return {...p,age:year-Number(birthdate.slice(0,4)),seasonYear:year};
 const age=year-Number(birthdate.slice(0,4));
 const available=eligibleDivisions(age);
 if(!available.length)return {...p,age,seasonYear:year,division:'junior',tier:'jrb'};
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
