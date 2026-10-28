/** Continuous puck-versus-equipment and goal-frame collision geometry.
 * Rink coordinates: x along ice, y across ice, z above ice.
 * All shapes are defined in world units. The camera must project these same units.
 */
export interface PuckPoint {x:number;y:number;z:number}
export type SaveSurface='stick'|'pads'|'body'|'mask'|'glove'|'blocker';
export interface GoalieCollider {
 x:number;y:number;team:0|1;stance:number;
 saveHand:'glove'|'blocker'|null;saveReach:number;
}
export interface SweepHit {time:number;normal:PuckPoint}
export interface EquipmentHit extends SweepHit {surface:SaveSurface;point:PuckPoint}
export type GoalSurface='post'|'crossbar'|'mesh'|'goal';
export interface GoalHit extends SweepHit {surface:GoalSurface;point:PuckPoint}
interface Box {min:PuckPoint;max:PuckPoint}
export const PUCK_RADIUS=3;
export const GOAL_HALF_WIDTH=34;
export const GOAL_HEIGHT=64;
export const POST_RADIUS=4;
const EPS=1e-8;
const at=(a:PuckPoint,b:PuckPoint,t:number):PuckPoint=>({
 x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t
});
const box=(x0:number,x1:number,y0:number,y1:number,z0:number,z1:number):Box=>({
 min:{x:Math.min(x0,x1),y:Math.min(y0,y1),z:Math.min(z0,z1)},
 max:{x:Math.max(x0,x1),y:Math.max(y0,y1),z:Math.max(z0,z1)}
});
/** Slab-based segment sweep against box expanded by puck radius.
 * Returns the first collision within the frame, even if the puck travels
 * completely through a thin surface before the frame finishes.
 */
