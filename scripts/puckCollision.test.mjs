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
const {findGoalieImpact,findGoalFrameImpact}=physics;
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
 const m=setup();shoot(m,175,220);
 assert.equal(m.saves,1);assert.equal(m.scores[1],0);
 assert.ok(m.puck.vx>=0,'the puck must rebound toward the shooter');
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
 for(const [y,z,surface] of [[254,5,'post'],[220,64,'crossbar']]){
  const impact=findGoalFrameImpact(point(105,y,z),point(40,y,z),60,-1);
  assert.equal(impact?.surface,surface);
 }
});
test('shot fully inside the mouth scores; touching post does not',()=>{
 assert.equal(findGoalFrameImpact(point(100,220,8),point(40,220,8),60,-1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(100,247,8),point(40,247,8),60,-1)?.surface,'post');
 assert.notEqual(findGoalFrameImpact(point(100,275,8),point(40,275,8),60,-1)?.surface,'goal');
});
test('shots above crossbar and outside the posts cannot score',()=>{
 assert.notEqual(findGoalFrameImpact(point(100,220,85),point(40,220,85),60,-1)?.surface,'goal');
 assert.notEqual(findGoalFrameImpact(point(100,285,8),point(40,285,8),60,-1)?.surface,'goal');
});
test('right-side goal mirrors left-side goal',()=>{
 assert.equal(findGoalFrameImpact(point(695,220,8),point(760,220,8),740,1)?.surface,'goal');
 assert.equal(findGoalFrameImpact(point(695,254,8),point(760,254,8),740,1)?.surface,'post');
});
test('outside mesh contact is not a goal',()=>{
 const hit=findGoalFrameImpact(point(110,269,9),point(43,269,9),60,-1);
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
