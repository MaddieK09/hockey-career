import {getTeam,type LeagueTeam} from './fictionalLeague';
import type {CareerStart} from './careerPath';
export interface CrestDesign {symbol:string;path:string;detail:string}
/** Original source-editable geometric crests; no licensed club artwork. */
export const TEAM_CRESTS:Readonly<Record<string,CrestDesign>>={
 northport:{symbol:'WOLF',path:'M13 27 L24 7 36 22 50 19 64 22 76 7 87 27 80 66 66 83 50 94 34 83 20 66 Z',detail:'M31 48 L43 52 50 61 57 52 69 48 M40 72 L50 81 60 72'},
 lakehaven:{symbol:'OTTER',path:'M18 55 C18 21 34 15 50 31 C66 15 82 21 82 55 C82 74 68 88 50 88 C32 88 18 74 18 55 Z',detail:'M18 59 Q33 41 50 58 Q67 41 82 59 M37 43 L40 43 M60 43 L63 43 M42 71 Q50 78 58 71'},
 ironvale:{symbol:'FORGE',path:'M16 31 H84 L76 46 H65 L61 71 H74 V85 H26 V71 H39 L35 46 H24 Z',detail:'M28 31 L50 13 72 31 M41 47 H59 M35 81 H65'},
 stonebridge:{symbol:'STAG',path:'M38 85 L30 48 17 23 L30 30 37 15 43 38 50 45 57 38 63 15 70 30 83 23 70 48 62 85 50 94 Z',detail:'M40 57 L45 60 M55 60 L60 57 M43 75 L50 80 57 75'},
 frostford:{symbol:'AURORA',path:'M10 72 Q25 14 42 48 Q53 64 63 33 Q75 10 90 35 L76 84 56 66 38 90 Z',detail:'M20 70 Q33 33 43 61 Q55 78 68 42 M33 75 Q54 64 74 77'},
 redcliff:{symbol:'FALCON',path:'M8 41 L43 19 50 35 57 19 92 41 73 62 56 52 50 83 44 52 27 62 Z',detail:'M24 42 L46 44 M54 44 L76 42 M43 58 L50 64 57 58'},
 clearwater:{symbol:'TIDES',path:'M9 62 Q24 28 40 48 Q56 68 73 42 Q84 29 92 31 L84 73 Q62 99 42 80 Q25 68 9 85 Z',detail:'M11 64 Q29 48 44 67 Q62 87 88 57 M29 41 Q50 29 69 44'},
 pinecrest:{symbol:'LYNX',path:'M16 15 L38 29 50 20 62 29 84 15 81 69 66 89 50 93 34 89 19 69 Z',detail:'M28 54 L43 60 M57 60 L72 54 M40 75 L50 80 60 75'}
};
export function teamCrest(id:string,size=48):string{
 const t=getTeam(id),mark=TEAM_CRESTS[t.id];
 return '<svg class="hockey-team-crest" viewBox="0 0 100 100" width="'+size+'" height="'+size+'" role="img" aria-label="'+t.city+' '+t.name+' crest" xmlns="http://www.w3.org/2000/svg">'+
 '<path d="M50 3 L92 19 V63 Q90 84 50 99 Q10 84 8 63 V19 Z" fill="'+t.primary+'" stroke="'+t.accent+'" stroke-width="5"/>'+
 '<path d="'+mark.path+'" fill="'+t.accent+'" stroke="'+t.helmet+'" stroke-width="2" stroke-linejoin="round"/>'+
 '<path d="'+mark.detail+'" fill="none" stroke="'+t.primary+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
 '</svg>';
}
export function drawTeamCrest(ctx:CanvasRenderingContext2D,id:string,x:number,y:number,scale:number):void{
 const t=getTeam(id),mark=TEAM_CRESTS[t.id];
 ctx.save();ctx.translate(x,y);ctx.scale(scale/100,scale/100);
 ctx.translate(-50,-50);
 ctx.fillStyle=t.primary;ctx.strokeStyle=t.accent;ctx.lineWidth=5;
 const shield=new Path2D('M50 3 L92 19 V63 Q90 84 50 99 Q10 84 8 63 V19 Z');ctx.fill(shield);ctx.stroke(shield);
 ctx.fillStyle=t.accent;ctx.strokeStyle=t.helmet;ctx.lineWidth=2;
 const symbol=new Path2D(mark.path);ctx.fill(symbol);ctx.stroke(symbol);
 ctx.strokeStyle=t.primary;ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
 ctx.stroke(new Path2D(mark.detail));ctx.restore();
}
export function leagueCrest(start:CareerStart,size=44):string{
 const division=start.division==='development'?'DEV':start.division.toUpperCase();
 const tier=start.tier==='development'?'ICE':start.tier.toUpperCase();
 return '<svg class="hockey-league-crest" viewBox="0 0 100 100" width="'+size+'" height="'+size+'" role="img" aria-label="Northern Ice '+division+' league crest" xmlns="http://www.w3.org/2000/svg">'+
 '<path d="M50 5 L91 24 V66 L50 94 9 66 V24 Z" fill="#17344d" stroke="#8cd5e9" stroke-width="5"/>'+
 '<path d="M50 15 V80 M23 45 H77 M28 31 L72 71 M72 31 L28 71" stroke="#72b5d3" stroke-width="3" opacity=".7"/>'+
 '<circle cx="50" cy="48" r="25" fill="#0e3b57" stroke="#f3d48b" stroke-width="3"/>'+
 '<text x="50" y="45" fill="#fff" font-size="18" font-weight="900" font-family="system-ui" text-anchor="middle">'+division+'</text>'+
 '<text x="50" y="60" fill="#f8d990" font-size="10" font-weight="800" font-family="system-ui" text-anchor="middle">'+tier+'</text></svg>';
}
export const crestIds=()=>Object.keys(TEAM_CRESTS);
