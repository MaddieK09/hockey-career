/** NHL-inspired end-zone chase cameras. Perspective is drawn in Canvas 2D;
 * match coordinates remain authoritative and gameplay stays 5-on-5.
 */
import type {HockeyMatch} from '../game/hockeyMatchEngine';
import {GOAL_HALF_WIDTH,GOAL_HEIGHT} from '../game/puckCollision';
const TAU=Math.PI*2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ln=(c:CanvasRenderingContext2D,x:number,y:number,u:number,v:number,w:number,color:string)=>{
 c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.lineWidth=w;c.strokeStyle=color;c.lineCap='round';c.stroke();
};
const oval=(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string)=>{
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();
};
let cameraDepth=0,cameraLateral=220,previousMode='';
export function drawChaseHockey(c:CanvasRenderingContext2D,m:HockeyMatch,mode:'player'|'goalie',time:number,goalieDistance:'close'|'medium'|'far'='medium'):void{
 const goalieMode=mode==='goalie';
 const controlled=goalieMode?m.goalies[0]:m.skaters[m.selected];
 // Always look toward the opposing end from behind the controlled player.
 const direction=goalieMode?1:(m.skaters[m.selected].team===0?1:-1);
 const goalDepth=direction===1?controlled.x:800-controlled.x;
 if(previousMode!==mode){cameraDepth=goalieMode?60:goalDepth;cameraLateral=goalieMode?220:controlled.y;previousMode=mode;}
 if(goalieMode){cameraDepth=60;cameraLateral=220;}
 else {cameraDepth+=(goalDepth-cameraDepth)*.13;cameraLateral+=(controlled.y-cameraLateral)*.1;}
 const eye=goalieMode?0:Math.max(0,cameraDepth-55);
 const cameraFactor=goalieDistance==='close'?1.30:goalieDistance==='far'?.72:1;
 const cameraElevation=goalieDistance==='close'?13:goalieDistance==='far'?-9:0;
 // The original camera compresses almost the whole rink into a thin row.
 // Increase perspective depth separation so approaching skaters actually grow.
 const perspectiveDistance=goalieMode?(goalieDistance==='close'?205:goalieDistance==='far'?320:255):260;
 const horizon=goalieMode?95+cameraElevation:117;
 // Perspective: width grows toward camera. Near bodies are much larger.
 const project=(x:number,y:number)=>{
  const along=(direction===1?x:800-x)-eye;
  const depth=Math.max(-30,along);
  const z=clamp(perspectiveDistance/(perspectiveDistance+depth),goalieMode?.24:.27,1.15);
  return {x:400+(y-cameraLateral)*z*(goalieMode?1.75*cameraFactor:1.52),y:horizon+310*z*(goalieMode?cameraFactor:1),scale:z*(goalieMode?1.9*cameraFactor:1.45),behind:along< -25};
 };
 // Stands and glass.
 const sky=c.createLinearGradient(0,0,0,190);
 sky.addColorStop(0,'#0c1b2b');sky.addColorStop(.7,'#1c3a50');sky.addColorStop(1,'#7297af');
 c.fillStyle=sky;c.fillRect(0,0,800,440);
 for(let row=0;row<5;row++){
  c.fillStyle=row%2?'#223c50':'#172e40';c.fillRect(0,20+row*17,800,15);
  for(let x=8;x<800;x+=18)oval(c,x+(row%2)*7,26+row*17,3,2.4,row%2?'#537186':'#405c70');
 }
 c.fillStyle='#dceef7';c.fillRect(0,105,800,8);
 c.fillStyle='rgba(196,229,245,.20)';c.fillRect(0,113,800,31);
 for(let x=0;x<800;x+=80)ln(c,x,105,x,148,1,'rgba(220,242,251,.35)');
 const ice=c.createLinearGradient(0,horizon,0,440);
 ice.addColorStop(0,'#c9e4f3');ice.addColorStop(.55,'#f4fbff');ice.addColorStop(1,'#d0eaf6');
 c.fillStyle=ice;c.fillRect(0,horizon,800,440-horizon);
 // Perspective boards, continuous rink rails and red goal lines.
 const leftNear=project(eye-15,25),rightNear=project(eye-15,415);
 const leftFar=project(800,25),rightFar=project(800,415);
 ln(c,leftNear.x,leftNear.y,leftFar.x,leftFar.y,9,'#f9fcff');
 ln(c,rightNear.x,rightNear.y,rightFar.x,rightFar.y,9,'#f9fcff');
 ln(c,leftNear.x,leftNear.y-7,leftFar.x,leftFar.y-7,3,'#d8a43e');
 ln(c,rightNear.x,rightNear.y-7,rightFar.x,rightFar.y-7,3,'#d8a43e');
 const rinkLine=(x:number,color:string,w:number)=>{
  const a=project(x,25),b=project(x,415);
  if(a.behind&&b.behind)return;
  ln(c,a.x,a.y,b.x,b.y,w*a.scale,color);
 };
 rinkLine(400,'#c85060',4);
 rinkLine(262,'#5a9dcb',7);rinkLine(538,'#5a9dcb',7);
 rinkLine(60,'#c95060',3);rinkLine(740,'#c95060',3);
 for(const x of [166,634]){
  const center=project(x,220);if(center.behind)continue;
  c.beginPath();c.ellipse(center.x,center.y,80*center.scale,23*center.scale,0,0,TAU);
  c.strokeStyle='rgba(196,59,75,.65)';c.lineWidth=Math.max(1,2.5*center.scale);c.stroke();
 }
 const center=project(400,220);
 if(!center.behind)oval(c,center.x,center.y,4*center.scale,2.5*center.scale,'#bb4356');
 // Render both goals directly from the same world coordinates as puck physics.
 // Post spacing: y=220±34; crossbar: z=64. None depends on goalie movement.
 const drawGoal=(worldX:number,opacity:number)=>{
  const base=project(worldX,220),l=project(worldX,220-GOAL_HALF_WIDTH),r=project(worldX,220+GOAL_HALF_WIDTH);
  if(base.behind)return;
  const top=base.y-GOAL_HEIGHT*base.scale*.8;
  oval(c,base.x,base.y,Math.abs(r.x-l.x)*.63,Math.max(6,base.scale*12),'rgba(78,160,208,.18)');
  c.save();c.globalAlpha=opacity;
  const width=Math.max(1,3*base.scale);
  ln(c,l.x,l.y,l.x,top,width,'#c53d4d');
  ln(c,r.x,r.y,r.x,top,width,'#c53d4d');
  ln(c,l.x,top,r.x,top,width,'#c53d4d');
  for(let i=1;i<9;i++){
   const x=l.x+(r.x-l.x)*i/9;
   ln(c,x,top,x,base.y,.8,'#789eae');
  }
  for(let i=1;i<7;i++){
   const y=top+(base.y-top)*i/7;
   ln(c,l.x,y,r.x,y,.8,'#789eae');
  }
  c.restore();
 };
 drawGoal(direction===1?740:60,1);
 if(goalieMode)drawGoal(60,.52);
 type Actor={x:number;y:number;team:number;goalie:boolean;pose:string;selected:boolean;vx:number;vy:number;heading:number;shotAnimation:number;num:number;stance:number;saveHand:'glove'|'blocker'|null;saveReach:number;pokeTime:number;reaction:'pads'|'body'|'stick'|'glove'|'blocker'|null;reactionTime:number;reactionSide:number;holdTime:number;coverTime:number;releaseTime:number;postBlend:number;postSide:-1|0|1};
 const actors:Actor[]=[
  ...m.skaters.map((s,i)=>({x:s.x,y:s.y,team:s.team,goalie:false,pose:s.shotAnimation>0?'shoot':'skate',selected:!goalieMode&&m.selected===i,vx:s.vx,vy:s.vy,heading:s.heading,shotAnimation:s.shotAnimation,num:i+10,stance:0,saveHand:null,saveReach:0,pokeTime:0,reaction:null,reactionTime:0,reactionSide:0,holdTime:0,coverTime:0,releaseTime:0,postBlend:0,postSide:0 as const})),
  ...m.goalies.map((g,i)=>({x:g.x,y:g.y,team:g.team,goalie:true,pose:g.pose,selected:goalieMode&&i===0,vx:g.vx,vy:g.vy,heading:0,shotAnimation:0,num:30+i,stance:g.stance,saveHand:g.saveHand,saveReach:g.saveReach,pokeTime:g.pokeTime,reaction:g.reaction,reactionTime:g.reactionTime,reactionSide:g.reactionSide,holdTime:g.holdTime,coverTime:g.coverTime,releaseTime:g.releaseTime,postBlend:g.postBlend,postSide:g.postSide}))
 ];
 // Distant skaters first; selected goalie drawn last, as an NHL goalie camera.
 actors.sort((a,b)=>(direction===1?b.x-a.x:a.x-b.x));
 const selectedGoalie=goalieMode?actors.find(a=>a.goalie&&a.team===0):undefined;
 for(const a of actors){
  if(a===selectedGoalie)continue;
  const p=project(a.x,a.y);if(p.behind)continue;
  // Fade skaters directly in the goalie sightline instead of letting a
  // foreground jersey completely hide the puck and the attacking formation.
  const obstructs=goalieMode&&!a.goalie&&Math.abs(p.x-400)<72&&a.x<245;
  c.save();if(obstructs)c.globalAlpha=.56;
  drawActor(c,p.x,p.y,clamp(p.scale*.92,.34,1.7),a,time,false);
  c.restore();
 }
 if(selectedGoalie){
  // Unlike the old manually anchored goalie, all bodies and puck share the
  // exact same camera transform. The goal stays still when the goalie slides.
  const p=project(selectedGoalie.x,selectedGoalie.y);
  drawActor(c,p.x,p.y,clamp(p.scale*1.24,.75,2.7),selectedGoalie,time,true);
 }
 const puck=project(m.puck.x,m.puck.y);
 // Show possession clearly rather than letting a cluster of players hide the puck.
 if(m.puck.owner>=0){
  const carrier=m.skaters[m.puck.owner],p=project(carrier.x,carrier.y);
  if(!p.behind){
   c.strokeStyle='rgba(255,208,62,.85)';c.lineWidth=2;
   c.beginPath();c.ellipse(p.x,p.y,17*p.scale,7*p.scale,0,0,TAU);c.stroke();
  }
 }
 if(!puck.behind){
  // A shadow and contrast halo make the puck readable over dark equipment.
  oval(c,puck.x,puck.y,Math.max(4,7*puck.scale),Math.max(2,3*puck.scale),'rgba(19,42,59,.24)');
  oval(c,puck.x,puck.y-m.puck.height*puck.scale*.8,Math.max(3,8*puck.scale),Math.max(2,3*puck.scale),'#182631');
  c.beginPath();c.ellipse(puck.x,puck.y-m.puck.height*puck.scale*.8,Math.max(8,15*puck.scale),Math.max(5,9*puck.scale),0,0,TAU);
  c.strokeStyle='#ffd34f';c.lineWidth=2.8;c.stroke();
  if(Math.hypot(m.puck.vx,m.puck.vy)>125){
   const mag=Math.hypot(m.puck.vx,m.puck.vy);
   const trail=project(m.puck.x-m.puck.vx/mag*22,m.puck.y-m.puck.vy/mag*22);
   if(!trail.behind)ln(c,trail.x,trail.y-m.puck.height*trail.scale*.8,puck.x,puck.y-m.puck.height*puck.scale*.8,2,'rgba(255,211,79,.55)');
  }
 }
 c.fillStyle='rgba(8,29,47,.8)';c.fillRect(12,12,220,30);
 c.fillStyle='#e9f7ff';c.font='bold 14px system-ui';c.textAlign='left';
 c.fillText(goalieMode?'BEHIND GOALIE • NHL STYLE':'BEHIND PLAYER • NHL STYLE',22,32);
}
function drawActor(c:CanvasRenderingContext2D,x:number,y:number,s:number,a:{team:number;goalie:boolean;pose:string;selected:boolean;num:number;vx:number;vy:number;heading:number;shotAnimation:number;stance:number;saveHand:'glove'|'blocker'|null;saveReach:number;pokeTime:number;reaction:'pads'|'body'|'stick'|'glove'|'blocker'|null;reactionTime:number;reactionSide:number;holdTime:number;coverTime:number;releaseTime:number;postBlend:number;postSide:-1|0|1},time:number,back:boolean){
 const jersey=a.team===0?'#c83e51':'#2864a5',trim=a.team===0?'#f8f5f1':'#dceeff';
 const dark='#193146',drop=a.goalie?clamp(a.stance+(a.reaction==='pads'?Math.sin((.52-a.reactionTime)/.52*Math.PI)*.32:0),0,1):0;
 const impact=a.goalie&&a.reactionTime>0?Math.sin((.52-a.reactionTime)/.52*Math.PI):0;
 const lean=impact*(a.reactionSide>=0?-1:1)*.10;
 c.save();c.translate(x+impact*(a.reactionSide>=0?-5:5)*s,y+impact*3*s);c.scale(s,s);
 oval(c,0,0,34+drop*20,8,'rgba(21,53,77,.22)');
 const speed=Math.hypot(a.vx,a.vy);
 const skating=!a.goalie?clamp(speed/135,0,1):0;
 const stride=Math.sin(time*(6+skating*9)+a.num*.9)*9*skating;
 const shot=a.goalie?0:clamp(a.shotAnimation/.3,0,1);
 const shotWindup=shot>0?Math.sin((1-shot)*Math.PI):0;
 const lateral=a.goalie?clamp(a.vy/120,-1,1):0;
 const skateLean=a.goalie?lateral*(1-drop)*.13:clamp(a.vy/250,-.14,.14);
  // Goalies move with alternating C-cut shuffles when standing and
  // a single loaded-leg push when sliding in butterfly.
  const shuffleSpeed=a.goalie?clamp(Math.abs(a.vy)/85,0,1):0;
  const shufflePhase=Math.sin(time*(5+shuffleSpeed*6)+a.num*.9);
  const push=shuffleSpeed*shufflePhase*(1-drop);
  const butterflyPush=drop*shuffleSpeed*Math.sin(time*6+a.num);
 // Butterfly based on a real goalie: both knees drive down and inward,
 // while the pad faces rotate out to form a continuous seal along the ice.
 // All coordinates interpolate from the standing stance; no instant snap.
 const ease=drop*drop*(3-2*drop);
 // Even before a save, the goalie crouches with bent knees and a wide base.
 const bodyDrop=5+ease*11;
 for(const side of [-1,1]){
  const hipX=side*11;
  const kneeX=side*(12-ease*4)+(a.goalie?lateral*3:stride*(side===1?-.5:.5));
  const kneeY=-23+ease*17;
  const skateX=side*(13+ease*31)+(a.goalie?lateral*4+push*side*9+butterflyPush*side*7:stride*side);
  const skateY=-2+(a.goalie?Math.abs(push)*-3:0);
  // Thighs bend in as the knees settle close together.
  ln(c,hipX,-34+bodyDrop,kneeX,kneeY,a.goalie?12:8,dark);
  if(a.goalie){
   // In a standing stance the pad is vertical; in butterfly its broad
   // face lies along the ice with the outer tip extended toward the post.
   const padTopX=kneeX*(1-ease)+skateX*ease;
   const padTopY=kneeY*(1-ease)+(-5)*ease;
   const padEndX=side*(33+ease*19)+post*(postLeg?side*5:-side*7);
   const padEndY=-4-post*(postLeg&&a.pose==='vh'?13:0);
   ln(c,kneeX,kneeY,padEndX,padEndY,15,'#7b92a8');
   ln(c,kneeX,kneeY,padEndX,padEndY,12,'#f3f8fc');
   // Standing leg pad remains vertical until the knee drop rotates it.
   const upperX=kneeX+side*(3+ease*3);
   const upperY=kneeY-24*(1-ease)-post*(postLeg&&a.pose==='vh'?9:0);
   ln(c,upperX,upperY,padTopX,padTopY,14,'#7b92a8');
   ln(c,upperX,upperY,padTopX,padTopY,11,'#f3f8fc');
   // Contrasting knee blocks make the ice seal readable.
   oval(c,kneeX,kneeY,8,6,'#e2ebf4');
   ln(c,kneeX+side*5,kneeY+2,padEndX-side*4,padEndY+1,2,'#9db5c7');
   // Skate blade stays flush to the ice during the butterfly.
   ln(c,skateX-side*8,skateY,skateX+side*8,skateY,4,'#182a3a');
  }else{
   ln(c,kneeX,kneeY,skateX,skateY,8,dark);
   ln(c,skateX-8,skateY,skateX+8,skateY,4,'#182a3a');
  }
 }
 // The five-hole closes when both knee blocks meet at ice level.
 if(a.goalie&&ease>.15){
  oval(c,0,-6,Math.max(3,9*ease),4,'#dfeaf2');
 }
 // Pants, jersey, shoulders.
 c.fillStyle=dark;c.beginPath();c.roundRect(-15,-39+bodyDrop,30,19,5);c.fill();
 c.save();c.translate(lean*15,bodyDrop+impact*3);c.rotate(lean+skateLean);c.fillStyle=jersey;c.beginPath();c.moveTo(-14,-73);c.lineTo(14,-73);c.lineTo(23,-58);c.lineTo(16,-36);c.lineTo(-16,-36);c.lineTo(-23,-58);c.closePath();c.fill();c.restore();
 ln(c,-17,-41+bodyDrop,17,-41+bodyDrop,3,trim);ln(c,-18,-64+bodyDrop,18,-64+bodyDrop,2,trim);
 const armY=-43+bodyDrop;
 const cover=a.goalie?clamp(a.coverTime/.55,0,1):0;
 const outlet=a.goalie?Math.sin((1-clamp(a.releaseTime/.55,0,1))*Math.PI):0;
 const hold=a.goalie&&a.holdTime>0;
 const armPump=skating*Math.sin(time*(6+skating*9)+a.num*.9)*6;
 const gloveLift=(a.saveHand==='glove'?a.saveReach*29:0)+(a.reaction==='glove'?impact*22:0);
 const blockerLift=(a.saveHand==='blocker'?a.saveReach*29:0)+(a.reaction==='blocker'?impact*22:0);
 // Anatomical two-bone arms: shoulders -> articulated elbows -> wrists.
 // The elbow follows the wrist at half speed, preventing glove/blocker
 // from floating or snapping independently of the player's shoulders.
 const leftWrist={x:-39-gloveLift*.23+push*2,y:armY-gloveLift+cover*38+(hold?-10:0)+Math.abs(push)*2};
 const rightWrist={x:39+blockerLift*.23+outlet*19-push*2,y:armY-blockerLift+cover*33-outlet*16+Math.abs(push)*2};
 const shoulderY=-63+bodyDrop;
 const arm=(side:-1|1,wrist:{x:number;y:number})=>{
  const shoulderX=side*19;
  const elbowX=shoulderX+(wrist.x-shoulderX)*.55+side*9;
  const elbowY=shoulderY+(wrist.y-shoulderY)*.56+5;
  ln(c,shoulderX,shoulderY,elbowX,elbowY,12,jersey);
  oval(c,elbowX,elbowY,6,6,trim);
  ln(c,elbowX,elbowY,wrist.x,wrist.y,9,jersey);
 };
 arm(-1,leftWrist);arm(1,rightWrist);
 if(a.goalie){
  oval(c,leftWrist.x,leftWrist.y,12,11,'#f7fbfd');
  oval(c,leftWrist.x-3,leftWrist.y-2,6,7,'#aabeca');
  for(let i=-1;i<=1;i++)ln(c,leftWrist.x-6+i*3,leftWrist.y-7,leftWrist.x+1+i*3,leftWrist.y+5,1,'#718a9c');
  c.fillStyle='#eef5f9';c.strokeStyle='#8ba3b2';c.lineWidth=1.5;
  c.beginPath();c.roundRect(rightWrist.x-7,rightWrist.y-11,17,23,3);c.fill();c.stroke();
  if(hold)oval(c,leftWrist.x-3,leftWrist.y,4,3,'#101b26');
 }else{
  oval(c,leftWrist.x,leftWrist.y,6,6,dark);
  oval(c,rightWrist.x,rightWrist.y,6,6,dark);
 }
 // Poke check: extend the stick toward the shooter, then pull it back.
 const poke=a.goalie&&a.pokeTime>0?Math.sin((.34-a.pokeTime)/.34*Math.PI):0;
 const stickSave=a.reaction==='stick'?impact*.75:0;
 const bladeY=-3-poke*52-stickSave*28-shotWindup*32,bladeX=57+poke*10+stickSave*9+shotWindup*22;
 ln(c,rightWrist.x+3,rightWrist.y,42+poke*6,bladeY-4,3,'#ad865c');
 ln(c,42+poke*6,bladeY-4,bladeX,bladeY,5,'#182b3a');
 if(poke>.15)oval(c,bladeX,bladeY,4,2,'#d5e8f3');
 if(shotWindup>.12){ln(c,bladeX-14,bladeY-4,bladeX+8,bladeY,2,'rgba(255,255,255,.6)');}
 // Helmet and cage fully enclose head.
 oval(c,0,-85+bodyDrop,15,17,a.team===0?'#f2f4f5':'#193d67');
 oval(c,0,-82+bodyDrop,12,11,'#b8cbd8');
 for(const k of [-8,0,8])ln(c,k,-91+bodyDrop,k,-72+bodyDrop,1.7,'#557386');
 for(const k of [-88,-81,-74])ln(c,-12,k+bodyDrop,12,k+bodyDrop,1.5,'#557386');
 if(back){c.fillStyle=trim;c.textAlign='center';c.font='bold 13px system-ui';c.fillText(String(a.num),0,-49+bodyDrop);}
 if(a.selected){
  c.strokeStyle='#ffd34e';c.lineWidth=3;c.beginPath();c.ellipse(0,1,32,9,0,0,TAU);c.stroke();
 }
 c.restore();
}
