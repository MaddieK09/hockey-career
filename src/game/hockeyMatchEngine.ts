import {findGoalFrameImpact,findGoalieImpact,findSkaterImpact,type PuckPoint,type EquipmentHit,type GoalieCollider} from './puckCollision';
import {validPeriodMinutes,type PeriodMinutes} from '../config/matchSettings';
/** Self-contained 5v5 hockey simulation. Coordinates use the 800x440 canvas.
 * All puck possession, team decisions, goals, periods and goalie saves run here.
 */
export type Team = 0|1;
export type Position = 'C'|'LW'|'RW'|'LD'|'RD';
export type SavePose = 'glide'|'butterfly'|'blocker'|'vh'|'rvh';
export type PostMode = 'auto'|'manual';
export type MatchPhase = 'live'|'goal'|'intermission'|'final';
export interface MatchSkater {
 x:number;y:number;vx:number;vy:number;heading:number;team:Team;role:Position;
 carriedFor:number;shotAnimation:number;
}
export interface MatchGoalie {x:number;y:number;team:Team;pose:SavePose;poseTime:number;vx:number;vy:number;stance:number;actionTime:number;saveHand:'glove'|'blocker'|null;saveReach:number;saveTarget:number;pokeTime:number;reaction:'pads'|'body'|'stick'|'glove'|'blocker'|null;reactionTime:number;reactionSide:number;holdTime:number;coverTime:number;releaseTime:number;postBlend:number;postSide:-1|0|1;stridePhase:number;pushStrength:number;pushDirection:number;weightShift:number}
export interface MatchPuck {
 x:number;y:number;vx:number;vy:number;owner:number;lock:number;
 shotTeam:Team|null;shotHeight:'low'|'high';lastShooter:number;height:number;vz:number;
}
export interface MatchEvent {kind:'goal'|'save'|'shot'|'faceoff'|'period'|'final';team?:Team;message:string}
export interface MatchControls {x:number;y:number}
export interface MatchRating {speed:number;shot:number;handling:number;defense:number}
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const distance=(ax:number,ay:number,bx:number,by:number)=>Math.hypot(ax-bx,ay-by);
const roles:Position[]=['C','LW','RW','LD','RD'];
const spots=[{x:308,y:220},{x:330,y:119},{x:330,y:321},{x:205,y:156},{x:205,y:284}];
export class HockeyMatch {
 readonly skaters:MatchSkater[]=[];
 readonly goalies:MatchGoalie[]=[
  {x:91,y:220,team:0,pose:'glide',poseTime:0,vx:0,vy:0,stance:0,actionTime:0,saveHand:null,saveReach:0,saveTarget:0,pokeTime:0,reaction:null,reactionTime:0,reactionSide:0,holdTime:0,coverTime:0,releaseTime:0,postBlend:0,postSide:0,stridePhase:0,pushStrength:0,pushDirection:0,weightShift:0},
  {x:709,y:220,team:1,pose:'glide',poseTime:0,vx:0,vy:0,stance:0,actionTime:0,saveHand:null,saveReach:0,saveTarget:0,pokeTime:0,reaction:null,reactionTime:0,reactionSide:0,holdTime:0,coverTime:0,releaseTime:0,postBlend:0,postSide:0,stridePhase:0,pushStrength:0,pushDirection:0,weightShift:0}
 ];
 puck:MatchPuck={x:400,y:220,vx:0,vy:0,owner:-1,lock:0,shotTeam:null,shotHeight:'low',lastShooter:-1,height:0,vz:0};
 scores:[number,number]=[0,0];
 shots:[number,number]=[0,0];
 saves=0;goals=0;assists=0;
 readonly periodMinutes:PeriodMinutes;
 readonly paceFactor:number;
 period=1;timeRemaining=60;
 private shotClock:[number,number]=[0,0];
 phase:MatchPhase='live';phaseTime=0;
 message='PUCK DROP';messageTime=1.8;
 selected=0;lastPasser=-1;
 events:MatchEvent[]=[];
 goalieCareer:boolean;
 postMode:PostMode='auto';
 /** A post is within reach only at the edges of the expanded goal mouth. */
 private get nearPost():-1|0|1{
  const g=this.goalies[0];const offset=g.y-220;
  return Math.abs(offset)>=36&&Math.abs(offset)<=68&&Math.abs(g.x-60)<=68?(offset<0?-1:1):0;
 }
 get postAvailable():boolean{return this.goalieCareer&&this.phase==='live'&&this.nearPost!==0;}
 setPostMode(mode:PostMode):void{
  this.postMode=mode;
  if(mode==='auto'&&(this.goalies[0].pose==='vh'||this.goalies[0].pose==='rvh'))this.goalies[0].pose='glide';
 }