export function sweepPuckBox(a:PuckPoint,b:PuckPoint,target:Box,radius=PUCK_RADIUS):SweepHit|null {
 let enter=0,leave=1;let normal:PuckPoint={x:0,y:0,z:0};
 const delta={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
 const keys=['x','y','z'] as const;
 let inside=true;
 for(const k of keys){
  const low=target.min[k]-radius,high=target.max[k]+radius;
  if(a[k]<low||a[k]>high)inside=false;
  const v=delta[k];
  if(Math.abs(v)<EPS){if(a[k]<low||a[k]>high)return null;continue;}
  const near=(v>0?low:high)-a[k],far=(v>0?high:low)-a[k];
  const tNear=near/v,tFar=far/v;
  if(tNear>enter){
   enter=tNear;normal={x:0,y:0,z:0};normal[k]=v>0?-1:1;
  }
  leave=Math.min(leave,tFar);
  if(enter>leave)return null;
 }
 if(leave<0||enter>1)return null;
 if(inside){
  // If a shot starts slightly inside a surface, still react rather than tunnel.
  const dominant=keys.reduce((best,k)=>Math.abs(delta[k])>Math.abs(delta[best])?k:best,'x' as typeof keys[number]);
  normal={x:0,y:0,z:0};normal[dominant]=delta[dominant]>=0?-1:1;
  return {time:0,normal};
 }
 if(normal.x===0&&normal.y===0&&normal.z===0)return null;
 return {time:Math.max(0,enter),normal};
}
export function findGoalieImpact(a:PuckPoint,b:PuckPoint,g:GoalieCollider):EquipmentHit|null {
 const facing=g.team===0?1:-1,drop=Math.max(0,Math.min(1,g.stance));
 const shapes:{surface:SaveSurface;volume:Box}[]=[];
 // A low stick is well ahead of the body, with a small lateral footprint.
 shapes.push({surface:'stick',volume:box(g.x+facing*13,g.x+facing*54,g.y-11,g.y+11,0,6)});
 // Individual body regions never depend on a random save percentage.
 shapes.push({surface:'pads',volume:box(g.x-15,g.x+15,g.y-(19+23*drop),g.y+(19+23*drop),0,20)});
 shapes.push({surface:'body',volume:box(g.x-13,g.x+13,g.y-17,g.y+17,17,61)});
 shapes.push({surface:'mask',volume:box(g.x-11,g.x+11,g.y-12,g.y+12,61,83)});
 if(g.saveReach>.05&&g.saveHand){
  const reach=Math.max(0,Math.min(1,g.saveReach));
  const side=g.saveHand==='glove'?-1:1;
  const centerY=g.y+side*(25+reach*14);
  shapes.push({surface:g.saveHand,volume:box(g.x-12,g.x+facing*23,centerY-12,centerY+12,23,52+23*reach)});
 }
 let best:EquipmentHit|null=null;
 for(const item of shapes){
  const hit=sweepPuckBox(a,b,item.volume);
  if(!hit)continue;
  if(!best||hit.time<best.time-EPS){
   best={...hit,surface:item.surface,point:at(a,b,hit.time)};
  }
 }
 return best;
}
/** Goal contact uses the same coordinates and puck radius as goalie contact.
 * The posts/crossbar take precedence over a goal when a shot grazes metal.
 * direction=+1 for the right net; -1 for the left net.
 */
export function findGoalFrameImpact(a:PuckPoint,b:PuckPoint,goalX:number,direction:1|-1):GoalHit|null {
 const travel=b.x-a.x;
 if(travel*direction<=EPS)return null;
 const metal:{surface:'post'|'crossbar';volume:Box}[]=[
  {surface:'post',volume:box(goalX-POST_RADIUS,goalX+POST_RADIUS,
   220-GOAL_HALF_WIDTH-POST_RADIUS,220-GOAL_HALF_WIDTH+POST_RADIUS,0,GOAL_HEIGHT)},
  {surface:'post',volume:box(goalX-POST_RADIUS,goalX+POST_RADIUS,
   220+GOAL_HALF_WIDTH-POST_RADIUS,220+GOAL_HALF_WIDTH+POST_RADIUS,0,GOAL_HEIGHT)},
  {surface:'crossbar',volume:box(goalX-POST_RADIUS,goalX+POST_RADIUS,
   220-GOAL_HALF_WIDTH,220+GOAL_HALF_WIDTH,
   GOAL_HEIGHT-POST_RADIUS,GOAL_HEIGHT+POST_RADIUS)}
 ];
 let best:GoalHit|null=null;
 for(const item of metal){
  const hit=sweepPuckBox(a,b,item.volume);
  if(hit&&(!best||hit.time<best.time)){
   best={...hit,surface:item.surface,point:at(a,b,hit.time)};
  }
 }
 // The back edge of the puck must cross the goal line, not merely touch it.
 const scorePlane=goalX+direction*PUCK_RADIUS;
 const t=(scorePlane-a.x)/travel;
 if(t>=0&&t<=1){
  const point=at(a,b,t);
  const clearWidth=GOAL_HALF_WIDTH-POST_RADIUS-PUCK_RADIUS;
  const clearHeight=GOAL_HEIGHT-POST_RADIUS-PUCK_RADIUS;
  if(Math.abs(point.y-220)<clearWidth&&point.z>=0&&point.z<clearHeight){
   if(!best||t<best.time)return {surface:'goal',time:t,normal:{x:-direction,y:0,z:0},point};
  }
 }
 // A near-post miss can still strike the outside net mesh instead of scoring.
 const meshPlane=goalX+direction*12,meshTime=(meshPlane-a.x)/travel;
 if(meshTime>=0&&meshTime<=1){
  const point=at(a,b,meshTime),gap=Math.abs(point.y-220);
  if(gap>=GOAL_HALF_WIDTH+POST_RADIUS+PUCK_RADIUS&&gap<GOAL_HALF_WIDTH+20&&point.z<GOAL_HEIGHT){
   if(!best||meshTime<best.time)return {surface:'mesh',time:meshTime,normal:{x:-direction,y:0,z:0},point};
  }
 }
 return best;
}

/** Hockey players intercept shots with physical bodies and sticks, even during
 * temporary pickup locks. A moving puck must not tunnel through a defender.
 */
export interface SkaterCollider {x:number;y:number;team:0|1}
export interface SkaterHit extends SweepHit {surface:'body'|'stick';point:PuckPoint}
export function findSkaterImpact(a:PuckPoint,b:PuckPoint,s:SkaterCollider):SkaterHit|null {
 const face=s.team===0?1:-1;
 const bodies:{surface:'body'|'stick';volume:Box}[]=[
  {surface:'body',volume:box(s.x-11,s.x+11,s.y-14,s.y+14,0,49)},
  {surface:'stick',volume:box(s.x+face*16,s.x+face*35,s.y-9,s.y+9,0,7)}
 ];
 let earliest:SkaterHit|null=null;
 for(const region of bodies){
  const hit=sweepPuckBox(a,b,region.volume);
  if(hit&&(!earliest||hit.time<earliest.time))earliest={...hit,surface:region.surface,point:at(a,b,hit.time)};
 }
 return earliest;
}
