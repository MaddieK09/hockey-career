/** Self-contained 5v5 hockey simulation. Coordinates use the 800x440 canvas.
 * All puck possession, team decisions, goals, periods and goalie saves run here.
 */
export type Team = 0|1;
export type Position = 'C'|'LW'|'RW'|'LD'|'RD';
export type SavePose = 'glide'|'butterfly'|'blocker';
export type MatchPhase = 'live'|'goal'|'intermission'|'final';
export interface MatchSkater {
 x:number;y:number;vx:number;vy:number;heading:number;team:Team;role:Position;
 carriedFor:number;shotAnimation:number;
}
export interface MatchGoalie {x:number;y:number;team:Team;pose:SavePose;poseTime:number;vx:number;vy:number;stance:number;actionTime:number;saveHand:'glove'|'blocker'|null;saveReach:number}
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
  {x:91,y:220,team:0,pose:'glide',poseTime:0,vx:0,vy:0,stance:0,actionTime:0,saveHand:null,saveReach:0},
  {x:709,y:220,team:1,pose:'glide',poseTime:0,vx:0,vy:0,stance:0,actionTime:0,saveHand:null,saveReach:0}
 ];
 puck:MatchPuck={x:400,y:220,vx:0,vy:0,owner:-1,lock:0,shotTeam:null,shotHeight:'low',lastShooter:-1,height:0,vz:0};
 scores:[number,number]=[0,0];
 shots:[number,number]=[0,0];
 saves=0;goals=0;assists=0;
 period=1;timeRemaining=60;
 phase:MatchPhase='live';phaseTime=0;
 message='PUCK DROP';messageTime=1.8;
 selected=0;lastPasser=-1;
 events:MatchEvent[]=[];
 goalieCareer:boolean;
 private rng:()=>number;
 private decisionCooldown:[number,number]=[1.5,1.5];
 private movement:MatchControls={x:0,y:0};
 private goalieActionCooldown=0;
 private rating:MatchRating;
 private faceoffNext:Team=1;
 private possessionTime:[number,number]=[0,0];
 private goalieSaveCooldown:[number,number]=[0,0];
 private creaseMomentum:[number,number]=[0,0];
 constructor(goalieCareer:boolean,rating:MatchRating,rng:()=>number=Math.random){
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
 perform(action:'shoot'|'pass'|'butterfly'|'blocker'|'glove'|'poke'):void {
  if(this.phase!=='live')return;
  if(this.goalieCareer){
   const goalie=this.goalies[0];
   if(action==='butterfly'){
    // Toggle a persistent stance. Recovery has a genuine movement penalty.
    goalie.pose=goalie.pose==='butterfly'?'glide':'butterfly';
    goalie.poseTime=0;goalie.actionTime=.18;
   }else if((action==='blocker'||action==='glove')&&this.goalieActionCooldown<=0){
    goalie.saveHand=action;goalie.saveReach=1;goalie.poseTime=.46;goalie.actionTime=.46;
    this.goalieActionCooldown=.38;
   }else if(action==='poke'&&this.goalieActionCooldown<=0){
    if(distance(goalie.x,goalie.y,this.puck.x,this.puck.y)<67){
     this.puck.owner=-1;this.puck.shotTeam=null;
     this.puck.x=goalie.x+27;this.puck.vx=320;
     this.puck.vy=(this.rng()-.5)*210;this.puck.lock=.5;
     goalie.saveHand='blocker';goalie.saveReach=1;goalie.poseTime=.28;
     this.emit('save','POKE CHECK!');
    }
    this.goalieActionCooldown=.45;
   }
   return;
  }
  if(action!=='shoot'&&action!=='pass')return;
  const skater=this.skaters[this.selected];
  // Shooting and passing require possession. No instant telekinetic steals.
  if(this.puck.owner!==this.selected)return;
  if(action==='shoot'){
   this.shoot(this.selected,clamp(220+(this.rng()-.5)*65,185,255),true);
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
  this.goalies.forEach(g=>{g.pose='glide';g.poseTime=0;g.vx=g.vy=g.stance=g.actionTime=g.saveReach=0;g.saveHand=null;});
  this.creaseMomentum=[0,0];this.goalieSaveCooldown=[0,0];
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
  const teamHasPuck=this.puck.owner>=0&&this.skaters[this.puck.owner].team===a.team;
  const otherHasPuck=this.puck.owner>=0&&!teamHasPuck;
  const lane=a.role==='LW'?115:a.role==='RW'?325:a.role==='LD'?155:a.role==='RD'?285:220;
  const ownGoal=a.team===0?92:708;
  const carrier=this.puck.owner>=0?this.skaters[this.puck.owner]:null;
  if(this.puck.owner===i){
   const defender=this.closest(a.team===0?1:0,a.x,a.y);
   const d=this.skaters[defender];
   const dodge=(a.y<d.y?-1:1)*24;
   return {x:a.team===0?665:135,y:clamp(220+(a.role==='LW'?-48:a.role==='RW'?48:0)+dodge,95,345)};
  }
  if(teamHasPuck){
   const px=carrier!.x;
   if(a.role==='LD'||a.role==='RD')return {x:clamp(px-sign*170,150,650),y:lane};
   if(a.role==='C')return {x:clamp(px-sign*70,130,670),y:220};
   return {x:clamp(px-sign*30,130,670),y:lane};
  }
  const first=this.closest(a.team,this.puck.x,this.puck.y);
  // Only one forechecker pressures the puck. The other forwards hold lanes,
  // while defensemen protect the slot instead of collapsing into a pile.
  if(i===first&&a.role!=='LD'&&a.role!=='RD'){
   const owner=this.puck.owner>=0?this.skaters[this.puck.owner]:null;
   return {x:clamp(this.puck.x+(owner?owner.vx*.16:0),110,690),
    y:clamp(this.puck.y+(owner?owner.vy*.16:0),58,382)};
  }
  if(otherHasPuck){
   if(a.role==='LD'||a.role==='RD')return {x:ownGoal+sign*(a.role==='LD'?110:150),y:lane};
   const interceptX=clamp(this.puck.x-sign*(a.role==='C'?92:135),110,690);
   return {x:interceptX,y:lane};
  }
  if(a.role==='LD'||a.role==='RD')return {x:ownGoal+sign*132,y:lane};
  return {x:clamp(this.puck.x-sign*75,110,690),y:lane};
 }
 private updateSkaters(dt:number):void {
  const humanIndex=this.goalieCareer?-1:this.selected;
  // Targets are formed by role/possession rather than all chasing the puck.
  for(let i=0;i<10;i++){
   const a=this.skaters[i],controlled=i===humanIndex;
   let dx:number,dy:number;
   if(controlled){dx=this.movement.x;dy=this.movement.y;}
   else {const target=this.aiTarget(i);dx=target.x-a.x;dy=target.y-a.y;}
   const mag=Math.hypot(dx,dy),speed=controlled?185+this.rating.speed*.55:175;
   const desiredX=mag<4?0:dx/Math.max(1,mag)*Math.min(speed,mag*2.8);
   const desiredY=mag<4?0:dy/Math.max(1,mag)*Math.min(speed,mag*2.8);
   const accel=controlled?8:4.3;
   a.vx+=(desiredX-a.vx)*Math.min(1,accel*dt);
   a.vy+=(desiredY-a.vy)*Math.min(1,accel*dt);
   // Short-range separation prevents players forming overlapping piles.
   for(let j=0;j<10;j++){
    if(i===j)continue;
    const b=this.skaters[j],r=distance(a.x,a.y,b.x,b.y);
    if(r>0&&r<46){const push=(46-r)*dt*(a.team===b.team?13:8);a.vx+=(a.x-b.x)/r*push;a.vy+=(a.y-b.y)/r*push;}
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
   const butterfly=g.pose==='butterfly';
   const recovering=g.stance>.05&&g.pose==='glide';
   const topSpeed=butterfly?66:recovering?70:user?170+this.rating.speed*.28:123;
   const accel=butterfly?250:recovering?300:640;
   const desiredX=targetX*topSpeed,desiredY=targetY*topSpeed;
   const maxChange=accel*dt;
   const dx=desiredX-g.vx,dy=desiredY-g.vy;
   const change=Math.hypot(dx,dy);
   g.vx+=change>maxChange?dx/change*maxChange:dx;
   g.vy+=change>maxChange?dy/change*maxChange:dy;
   const minX=g.team===0?72:672,maxX=g.team===0?128:728;
   const nextX=clamp(g.x+g.vx*dt,minX,maxX);
   const nextY=clamp(g.y+g.vy*dt,178,262);
   if(nextX===g.x&&Math.sign(g.vx)===Math.sign(g.x-(minX+maxX)/2))g.vx=0;
   if(nextY===g.y&&Math.sign(g.vy)===Math.sign(g.y-220))g.vy=0;
   g.x=nextX;g.y=nextY;
   const targetStance=butterfly?1:0;
   g.stance+=clamp(targetStance-g.stance,-dt*5,dt*7);
   g.actionTime=Math.max(0,g.actionTime-dt);
   g.saveReach=Math.max(0,g.saveReach-dt*2.5);
   if(g.saveReach===0)g.saveHand=null;
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
  if(offensive&&inShootingLane&&(team===0?carrier.x>515:carrier.x<285)){
   this.shoot(owner,clamp(220+(this.rng()-.5)*64,189,251));return;
  }
  // Hold possession and carry the puck; pass only when genuinely trapped.
  if(pressured&&carrier.carriedFor>3.1&&this.rng()<.20){
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
 private saveContact(goalie:MatchGoalie):'pads'|'body'|'stick'|'glove'|'blocker'|null {
  const lateral=this.puck.y-goalie.y;
  const gap=Math.abs(lateral),z=this.puck.height;
  // Geometry is expressed in the same rink units as the goal mouth.
  // Low pads are wider in butterfly; standing body protects the middle.
  if(z<=9&&gap<=20)return 'stick';
  if(z<=18&&gap<=17+30*goalie.stance)return 'pads';
  if(z<=58&&gap<=14)return 'body';
  if(goalie.saveHand==='glove'&&goalie.saveReach>.08&&lateral>=-51&&lateral<=-12&&z>=9&&z<=78)return 'glove';
  if(goalie.saveHand==='blocker'&&goalie.saveReach>.08&&lateral>=12&&lateral<=51&&z>=9&&z<=74)return 'blocker';
  return null;
 }
 private collideGoalies(previousX:number):boolean {
  if(this.puck.owner>=0)return false;
  const direction=Math.sign(this.puck.vx);
  if(direction===0)return false;
  const goalie=direction>0?this.goalies[1]:this.goalies[0];
  // Swept crossing of the front of the goalie; no random "save chance".
  const plane=goalie.x-direction*14;
  if(direction*(previousX-plane)>0||direction*(this.puck.x-plane)<0)return false;
  const t=clamp((plane-previousX)/(this.puck.x-previousX||1),0,1);
  const impactY=this.previousPuckY+(this.puck.y-this.previousPuckY)*t;
  const impactZ=this.previousPuckHeight+(this.puck.height-this.previousPuckHeight)*t;
  const finalY=this.puck.y,finalZ=this.puck.height;
  this.puck.y=impactY;this.puck.height=impactZ;
  const contact=this.saveContact(goalie);
  this.puck.y=finalY;this.puck.height=finalZ;
  if(!contact)return false;
  const wasShot=this.puck.shotTeam!==null;
  const caught=contact==='glove'&&impactZ>16;
  const speed=Math.hypot(this.puck.vx,this.puck.vy);
  this.puck.x=plane-direction*5;
  this.puck.y=impactY;
  this.puck.vx=-direction*Math.max(85,speed*(contact==='pads'?.42:.30));
  this.puck.vy+=(impactY-goalie.y)*2.1+(this.rng()-.5)*35;
  this.puck.height=caught?0:Math.max(0,impactZ);
  this.puck.vz=caught?0:Math.max(0,this.puck.vz*.3);
  this.puck.shotTeam=null;this.puck.lock=.16;
  if(wasShot){
   if(goalie.team===0&&this.goalieCareer)this.saves++;
   this.emit('save',caught?'GLOVE SAVE!':contact==='pads'?'PAD SAVE!':contact==='blocker'?'BLOCKER SAVE!':contact==='stick'?'STICK SAVE!':'GOALIE SAVE!',goalie.team);
  }
  if(!(goalie.team===0&&this.goalieCareer)){
   if(contact==='pads')goalie.pose='butterfly';
   else if(contact==='glove'||contact==='blocker'){goalie.saveHand=contact;goalie.saveReach=1;}
   goalie.poseTime=.38;
  }
  return true;
 }
 private previousPuckY=220;
 private previousPuckHeight=0;
 private resolveGoalPlane(previousX:number,previousY:number,previousHeight:number):boolean {
  const dir=Math.sign(this.puck.vx);
  if(!dir)return false;
  const line=dir>0?740:60;
  if(dir*(previousX-line)>0||dir*(this.puck.x-line)<0)return false;
  const t=clamp((line-previousX)/(this.puck.x-previousX||1),0,1);
  const y=previousY+(this.puck.y-previousY)*t;
  const z=previousHeight+(this.puck.height-previousHeight)*t;
  const offset=Math.abs(y-220);
  const postRadius=4,puckRadius=3;
  const opening=34;
  // Posts and crossbar are solid; a shot that touches metal cannot be a goal.
  const hitsPost=Math.abs(offset-opening)<=postRadius+puckRadius&&z<=68;
  const hitsCrossbar=offset<opening+postRadius&&Math.abs(z-64)<=postRadius+puckRadius;
  if(hitsPost||hitsCrossbar){
   this.puck.x=line-dir*6;this.puck.y=y;this.puck.height=z;
   this.puck.vx=-this.puck.vx*.64;
   this.puck.vy+=(y>220?1:-1)*85;
   this.puck.vz=hitsCrossbar?Math.min(-65,this.puck.vz*.25):this.puck.vz*.65;
   this.puck.shotTeam=null;this.puck.lock=.12;
   this.announce(hitsCrossbar?'OFF THE CROSSBAR!':'OFF THE POST!');
   return true;
  }
  if(offset<opening-postRadius-puckRadius&&z>=0&&z<64-postRadius-puckRadius){
   // The entire puck passed the goal line inside the frame. Net mesh absorbs it.
   const scorer:Team=dir>0?0:1;
   this.scores[scorer]++;
   if(scorer===0&&!this.goalieCareer&&this.puck.lastShooter===this.selected)this.goals++;
   if(scorer===0&&this.lastPasser>=0&&this.lastPasser!==this.puck.lastShooter)this.assists++;
   this.puck.x=line+dir*10;this.puck.y=y;this.puck.height=z;
   this.puck.vx=this.puck.vy=this.puck.vz=0;this.puck.lock=2;
   this.phase='goal';this.phaseTime=1.5;this.faceoffNext=scorer===0?1:0;
   this.emit('goal',scorer===0?'HOME GOAL!':'AWAY GOAL!',scorer);
   return true;
  }
  // A puck missing the opening passes behind the frame and contacts end boards.
  return false;
 }
 private collideSkaterPuck():void {
  if(this.puck.owner>=0||this.puck.lock>0||this.puck.height>26)return;
  for(const skater of this.skaters){
   const dx=this.puck.x-skater.x,dy=this.puck.y-skater.y;
   const d=Math.hypot(dx,dy);
   if(d>0&&d<15){
    const nx=dx/d,ny=dy/d,normal=this.puck.vx*nx+this.puck.vy*ny;
    if(normal>=0)continue;
    this.puck.x=skater.x+nx*16;this.puck.y=skater.y+ny*16;
    this.puck.vx-=1.4*normal*nx;this.puck.vy-=1.4*normal*ny;
    this.puck.vx+=skater.vx*.25;this.puck.vy+=skater.vy*.25;
    this.puck.vz=Math.max(this.puck.vz,25);
    this.puck.shotTeam=null;this.puck.lock=.12;
    return;
   }
  }
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
   if(this.collideGoalies(previousX))continue;
   if(this.resolveGoalPlane(previousX,previousY,previousHeight))return;
   this.collideSkaterPuck();
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
  this.puck.lock=Math.max(0,this.puck.lock-dt);
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
   this.period++;this.timeRemaining=60;this.phase='intermission';this.phaseTime=1.15;
   this.faceoffNext=this.period%2===0?0:1;this.emit('period','PERIOD '+this.period);return;
  }
  this.updateSkaters(dt);
  this.aiDecisions(dt);
  this.stepPuck(dt);
 }
}
