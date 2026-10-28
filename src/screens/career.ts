import type {PlayerDraft} from '../player/types';
import {playerPortrait} from '../graphics/playerPortrait';

export interface CareerSave {
 player:PlayerDraft; games:number;wins:number;losses:number;goals:number;assists:number;saves:number;
 xp:number;level:number;skillPoints:number;speed:number;shot:number;handling:number;defense:number;
}
const KEY='hockey-career-save-v1';
export function loadCareer():CareerSave|null {
 try {const raw=localStorage.getItem(KEY);if(!raw)return null;const s=JSON.parse(raw) as CareerSave;return s?.player&&Number.isFinite(s.games)?s:null;}catch{return null;}
}
export function startCareer(p:PlayerDraft):CareerSave {
 const s:CareerSave={player:p,games:0,wins:0,losses:0,goals:0,assists:0,saves:0,xp:0,level:1,skillPoints:0,speed:50,shot:50,handling:50,defense:50};
 saveCareer(s);return s;
}
function saveCareer(s:CareerSave){localStorage.setItem(KEY,JSON.stringify(s));}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
type Skater={x:number;y:number;vx:number;vy:number;team:0|1};
export function renderCareer(root:HTMLElement,career:CareerSave,onMenu:()=>void):void {
 let match:ReturnType<typeof startMatch>|null=null;
 const p=career.player;
 const name=(p.firstName+' '+p.lastName).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
 const drawHub=()=>{
  match?.stop();match=null;
  root.innerHTML=`<main class="career-shell"><header class="career-top"><button data-menu>← Menu</button><strong>HOCKEY CAREER · 2D</strong><span>LEVEL ${career.level}</span></header><section class="career-hero"><div class="career-avatar">${playerPortrait(p.appearance,p.equipment)}</div><div><p class="eyebrow">ROOKIE SEASON · DEVELOPMENT LEAGUE</p><h1>${name}</h1><p>#${p.jerseyNumber} · ${p.position} · ${p.nationality}</p><p>${career.games} GP · ${career.wins} W · ${career.losses} L</p></div></section><section class="career-stats"><div><strong>${career.goals}</strong><span>Goals</span></div><div><strong>${career.assists}</strong><span>Assists</span></div><div><strong>${career.saves}</strong><span>Saves</span></div><div><strong>${career.xp}</strong><span>XP</span></div></section><section class="career-panel"><h2>Player development</h2><p>Earn XP from games to level up and unlock attribute points.</p><div class="skill-grid">${(['speed','shot','handling','defense'] as const).map(k=>`<div class="skill-row"><span>${k.toUpperCase()} · ${career[k]}</span><button data-skill="${k}" ${career.skillPoints<1||career[k]>=99?'disabled':''}>+ Upgrade</button></div>`).join('')}</div><p>Available skill points: <b>${career.skillPoints}</b></p></section><section class="career-panel"><h2>Next game</h2><p>Home vs. Rivals · 3 short periods · 2D arcade-simulation prototype</p><button class="career-primary" data-play>PLAY NEXT GAME 🏒</button><p class="career-muted">Touch: drag the movement pad, tap Shoot / Pass / Switch. Keyboard: WASD or arrows, Space to shoot, E to pass, Tab to switch. Goalie: move and tap Save.</p></section></main>`;
  root.querySelector('[data-menu]')?.addEventListener('click',onMenu);
  root.querySelector('[data-play]')?.addEventListener('click',()=>{match=startMatch();});
  root.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.skill as 'speed'|'shot'|'handling'|'defense';if(career.skillPoints&&career[k]<99){career[k]=clamp(career[k]+3,0,99);career.skillPoints--;saveCareer(career);drawHub();}}));
 };
 const startMatch=()=>{
  let active=true,finished=false,raf=0,last=performance.now(),elapsed=0,period=1,home=0,away=0,saves=0,goals=0,assists=0;
  const goalie=p.position==='G';
  const W=800,H=440;
  const players:Skater[]=[
   {x:200,y:220,vx:0,vy:0,team:0},{x:320,y:130,vx:0,vy:0,team:0},{x:320,y:310,vx:0,vy:0,team:0},
   {x:590,y:220,vx:0,vy:0,team:1},{x:485,y:130,vx:0,vy:0,team:1},{x:485,y:310,vx:0,vy:0,team:1}
  ];
  const puck={x:400,y:220,vx:0,vy:0,owner:-1,lock:0};
  let selected=0,moveX=0,moveY=0,stickPointer=-1,stickOrigin={x:0,y:0},cooldown=0,goalieX=91,goalieY=220,saveWindow=0,savePose=0,opponentCooldown=1.2,aiShotCount=0,goalieTouches=0;
  const keys=new Set<string>();
  root.innerHTML=`<main class="career-shell match-shell"><header class="career-top"><button data-exit>← Career</button><strong>HOME <span data-score>0 - 0</span> AWAY</strong><span data-clock>P1 · 1:00</span></header><canvas data-rink width="800" height="440" aria-label="Playable top-down hockey rink"></canvas><div class="match-controls"><div class="move-pad" data-stick><span class="move-knob" data-knob></span><small>MOVE</small></div><div class="action-pad"><button data-action="shoot">${goalie?'BUTTERFLY':'SHOOT'}</button><button data-action="pass">${goalie?'BLOCKER':'PASS'}</button><button data-action="switch">SWITCH</button></div></div><p class="career-muted" data-hint>${goalie?'Protect the left net. BUTTERFLY seals low shots; BLOCKER deflects high shots. Follow the puck with the movement pad.':'Attack the right net. Move, pass, shoot and switch skaters.'}</p><section class="match-result" data-result hidden></section></main>`;
  const canvas=root.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d')!;
  const clock=root.querySelector<HTMLElement>('[data-clock]')!,score=root.querySelector<HTMLElement>('[data-score]')!;
  const stick=root.querySelector<HTMLElement>('[data-stick]')!,knob=root.querySelector<HTMLElement>('[data-knob]')!;
  const pointer=(e:PointerEvent)=>{const r=stick.getBoundingClientRect();const dx=e.clientX-stickOrigin.x,dy=e.clientY-stickOrigin.y,lim=r.width*.32;const d=Math.hypot(dx,dy)||1;moveX=clamp(dx/lim,-1,1);moveY=clamp(dy/lim,-1,1);if(d>lim){moveX=dx/d;moveY=dy/d;}knob.style.transform=`translate(${moveX*lim}px,${moveY*lim}px)`;};
  const down=(e:PointerEvent)=>{e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);const r=stick.getBoundingClientRect();stickOrigin={x:r.left+r.width/2,y:r.top+r.height/2};pointer(e);};
  const up=(e:PointerEvent)=>{if(e.pointerId!==stickPointer)return;stickPointer=-1;moveX=moveY=0;knob.style.transform='translate(0,0)';};
  stick.addEventListener('pointerdown',down);stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)pointer(e);});stick.addEventListener('pointerup',up);stick.addEventListener('pointercancel',up);
  const onKeyDown=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.code==='Space')action('shoot');if(e.key.toLowerCase()==='e')action('pass');if(e.key==='Tab')action('switch');};
  const onKeyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  const stop=()=>{active=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);};
  const reset=()=>{opponentCooldown=1.2;saveWindow=0;savePose=0;puck.x=400;puck.y=220;puck.vx=puck.vy=0;puck.owner=-1;puck.lock=1;players.forEach((a,i)=>{a.x=i<3?230+(i===0?0:80):570-(i===3?0:80);a.y=[220,130,310,220,130,310][i];});goalieX=91;goalieY=220;};
  const fire=(owner:number,tx:number,ty:number,power:number)=>{const a=players[owner],dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy)||1;puck.owner=-1;puck.lock=.28;puck.x=a.x+dx/d*20;puck.y=a.y+dy/d*20;puck.vx=dx/d*power;puck.vy=dy/d*power;};
  const action=(kind:string)=>{
   if(finished)return;
   if(kind==='switch'){if(!goalie)selected=(selected+1)%3;return;}
   if(cooldown>0)return;
   cooldown=.28;
   if(goalie){if(kind==='shoot'){saveWindow=.48;savePose=1;}else if(kind==='pass'){saveWindow=.38;savePose=2;if(puck.owner<0&&puck.x<145&&Math.abs(puck.y-goalieY)<46){puck.vx=370;puck.vy=(Math.random()-.5)*220;puck.lock=.5;}}return;}
   const a=players[selected];if(puck.owner!==selected&&Math.hypot(puck.x-a.x,puck.y-a.y)>32)return;
   if(kind==='shoot'){const spread=(Math.random()-.5)*(100-career.shot)*1.5;fire(selected,790,220+spread,630+career.shot*2);}
   if(kind==='pass'){const teammate=players[(selected+1)%3];fire(selected,teammate.x,teammate.y,420+career.handling*2);selected=(selected+1)%3;}
  };
  root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action!)));
  root.querySelector('[data-exit]')?.addEventListener('click',()=>{stop();drawHub();});
  const draw=()=>{
   ctx.clearRect(0,0,W,H);ctx.fillStyle='#dceef4';ctx.fillRect(0,0,W,H);
   ctx.strokeStyle='#1b4967';ctx.lineWidth=6;ctx.strokeRect(17,17,766,406);
   ctx.strokeStyle='#d14e56';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(400,20);ctx.lineTo(400,420);ctx.stroke();
   ctx.strokeStyle='#3980ba';ctx.lineWidth=3;for(const x of [260,540]){ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,420);ctx.stroke();}
   ctx.strokeStyle='#b63b47';ctx.lineWidth=3;ctx.beginPath();ctx.arc(400,220,58,0,Math.PI*2);ctx.stroke();
   for(const x of [165,635])for(const y of [125,315]){ctx.beginPath();ctx.arc(x,y,42,0,Math.PI*2);ctx.stroke();}
   ctx.fillStyle='#b63b47';for(const x of [48,752]){ctx.fillRect(x-5,173,10,94);ctx.fillStyle='#9ec4d8';ctx.fillRect(x===48?27:757,184,16,72);ctx.fillStyle='#b63b47';}
   const sk=(x:number,y:number,team:number,focus=false)=>{ctx.fillStyle=team===0?'#b52f47':'#1b4d83';ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle=focus?'#f8b42c':'#ffffff';ctx.lineWidth=focus?5:2;ctx.stroke();ctx.strokeStyle='#15283a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+8,y+8);ctx.lineTo(x+19,y+17);ctx.stroke();};
   players.forEach((a,i)=>sk(a.x,a.y,a.team,i===selected&&!goalie));
   // A goalie silhouette, distinct from round skaters: pads, mask, glove and blocker.
   const drawGoalie=(x:number,y:number,team:0|1,pose=0)=>{
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle=team===0?'#b52f47':'#1b4d83';ctx.strokeStyle='#e8f3fa';ctx.lineWidth=2.5;
    ctx.fillRect(-12,-16,24,32);ctx.strokeRect(-12,-16,24,32);
    ctx.fillStyle='#f1f4f6';ctx.fillRect(-18,-19,10,14);ctx.fillRect(-18,5,10,14);ctx.fillRect(8,-19,10,14);ctx.fillRect(8,5,10,14);
    ctx.fillStyle='#dce5ed';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#647d91';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,-3);ctx.lineTo(6,-3);ctx.moveTo(-6,3);ctx.lineTo(6,3);ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();
    ctx.fillStyle='#eef3f7';ctx.fillRect(-26,pose===1?-22:-12,10,15);ctx.fillStyle='#293e54';ctx.fillRect(16,pose===2?-22:-12,12,18);
    if(pose){ctx.strokeStyle='#f9c14a';ctx.lineWidth=3;ctx.strokeRect(-28,-24,56,48);}
    ctx.restore();
   };
   drawGoalie(goalieX,goalieY,0,goalie?savePose:0);
   drawGoalie(709,220,1);
   ctx.fillStyle='#14171b';ctx.beginPath();ctx.arc(puck.x,puck.y,7,0,Math.PI*2);ctx.fill();
  };
  const finish=()=>{
   finished=true;stop();
   career.games++;if(home>away)career.wins++;else career.losses++;
   career.goals+=goals;career.assists+=assists;career.saves+=saves;
   const gained=40+goals*35+assists*20+saves*10+(home>away?30:0);career.xp+=gained;
   const newLevel=1+Math.floor(career.xp/200);if(newLevel>career.level){career.skillPoints+=newLevel-career.level;career.level=newLevel;}
   saveCareer(career);
   const result=root.querySelector<HTMLElement>('[data-result]')!;result.hidden=false;result.innerHTML=`<h2>${home>away?'VICTORY!':'FINAL BUZZER'}</h2><p>Home ${home} – ${away} Away</p><p>+${gained} XP · ${goals} goals · ${saves} saves · ${aiShotCount} opposing shots</p><button class="career-primary" data-return>CONTINUE CAREER →</button>`;result.querySelector('[data-return]')?.addEventListener('click',drawHub);
  };
  const tick=(now:number)=>{
   if(!active)return;
   const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;cooldown=Math.max(0,cooldown-dt);saveWindow=Math.max(0,saveWindow-dt);if(saveWindow===0)savePose=0;opponentCooldown=Math.max(0,opponentCooldown-dt);puck.lock=Math.max(0,puck.lock-dt);
   if(elapsed>=60){elapsed=0;period++;if(period>3){finish();return;}reset();}
   clock.textContent=`P${period} · ${Math.floor(60-elapsed)}s`;score.textContent=`${home} - ${away}`;
   const speed=145+career.speed*1.25;
   let dx=moveX,dy=moveY;
   if(keys.has('a')||keys.has('arrowleft'))dx-=1;if(keys.has('d')||keys.has('arrowright'))dx+=1;
   if(keys.has('w')||keys.has('arrowup'))dy-=1;if(keys.has('s')||keys.has('arrowdown'))dy+=1;
   const norm=Math.max(1,Math.hypot(dx,dy));dx/=norm;dy/=norm;
   if(goalie){goalieX=clamp(goalieX+dx*speed*dt,55,150);goalieY=clamp(goalieY+dy*speed*dt,175,265);}
   else {const a=players[selected];a.x=clamp(a.x+dx*speed*dt,35,765);a.y=clamp(a.y+dy*speed*dt,35,405);}
   // Lane-aware positioning: puck carrier attacks, nearest teammate supports,
   // defenders cover lanes instead of six skaters chasing the same puck.
   const nearest=(team:0|1)=>players.reduce((best,a,i)=>a.team===team&&Math.hypot(a.x-puck.x,a.y-puck.y)<Math.hypot(players[best].x-puck.x,players[best].y-puck.y)?i:best,team===0?0:3);
   const chaseHome=nearest(0),chaseAway=nearest(1);
   for(let i=0;i<players.length;i++){
    if(!goalie&&i===selected)continue;
    const a=players[i],attack=a.team===1,carrier=puck.owner===i;
    const lane=i%3,offset=(lane===1?-105:lane===2?105:0);
    let tx:number,ty:number;
    if(carrier){tx=attack?150:650;ty=220+offset*.32;}
    else if(i===(attack?chaseAway:chaseHome)&&puck.owner<0){tx=puck.x;ty=puck.y;}
    else if(attack){tx=puck.owner>=0&&players[puck.owner].team===1?Math.max(190,puck.x-120):Math.max(345,puck.x+70);ty=220+offset;}
    else {tx=puck.owner>=0&&players[puck.owner].team===0?Math.min(610,puck.x+110):Math.min(420,puck.x-90);ty=220+offset;}
    const dist=Math.hypot(tx-a.x,ty-a.y)||1,spd=(carrier?125:attack?145:125)*dt;
    a.x=clamp(a.x+(tx-a.x)/dist*Math.min(spd,dist),36,764);
    a.y=clamp(a.y+(ty-a.y)/dist*Math.min(spd,dist),36,404);
   }
   if(puck.owner>=0){const a=players[puck.owner];puck.x=a.x+17;puck.y=a.y+10;
    if(a.team===1&&a.x<390&&opponentCooldown<=0){opponentCooldown=1.5+Math.random()*1.4;aiShotCount++;fire(puck.owner,8,220+(Math.random()-.5)*85,500+Math.random()*150);}
   }else{
    puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;puck.vx*=Math.pow(.991,dt*60);puck.vy*=Math.pow(.991,dt*60);
    if(puck.y<28||puck.y>412){puck.y=clamp(puck.y,28,412);puck.vy*=-.7;}
    if(puck.lock<=0)for(let i=0;i<players.length;i++){const a=players[i];if(Math.hypot(puck.x-a.x,puck.y-a.y)<23){puck.owner=i;puck.vx=puck.vy=0;break;}}
   }
   if(puck.owner<0&&puck.x<112&&Math.abs(puck.y-goalieY)<(saveWindow>0?53:23)&&puck.vx<0){
    const stopped=saveWindow>0||Math.abs(puck.y-goalieY)<15;
    if(stopped){puck.vx=Math.abs(puck.vx)*(.6+Math.random()*.25);puck.vy+=(puck.y-goalieY)*2;puck.x=113;puck.lock=.3;if(goalie){saves++;goalieTouches++;}}
   }
   if(puck.owner<0&&puck.x>691&&Math.abs(puck.y-220)<27&&puck.vx>0){const goalieBeat=Math.random()<(.24+career.shot*.004);if(!goalieBeat){puck.vx=-Math.abs(puck.vx)*.7;puck.x=689;}}
   if(puck.x>783||puck.x<17){const scoredRight=puck.x>783;if(Math.abs(puck.y-220)<47){if(scoredRight){home++;if(!goalie)goals++;}else away++;reset();}else{puck.x=clamp(puck.x,23,777);puck.vx*=-.65;}}
   draw();raf=requestAnimationFrame(tick);
  };
  reset();raf=requestAnimationFrame(tick);
  return {stop};
 };
 drawHub();
}
