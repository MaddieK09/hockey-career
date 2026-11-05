/** Shared, deterministic hockey decisions: no camera, DOM, or random teleports. */
export interface HockeyPoint {x:number;y:number;vx?:number;vy?:number}
export interface HockeyAISkater extends HockeyPoint {team:0|1;role:string}
const clamp=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
const dist=(a:HockeyPoint,b:HockeyPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
/** Select one puck presser, preferring nearby forwards but allowing a defender to
 * clear a dangerous loose puck within their own zone. */
export function puckPresser(skaters:readonly HockeyAISkater[],team:0|1,puck:HockeyPoint):number{
 let best=-1,score=Infinity;
 for(let i=0;i<skaters.length;i++){
  const s=skaters[i];if(s.team!==team)continue;
  const defensive=team===0?puck.x<300:puck.x>500;
  const defender=s.role==='LD'||s.role==='RD';
  const penalty=defender&&!defensive?75:0;
  const travel=dist(s,puck)/(Math.max(95,175+Math.hypot(s.vx??0,s.vy??0)*.1));
  const value=travel*100+penalty;
  if(value<score){score=value;best=i;}
 }
 return best;
}
/** Cover the center of the defensive slot when possession is in the zone.
 * Unlike chasing the puck, this retains a passing/shooting-lane blocker. */
export function defensiveCoverage(role:string,team:0|1,puck:HockeyPoint,carrier:HockeyPoint|null):HockeyPoint{
 const home=team===0?95:705,dir=team===0?1:-1;
 const attack=carrier??puck;
 const danger=team===0?attack.x<350:attack.x>450;
 if(!danger){
  const depth=role==='LD'?160:role==='RD'?176:role==='C'?265:325;
  const lane=role==='LD'?155:role==='RD'?285:role==='LW'?98:role==='RW'?342:220;
  return {x:clamp(home+dir*depth,90,710),y:lane};
 }
 const defending=role==='LD'||role==='RD';
 const targetY=defending?(role==='LD'?180:260):role==='C'?220:role==='LW'?118:322;
 const x=home+dir*(defending?128:role==='C'?173:225);
 return {x:clamp(x,90,710),y:clamp(targetY+(attack.y-220)*(defending?.16:.11),65,375)};
}
/** Return pass safety along the full segment; defenders near any point of the
 * trajectory lower its value, not only defenders near the receiver. */
export function laneClearance(from:HockeyPoint,to:HockeyPoint,defenders:readonly HockeyPoint[]):number{
 const dx=to.x-from.x,dy=to.y-from.y,length2=Math.max(1,dx*dx+dy*dy);
 let clear=200;
 for(const d of defenders){
  const t=clamp(((d.x-from.x)*dx+(d.y-from.y)*dy)/length2,0,1);
  const gap=Math.hypot(d.x-(from.x+dx*t),d.y-(from.y+dy*t));
  clear=Math.min(clear,gap);
 }
 return clear;
}
export function choosePassTarget(owner:number,skaters:readonly HockeyAISkater[]):number|null{
 const carrier=skaters[owner];if(!carrier)return null;
 const dir=carrier.team===0?1:-1,defenders=skaters.filter(s=>s.team!==carrier.team);
 let best:number|null=null,score=-Infinity;
 for(let i=0;i<skaters.length;i++){
  const s=skaters[i];if(i===owner||s.team!==carrier.team)continue;
  const length=dist(carrier,s);
  if(length<55||length>380)continue;
  const clearance=laneClearance(carrier,s,defenders);
  const ahead=(s.x-carrier.x)*dir;
  const positionPenalty=(s.role==='LD'||s.role==='RD')&&ahead>0?16:0;
  const value=clearance*.9+ahead*.25-length*.12-positionPenalty;
  if(value>score){score=value;best=i;}
 }
 return best;
}
export function shootingLane(carrier:HockeyPoint,team:0|1,targetY:number,opponents:readonly HockeyPoint[]):boolean{
 const goalX=team===0?740:60;
 return laneClearance(carrier,{x:goalX,y:targetY},opponents)>23;
}
/** Predict puck arrival into the goalie's lane, then blend toward center so
 * far-side passes do not trick a goalie into leaving the posts entirely. */
export function goalieTrackY(goalie:HockeyPoint,team:0|1,puck:HockeyPoint,carrier:HockeyPoint|null):number{
 const source=carrier??puck;
 const closing=team===0?(puck.vx??0)<-20:(puck.vx??0)>20;
 const horizon=closing?Math.min(.42,Math.abs((goalie.x-puck.x)/Math.max(140,Math.abs(puck.vx??0)))):0;
 const incoming=clamp(puck.y+(puck.vy??0)*horizon,162,278);
 const desired=closing?incoming:clamp(source.y,162,278);
 return clamp(220+(desired-220)*(closing?.94:.72),168,272);
}
