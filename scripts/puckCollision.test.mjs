import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';

// Compile the actual game TypeScript without mocks: this prevents a green
// geometry-only test from hiding a bug in the match engine integration.
async function loadTS(entry){
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',target:'es2022',write:false,logLevel:'silent'});
 const code=Buffer.from(result.outputFiles[0].text).toString('base64');
 return import('data:text/javascript;base64,'+code);
}
const physics=await loadTS('src/game/puckCollision.ts');
const {HockeyMatch}=await loadTS('src/game/hockeyMatchEngine.ts');
const {findGoalieImpact,findGoalFrameImpact,findSkaterImpact,GOAL_HALF_WIDTH,GOAL_HEIGHT,POST_RADIUS,PUCK_RADIUS}=physics;
const point=(x,y,z=3)=>({x,y,z});
const home={x:91,y:220,team:0,stance:0,saveHand:null,saveReach:0};
const incoming=(y=220,z=3)=>[point(160,y,z),point(40,y,z)];
const setup=()=>{
 const m=new HockeyMatch(true,{speed:50,shot:50,handling:50,defense:50},()=>.5,5);
 m.goalies[0].x=91;m.goalies[0].y=220;
 m.puck.owner=-1;m.puck.lock=.5;m.puck.shotTeam=1;m.puck.lastShooter=5;
 m.puck.height=3;m.puck.vz=0;m.puck.vx=-700;m.puck.vy=0;
 m.puck.x=175;m.puck.y=220;
 return m;
};
const shoot=(m,fromX,y,z=3,vx=-700,vy=0)=>{
 m.puck.x=fromX;m.puck.y=y;m.puck.height=z;m.puck.vz=0;
 m.puck.vx=vx;m.puck.vy=vy;
 for(let i=0;i<25&&m.phase==='live';i++)m.stepPuck(.02);
};
test('direct low shot touches equipment, returns as save and never scores',()=>{
 const m=setup();m.puck.x=175;m.puck.y=220;
 for(let i=0;i<16&&m.saves===0;i++)m.stepPuck(.02);
 assert.equal(m.saves,1);assert.equal(m.scores[1],0);
 assert.ok(m.puck.vx>0,'the first rebound must travel back toward the shooter');
});
test('diagonal fast puck cannot tunnel through the goalie',()=>{
 const g={...home,saveHand:null};
 const impact=findGoalieImpact(point(165,244,5),point(35,215,5),g);
 assert.ok(impact,'swept travel must hit the equipment between frames');
});
test('centered butterfly seals low corners that standing pads leave open',()=>{
 const [a,b]=incoming(245,4);
 assert.equal(findGoalieImpact(a,b,home),null,'standing pad should not save a true corner');
 assert.equal(findGoalieImpact(a,b,{...home,stance:1})?.surface,'pads');
});
test('raising glove extends high catching region',()=>{
 const a=point(150,183,55),b=point(65,183,55);
 assert.equal(findGoalieImpact(a,b,home),null);
 assert.equal(findGoalieImpact(a,b,{...home,saveHand:'glove',saveReach:1})?.surface,'glove');
});
test('shot into open home goal scores when goalie is displaced',()=>{
 const m=setup();m.goalies[0].y=320;
 shoot(m,160,220);
 assert.equal(m.scores[1],1);assert.equal(m.phase,'goal');
});
test('post and crossbar bounce instead of goals',()=>{
 for(const [y,z,surface] of [[220+GOAL_HALF_WIDTH,5,'post'],[220,GOAL_HEIGHT,'crossbar']]){
  const impact=findGoalFrameImpact(point(105,y,z),point(40,y,z),60,-1);
  assert.equal(impact?.surface,surface);
 }
});
test('shot fully inside the mouth scores; touching post does not',()=>{
 assert.equal(findGoalFrameImpact(point(100,220,8),point(40,220,8),60,-1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(100,220+GOAL_HALF_WIDTH,8),point(40,220+GOAL_HALF_WIDTH,8),60,-1)?.surface,'post');
 assert.notEqual(findGoalFrameImpact(point(100,220+GOAL_HALF_WIDTH+26,8),point(40,220+GOAL_HALF_WIDTH+26,8),60,-1)?.surface,'goal');
});
test('shots above crossbar and outside the posts cannot score',()=>{
 assert.notEqual(findGoalFrameImpact(point(100,220,85),point(40,220,85),60,-1)?.surface,'goal');
 assert.notEqual(findGoalFrameImpact(point(100,285,8),point(40,285,8),60,-1)?.surface,'goal');
});
test('right-side goal mirrors left-side goal',()=>{
 assert.equal(findGoalFrameImpact(point(695,220,8),point(760,220,8),740,1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(695,220+GOAL_HALF_WIDTH,8),point(760,220+GOAL_HALF_WIDTH,8),740,1)?.surface,'post');
});
test('outside mesh contact is not a goal',()=>{
 const hit=findGoalFrameImpact(point(110,220+GOAL_HALF_WIDTH+15,9),point(43,220+GOAL_HALF_WIDTH+15,9),60,-1);
 assert.equal(hit?.surface,'mesh');
});
test('a real shot near home top corner scores unless butterfly pad blocks it',()=>{
 const m=setup();m.puck.y=245;
 shoot(m,160,245);
 assert.equal(m.scores[1],1);
 const b=setup();b.goalies[0].stance=1;b.goalies[0].pose='butterfly';
 shoot(b,160,245);
 assert.equal(b.scores[1],0);assert.equal(b.saves,1);
});

