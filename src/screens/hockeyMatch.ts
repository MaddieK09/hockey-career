import {HockeyMatch} from '../game/hockeyMatchEngine';
import type {MatchRating} from '../game/hockeyMatchEngine';
import {drawHockeyCharacter,drawRink} from '../graphics/animatedHockey2d';
import {drawSideHockey} from '../graphics/sideHockey2d';
import {drawChaseHockey} from '../graphics/chaseHockey2d';
import type {CameraMode} from '../graphics/sideHockey2d';

export interface MatchSummary {
 home:number;away:number;goals:number;assists:number;saves:number;
 homeShots:number;awayShots:number;
}
/** Mounts the playable 2D hockey match. Never changes the existing career save
 * directly: the owner screen applies the final result once, after three periods.
 */
export function mountHockeyMatch(
 root:HTMLElement,goalieCareer:boolean,rating:MatchRating,
 onComplete:(result:MatchSummary)=>void,onReturn:()=>void
):{stop:()=>void}{
 const match=new HockeyMatch(goalieCareer,rating);
 let active=true,completed=false,last=performance.now(),raf=0,pointerId=-1;
 let visualTime=0;const puckTrail:{x:number;y:number}[]=[];
 let cameraZoom=false,cameraX=400;
 let paused=false;let cameraMode:CameraMode=goalieCareer?'goalie':'player';
 let cameraNotice=0;
 let arenaMode=false;
 const actA=goalieCareer?'BUTTERFLY':'SHOOT';
 const actB=goalieCareer?'BLOCKER':'PASS';
 const actC=goalieCareer?'POKE':'SWITCH';
 root.innerHTML='<main class="career-shell match-shell">'
  +'<header class="career-top"><button type="button" data-exit>← Career</button>'
  +'<strong>HOME <span data-score>0 - 0</span> AWAY</strong>'
  +'<span data-clock>P1 · 1:00</span></header>'
  +'<div class="match-meta"><span data-shots>Shots 0 - 0</span><button type="button" data-camera>Ⅱ PAUSE / CAMERA</button><button type="button" data-arena>⛶ BIG RINK</button></div>'
  +'<div class="rink-stage"><canvas data-rink width="800" height="440" aria-label="Side-view animated five-on-five hockey game with selectable camera angles"></canvas>'
  +'<div class="rink-hud"><span>HOME · RED</span><span data-event>FACE OFF</span><span>AWAY · BLUE</span></div></div>'
  +'<div class="match-controls"><div class="move-pad" data-stick><span class="move-knob" data-knob></span><small>MOVE</small></div>'
  +'<div class="action-pad"><button type="button" data-action="a">'+actA+'</button>'
  +'<button type="button" data-action="b">'+actB+'</button>'
  +'<button type="button" data-action="c">'+actC+'</button></div></div>'
  +'<div class="match-pause" data-pause hidden><div class="match-pause-panel"><h2>GAME PAUSED</h2><p>Choose your camera angle. Changes apply immediately.</p><div class="camera-options">'
  +'<button type="button" data-view="player">PLAYER CHASE (NHL)</button>'
  +'<button type="button" data-view="broadcast">TV BROADCAST</button>'
  +'<button type="button" data-view="sideline">SIDE BOARDS</button>'
  +'<button type="button" data-view="goalie">BEHIND GOALIE (NHL)</button>'
  +'<button type="button" data-view="overhead">OVERHEAD (CLASSIC)</button>'
  +'</div><button type="button" class="career-primary" data-resume>▶ RESUME GAME</button></div></div>'
  +'<p class="career-muted" data-hint>'
  +(goalieCareer?'Move inside the crease · Toggle Butterfly for low shots · Blocker for high shots · Poke when the puck is close.':'Use the joystick to skate · Shoot and pass · Switch to your nearest teammate.')
  +'</p><section class="match-result" data-result hidden></section></main>';
 const canvas=root.querySelector<HTMLCanvasElement>('[data-rink]')!;
 const ctx=canvas.getContext('2d')!;
 const score=root.querySelector<HTMLElement>('[data-score]')!;
 const clock=root.querySelector<HTMLElement>('[data-clock]')!;
 const shots=root.querySelector<HTMLElement>('[data-shots]')!;
 const event=root.querySelector<HTMLElement>('[data-event]')!;
 const hint=root.querySelector<HTMLElement>('[data-hint]')!;
 const stick=root.querySelector<HTMLElement>('[data-stick]')!;
 const knob=root.querySelector<HTMLElement>('[data-knob]')!;
 const result=root.querySelector<HTMLElement>('[data-result]')!;
 const cameraButton=root.querySelector<HTMLButtonElement>('[data-camera]')!;
 const arenaButton=root.querySelector<HTMLButtonElement>('[data-arena]')!;
 const shell=root.querySelector<HTMLElement>('.match-shell')!;
 arenaButton.addEventListener('click',()=>{arenaMode=!arenaMode;shell.classList.toggle('arena-expanded',arenaMode);arenaButton.textContent=arenaMode?'⤢ NORMAL VIEW':'⛶ BIG RINK';});
 const pausePanel=root.querySelector<HTMLElement>('[data-pause]')!;
 const viewButtons=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-view]'));
 function setPaused(next:boolean){
  paused=next;pausePanel.hidden=!paused;
  cameraButton.textContent=paused?'▶ RESUME':'Ⅱ PAUSE / CAMERA';
  if(paused){match.setMovement(0,0);touchX=touchY=0;knob.style.transform='translate(0,0)';}
  shell.classList.toggle('match-is-paused',paused);
  last=performance.now();
 }
 viewButtons.forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.view===cameraMode));
  b.addEventListener('click',()=>{
  cameraMode=b.dataset.view as CameraMode;
  cameraNotice=2.2;
  viewButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  });
 });
 root.querySelector('[data-resume]')?.addEventListener('click',()=>setPaused(false));
 const controls=new Set<string>();
 cameraButton.addEventListener('click',()=>setPaused(!paused));
 const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
 let touchX=0,touchY=0;
 function syncMovement(){
  let x=touchX,y=touchY;
  if(paused){match.setMovement(0,0);return;}
  if(controls.has('a')||controls.has('arrowleft'))x-=1;
  if(controls.has('d')||controls.has('arrowright'))x+=1;
  if(controls.has('w')||controls.has('arrowup'))y-=1;
  if(controls.has('s')||controls.has('arrowdown'))y+=1;
  const n=Math.max(1,Math.hypot(x,y));match.setMovement(x/n,y/n);
 }
 function joystick(e:PointerEvent){
  const r=stick.getBoundingClientRect();
  const radius=r.width*.30;
  let x=(e.clientX-r.left-r.width/2)/radius;
  let y=(e.clientY-r.top-r.height/2)/radius;
  const len=Math.max(1,Math.hypot(x,y));x/=len;y/=len;
  touchX=x;touchY=y;
  knob.style.transform='translate('+(x*radius)+'px,'+(y*radius)+'px)';
  syncMovement();
 }
 function pointerDown(e:PointerEvent){
  e.preventDefault();pointerId=e.pointerId;
  stick.setPointerCapture(e.pointerId);joystick(e);
 }
 function pointerMove(e:PointerEvent){if(e.pointerId===pointerId)joystick(e);}
 function pointerUp(e:PointerEvent){
  if(e.pointerId!==pointerId)return;
  pointerId=-1;touchX=touchY=0;knob.style.transform='translate(0,0)';syncMovement();
 }
 function action(key:string){
  if(paused)return;
  if(key==='c'){if(goalieCareer)match.perform('poke');else match.switchSkater();return;}
  if(key==='a'){match.perform(goalieCareer?'butterfly':'shoot');return;}
  if(key==='b'){match.perform(goalieCareer?'blocker':'pass');}
 }
 function keyDown(e:KeyboardEvent){
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))e.preventDefault();
  if(e.key==='Escape'){setPaused(!paused);return;}
  controls.add(e.key.toLowerCase());syncMovement();
  if(e.repeat)return;
  if(e.code==='Space')action('a');
  if(e.key.toLowerCase()==='e')action('b');
  if(e.key==='Tab')action('c');
 }
 function keyUp(e:KeyboardEvent){controls.delete(e.key.toLowerCase());syncMovement();}
 function visibility(){last=performance.now();}
 stick.addEventListener('pointerdown',pointerDown);
 stick.addEventListener('pointermove',pointerMove);
 stick.addEventListener('pointerup',pointerUp);
 stick.addEventListener('pointercancel',pointerUp);
 window.addEventListener('keydown',keyDown);
 window.addEventListener('keyup',keyUp);
 document.addEventListener('visibilitychange',visibility);
 root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>
  button.addEventListener('click',()=>action(button.dataset.action??'')));
 function stop(){
  if(!active)return;
  active=false;cancelAnimationFrame(raf);shell.classList.remove('arena-expanded');
  window.removeEventListener('keydown',keyDown);
  window.removeEventListener('keyup',keyUp);
  document.removeEventListener('visibilitychange',visibility);
  stick.removeEventListener('pointerdown',pointerDown);
  stick.removeEventListener('pointermove',pointerMove);
  stick.removeEventListener('pointerup',pointerUp);
  stick.removeEventListener('pointercancel',pointerUp);
 }
 root.querySelector('[data-exit]')?.addEventListener('click',()=>{stop();onReturn();});
 function render(t:number){
  ctx.save();
  if(cameraMode!=='overhead'){
   if(cameraMode==='player'||cameraMode==='goalie')drawChaseHockey(ctx,match,cameraMode,t);
   else drawSideHockey(ctx,match,cameraMode,t);
   if(match.phase==='goal'||match.phase==='intermission'){
    ctx.fillStyle='rgba(7,26,43,.78)';ctx.fillRect(215,174,370,91);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 32px system-ui';ctx.fillText(match.message,400,225);
   }
   ctx.restore();return;
  }
  // Camera zoom preserves simulation coordinates; only rendering changes.
  if(cameraZoom){
   const zoom=goalieCareer?1.32:1.45;
   const focus=goalieCareer?195:match.puck.x;
   cameraX+=(focus-cameraX)*Math.min(1,1/60*5);
   const cx=Math.max(400/zoom,Math.min(800-400/zoom,cameraX));
   const cy=220+(match.puck.y-220)*(goalieCareer?.15:.36);
   ctx.translate(400,220);ctx.scale(zoom,zoom);ctx.translate(-cx,-cy);
  }
  drawRink(ctx,t);
  for(let i=0;i<match.skaters.length;i++){
   const s=match.skaters[i],moving=Math.hypot(s.vx,s.vy);
   drawHockeyCharacter(ctx,{
    x:s.x,y:s.y,team:s.team,angle:s.heading,time:t+i*.22,speed:moving,
    pose:s.shotAnimation>0?'shoot':moving>14?'skate':'glide',
    selected:!goalieCareer&&match.selected===i,hasPuck:match.puck.owner===i,
    number:s.team===0?10+i:17+i-5
   });
  }
  for(const g of match.goalies){
   drawHockeyCharacter(ctx,{
    x:g.x,y:g.y,team:g.team,goalie:true,angle:g.team===0?0:Math.PI,
    time:t,speed:0,selected:goalieCareer&&g.team===0,pose:g.pose,
    number:g.team===0?10:30
   });
  }
  const puck=match.puck;
  // A fading puck trail makes shots and rebounds legible on small screens.
  if(match.phase==='live'&&Math.hypot(puck.vx,puck.vy)>75&&puck.owner<0){
   puckTrail.push({x:puck.x,y:puck.y});
   if(puckTrail.length>12)puckTrail.shift();
  }else if(puckTrail.length)puckTrail.shift();
  puckTrail.forEach((point,i)=>{
   ctx.fillStyle='rgba(22,54,76,'+(i/puckTrail.length*.34)+')';
   ctx.beginPath();ctx.arc(point.x,point.y,2+i/puckTrail.length*3,0,Math.PI*2);ctx.fill();
  });
  // Readable puck locator and a pulse on the selected player.
  const pulse=1+Math.sin(visualTime*5)*.08;
  ctx.strokeStyle='#f7c83b';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(puck.x,puck.y,11*pulse,0,Math.PI*2);ctx.stroke();
  if(!goalieCareer){
   const selected=match.skaters[match.selected];
   ctx.fillStyle='#ffcf53';ctx.beginPath();
   ctx.moveTo(selected.x,selected.y-31);
   ctx.lineTo(selected.x-7,selected.y-42);
   ctx.lineTo(selected.x+7,selected.y-42);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();
  ctx.ellipse(puck.x+2,puck.y+3,8,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#141b22';ctx.beginPath();ctx.ellipse(puck.x,puck.y,6.7,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#8395a4';ctx.lineWidth=1;ctx.stroke();
  if(match.phase==='goal'||match.phase==='intermission'){
   ctx.fillStyle='rgba(4,25,44,.63)';ctx.fillRect(240,167,320,105);
   ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 34px system-ui';
   ctx.fillText(match.message,400,229);
   ctx.font='14px system-ui';ctx.fillText('Next faceoff',400,253);
  }
  ctx.restore();
 }
 function completedMatch(){
  if(completed)return;completed=true;stop();
  const summary:MatchSummary={
   home:match.scores[0],away:match.scores[1],goals:match.goals,
   assists:match.assists,saves:match.saves,homeShots:match.shots[0],awayShots:match.shots[1]
  };
  onComplete(summary);
  result.hidden=false;
  const outcome=summary.home>summary.away?'VICTORY!':summary.home<summary.away?'FINAL BUZZER':'TIE GAME';
  result.innerHTML='<h2>'+outcome+'</h2><p>Home '+summary.home+' – '+summary.away+' Away</p>'
   +'<p>Shots '+summary.homeShots+' – '+summary.awayShots+' · '+summary.saves+' saves</p>'
   +'<button type="button" class="career-primary" data-continue>CONTINUE CAREER →</button>';
  result.querySelector('[data-continue]')?.addEventListener('click',onReturn);
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function frame(now:number){
  if(!active)return;
  const dt=Math.min((now-last)/1000,.04);last=now;
  if(!paused){visualTime+=dt;match.step(dt);cameraNotice=Math.max(0,cameraNotice-dt);}
  syncMovement();
  score.textContent=match.scores[0]+' - '+match.scores[1];
  shots.textContent='Shots '+match.shots[0]+' - '+match.shots[1];
  clock.textContent='P'+match.period+' · '+Math.ceil(match.timeRemaining)+'s';
  event.textContent=match.message;
  if(goalieCareer){
   const danger=match.puck.shotTeam===1&&match.puck.owner<0;
   hint.textContent=danger?'SHOT INCOMING · Move into the shooting lane, then use Butterfly (low) or Blocker (high).':
    match.messageTime>0?match.message+' · Track the shooter and time your save.':'Butterfly toggles stance · Move to slide · Blocker = high · Poke = close range.';
  }
  render(now/1000);
  if(cameraNotice>0&&!paused){
   ctx.fillStyle='rgba(7,29,46,.8)';ctx.fillRect(215,390,370,35);
   ctx.fillStyle='#f6fcff';ctx.textAlign='center';ctx.font='bold 16px system-ui';
   ctx.fillText('CAMERA: '+cameraMode.toUpperCase(),400,413);
  }
  if(match.phase==='final'){completedMatch();return;}
  raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);
 return {stop};
}
