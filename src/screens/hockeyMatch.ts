import {getTeam,type LeagueTeam} from '../game/fictionalLeague';
import {validPeriodMinutes,periodOptions,savePeriodMinutes,type PeriodMinutes} from '../config/matchSettings';
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
 onComplete:(result:MatchSummary)=>void,onReturn:()=>void,onPeriodChange?:(minutes:PeriodMinutes)=>void,
 homeTeam:LeagueTeam=getTeam(),awayTeam:LeagueTeam=getTeam('lakehaven')
):{stop:()=>void}{
 const match=new HockeyMatch(goalieCareer,rating,Math.random,validPeriodMinutes((rating as MatchRating & {periodMinutes?:number}).periodMinutes));
 match.setTeams(homeTeam,awayTeam);
 let active=true,completed=false,last=performance.now(),raf=0,pointerId=-1;
 let visualTime=0;const puckTrail:{x:number;y:number}[]=[];
 let cameraZoom=false,cameraX=400,cameraY=220;
 let paused=false;let cameraMode:CameraMode=goalieCareer?'goalie':'player';
 let cameraNotice=0;
 let arenaMode=true;
 let goalieDistance:'close'|'medium'|'far'='medium';
 let futurePeriod=match.periodMinutes;
 const actA=goalieCareer?'BUTTERFLY':'SHOOT';
 const actB=goalieCareer?'BLOCKER':'PASS';
 const actC=goalieCareer?'POKE':'SWITCH';
 root.innerHTML='<main class="career-shell match-shell">'
  +'<header class="career-top"><button type="button" data-exit>← Career</button>'
  +'<div class="scorebug" role="status" aria-label="Live game scoreboard">'
  +'<div class="scorebug-team scorebug-home"><span>'+homeTeam.abbr+'</span><strong data-home-score>0</strong></div>'
  +'<div class="scorebug-team scorebug-away"><span>'+awayTeam.abbr+'</span><strong data-away-score>0</strong></div>'
  +'<div class="scorebug-timer"><strong data-clock>'+match.periodMinutes+':00</strong><small data-period>1ST</small></div>'
  +'</div></header>'
  +'<div class="match-meta"><span data-shots>SOG 0 - 0</span><button type="button" data-camera>Ⅱ PAUSE / CAMERA</button><button type="button" data-arena>⛶ BIG RINK</button></div>'
  +'<div class="rink-stage"><canvas data-rink width="800" height="440" aria-label="Side-view animated five-on-five hockey game with selectable camera angles"></canvas>'
  +'<div class="rink-scorebug-slot" data-rink-scorebug></div>'
  +'<div class="goal-banner" data-goal-banner hidden><span data-goal-team>HOME</span><strong>GOAL!</strong></div>'
  +'<div class="rink-hud"><span>'+homeTeam.city.toUpperCase()+' · '+homeTeam.name.toUpperCase()+'</span><span data-event>FACE OFF</span><span>'+awayTeam.city.toUpperCase()+' · '+awayTeam.name.toUpperCase()+'</span></div></div>'
  +'<div class="match-controls"><div class="move-pad" data-stick><span class="move-knob" data-knob></span><small>MOVE</small></div>'
  +'<div class="action-pad"><button type="button" data-action="a">'+actA+'</button>'
  +'<button type="button" data-action="b">'+actB+'</button>'
  +'<button type="button" data-action="c">'+actC+'</button>'
  +(goalieCareer?'<button type="button" data-action="d">GLOVE</button><button type="button" data-action="e">COVER PUCK</button><button type="button" data-action="f">PASS PUCK</button><button type="button" data-action="g" hidden>VH POST</button><button type="button" data-action="h" hidden>RVH POST</button>':'')+'</div></div>'
  +'<div class="match-pause" data-pause hidden><div class="match-pause-panel"><h2>GAME PAUSED</h2><p>Camera and post settings apply now. Period length applies to your next game.</p>'
  +(goalieCareer?'<div class="pause-setting"><strong>POST TECHNIQUE</strong><div class="camera-options"><button type="button" data-post-mode="auto">AUTO VH / RVH</button><button type="button" data-post-mode="manual">MANUAL VH / RVH</button></div><small>Auto chooses VH for shots in front and RVH for plays near or behind the goal line. Manual enables post buttons near either post.</small></div>':'')
  +'<div class="pause-setting"><label for="pause-period-length"><strong>PERIOD LENGTH (NEXT GAME)</strong></label><select id="pause-period-length" data-period-length>'+periodOptions(futurePeriod)+'</select><small>This game remains '+match.periodMinutes+' minutes per period; the next game uses your selection.</small></div>'
  +'<div class="camera-options">'
  +'<button type="button" data-view="player">PLAYER CHASE (NHL)</button>'
  +'<button type="button" data-view="broadcast">TV BROADCAST</button>'
  +'<button type="button" data-view="sideline">SIDE BOARDS</button>'
  +'<button type="button" data-view="goalie">BEHIND GOALIE (NHL)</button>'
  +(goalieCareer?'<button type="button" data-distance="close">CREASE CLOSE</button><button type="button" data-distance="medium">CREASE STANDARD</button><button type="button" data-distance="far">CREASE WIDE</button>':'')
  +'<button type="button" data-view="overhead">OVERHEAD (CLASSIC)</button>'
  +'<button type="button" data-overhead="full">FULL RINK</button><button type="button" data-overhead="track">TRACK PUCK</button>'
  +'</div><button type="button" class="career-primary" data-resume>▶ RESUME GAME</button></div></div>'
  +'<p class="career-muted" data-hint>'
  +(goalieCareer?'Move inside the crease · Toggle Butterfly for low shots · Blocker for high shots · Poke when the puck is close.':'Use the joystick to skate · Shoot and pass · Switch to your nearest teammate.')
  +'</p><section class="match-result" data-result hidden></section></main>';
 const canvas=root.querySelector<HTMLCanvasElement>('[data-rink]')!;
 const ctx=canvas.getContext('2d')!;
 const homeScore=root.querySelector<HTMLElement>('[data-home-score]')!;
 const awayScore=root.querySelector<HTMLElement>('[data-away-score]')!;
 const periodLabel=root.querySelector<HTMLElement>('[data-period]')!;
 const scorebug=root.querySelector<HTMLElement>('.scorebug')!;
 const scorebugSlot=root.querySelector<HTMLElement>('[data-rink-scorebug]')!;
 scorebugSlot.appendChild(scorebug);
 shellColorFix();
 function shellColorFix(){
  const home=root.querySelector<HTMLElement>('.scorebug-home');
  const away=root.querySelector<HTMLElement>('.scorebug-away');
  if(home)home.style.backgroundColor=homeTeam.primary;
  if(away)away.style.backgroundColor=awayTeam.primary;
 }
 const goalBanner=root.querySelector<HTMLElement>('[data-goal-banner]')!;
 const goalTeam=root.querySelector<HTMLElement>('[data-goal-team]')!;
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
 shell.classList.add('arena-expanded');
 arenaButton.textContent='⤢ NORMAL VIEW';
 arenaButton.addEventListener('click',()=>{arenaMode=!arenaMode;shell.classList.toggle('arena-expanded',arenaMode);arenaButton.textContent=arenaMode?'⤢ NORMAL VIEW':'⛶ BIG RINK';});
 const pausePanel=root.querySelector<HTMLElement>('[data-pause]')!;
 const viewButtons=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-view]'));
 const overheadButtons=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-overhead]'));
 overheadButtons.forEach(b=>{
  b.setAttribute('aria-pressed',String((b.dataset.overhead==='track')===cameraZoom));
  b.addEventListener('click',()=>{
   cameraZoom=b.dataset.overhead==='track';cameraMode='overhead';cameraNotice=1.7;
   overheadButtons.forEach(x=>x.setAttribute('aria-pressed',String((x.dataset.overhead==='track')===cameraZoom)));
   viewButtons.forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view==='overhead')));
  });
 });
 const postButtons=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-post-mode]'));
 const periodSelect=root.querySelector<HTMLSelectElement>('[data-period-length]')!;
 periodSelect.addEventListener('change',()=>{
  futurePeriod=validPeriodMinutes(Number(periodSelect.value));
  savePeriodMinutes(futurePeriod);onPeriodChange?.(futurePeriod);
 });
 postButtons.forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.postMode===match.postMode));
  b.addEventListener('click',()=>{
   match.setPostMode(b.dataset.postMode==='manual'?'manual':'auto');
   postButtons.forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.postMode===match.postMode)));
  });
 });
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
 root.querySelectorAll<HTMLButtonElement>('[data-distance]').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.distance===goalieDistance));
  b.addEventListener('click',()=>{
   goalieDistance=b.dataset.distance as 'close'|'medium'|'far';cameraMode='goalie';cameraNotice=2;
   root.querySelectorAll<HTMLButtonElement>('[data-distance]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
   viewButtons.forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view==='goalie')));
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
  const n=Math.max(1,Math.hypot(x,y));
  // Chase goalie camera looks down +rink-X: screen up is rink +X,
  // screen right is rink +Y. Overhead and skater cameras retain rink axes.
  if(goalieCareer&&cameraMode==='goalie')match.setMovement(-y/n,x/n);
  else match.setMovement(x/n,y/n);
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
  if(goalieCareer&&key==='g'){match.perform('vh');return;}
  if(goalieCareer&&key==='h'){match.perform('rvh');return;}
  if(goalieCareer&&key==='e'){match.perform(match.goalieHolding?'freeze':'cover');return;}
  if(goalieCareer&&key==='f'){match.perform('pass');return;}
  if(key==='c'){if(goalieCareer)match.perform('poke');else match.switchSkater();return;}
  if(key==='d'&&goalieCareer){match.perform('glove');return;}
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
  if(e.key.toLowerCase()==='q')action('d');
  if(e.key.toLowerCase()==='f')action('e');
  if(e.key.toLowerCase()==='r')action('f');
  if(e.key.toLowerCase()==='v')action('g');
  if(e.key.toLowerCase()==='b')action('h');
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
 root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>{
  button.addEventListener('click',()=>action(button.dataset.action??''));
 });
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
   if(cameraMode==='player'||cameraMode==='goalie')drawChaseHockey(ctx,match,cameraMode,t,goalieDistance);
   else drawSideHockey(ctx,match,cameraMode,t);
   if(match.phase==='intermission'){
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
  ctx.beginPath();ctx.arc(puck.x,puck.y-puck.height,11*pulse,0,Math.PI*2);ctx.stroke();
  if(!goalieCareer){
   const selected=match.skaters[match.selected];
   ctx.fillStyle='#ffcf53';ctx.beginPath();
   ctx.moveTo(selected.x,selected.y-31);
   ctx.lineTo(selected.x-7,selected.y-42);
   ctx.lineTo(selected.x+7,selected.y-42);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();
  ctx.ellipse(puck.x+2,puck.y+3,8,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#141b22';ctx.beginPath();ctx.ellipse(puck.x,puck.y-puck.height,6.7,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#8395a4';ctx.lineWidth=1;ctx.stroke();
  if(match.phase==='intermission'){
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
  homeScore.textContent=String(match.scores[0]);
  awayScore.textContent=String(match.scores[1]);
  scorebug.classList.toggle('scorebug-goal',match.phase==='goal');
  goalBanner.hidden=match.phase!=='goal';
  if(match.phase==='goal'){
   const isHome=match.message.startsWith('HOME');
   goalTeam.textContent=isHome?homeTeam.abbr:awayTeam.abbr;
   goalBanner.classList.toggle('goal-banner-away',!isHome);
  }
  shots.textContent='SOG '+match.shots[0]+' - '+match.shots[1];
  const remaining=Math.ceil(match.timeRemaining);
  clock.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
  periodLabel.textContent=match.period===1?'1ST':match.period===2?'2ND':'3RD';
  event.textContent=match.message;
  if(goalieCareer){
   const danger=match.puck.shotTeam===1&&match.puck.owner<0;
   const cover=root.querySelector<HTMLButtonElement>('[data-action="e"]');
   const pass=root.querySelector<HTMLButtonElement>('[data-action="f"]');
   if(cover){cover.textContent=match.goalieHolding?'FREEZE PUCK':'COVER PUCK';cover.disabled=!match.goalieHolding&&!match.canCoverPuck;}
   if(pass)pass.disabled=!match.goalieHolding;
   for(const b of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action="g"],[data-action="h"]'))){
    b.hidden=match.postMode!=='manual';b.disabled=!match.postAvailable;
    b.setAttribute('aria-pressed',String(match.goalies[0].pose===(b.dataset.action==='g'?'vh':'rvh')));
   }
   const inButterfly=match.goalies[0].pose==='butterfly';
   const butterflyButton=root.querySelector<HTMLButtonElement>('[data-action="a"]');
   if(butterflyButton){butterflyButton.setAttribute('aria-pressed',String(inButterfly));butterflyButton.textContent=inButterfly?'STAND UP':'BUTTERFLY';}
   hint.textContent=match.goalieHolding?'GLOVE SAVE! '+match.goalies[0].holdTime.toFixed(1)+'s · PASS PUCK or FREEZE PUCK now.':match.canCoverPuck?'LOOSE PUCK NEAR CREASE · Press COVER PUCK to freeze play.':danger?'SHOT INCOMING · Move into the shooting lane, then use Butterfly (low) or Blocker (high).':
    match.messageTime>0?match.message+' · Track the shooter and time your save.':'Butterfly toggles stance · Glove (Q) catches high left · Blocker (E) covers high right · Poke (Tab) close range.';
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
