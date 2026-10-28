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
export interface MatchGoalie {x:number;y:number;team:Team;pose:SavePose;poseTime:number}
export interface MatchPuck {
 x:number;y:number;vx:number;vy:number;owner:number;lock:number;
 shotTeam:Team|null;shotHeight:'low'|'high';lastShooter:number;
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
  {x:91,y:220,team:0,pose:'glide',poseTime:0},
  {x:709,y:220,team:1,pose:'glide',poseTime:0}
 ];
 puck:MatchPuck={x:400,y:220,vx:0,vy:0,owner:-1,lock:0,shotTeam:null,shotHeight:'low',lastShooter:-1};
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
 private decisionCooldown:[number,number]=[.8,.8];
 private movement:MatchControls={x:0,y:0};
 private goalieActionCooldown=0;
 private rating:MatchRating;
 private faceoffNext:Team=1;
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
 perform(action:'shoot'|'pass'|'butterfly'|'blocker'):void {
  if(this.phase!=='live')return;
  if(this.goalieCareer){
   const goalie=this.goalies[0];
   if(this.goalieActionCooldown>0)return;
   if(action==='butterfly'||action==='blocker'){
    goalie.pose=action;goalie.poseTime=.47;
    this.goalieActionCooldown=.26;
   }
   return;
  }
  if(action!=='shoot'&&action!=='pass')return;
  const skater=this.skaters[this.selected];
  if(this.puck.owner!==this.selected&&distance(skater.x,skater.y,this.puck.x,this.puck.y)>29)return;
  this.puck.owner=this.selected;skater.carriedFor=0;
  if(action==='shoot'){
   this.shoot(this.selected,clamp(220+(this.rng()-.5)*65,185,255),true);
  }else{
   const teammates=this.skaters.map((s,i)=>({s,i}))
    .filter(a=>a.i<5&&a.i!==this.selected)
    .sort((a,b)=>b.s.x-a.s.x);
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
  this.goalies.forEach(g=>{g.pose='glide';g.poseTime=0;});
  const carrier=team===0?0:5;
  this.puck={x:this.skaters[carrier].x,y:this.skaters[carrier].y,
   vx:0,vy:0,owner:carrier,lock:.55,shotTeam:null,shotHeight:'low',lastShooter:-1};
  this.lastPasser=-1;this.decisionCooldown=[.8,.8];
  this.phase='live';this.phaseTime=0;this.emit('faceoff','FACE OFF',team);
 }
 private release(owner:number,targetX:number,targetY:number,power:number,shot:boolean):void {
  const a=this.skaters[owner],dx=targetX-a.x,dy=targetY-a.y,mag=Math.hypot(dx,dy)||1;
  const nx=dx/mag,ny=dy/mag;
  this.puck.owner=-1;this.puck.x=a.x+nx*24;this.puck.y=a.y+ny*24;
  this.puck.vx=nx*power;this.puck.vy=ny*power;this.puck.lock=.33;
  this.puck.shotTeam=shot?a.team:null;
  this.puck.lastShooter=shot?owner:-1;
  this.puck.shotHeight=this.rng()<.58?'low':'high';
  a.shotAnimation=.3;a.carriedFor=0;
 }
 private shoot(owner:number,targetY:number,user=false):void {
  const a=this.skaters[owner];
  const scatter=(this.rng()-.5)*(user?(85-this.rating.shot*.45):40);
  this.release(owner,a.team===0?786:14,targetY+scatter,user?570+this.rating.shot*1.6:520+this.rng()*90,true);
  this.shots[a.team]++;this.decisionCooldown[a.team]=1.5+this.rng()*.9;
  this.emit('shot',a.team===0?'HOME SHOT':'AWAY SHOT',a.team);
 }
 private pass(owner:number,to:number):void {
  const a=this.skaters[owner],b=this.skaters[to];
  this.release(owner,b.x+b.vx*.42,b.y+b.vy*.42,400+this.rating.handling*.4,false);
  this.puck.lock=.22;this.lastPasser=owner;
  this.decisionCooldown[a.team]=.6;
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
  if(i===first)return {x:this.puck.x,y:this.puck.y};
  if(otherHasPuck){
   if(a.role==='LD'||a.role==='RD')return {x:ownGoal+sign*100,y:lane};
   const interceptX=clamp(this.puck.x-sign*68,ownGoal-260,ownGoal+260);
   return {x:clamp(interceptX,110,690),y:lane};
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
   const accel=controlled?7:4.6;
   a.vx+=(desiredX-a.vx)*Math.min(1,accel*dt);
   a.vy+=(desiredY-a.vy)*Math.min(1,accel*dt);
   // Short-range separation prevents players forming overlapping piles.
   for(let j=0;j<10;j++){
    if(i===j)continue;
    const b=this.skaters[j],r=distance(a.x,a.y,b.x,b.y);
    if(r>0&&r<33){a.vx+=(a.x-b.x)/r*(33-r)*dt*7;a.vy+=(a.y-b.y)/r*(33-r)*dt*7;}
   }
   a.x=clamp(a.x+a.vx*dt,42,758);
   a.y=clamp(a.y+a.vy*dt,43,397);
   if(Math.hypot(a.vx,a.vy)>9)a.heading=Math.atan2(a.vy,a.vx);
   a.shotAnimation=Math.max(0,a.shotAnimation-dt);
   a.carriedFor=this.puck.owner===i?a.carriedFor+dt:0;
  }
  // Controlled goalie stays in the crease. Other goalie tracks the puck.
  for(const g of this.goalies){
   let vy=0,vx=0;
   if(g.team===0&&this.goalieCareer){vx=this.movement.x*(165+this.rating.speed*.45);vy=this.movement.y*(165+this.rating.speed*.45);}
   else {vy=clamp((this.puck.y-g.y)*4,-120,120);}
   g.x=clamp(g.x+vx*dt,g.team===0?65:687,g.team===0?142:729);
   g.y=clamp(g.y+vy*dt,177,263);
   g.poseTime=Math.max(0,g.poseTime-dt);
   if(g.poseTime===0)g.pose='glide';
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
  if(offensive&&(carrier.x>(team===0?560:-Infinity)||carrier.x<(team===1?240:Infinity))){
   this.shoot(owner,clamp(220+(this.rng()-.5)*64,189,251));return;
  }
  if(pressured||carrier.carriedFor>2.4){
   const partners=this.skaters.map((a,i)=>({a,i})).filter(t=>t.a.team===team&&t.i!==owner);
   partners.sort((a,b)=>{
    const aheadA=(a.a.x-carrier.x)*(team===0?1:-1);
    const aheadB=(b.a.x-carrier.x)*(team===0?1:-1);
    return (aheadB+distance(b.a.x,b.a.y,carrier.x,carrier.y)*.1)-(aheadA+distance(a.a.x,a.a.y,carrier.x,carrier.y)*.1);
   });
   if(partners[0])this.pass(owner,partners[0].i);
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
   this.puck.owner=nearest;this.puck.vx=this.puck.vy=0;
   this.puck.shotTeam=null;
   this.puck.lock=.32;
   this.skaters[nearest].carriedFor=0;
  }
 }
 private collideGoalies():void {
  if(this.puck.owner>=0||this.puck.shotTeam===null)return;
  const team=this.puck.shotTeam,defender=team===0?this.goalies[1]:this.goalies[0];
  const nearX=team===0?this.puck.x>=defender.x-25:this.puck.x<=defender.x+25;
  const advancing=team===0?this.puck.vx>0:this.puck.vx<0;
  if(!nearX||!advancing)return;
  const gap=Math.abs(this.puck.y-defender.y);
  const low=this.puck.shotHeight==='low';
  let reach:number;
  if(this.goalieCareer&&defender.team===0){
   reach=defender.pose==='butterfly'?(low?46:9):defender.pose==='blocker'?(!low?40:14):15;
  }else reach=low?29:24;
  if(gap>reach)return;
  const chance=(defender.team===0&&this.goalieCareer)?1:.76;
  if(this.rng()>chance)return;
  const side=team===0?-1:1;
  this.puck.vx=side*Math.max(195,Math.abs(this.puck.vx)*.55);
  this.puck.vy+=(this.puck.y-defender.y)*2+(this.rng()-.5)*135;
  this.puck.x=defender.x+side*27;
  this.puck.shotTeam=null;this.puck.lock=.28;
  if(defender.team===0&&this.goalieCareer)this.saves++;
  defender.pose=low?'butterfly':'blocker';defender.poseTime=.35;
  this.emit('save',defender.team===0?'HOME SAVE!':'AWAY SAVE!',defender.team);
 }
 private stepPuck(dt:number):void {
  if(this.puck.owner>=0){
   const a=this.skaters[this.puck.owner],sign=a.team===0?1:-1;
   this.puck.x=a.x+sign*22;this.puck.y=a.y+7;
   // Stick checks produce occasional loose pucks, not automatic turnovers.
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
  this.puck.x+=this.puck.vx*dt;this.puck.y+=this.puck.vy*dt;
  this.puck.vx*=Math.pow(.996,dt*60);this.puck.vy*=Math.pow(.996,dt*60);
  if(this.puck.y<32||this.puck.y>408){
   this.puck.y=clamp(this.puck.y,32,408);this.puck.vy*=-.68;
  }
  this.collideGoalies();
  if(this.puck.x>=755||this.puck.x<=45){
   const scoringRight=this.puck.x>=755;
   if(Math.abs(this.puck.y-220)<=36){
    const scorer:Team=scoringRight?0:1;
    this.scores[scorer]++;
    if(scorer===0&&!this.goalieCareer&&this.puck.lastShooter===this.selected)this.goals++;
    if(scorer===0&&this.lastPasser>=0&&this.lastPasser!==this.puck.lastShooter)this.assists++;
    this.phase='goal';this.phaseTime=1.5;this.faceoffNext=scorer===0?1:0;
    this.puck.vx=this.puck.vy=0;this.puck.lock=2;
    this.emit('goal',scorer===0?'HOME GOAL!':'AWAY GOAL!',scorer);
    return;
   }
   this.puck.x=clamp(this.puck.x,48,752);this.puck.vx*=-.56;this.puck.shotTeam=null;
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
