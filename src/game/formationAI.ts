/** Ice-space positioning independent of camera and animation.
 * x=0..800 down rink; y=0..440 across the ice. */
export type SkaterRole='C'|'LW'|'RW'|'LD'|'RD';
export type RinkPoint={x:number;y:number};
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const lanes:Record<SkaterRole,number>={C:220,LW:92,RW:348,LD:142,RD:298};
/** Each of five roles has its own lane and depth, avoiding convergent chase targets. */
export function supportPosition(role:SkaterRole,team:0|1,carrier:RinkPoint,attacking:boolean):RinkPoint {
 const direction=team===0?1:-1;
 const lane=lanes[role],center=220;
 const forward=role==='C'||role==='LW'||role==='RW';
 if(attacking){
  const depth=role==='C'?42:forward?95:-190;
  const x=clamp(carrier.x+direction*depth,100,700);
  const y=role==='C'?clamp(center+(carrier.y-center)*.16,185,255):lane;
  return {x,y};
 }
 // Defensive support: wingers recover toward the boards, centre protects
 // the central passing lane, and the two defenders form a staggered pair.
 const home=team===0?92:708;
 const depth=role==='LD'?145:role==='RD'?110:role==='C'?215:forward?260:180;
 return {x:clamp(home+direction*depth,110,690),y:role==='C'?220:lane};
}
/** Occupancy safety valve for non-puck carriers.
 * Offsets are bounded so skaters keep their assigned role/zone. */
export function separateFormation(target:RinkPoint,self:RinkPoint,teammates:readonly RinkPoint[]):RinkPoint{
 let dx=0,dy=0;
 for(const other of teammates){
  const x=self.x-other.x,y=self.y-other.y;
  const dist=Math.hypot(x,y);
  if(dist>=85)continue;
  if(dist<.01){dy+=24;continue;}
  const force=(85-dist)/85;
  dx+=x/dist*force*34;dy+=y/dist*force*39;
 }
 return {x:clamp(target.x+clamp(dx,-40,40),85,715),y:clamp(target.y+clamp(dy,-50,50),55,385)};
}

/** Pick an actual empty receiving lane instead of blindly following the puck.
 * Retains the player's role lane, but steps away from a nearby opponent.
 */
export function openPassingLane(role:SkaterRole,base:RinkPoint,defenders:readonly RinkPoint[]):RinkPoint{
 if(role==='LD'||role==='RD')return base;
 const offsets=role==='C'?[0,-45,45,-82,82]:role==='LW'?[0,34,-24,65]:[0,-34,24,-65];
 let best=base,bestScore=-Infinity;
 for(const offset of offsets){
  const y=clamp(base.y+offset,55,385),candidate={x:base.x,y};
  const clearance=Math.min(180,...defenders.map(d=>Math.hypot((d.x-candidate.x)*.9,d.y-candidate.y)));
  const score=clearance-Math.abs(offset)*.35;
  if(score>bestScore){bestScore=score;best=candidate;}
 }
 return best;
}
