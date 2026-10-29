/** Original fictional development league; no NHL names, marks, or assets. */
export interface LeagueTeam {
 id:string;city:string;name:string;abbr:string;primary:string;accent:string;helmet:string;
}
export const LEAGUE_TEAMS:readonly LeagueTeam[]=[
 {id:'northport',city:'Northport',name:'Wolves',abbr:'NPW',primary:'#ac3545',accent:'#fff1dd',helmet:'#ecf0f4'},
 {id:'lakehaven',city:'Lakehaven',name:'Otters',abbr:'LHO',primary:'#196c8a',accent:'#f4c55d',helmet:'#123f55'},
 {id:'ironvale',city:'Ironvale',name:'Forge',abbr:'IVF',primary:'#bd542c',accent:'#e7e9ef',helmet:'#333945'},
 {id:'stonebridge',city:'Stonebridge',name:'Stags',abbr:'SBS',primary:'#245841',accent:'#d9c7a4',helmet:'#15382b'},
 {id:'frostford',city:'Frostford',name:'Aurora',abbr:'FFA',primary:'#4b5094',accent:'#b4e4ec',helmet:'#262b54'},
 {id:'redcliff',city:'Redcliff',name:'Falcons',abbr:'RCF',primary:'#812b43',accent:'#f5a866',helmet:'#421a2a'},
 {id:'clearwater',city:'Clearwater',name:'Tides',abbr:'CWT',primary:'#18758c',accent:'#e9f5fa',helmet:'#12475b'},
 {id:'pinecrest',city:'Pinecrest',name:'Lynx',abbr:'PCL',primary:'#334e7c',accent:'#e5ae48',helmet:'#1b2b49'}
];
export const DEFAULT_TEAM_ID='northport';
export const getTeam=(id?:string):LeagueTeam=>LEAGUE_TEAMS.find(t=>t.id===id)??LEAGUE_TEAMS[0];
/** Round-robin through every other club, with no self-fixtures. */
export function nextOpponent(teamId:string,gameNumber:number):LeagueTeam{
 const opponents=LEAGUE_TEAMS.filter(t=>t.id!==getTeam(teamId).id);
 return opponents[Math.max(0,Math.floor(gameNumber))%opponents.length];
}
export function teamChoiceOptions(selectedId:string):string{
 return LEAGUE_TEAMS.map(t=>'<option value="'+t.id+'"'+(t.id===selectedId?' selected':'')+'>'+t.city+' '+t.name+'</option>').join('');
}
