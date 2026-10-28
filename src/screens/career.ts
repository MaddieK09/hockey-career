import {loadPeriodMinutes,validPeriodMinutes,type PeriodMinutes} from '../config/matchSettings';
import type {PlayerDraft} from '../player/types';
import {playerPortrait} from '../graphics/playerPortrait';
import {mountHockeyMatch} from './hockeyMatch';
import {drawHockeyCharacter,drawRink} from '../graphics/animatedHockey2d';

export interface CareerSave {
 player:PlayerDraft; periodMinutes?:PeriodMinutes; games:number;wins:number;losses:number;goals:number;assists:number;saves:number;
 xp:number;level:number;skillPoints:number;speed:number;shot:number;handling:number;defense:number;
}
const KEY='hockey-career-save-v1';
export function loadCareer():CareerSave|null {
 try {const raw=localStorage.getItem(KEY);if(!raw)return null;const s=JSON.parse(raw) as CareerSave;return s?.player&&Number.isFinite(s.games)?s:null;}catch{return null;}
}
export function startCareer(p:PlayerDraft):CareerSave {
 const s:CareerSave={player:p,periodMinutes:loadPeriodMinutes(),games:0,wins:0,losses:0,goals:0,assists:0,saves:0,xp:0,level:1,skillPoints:0,speed:50,shot:50,handling:50,defense:50};
 saveCareer(s);return s;
}
function saveCareer(s:CareerSave){localStorage.setItem(KEY,JSON.stringify(s));}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function renderCareer(root:HTMLElement,career:CareerSave,onMenu:()=>void):void {
 let match:ReturnType<typeof startMatch>|null=null;
 const p=career.player;
 // Older saves keep working and inherit the current menu preference.
 career.periodMinutes=validPeriodMinutes(career.periodMinutes??loadPeriodMinutes());
 const name=(p.firstName+' '+p.lastName).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
 const drawHub=()=>{
  match?.stop();match=null;
  root.innerHTML=`<main class="career-shell"><header class="career-top"><button data-menu>← Menu</button><strong>HOCKEY CAREER · 2D</strong><span>LEVEL ${career.level}</span></header><section class="career-hero"><div class="career-avatar">${playerPortrait(p.appearance,p.equipment)}</div><div><p class="eyebrow">ROOKIE SEASON · DEVELOPMENT LEAGUE</p><h1>${name}</h1><p>#${p.jerseyNumber} · ${p.position} · ${p.nationality}</p><p>${career.games} GP · ${career.wins} W · ${career.losses} L</p></div></section><section class="career-stats"><div><strong>${career.goals}</strong><span>Goals</span></div><div><strong>${career.assists}</strong><span>Assists</span></div><div><strong>${career.saves}</strong><span>Saves</span></div><div><strong>${career.xp}</strong><span>XP</span></div></section><section class="career-panel"><h2>Player development</h2><p>Earn XP from games to level up and unlock attribute points.</p><div class="skill-grid">${(['speed','shot','handling','defense'] as const).map(k=>`<div class="skill-row"><span>${k.toUpperCase()} · ${career[k]}</span><button data-skill="${k}" ${career.skillPoints<1||career[k]>=99?'disabled':''}>+ Upgrade</button></div>`).join('')}</div><p>Available skill points: <b>${career.skillPoints}</b></p></section><section class="career-panel"><h2>Next game</h2><p>Home vs. Rivals · 3 × ${career.periodMinutes}-minute periods · 5 skaters and a goalie per team</p><button class="career-primary" data-play>PLAY NEXT GAME 🏒</button><p class="career-muted">Touch: drag the movement pad, tap Shoot / Pass / Switch. Keyboard: WASD or arrows, Space to shoot, E to pass, Tab to switch. Goalie: Butterfly (low), Blocker (high), Poke (close range).</p></section></main>`;
  root.querySelector('[data-menu]')?.addEventListener('click',onMenu);
  root.querySelector('[data-play]')?.addEventListener('click',()=>{match=startMatch();});
  root.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.skill as 'speed'|'shot'|'handling'|'defense';if(career.skillPoints&&career[k]<99){career[k]=clamp(career[k]+3,0,99);career.skillPoints--;saveCareer(career);drawHub();}}));
 };
 const startMatch=()=>mountHockeyMatch(root,p.position==='G',career,(result)=>{
  career.games++;
  if(result.home>result.away)career.wins++;
  else if(result.home<result.away)career.losses++;
  career.goals+=result.goals;
  career.assists+=result.assists;
  career.saves+=result.saves;
  const gained=40+result.goals*35+result.assists*20+result.saves*10+(result.home>result.away?30:0);
  career.xp+=gained;
  const newLevel=1+Math.floor(career.xp/200);
  if(newLevel>career.level){career.skillPoints+=newLevel-career.level;career.level=newLevel;}
  saveCareer(career);
 },()=>drawHub());
 drawHub();
}