 private rng:()=>number;
 private decisionCooldown:[number,number]=[1.5,1.5];
 private movement:MatchControls={x:0,y:0};
 private goalieActionCooldown=0;
 /** Goalkeeper glove possession is distinct from skater possession. */
 get goalieHolding():boolean{return this.goalies[0].holdTime>0;}
 get canCoverPuck():boolean{const g=this.goalies[0];return this.goalieCareer&&this.phase==='live'&&this.puck.owner<0&&g.holdTime<=0&&this.puck.height<16&&distance(g.x,g.y,this.puck.x,this.puck.y)<49;}
 private freezeGoalie(team:Team):void{
  const g=this.goalies[team];g.holdTime=0;g.coverTime=.55;
  this.puck.vx=this.puck.vy=this.puck.vz=0;
  this.phase='intermission';this.phaseTime=1.15;this.faceoffNext=team===0?1:0;
  this.emit('faceoff','PUCK FROZEN',team);
 }
 private releaseGoalie(team:Team):void{
  const g=this.goalies[team];if(g.holdTime<=0)return;
  g.holdTime=0;g.releaseTime=.55;g.saveHand=null;g.saveTarget=0;
  const forward=team===0?1:-1;
  // Controlled release into the defensive-zone boards; no instant teleport pass.
  this.puck.owner=-1;this.puck.x=g.x+forward*32;this.puck.y=clamp(g.y+(g.y<220?-37:37),60,380);
  this.puck.height=8;this.puck.vx=forward*260;this.puck.vy=g.y<220?-145:145;this.puck.vz=58;
  this.puck.lock=.35;this.puck.shotTeam=null;this.goalieSaveCooldown[team]=.4;
  this.announce('GOALIE PLAYS THE PUCK!');
 }
 private rating:MatchRating;
 private faceoffNext:Team=1;
 private possessionTime:[number,number]=[0,0];
 private goalieSaveCooldown:[number,number]=[0,0];
 private lastSkaterDeflector=-1;
 private skaterDeflectionTime=0;
 private lastBlockAnnouncement=0;
 private creaseMomentum:[number,number]=[0,0];
 constructor(goalieCareer:boolean,rating:MatchRating,rng:()=>number=Math.random,periodMinutes:PeriodMinutes=5){
  this.periodMinutes=validPeriodMinutes(periodMinutes);
  this.timeRemaining=this.periodMinutes*60;
  this.paceFactor=1-.24*(this.periodMinutes-1)/19;
  this.shotClock=[5,7];
  this.goalieCareer=goalieCareer;this.rating=rating;this.rng=rng;
  for(const team of [0,1] as Team[])for(let i=0;i<5;i++){
   const f=spots[i];
   this.skaters.push({x:team===0?f.x:800-f.x,y:f.y,vx:0,vy:0,
    heading:team===0?0:Math.PI,team,role:roles[i],carriedFor:0,shotAnimation:0});
  }
  this.resetFaceoff(1);
 }
 setMovement(x:number,y:number):void{this.movement={x:clamp(x,-1,1),y:clamp(y,-1,1)};}
 switchSkater():void {
  if(this.goalieCareer||this.phase!=='live')return;
  const nearest=this.skaters.map((s,i)=>({i,d:distance(s.x,s.y,this.puck.x,this.puck.y)}))
   .filter(a=>a.i<5&&a.i!==this.selected).sort((a,b)=>a.d-b.d);
  this.selected=nearest[0]?.i??(this.selected+1)%5;
 }
 perform(action:'shoot'|'pass'|'butterfly'|'blocker'|'glove'|'poke'|'cover'|'freeze'|'vh'|'rvh'):void {
  if(this.phase!=='live')return;
  if(this.goalieCareer){
   const goalie=this.goalies[0];
   if(goalie.holdTime>0){
    if(action==='pass')this.releaseGoalie(0);
    else if(action==='freeze'||action==='cover')this.freezeGoalie(0);
    return;
   }
   if(action==='cover'&&this.canCoverPuck){
    goalie.coverTime=.55;goalie.holdTime=.55;goalie.pose='butterfly';goalie.poseTime=.7;
    this.puck.x=goalie.x+20;this.puck.y=goalie.y;this.puck.height=0;
    this.announce('COVERING THE PUCK!');return;
   }
   if((action==='vh'||action==='rvh')&&this.postMode==='manual'&&this.postAvailable){
    goalie.pose=goalie.pose===action?'glide':action;
    goalie.poseTime=.5;goalie.actionTime=.5;return;
   }
   if(action==='butterfly'){
    // Toggle a persistent stance. Recovery has a genuine movement penalty.
    goalie.pose=goalie.pose==='butterfly'?'glide':'butterfly';
    goalie.poseTime=0;goalie.actionTime=.18;
   }else if((action==='blocker'||action==='glove')&&this.goalieActionCooldown<=0){
    goalie.saveHand=action;goalie.saveTarget=1;goalie.poseTime=.46;goalie.actionTime=.46;
    this.goalieActionCooldown=.38;
   }else if(action==='poke'&&this.goalieActionCooldown<=0){
    // Start an actual stick thrust. Contact is evaluated during the animation,
    // not only on the button's first frame.
    goalie.pokeTime=.34;goalie.actionTime=.34;
    this.goalieActionCooldown=.42;
   }
   return;
  }
  if(action!=='shoot'&&action!=='pass')return;
  const skater=this.skaters[this.selected];
  // Shooting and passing require possession. No instant telekinetic steals.
  if(this.puck.owner!==this.selected)return;
  if(action==='shoot'){
   this.shoot(this.selected,clamp(220+(this.rng()-.5)*92,177,263),true);
  }else{
   const teammates=this.skaters.map((s,i)=>({s,i}))
    .filter(a=>a.i<5&&a.i!==this.selected)
    .sort((a,b)=>{
     const sa=(a.s.x-skater.x)*1.2-Math.abs(a.s.y-skater.y)*.18;
     const sb=(b.s.x-skater.x)*1.2-Math.abs(b.s.y-skater.y)*.18;
     return sb-sa;
    });
   const target=teammates[0];
   if(target)this.pass(this.selected,target.i);
  }
 }
 consumeEvents():MatchEvent[]{return this.events.splice(0);}
 private announce(message:string,time=1.4):void{this.message=message;this.messageTime=time;}
 private emit(kind:MatchEvent['kind'],message:string,team?:Team):void{
  this.events.push({kind,message,team});this.announce(message);
 }
 private resetFaceoff(team:Team):void {
  for(let i=0;i<this.skaters.length;i++){
   const f=spots[i%5],a=this.skaters[i];
   a.x=a.team===0?f.x:800-f.x;a.y=f.y;
   a.vx=a.vy=a.carriedFor=a.shotAnimation=0;
  }
  this.goalies[0].x=91;this.goalies[0].y=220;
  this.goalies[1].x=709;this.goalies[1].y=220;
  this.goalies.forEach(g=>{g.pose='glide';g.poseTime=0;g.vx=g.vy=g.stance=g.actionTime=g.saveReach=g.saveTarget=0;g.saveHand=null;g.pokeTime=0;g.reaction=null;g.reactionTime=0;g.reactionSide=0;g.holdTime=g.coverTime=g.releaseTime=g.postBlend=0;g.postSide=0;g.stridePhase=g.pushStrength=g.pushDirection=g.weightShift=0;});
  this.creaseMomentum=[0,0];this.goalieSaveCooldown=[0,0];
  this.lastSkaterDeflector=-1;this.skaterDeflectionTime=0;
  this.lastBlockAnnouncement=0;
  const carrier=team===0?0:5;
  this.puck={x:this.skaters[carrier].x,y:this.skaters[carrier].y,
   vx:0,vy:0,owner:carrier,lock:.55,shotTeam:null,shotHeight:'low',lastShooter:-1,height:0,vz:0};
  this.lastPasser=-1;this.decisionCooldown=[1.5,1.5];this.possessionTime=[0,0];
  this.phase='live';this.phaseTime=0;this.emit('faceoff','FACE OFF',team);
 }
 private release(owner:number,targetX:number,targetY:number,power:number,shot:boolean):void {
  const a=this.skaters[owner],dx=targetX-a.x,dy=targetY-a.y,mag=Math.hypot(dx,dy)||1;
  const nx=dx/mag,ny=dy/mag;
  this.puck.owner=-1;this.puck.x=a.x+nx*24;this.puck.y=a.y+ny*24;
  this.puck.vx=nx*power;this.puck.vy=ny*power;this.puck.lock=.33;
  this.puck.shotTeam=shot?a.team:null;
  this.puck.lastShooter=shot?owner:-1;
  this.puck.shotHeight=shot&&this.rng()<.58?'low':'high';
  this.puck.height=shot?(this.puck.shotHeight==='high'?13:3):0;
  this.puck.vz=shot?(this.puck.shotHeight==='high'?155:48):0;
  a.shotAnimation=.3;a.carriedFor=0;
 }
 private shoot(owner:number,targetY:number,user=false):void {
  const a=this.skaters[owner];
  // A closer shot has less error; player shot skill improves aim.
  const goalX=a.team===0?740:60;
  const range=Math.abs(goalX-a.x);
  const scatter=(this.rng()-.5)*(user?Math.max(12,62-this.rating.shot*.42):Math.max(12,27+range*.05));
  this.release(owner,a.team===0?780:20,targetY+scatter,user?520+this.rating.shot*1.7:485+this.rng()*90,true);
  this.shots[a.team]++;this.decisionCooldown[a.team]=1.5+this.rng()*.9;
  this.emit('shot',a.team===0?'HOME SHOT':'AWAY SHOT',a.team);
 }
 private pass(owner:number,to:number):void {
  const a=this.skaters[owner],b=this.skaters[to];
  this.release(owner,b.x+b.vx*.42,b.y+b.vy*.42,400+this.rating.handling*.4,false);
  this.puck.lock=.22;this.lastPasser=owner;
  this.decisionCooldown[a.team]=2.2;
 }
 private closest(team:Team,x:number,y:number):number {
  let found=team===0?0:5,best=Infinity;
  for(let i=team===0?0:5;i<(team===0?5:10);i++){
   const a=this.skaters[i],d=distance(a.x,a.y,x,y);
   if(d<best){best=d;found=i;}
  }
  return found;
 }
 private aiTarget(i:number):{x:number;y:number}{
  const a=this.skaters[i],sign=a.team===0?1:-1;
  const ownGoal=a.team===0?92:708;
  const roleLane=a.role==='LW'?113:a.role==='RW'?327:a.role==='LD'?158:a.role==='RD'?282:220;
  const owner=this.puck.owner;
  const carrier=owner>=0?this.skaters[owner]:null;
  const hasPuck=carrier?.team===a.team;
  const attacking=carrier?carrier.x*sign>400*sign:this.puck.x*sign>400*sign;
  const front=a.role==='C'||a.role==='LW'||a.role==='RW';
  const isCarrier=owner===i;
  if(isCarrier){
   const defender=this.closest(a.team===0?1:0,a.x,a.y),opponent=this.skaters[defender];
   const evade=Math.abs(a.y-opponent.y)<45?(a.y<=opponent.y?-1:1)*46:0;
   return {x:a.team===0?644:156,
    y:clamp(roleLane+evade,85,355)};
  }
  if(hasPuck&&carrier){
   // A real attacking shape: high slot, two wide outlets and two points.
   // Supports track the puck but never collapse onto its carrier.
   const attackX=clamp(carrier.x+sign*64,155,645);
   if(a.role==='LD'||a.role==='RD')
    return {x:clamp(carrier.x-sign*160,150,650),y:roleLane};
   if(a.role==='C')
    return {x:clamp(attackX-sign*32,150,650),y:clamp(220+(carrier.y-220)*.22,185,255)};
   return {x:attackX,y:roleLane};
  }
  // Only the closest *forward* actively pressures the carrier/loose puck.
  // Defenders always keep the slot and the other forwards cover passing lanes.
  let forechecker=-1,nearest=Infinity;
  for(let j=0;j<this.skaters.length;j++){
   const other=this.skaters[j];
   if(other.team!==a.team||other.role==='LD'||other.role==='RD')continue;
   const d=distance(other.x,other.y,this.puck.x,this.puck.y);
   if(d<nearest){nearest=d;forechecker=j;}
  }
  if(i===forechecker){
   const lead=carrier?Math.min(.18,nearest/Math.max(160,Math.hypot(carrier.vx,carrier.vy))):.08;
   return {x:clamp(this.puck.x+(carrier?.vx??this.puck.vx)*lead,100,700),
    y:clamp(this.puck.y+(carrier?.vy??this.puck.vy)*lead,55,385)};
  }
  if(!front){
   // Defensive pair protects the crease, with one stepping toward the puck.
   const closeSide=a.role==='LD'?-1:1;
   const puckSide=this.puck.y<220?-1:1;
   const depth=closeSide===puckSide?144:105;
   return {x:clamp(ownGoal+sign*depth,100,700),y:clamp(220+closeSide*65,140,300)};
  }
  if(carrier&&carrier.team!==a.team){
   const centerX=clamp(this.puck.x-sign*(a.role==='C'?88:120),120,680);
   return {x:centerX,y:a.role==='C'?clamp(220+(this.puck.y-220)*.2,170,270):roleLane};
  }
  // Loose puck: support behind the forechecker rather than all pursuing it.
  return {x:clamp(this.puck.x-sign*(attacking?105:78),110,690),y:roleLane};
 }
 private updateSkaters(dt:number):void {
  const humanIndex=this.goalieCareer?-1:this.selected;
  // Targets are formed by role/possession rather than all chasing the puck.
  for(let i=0;i<10;i++){
   const a=this.skaters[i],controlled=i===humanIndex;
   let dx:number,dy:number;
   if(controlled){dx=this.movement.x;dy=this.movement.y;}
   else {const target=this.aiTarget(i);dx=target.x-a.x;dy=target.y-a.y;}
   const mag=Math.hypot(dx,dy),speed=(controlled?185+this.rating.speed*.55:175)*this.paceFactor;
   const desiredX=mag<4?0:dx/Math.max(1,mag)*Math.min(speed,mag*2.8);
   const desiredY=mag<4?0:dy/Math.max(1,mag)*Math.min(speed,mag*2.8);
   const accel=controlled?8:4.8;
   a.vx+=(desiredX-a.vx)*Math.min(1,accel*dt);
   a.vy+=(desiredY-a.vy)*Math.min(1,accel*dt);
   // Separation begins before visual overlap; teammate spacing is stronger.
   // The steering force is bounded so it cannot cause sudden bursts.
   for(let j=0;j<10;j++){
    if(i===j)continue;
    const b=this.skaters[j],r=distance(a.x,a.y,b.x,b.y);
    if(r>0&&r<(a.team===b.team?76:42)){
     const radius=a.team===b.team?76:42;
     const push=Math.min(130,(radius-r)*(a.team===b.team?3.8:2.4));
     a.vx+=(a.x-b.x)/r*push*dt;a.vy+=(a.y-b.y)/r*push*dt;
    }
   }
   a.x=clamp(a.x+a.vx*dt,42,758);
   a.y=clamp(a.y+a.vy*dt,43,397);
   // Goalies are physical obstacles: skaters cannot skate through the crease keeper.
   for(const g of this.goalies){
    const dx=a.x-g.x,dy=a.y-g.y,dist=Math.hypot(dx,dy);
    if(dist>0&&dist<30){const push=30-dist;a.x=clamp(a.x+dx/dist*push,42,758);a.y=clamp(a.y+dy/dist*push,43,397);a.vx*=.55;a.vy*=.55;}
   }
   if(Math.hypot(a.vx,a.vy)>9){
    const targetAngle=Math.atan2(a.vy,a.vx);
    const delta=Math.atan2(Math.sin(targetAngle-a.heading),Math.cos(targetAngle-a.heading));
    a.heading+=clamp(delta,-dt*8,dt*8);
   }
   a.shotAnimation=Math.max(0,a.shotAnimation-dt);
   a.carriedFor=this.puck.owner===i?a.carriedFor+dt:0;
  }
  // Goalie locomotion uses velocity and constrained acceleration instead of teleport-like steps.
  // Butterfly is a persistent stance with a slower, lateral push-based slide.
  for(const g of this.goalies){
   const user=g.team===0&&this.goalieCareer;
   let targetX=0,targetY=0;
   if(user){
    targetX=this.movement.x;targetY=this.movement.y;
   }else{
    const approaching=g.team===0?this.puck.vx<0:this.puck.vx>0;
    const range=Math.abs(this.puck.x-g.x);
    const predicted=approaching&&range<300
     ?this.puck.y+this.puck.vy*Math.min(.28,range/Math.max(180,Math.abs(this.puck.vx)))
     :this.puck.y;
    targetY=clamp((220+(predicted-220)*.62-g.y)/30,-1,1);
    const idealX=g.team===0?92:708;
    targetX=clamp((idealX-g.x)/25,-1,1);
   }
   const magnitude=Math.max(1,Math.hypot(targetX,targetY));
   targetX/=magnitude;targetY/=magnitude;
   if(user&&this.postMode==='auto'){
    const post=this.nearPost;
    const puckClose=Math.abs(this.puck.x-g.x)<175;
    const behind=g.team===0?this.puck.x<g.x+32:this.puck.x>g.x-32;
    if(post!==0&&puckClose){g.pose=behind?'rvh':'vh';g.postSide=post;}
    else if(g.pose==='vh'||g.pose==='rvh'){g.pose='glide';}
   }
   if(user&&this.postMode==='manual'&&(g.pose==='vh'||g.pose==='rvh')){
    if(this.nearPost===0)g.pose='glide';else g.postSide=this.nearPost;
   }
   const postLock=g.pose==='vh'||g.pose==='rvh';
   const butterfly=g.pose==='butterfly';
   const recovering=g.stance>.05&&g.pose==='glide';
   const topSpeed=(postLock?24:butterfly?56:recovering?68:user?132+this.rating.speed*.22:115)*this.paceFactor;
   const accel=postLock?115:butterfly?205:recovering?290:470;
   const desiredX=targetX*topSpeed,desiredY=targetY*topSpeed;
   // Movement animation is tied to physical push-off events rather than a free
   // running clock. Fast shuffles load the opposite skate; a butterfly slide
   // gets one long, powerful push, not frantic alternating foot motion.
   const lateralIntent=Math.abs(targetY)>.16?Math.sign(targetY):0;
   const startPush=lateralIntent!==0&&(Math.sign(g.pushDirection)!==lateralIntent||g.pushStrength<.1);
   const speedFraction=clamp(Math.abs(g.vy)/Math.max(1,topSpeed),0,1);
   if(startPush){
    g.pushDirection=lateralIntent;
    g.pushStrength=butterfly?.85:postLock?.16:.64;
   }
   if(lateralIntent!==0){
    g.stridePhase+=(butterfly?2.9:postLock?2.0:6.4)*dt*(.35+.65*speedFraction);
    g.pushStrength=clamp(g.pushStrength+dt*(butterfly?.55:1.25),0,butterfly?.95:1);
   }else{
    g.pushStrength=Math.max(0,g.pushStrength-dt*(butterfly?1.8:3.8));
    g.stridePhase+=dt*1.2*speedFraction;
   }
   const targetLean=postLock?0:clamp(targetY*.68+g.vy/Math.max(1,topSpeed)*.32,-1,1);
   g.weightShift+=clamp(targetLean-g.weightShift,-dt*4,dt*4);
   // Braking is stronger than acceleration to keep small crease corrections precise.
   const maxChange=(Math.hypot(targetX,targetY)<.08?accel*1.8:accel)*dt;
   const dx=desiredX-g.vx,dy=desiredY-g.vy;
   const change=Math.hypot(dx,dy);
   g.vx+=change>maxChange?dx/change*maxChange:dx;
   g.vy+=change>maxChange?dy/change*maxChange:dy;
   const minX=g.team===0?72:672,maxX=g.team===0?128:728;
   const nextX=clamp(g.x+g.vx*dt,minX,maxX);
   // Wider net requires lateral post-to-post coverage, but the goalie cannot leave the crease.
   const nextY=clamp(g.y+g.vy*dt,163,277);
   if(nextX===g.x&&Math.sign(g.vx)===Math.sign(g.x-(minX+maxX)/2))g.vx=0;
   if(nextY===g.y&&Math.sign(g.vy)===Math.sign(g.y-220))g.vy=0;
   g.x=nextX;g.y=nextY;
   const targetStance=butterfly||g.pose==='rvh'?1:g.pose==='vh'?.32:0;
   g.postBlend+=clamp((postLock?1:0)-g.postBlend,-dt*4,dt*4);
   g.stance+=clamp(targetStance-g.stance,-dt*5,dt*7);
   g.actionTime=Math.max(0,g.actionTime-dt);
   g.reactionTime=Math.max(0,g.reactionTime-dt);
   if(g.reactionTime===0)g.reaction=null;
   g.pokeTime=Math.max(0,g.pokeTime-dt);
   // Rise and retract on separate smooth phases, without snapping the glove or blocker.
   if(g.poseTime<.21&&g.holdTime<=0)g.saveTarget=0;
   const reachSpeed=g.saveTarget>g.saveReach?6:3.7;
   g.saveReach+=clamp(g.saveTarget-g.saveReach,-dt*reachSpeed,dt*reachSpeed);
   if(g.saveReach<.001&&g.saveTarget===0){g.saveReach=0;g.saveHand=null;}
   g.poseTime=Math.max(0,g.poseTime-dt);
   if(g.pose==='blocker'&&g.poseTime===0)g.pose='glide';
  }
 }
 private aiDecisions(dt:number):void {
  for(const team of [0,1] as Team[])this.decisionCooldown[team]=Math.max(0,this.decisionCooldown[team]-dt);
  const owner=this.puck.owner;
  if(owner<0)return;
  const carrier=this.skaters[owner],team=carrier.team;
  if(!this.goalieCareer&&owner===this.selected)return;
  if(this.decisionCooldown[team]>0||carrier.carriedFor<.55)return;
  const offensive=team===0?carrier.x>490:carrier.x<310;
  const marker=this.closest(team===0?1:0,carrier.x,carrier.y);
  const pressured=distance(carrier.x,carrier.y,this.skaters[marker].x,this.skaters[marker].y)<60;
  const inShootingLane=Math.abs(carrier.y-220)<120;
  // Aim around the wider opening, including challenging corners.
  const targetY=clamp(220+(this.rng()-.5)*100,172,268);
  // Avoid firing directly into an obvious defender: create a passing lane first.
  const laneBlocked=this.skaters.some((def,i)=>{
   if(i===owner||def.team===team)return false;
   const goalX=team===0?740:60,span=goalX-carrier.x;
   const t=span===0?0:(def.x-carrier.x)/span;
   if(t<=.04||t>=.96)return false;
   const laneY=carrier.y+(targetY-carrier.y)*t;
   return Math.abs(def.y-laneY)<16;
  });
  if(this.shotClock[team]<=0&&offensive&&inShootingLane&&!laneBlocked&&(team===0?carrier.x>515:carrier.x<285)){
   this.shoot(owner,targetY);return;
  }
  // Longer periods need possession cycles, not skaters camping in the slot.
  // Cycle the puck while the team's next shooting opportunity develops.
  const cycling=offensive&&(this.shotClock[team]>6||laneBlocked)&&carrier.carriedFor>2;
  if((pressured||cycling)&&carrier.carriedFor>2.2&&this.rng()<(cycling?.24:.20)){
   const partners=this.skaters.map((a,i)=>({a,i})).filter(t=>t.a.team===team&&t.i!==owner);
   partners.sort((a,b)=>{
    const aheadA=(a.a.x-carrier.x)*(team===0?1:-1);
    const aheadB=(b.a.x-carrier.x)*(team===0?1:-1);
    return (aheadB+distance(b.a.x,b.a.y,carrier.x,carrier.y)*.1)-(aheadA+distance(a.a.x,a.a.y,carrier.x,carrier.y)*.1);
   });
   if(partners[0]&&distance(partners[0].a.x,partners[0].a.y,carrier.x,carrier.y)>80)this.pass(owner,partners[0].i);
  }
 }
 private intercept():void {
  if(this.puck.owner>=0||this.puck.lock>0)return;
  let nearest=-1,best=Infinity;
  for(let i=0;i<10;i++){
   const s=this.skaters[i],r=distance(s.x,s.y,this.puck.x,this.puck.y);
   if(r<21&&r<best){best=r;nearest=i;}
  }
  if(nearest>=0){
   if(this.puck.height>9)return;
   this.puck.owner=nearest;this.puck.vx=this.puck.vy=0;this.puck.height=this.puck.vz=0;
   this.puck.shotTeam=null;
   this.puck.lock=.32;
   this.skaters[nearest].carriedFor=0;
  }
 }
 private collidePokeCheck():boolean {
  if(this.puck.owner>=0||this.puck.height>13)return false;
  for(const g of this.goalies){
   if(g.pokeTime<=.06||g.pokeTime>=.33)continue;
   const direction=g.team===0?1:-1;
   // Extend the stick out from the goalie toward the incoming shooter.
   const reach=32+Math.sin((.34-g.pokeTime)/.34*Math.PI)*50;
   const forward=(this.puck.x-g.x)*direction;
   if(forward<8||forward>reach+12||Math.abs(this.puck.y-g.y)>20)continue;
   const shot=this.puck.shotTeam!==null;
   this.puck.x=g.x+direction*(reach+14);
   this.puck.vx=direction*Math.max(230,Math.abs(this.puck.vx)*.68);
   this.puck.vy+=(this.puck.y-g.y)*3;
   this.puck.vz=42;this.puck.shotTeam=null;this.puck.lock=.2;
   g.pokeTime=.06;g.reaction='stick';g.reactionTime=.45;g.reactionSide=this.puck.y-g.y;
   if(shot){if(g.team===0&&this.goalieCareer)this.saves++;this.emit('save','POKE CHECK SAVE!',g.team);}
   else this.announce('POKE CHECK!');
   return true;
  }
  return false;
 }
 /** Resolve the first physical puck contact against either goalie using a
  * continuous 3D sweep, including glove, blocker, stick, pads, chest and mask.
  * The same world coordinates also drive the camera.
  */
 private collideGoalies(previousX:number):boolean {
  if(this.puck.owner>=0)return false;
  const from:PuckPoint={x:previousX,y:this.previousPuckY,z:this.previousPuckHeight};
  const to:PuckPoint={x:this.puck.x,y:this.puck.y,z:this.puck.height};
  let first:{goalie:MatchGoalie;impact:EquipmentHit}|null=null;
  for(const goalie of this.goalies){
   // A rebound must have time to clear equipment before colliding again.
   if(this.goalieSaveCooldown[goalie.team]>0)continue;
   const impact=findGoalieImpact(from,to,goalie as GoalieCollider);
   if(impact&&(!first||impact.time<first.impact.time))first={goalie,impact};
  }
  if(!first)return false;
  const {goalie,impact}=first,contact=impact.surface;
  const caught=contact==='glove'&&impact.point.z>14;
  const wasShot=this.puck.shotTeam!==null&&this.puck.shotTeam!==goalie.team;
  const restitution=contact==='stick'?.65:contact==='pads'?.46:contact==='mask'?.31:.28;
  // Send the puck back into play from the *incoming* side of the goalie,
  // not through their body into the goal behind them.
  const incomingSide=this.puck.vx<0?1:-1;
  this.puck.x=goalie.x+incomingSide*24;
  this.puck.y=impact.point.y;
  this.puck.height=caught?0:Math.max(0,impact.point.z);
  this.puck.vx=incomingSide*Math.max(90,Math.abs(this.puck.vx)*restitution);
  this.puck.vy=(this.puck.vy*.35)+(impact.point.y-goalie.y)*1.8;
  this.puck.vz=caught?0:Math.max(-42,this.puck.vz*.3);
  this.puck.shotTeam=null;this.puck.lock=.20;
  this.goalieSaveCooldown[goalie.team]=.22;
  goalie.reaction=contact==='mask'?'body':contact;
  goalie.reactionTime=.56;
  goalie.reactionSide=impact.point.y-goalie.y;
  if(contact==='glove'||contact==='blocker'){
   goalie.saveHand=contact;goalie.saveTarget=1;goalie.poseTime=Math.max(goalie.poseTime,.46);
  }else if(contact==='pads'){
   goalie.poseTime=.35;
   if(!this.goalieCareer||goalie.team!==0)goalie.pose='butterfly';
  }
  if(wasShot){
   if(goalie.team===0&&this.goalieCareer)this.saves++;
   const label=contact==='pads'?'PAD SAVE!':contact==='mask'?'MASK SAVE!':
    contact==='body'?'BODY SAVE!':contact==='glove'?'GLOVE SAVE!':
    contact==='blocker'?'BLOCKER SAVE!':'STICK SAVE!';
   this.emit('save',label,goalie.team);
  }
  if(caught){
   // A clean glove save stays live for two seconds. The user may pass or
   // cover/freeze; timeout or AI catches whistle for a faceoff.
   goalie.holdTime=2;
   goalie.saveHand='glove';goalie.saveTarget=1;goalie.poseTime=Math.max(goalie.poseTime,.46);
   this.puck.x=goalie.x+(goalie.team===0?14:-14);
   this.puck.y=goalie.y-31;this.puck.height=45;
   this.puck.vx=this.puck.vy=this.puck.vz=0;
   this.announce('GLOVE SAVE! PASS OR FREEZE · 2 SEC',2);
  }
  return true;
 }
 private previousPuckY=220;
 private previousPuckHeight=0;
 private resolveGoalPlane(previousX:number,previousY:number,previousHeight:number):boolean {
  const from:PuckPoint={x:previousX,y:previousY,z:previousHeight};
  const to:PuckPoint={x:this.puck.x,y:this.puck.y,z:this.puck.height};
  const left=findGoalFrameImpact(from,to,60,-1);
  const right=findGoalFrameImpact(from,to,740,1);
  const impact=left&&right?(left.time<=right.time?left:right):left??right;
  if(!impact)return false;
  if(impact.surface==='goal'){
   // Both the puck and goal are world-space objects. A shot grazing
   // the post or crossbar is rejected by the frame sweep before scoring.
   const scorer:Team=to.x>from.x?0:1;
   this.scores[scorer]++;
   if(scorer===0&&!this.goalieCareer&&this.puck.lastShooter===this.selected)this.goals++;
   if(scorer===0&&this.lastPasser>=0&&this.lastPasser!==this.puck.lastShooter)this.assists++;
   this.puck.x=impact.point.x;this.puck.y=impact.point.y;this.puck.height=impact.point.z;
   this.puck.vx=this.puck.vy=this.puck.vz=0;this.puck.lock=2;
   this.phase='goal';this.phaseTime=1.5;this.faceoffNext=scorer===0?1:0;
   this.emit('goal',scorer===0?'HOME GOAL!':'AWAY GOAL!',scorer);
   return true;
  }
  const post=impact.surface==='post',crossbar=impact.surface==='crossbar';
  this.puck.x=impact.point.x+impact.normal.x*4;
  this.puck.y=impact.point.y+impact.normal.y*4;
  this.puck.height=Math.max(0,impact.point.z+impact.normal.z*4);
  const vx=this.puck.vx,vy=this.puck.vy,vz=this.puck.vz;
  const normal=impact.normal;
  const dot=vx*normal.x+vy*normal.y+vz*normal.z;
  const bounce=post?.7:crossbar?.56:.19;
  if(dot<0){
   this.puck.vx=vx-(1+bounce)*dot*normal.x;
   this.puck.vy=vy-(1+bounce)*dot*normal.y;
   this.puck.vz=vz-(1+bounce)*dot*normal.z;
  }else this.puck.vx=-vx*bounce;
  if(post)this.puck.vy+=(impact.point.y>220?1:-1)*34;
  this.puck.shotTeam=null;this.puck.lock=.12;
  this.announce(post?'OFF THE POST!':crossbar?'OFF THE CROSSBAR!':'SIDE NETTING!');
  return true;
 }
 private collideSkaterPuck(previousX:number,previousY:number,previousHeight:number):boolean {
  // Stick/body shot blocks only apply to genuine high-speed attempts.
  // Slow loose pucks are handled by possession pickup, not phantom ricochets.
  if(this.puck.owner>=0||this.puck.shotTeam===null&&
     (this.puck.lock>0||Math.hypot(this.puck.vx,this.puck.vy)<195))return false;
  const from:PuckPoint={x:previousX,y:previousY,z:previousHeight};
  const to:PuckPoint={x:this.puck.x,y:this.puck.y,z:this.puck.height};
  let first:{index:number;hit:ReturnType<typeof findSkaterImpact>}|null=null;
  for(let i=0;i<this.skaters.length;i++){
   // Ignore the shooter's own stick until the puck has cleared their release.
   if(i===this.puck.lastShooter&&this.puck.lock>0)continue;
   // Teammates near the release point should not absorb their own shot.
   if(this.puck.shotTeam!==null&&this.skaters[i].team===this.puck.shotTeam&&
      distance(this.skaters[i].x,this.skaters[i].y,from.x,from.y)<65)continue;
   if(i===this.lastSkaterDeflector&&this.skaterDeflectionTime>0)continue;
   const hit=findSkaterImpact(from,to,this.skaters[i]);
   if(hit&&(!first||!first.hit||hit.time<first.hit.time))first={index:i,hit};
  }
  if(!first||!first.hit)return false;
  const {hit,index}=first;
  const skater=this.skaters[index];
  const nx=hit.normal.x,ny=hit.normal.y,nz=hit.normal.z;
  const dot=this.puck.vx*nx+this.puck.vy*ny+this.puck.vz*nz;
  const restitution=hit.surface==='stick'?.52:.32;
  this.puck.x=hit.point.x+nx*4;
  this.puck.y=hit.point.y+ny*4;
  this.puck.height=Math.max(0,hit.point.z+nz*4);
  if(dot<0){
   this.puck.vx-=(1+restitution)*dot*nx;
   this.puck.vy-=(1+restitution)*dot*ny;
   this.puck.vz-=(1+restitution)*dot*nz;
  }else{
   this.puck.vx=-this.puck.vx*restitution;
   this.puck.vy=-this.puck.vy*restitution;
  }
  this.puck.vx+=skater.vx*.16;this.puck.vy+=skater.vy*.16;
  this.puck.shotTeam=null;this.puck.lock=.32;
  this.lastSkaterDeflector=index;this.skaterDeflectionTime=.18;
  if(this.lastBlockAnnouncement<=0){
   this.announce(hit.surface==='stick'?'STICK DEFLECTION!':'SHOT BLOCKED!',.85);
   this.lastBlockAnnouncement=1.5;
  }
  return true;
 }
 private stepPuck(dt:number):void {
  if(this.puck.owner>=0){
   const a=this.skaters[this.puck.owner],sign=a.team===0?1:-1;
   this.puck.x=a.x+sign*22;this.puck.y=a.y+7;this.puck.height=0;this.puck.vz=0;
   if(this.puck.lock<=0){
    const opponent=this.closest(a.team===0?1:0,a.x,a.y);
    const defender=this.skaters[opponent];
    if(distance(a.x,a.y,defender.x,defender.y)<27&&this.rng()<.48*dt){
     this.puck.owner=-1;this.puck.x=a.x+sign*24;
     this.puck.vx=-sign*120;this.puck.vy=(this.rng()-.5)*140;
     this.puck.lock=.25;this.puck.shotTeam=null;
     this.emit('faceoff','PUCK KNOCKED LOOSE');
    }
   }
   return;
  }
  // Substep travel: fast shots must not tunnel through a pad, post or goal line.
  const speed=Math.hypot(this.puck.vx,this.puck.vy);
  const steps=Math.min(16,Math.max(1,Math.ceil(speed*dt/8)));
  const h=dt/steps;
  for(let i=0;i<steps;i++){
   const previousX=this.puck.x,previousY=this.puck.y,previousHeight=this.puck.height;
   this.previousPuckY=previousY;this.previousPuckHeight=previousHeight;
   this.puck.x+=this.puck.vx*h;this.puck.y+=this.puck.vy*h;
   this.puck.height+=this.puck.vz*h-.5*320*h*h;
   this.puck.vz-=320*h;
   if(this.puck.height<=0){
    this.puck.height=0;
    if(this.puck.vz< -38)this.puck.vz=-this.puck.vz*.27;
    else this.puck.vz=0;
   }
   const drag=Math.pow(this.puck.height>0?.9985:.994,h*60);
   this.puck.vx*=drag;this.puck.vy*=drag;
   if(this.puck.y<32||this.puck.y>408){
    this.puck.y=clamp(this.puck.y,32,408);
    this.puck.vy*=-.66;
    this.puck.vx*=.91;
    this.puck.shotTeam=null;
   }
   if(this.collidePokeCheck())continue;
   if(this.collideGoalies(previousX)){
    if(this.phase!=='live')return;
    continue;
   }
   if(this.collideSkaterPuck(previousX,previousY,previousHeight))continue;
   if(this.resolveGoalPlane(previousX,previousY,previousHeight))return;
   // Behind the nets, end boards absorb energy and send the puck back out.
   if(this.puck.x<43||this.puck.x>757){
    this.puck.x=clamp(this.puck.x,43,757);
    this.puck.vx*=-.58;this.puck.vy*=.9;
    this.puck.shotTeam=null;
   }
  }
  this.intercept();
 }
 step(rawDt:number):void {
  if(this.phase==='final')return;
  const dt=clamp(rawDt,0,.04);
  this.messageTime=Math.max(0,this.messageTime-dt);
  if(this.messageTime===0&&this.phase==='live')this.message='LIVE PLAY';
  this.goalieActionCooldown=Math.max(0,this.goalieActionCooldown-dt);
  for(const g of this.goalies){
   g.coverTime=Math.max(0,g.coverTime-dt);g.releaseTime=Math.max(0,g.releaseTime-dt);
   if(g.holdTime>0){g.holdTime=Math.max(0,g.holdTime-dt);if(g.holdTime===0)this.freezeGoalie(g.team);}
  }
  this.puck.lock=Math.max(0,this.puck.lock-dt);
  this.skaterDeflectionTime=Math.max(0,this.skaterDeflectionTime-dt);
  this.lastBlockAnnouncement=Math.max(0,this.lastBlockAnnouncement-dt);
  for(const team of [0,1] as Team[])this.goalieSaveCooldown[team]=Math.max(0,this.goalieSaveCooldown[team]-dt);
  if(this.puck.owner>=0)this.possessionTime[this.skaters[this.puck.owner].team]+=dt;
  if(this.phase==='goal'||this.phase==='intermission'){
   this.phaseTime=Math.max(0,this.phaseTime-dt);
   if(this.phaseTime===0)this.resetFaceoff(this.faceoffNext);
   return;
  }
  this.timeRemaining=Math.max(0,this.timeRemaining-dt);
  if(this.timeRemaining===0){
   if(this.period===3){this.phase='final';this.emit('final','FINAL BUZZER');return;}
   this.period++;this.timeRemaining=this.periodMinutes*60;this.phase='intermission';this.phaseTime=1.15;
   this.faceoffNext=this.period%2===0?0:1;this.emit('period','PERIOD '+this.period);return;
  }
  for(const team of [0,1] as Team[])this.shotClock[team]=Math.max(0,this.shotClock[team]-dt);
  this.updateSkaters(dt);
  if(this.goalies.some(g=>g.holdTime>0)){
   const g=this.goalies.find(g=>g.holdTime>0)!;
   this.puck.x=g.x+(g.team===0?14:-14);this.puck.y=g.coverTime>0?g.y:g.y-31;this.puck.height=g.coverTime>0?0:45;
   this.puck.vx=this.puck.vy=this.puck.vz=0;return;
  }
  this.aiDecisions(dt);
  this.stepPuck(dt);
 }
}
