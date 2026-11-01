import {LEAGUE_TEAMS,getTeam} from './fictionalLeague';
import {dateAt,lastCareerDay,type SeasonSave,MAX_SEASON_DAY} from './seasonLeague';
import {findDivision,type CareerStart} from './careerPath';

export type RosterPosition='C'|'LW'|'RW'|'LD'|'RD'|'G';
export interface RosterPlayer {
 id:string;name:string;position:RosterPosition;teamId:string;age:number;overall:number;potential:number;jersey:number;
}
export type MoveKind='trade'|'signing'|'transfer';
export interface RosterTransaction {
 id:string;day:number;date:string;kind:MoveKind;from?:string;to:string;
 playerName:string;description:string;
}
export interface CareerRosters {
 version:1;seasonYear:number;seed:number;lastDay:number;players:RosterPlayer[];
 events:RosterTransaction[];coachTrust:number;gmTrust:number;playerTeamId:string;
 playerTransfersThisYear:number;
}
const FIRST=['Alex','Evan','Leo','Mason','Dylan','Jordan','Sam','Casey','Nolan','Theo','Mika','Avery','Jamie','Parker','Quinn','Riley','Hayden','Jesse','Emery','Noah','Rowan','Kai','Owen','Logan'];
const LAST=['Cole','Mercer','Voss','Stone','Reed','Keller','Vale','Bennett','Brooks','Mills','Shaw','Frost','Hayes','Reyes','Sato','Ward','Rowe','Meyer','Price','Hale','Chen','Novak','Roy','Tremblay'];
const POSITIONS:RosterPosition[]=['C','C','C','C','LW','LW','LW','LW','RW','RW','RW','RW','LD','LD','LD','RD','RD','RD','G','G'];
const hash=(text:string):number=>{
 let h=2166136261;
 for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
 return h>>>0;
};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const group=(position:RosterPosition):'F'|'D'|'G'=>
 position==='G'?'G':position==='LD'||position==='RD'?'D':'F';
const ageRange=(start:CareerStart):[number,number]=>{
 const division=findDivision(start.division);
 if(!division)return [Math.max(16,start.age-3),Math.min(24,start.age+3)];
 return [division.minAge,division.maxAge];
};
function recruit(teamId:string,year:number,index:number,start:CareerStart):RosterPlayer{
 const h=hash(teamId+'|'+year+'|'+index);
 const range=ageRange(start),age=range[0]+h%(range[1]-range[0]+1);
 const id=teamId+'-'+year+'-'+index;
 return {id,name:FIRST[h%FIRST.length]+' '+LAST[(h>>>8)%LAST.length],
  position:POSITIONS[index%POSITIONS.length],teamId,age,
  overall:clamp(45+((h>>>12)%33),35,91),
  potential:clamp(64+((h>>>5)%34),60,99),
  jersey:1+((h>>>16)%98)};
}
export const teamRoster=(world:CareerRosters,teamId:string):RosterPlayer[]=>
 world.players.filter(p=>p.teamId===teamId);
export const teamOverall=(world:CareerRosters,teamId:string):number=>{
 const p=teamRoster(world,teamId);
 return p.length?Math.round(p.reduce((n,x)=>n+x.overall,0)/p.length):55;
};
export const rosterRatings=(world:CareerRosters):Record<string,number>=>
 Object.fromEntries(LEAGUE_TEAMS.map(t=>[t.id,teamOverall(world,t.id)]));
export const tradeDeadline=(s:SeasonSave):number=>{
 const year=Number(s.startDate.slice(0,4));
 const iso=String(year+1)+'-03-01';
 return Math.round((Date.parse(iso+'T12:00:00Z')-Date.parse(s.startDate+'T12:00:00Z'))/86400000);
};
export const isTradeWindow=(s:SeasonSave,day:number):boolean=>
 day<=tradeDeadline(s)||(day>=243&&day<=lastCareerDay(s.startDate));