test('fast shots collide with skater bodies even with puck pickup locked',()=>{
 const body={x:145,y:220,team:0};
 assert.ok(findSkaterImpact(point(175,220,5),point(100,220,5),body));
 const m=setup();m.skaters[3].x=145;m.skaters[3].y=220;
 shoot(m,175,220);
 assert.equal(m.scores[1],0);
 assert.equal(m.saves,0,'a skater block is not a goalie save');
 assert.ok(m.message.includes('BLOCKED')||m.message.includes('DEFLECTION'));
});
test('shots over a skater can continue without phantom body contact',()=>{
 const skater={x:145,y:220,team:0};
 assert.equal(findSkaterImpact(point(175,220,85),point(100,220,85),skater),null);
});

test('wider net has a real open corner outside the butterfly pads',()=>{
 const lateral=220+GOAL_HALF_WIDTH-POST_RADIUS-PUCK_RADIUS-5;
 assert.ok(lateral>220+35,'net is wider than even the extended butterfly');
 const [a,b]=incoming(lateral,6);
 assert.equal(findGoalieImpact(a,b,{...home,stance:1}),null,
  'a puck in the open corner must not count as a pad save');
 assert.equal(findGoalFrameImpact(point(100,lateral,6),point(40,lateral,6),60,-1)?.surface,'goal',
  'a fully clear shot just inside the post is a goal');
});
test('goal width, crossbar and metal contact remain synchronized',()=>{
 const yInside=220+GOAL_HALF_WIDTH-POST_RADIUS-PUCK_RADIUS-1;
 const zInside=GOAL_HEIGHT-POST_RADIUS-PUCK_RADIUS-1;
 assert.equal(findGoalFrameImpact(point(100,yInside,12),point(40,yInside,12),60,-1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(100,220,zInside),point(40,220,zInside),60,-1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(100,220+GOAL_HALF_WIDTH,12),point(40,220+GOAL_HALF_WIDTH,12),60,-1)?.surface,'post');
 assert.equal(findGoalFrameImpact(point(100,220,GOAL_HEIGHT),point(40,220,GOAL_HEIGHT),60,-1)?.surface,'crossbar');
});

test('fictional league has unique original clubs and no duplicate abbreviations',async()=>{
 const {LEAGUE_TEAMS}=await loadTS('src/game/fictionalLeague.ts');
 assert.equal(LEAGUE_TEAMS.length,8);
 assert.equal(new Set(LEAGUE_TEAMS.map(t=>t.id)).size,8);
 assert.equal(new Set(LEAGUE_TEAMS.map(t=>t.abbr)).size,8);
 for(const t of LEAGUE_TEAMS){assert.match(t.primary,/^#[0-9a-f]{6}$/i);assert.match(t.accent,/^#[0-9a-f]{6}$/i);}
});
test('fictional league fixture rotation never schedules your own club',async()=>{
 const {LEAGUE_TEAMS,nextOpponent}=await loadTS('src/game/fictionalLeague.ts');
 for(const t of LEAGUE_TEAMS){
  const opponents=Array.from({length:7},(_,i)=>nextOpponent(t.id,i));
  assert.equal(new Set(opponents.map(x=>x.id)).size,7);
  assert.ok(opponents.every(x=>x.id!==t.id));
  assert.equal(nextOpponent(t.id,7).id,opponents[0].id);
 }
});

test('AI shots reset the shot clock instead of becoming rapid-fire spam',()=>{
 const m=new HockeyMatch(true,{speed:50,shot:50,handling:50,defense:50},()=>.5,5);
 m.skaters[5].x=245;m.skaters[5].y=220;
 m.puck.owner=5;
 m.shoot(5,220);
 assert.ok(m.shotClock[1]>=20,'a fresh shot should require another offensive build-up');
 assert.equal(m.shots[1],1);
});
test('a new faceoff starts a nonzero shot build-up interval',()=>{
 const m=new HockeyMatch(true,{speed:50,shot:50,handling:50,defense:50},()=>.5,5);
 m.shotClock=[0,0];m.resetFaceoff(1);
 assert.ok(m.shotClock[0]>0&&m.shotClock[1]>0);
});