export const isRosterOffseason=(day:number):boolean=>day>=243;

export function newCareerRosters(start:CareerStart,playerTeamId:string,day=-1):CareerRosters{
 const players=LEAGUE_TEAMS.flatMap(t=>POSITIONS.map((_,i)=>recruit(t.id,start.seasonYear,i,start)));
 const seed=hash('rosters|'+start.seasonYear+'|'+playerTeamId);
 return {version:1,seasonYear:start.seasonYear,seed,lastDay:day,players,events:[],
  coachTrust:64,gmTrust:62,playerTeamId:getTeam(playerTeamId).id,playerTransfersThisYear:0};
}
export function normalizeCareerRosters(raw:unknown,start:CareerStart,playerTeamId:string,day:number):CareerRosters{
 const o=raw as Partial<CareerRosters>|undefined;
 if(!o||o.version!==1||!Array.isArray(o.players)||o.players.length!==LEAGUE_TEAMS.length*POSITIONS.length){
  return newCareerRosters(start,playerTeamId,Math.max(-1,day));
 }
 return {...o,version:1,seasonYear:start.seasonYear,
  seed:o.seed??hash('rosters|'+start.seasonYear),
  lastDay:clamp(Math.floor(o.lastDay??day),-1,lastCareerDay(start.seasonYear+'-10-01')),
  players:o.players.map(p=>({...p})),
  events:(o.events??[]).map(e=>({...e})),
  coachTrust:clamp(o.coachTrust??64,0,100),gmTrust:clamp(o.gmTrust??62,0,100),
  playerTeamId:getTeam(playerTeamId).id,playerTransfersThisYear:o.playerTransfersThisYear??0};
}
const push=(world:CareerRosters,e:RosterTransaction)=>{if(!world.events.some(x=>x.id===e.id))world.events.push(e);};
export function updateManagementAfterGame(world:CareerRosters,won:boolean,simulated:boolean,goodGame=false):void{
 world.coachTrust=clamp(world.coachTrust+(won?(simulated?1:2):(simulated?-1:-2))+(goodGame?2:0),0,100);
 world.gmTrust=clamp(world.gmTrust+(won?1:-1)+(goodGame?1:0),0,100);
}
function exchange(world:CareerRosters,season:SeasonSave,day:number):void{
 const teamA=LEAGUE_TEAMS[hash('A'+world.seed+':'+day)%LEAGUE_TEAMS.length].id;
 const available=LEAGUE_TEAMS.filter(t=>t.id!==teamA);
 const teamB=available[hash('B'+world.seed+':'+day)%available.length].id;
 const kind=(hash('P'+world.seed+':'+day)%10)<6?'F':(hash('P'+world.seed+':'+day)%10)<9?'D':'G';
 const a=teamRoster(world,teamA).filter(p=>group(p.position)===kind);
 const b=teamRoster(world,teamB).filter(p=>group(p.position)===kind);
 if(!a.length||!b.length)return;
 const pa=a[hash('X'+day+world.seed)%a.length],pb=b[hash('Y'+day+world.seed)%b.length];
 pa.teamId=teamB;pb.teamId=teamA;
 const id=world.seasonYear+'-'+day+'-swap';
 push(world,{id,day,date:dateAt(season,day),kind:'trade',from:teamA,to:teamB,playerName:pa.name,
  description:getTeam(teamA).abbr+' and '+getTeam(teamB).abbr+' trade '+pa.name+' for '+pb.name});
}
function signProspect(world:CareerRosters,season:SeasonSave,day:number,start:CareerStart):void{
 const team=LEAGUE_TEAMS[hash(world.seed+':sign:'+day)%LEAGUE_TEAMS.length].id;
 const club=teamRoster(world,team);
 if(!club.length)return;
 const old=club[hash(world.seed+':release:'+day)%club.length];
 const slot=POSITIONS.indexOf(old.position);
 const prospect=recruit(team,start.seasonYear+1,slot>=0?slot:0,start);
 prospect.id='prospect-'+world.seasonYear+'-'+day+'-'+team;
 prospect.position=old.position;
 world.players.splice(world.players.findIndex(p=>p.id===old.id),1,prospect);
 push(world,{id:world.seasonYear+'-'+day+'-sign',day,date:dateAt(season,day),
  kind:'signing',from:team,to:team,playerName:prospect.name,
  description:getTeam(team).abbr+' sign '+prospect.name+' ('+prospect.position+') and release '+old.name});
}
function maybeMoveCareerPlayer(world:CareerRosters,season:SeasonSave,day:number,start:CareerStart):string|undefined{
 if(world.playerTransfersThisYear>0)return undefined;
 const lowTrust=world.gmTrust<42||world.coachTrust<38;
 const junior=start.age>=15;
 const odds=lowTrust?(junior?38:110):(junior?900:2400);
 if(hash('player-move|'+world.seed+'|'+day)%odds!==0)return undefined;
 const options=LEAGUE_TEAMS.filter(t=>t.id!==world.playerTeamId);
 const destination=options[hash(world.seed+':destination:'+day)%options.length].id;
 const old=world.playerTeamId;
 world.playerTeamId=destination;
 world.playerTransfersThisYear++;
 world.coachTrust=56;world.gmTrust=58;
 const name=start.age<15?'club transfer':'trade';
 push(world,{id:world.seasonYear+'-'+day+'-player',day,date:dateAt(season,day),
  kind:'transfer',from:old,to:destination,playerName:'Your Player',
  description:'Your player was '+(name==='trade'?'traded':'transferred')+' from '+
  getTeam(old).abbr+' to '+getTeam(destination).abbr+(lowTrust?' after management lost confidence':' following a roster decision')});
 return destination;
}
export function processRosterMovesThrough(world:CareerRosters,season:SeasonSave,target:number,start:CareerStart):{
 teamId:string;newEvents:RosterTransaction[]
}{
 const end=clamp(Math.floor(target),world.lastDay,lastCareerDay(season.startDate));
 const eventsBefore=world.events.length;
 for(let d=world.lastDay+1;d<=end;d++){
  if(!isTradeWindow(season,d))continue;
  const offseason=isRosterOffseason(d);
  const chance=offseason?11:21;
  if(hash('trade|'+world.seed+'|'+d)%chance===0)exchange(world,season,d);
  if(offseason&&hash('sign|'+world.seed+'|'+d)%19===0)signProspect(world,season,d,start);
  maybeMoveCareerPlayer(world,season,d,start);
 }
 world.lastDay=end;
 return {teamId:world.playerTeamId,newEvents:world.events.slice(eventsBefore)};
}
export function nextSeasonRosters(world:CareerRosters,start:CareerStart):CareerRosters{
 world.seasonYear=start.seasonYear;world.lastDay=-1;world.playerTransfersThisYear=0;
 const [minAge,maxAge]=ageRange(start);
 world.players=world.players.map((p,i)=>{
  const age=p.age+1;
  if(age>maxAge||age<minAge){
   const replacement=recruit(p.teamId,start.seasonYear,i%20,start);
   // Trades change a player's team without changing their array index.
   // Preserve each club's positional composition and use the retiring
   // player's stable ID to guarantee unique prospect IDs after rollover.
   replacement.id='rookie-'+start.seasonYear+'-'+p.id;
   replacement.position=p.position;
   return replacement;
  }
  const growth=age<=18?1:age<24?0:age>32?-1:0;
  return {...p,age,overall:clamp(p.overall+growth,30,p.potential)};
 });
 world.coachTrust=clamp(Math.round((world.coachTrust+60)/2),0,100);
 world.gmTrust=clamp(Math.round((world.gmTrust+60)/2),0,100);
 return world;
}
