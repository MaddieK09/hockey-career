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

test('formation AI gives five players separated attacking lanes and depth',async()=>{
 const {supportPosition}=await loadTS('src/game/formationAI.ts');
 const carry={x:485,y:220},roles=['C','LW','RW','LD','RD'];
 const spots=roles.map(role=>supportPosition(role,0,carry,true));
 assert.ok(spots[1].y<150&&spots[2].y>290,'wings should occupy opposite wide lanes');
 assert.ok(spots[3].x<spots[0].x&&spots[4].x<spots[0].x,'defenders should support behind forwards');
 assert.ok(spots[0].y>180&&spots[0].y<260,'centre stays inside high slot');
 assert.ok(spots.every(p=>p.x>=85&&p.x<=715&&p.y>=55&&p.y<=385));
});
test('formation preserves opposite-board support on both teams',async()=>{
 const {supportPosition}=await loadTS('src/game/formationAI.ts');
 for(const team of [0,1]){
  const x=team===0?510:290;
  const lw=supportPosition('LW',team,{x,y:220},true);
  const rw=supportPosition('RW',team,{x,y:220},true);
  assert.ok(Math.abs(lw.y-rw.y)>=200);
 }
});
test('separation steers away from overlap without abandoning rink limits',async()=>{
 const {separateFormation}=await loadTS('src/game/formationAI.ts');
 const t=separateFormation({x:520,y:220},{x:510,y:210},[{x:511,y:212}]);
 assert.ok(t.x<520&&t.y<220);
 const safe=separateFormation({x:100,y:55},{x:100,y:55},[{x:100,y:55}]);
 assert.ok(safe.y>=55&&safe.x>=85);
});

test('uncredited loose puck goal increases both score and shots on goal',()=>{
 const m=setup();m.liveSinceFaceoff=6;
 m.puck.owner=-1;m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.countedShotTeam=null;
 const before=m.shots[1];
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.equal(m.scores[1],1);
 assert.equal(m.shots[1],before+1);
});
test('credited direct shot goal does not count the same shot twice',()=>{
 const m=setup();
 m.puck.owner=-1;m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.shots[1]=1;m.puck.countedShotTeam=1;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.equal(m.shots[1],1);
 assert.equal(m.scores[1],1);
});
test('a rebounded goal retains its originating shot credit',()=>{
 const m=setup();
 m.puck.owner=-1;m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.shotTeam=null;m.puck.countedShotTeam=1;
 m.shots[1]=1;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.equal(m.scores[1],1);
 assert.equal(m.shots[1],1);
});
test('goal totals cannot exceed SOG even with stale counters',()=>{
 const m=setup();
 m.scores[1]=2;m.shots[1]=0;
 m.puck.owner=-1;m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.countedShotTeam=1;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.ok(m.shots[1]>=m.scores[1]);
});

test('attacking forwards select open lanes rather than skating into defenders',async()=>{
 const {openPassingLane}=await loadTS('src/game/formationAI.ts');
 const base={x:560,y:220};
 const chosen=openPassingLane('C',base,[{x:560,y:220},{x:570,y:240}]);
 assert.notEqual(chosen.y,220);
 assert.ok(chosen.y>=55&&chosen.y<=385);
});
test('open-lane selection leaves a clear receiving option unchanged',async()=>{
 const {openPassingLane}=await loadTS('src/game/formationAI.ts');
 assert.deepEqual(openPassingLane('RW',{x:520,y:348},[{x:600,y:100}]),{x:520,y:348});
});
test('defensemen keep point assignments instead of wandering after defenders',async()=>{
 const {openPassingLane}=await loadTS('src/game/formationAI.ts');
 for(const role of ['LD','RD'])assert.deepEqual(openPassingLane(role,{x:340,y:150},[{x:340,y:150}]),{x:340,y:150});
});

test('unshot loose puck cannot score two seconds after faceoff',()=>{
 const m=setup();m.puck.owner=-1;
 m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.shotTeam=null;m.puck.countedShotTeam=null;
 m.liveSinceFaceoff=2;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.deepEqual(m.scores,[0,0]);
 assert.ok(m.puck.vx>0,'the puck must rebound back into the rink');
});
test('genuine shot still scores near a faceoff',()=>{
 const m=setup();m.puck.owner=-1;
 m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.shotTeam=1;m.puck.countedShotTeam=1;
 m.liveSinceFaceoff=2;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.equal(m.scores[1],1);
});
test('AI cannot shoot before new faceoff build-up ends',()=>{
 const m=setup();m.resetFaceoff(1);
 m.skaters[5].x=245;m.skaters[5].y=220;
 m.puck.owner=5;m.skaters[5].carriedFor=4;
 m.shotClock[1]=0;m.decisionCooldown[1]=0;
 m.liveSinceFaceoff=2;
 m.aiDecisions(.02);
 assert.equal(m.shots[1],0);
});
test('later loose puck crossing can still score and count shot',()=>{
 const m=setup();m.puck.owner=-1;
 m.puck.x=40;m.puck.y=220;m.puck.height=8;
 m.puck.shotTeam=null;m.puck.countedShotTeam=null;
 m.liveSinceFaceoff=7;
 assert.equal(m.resolveGoalPlane(100,220,8),true);
 assert.equal(m.scores[1],1);
 assert.ok(m.shots[1]>=m.scores[1]);
});

test('October–April schedule has eight balanced meetings per pair and no same-day conflicts',async()=>{
 const {newSeason}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('northport');
 assert.equal(s.fixtures.length,224);
 const pairings=new Map();
 for(const f of s.fixtures){
  assert.notEqual(f.homeId,f.awayId);
  const key=[f.homeId,f.awayId].sort().join('|');
  pairings.set(key,(pairings.get(key)||0)+1);
  const dayGames=s.fixtures.filter(x=>x.day===f.day&&(x.homeId===f.homeId||x.awayId===f.homeId));
  assert.equal(dayGames.length,1);
 }
 assert.equal(pairings.size,28);
 assert.ok([...pairings.values()].every(v=>v===8));
 const allDates=new Set(s.fixtures.map(f=>f.day));
 assert.equal(allDates.size,56);
 assert.ok(Math.max(...allDates)===196);
 assert.ok(s.fixtures.every(f=>f.day>=0&&f.day<=196));
});
test('simulating a chosen date is deterministic, monotonic, and never overwrites played results',async()=>{
 const {newSeason,simulateThrough,recordUserResult,nextUserFixture}=await loadTS('src/game/seasonLeague.ts');
 const a=newSeason('northport'),b=newSeason('northport');
 const first=nextUserFixture(a);
 recordUserResult(a,first,4,1);
 const r=simulateThrough(a,12),other=simulateThrough(b,12);
 assert.equal(a.fixtures.find(f=>f.id===first.id).homeGoals,4);
 assert.equal(a.fixtures.find(f=>f.id===first.id).played,true);
 assert.equal(other.games,r.games+1);
 const saved=JSON.stringify(a.fixtures);
 assert.equal(simulateThrough(a,12).games,0);
 assert.equal(JSON.stringify(a.fixtures),saved);
 assert.equal(a.day,12);
 assert.equal(b.day,12);
});
test('season standings agree with fixture results and bot points sum correctly',async()=>{
 const {newSeason,simulateThrough,leagueStandings,botStats,MAX_SEASON_DAY}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('lakehaven');simulateThrough(s,MAX_SEASON_DAY);
 const table=leagueStandings(s),bots=botStats(s);
 assert.equal(table.length,8);
 assert.ok(table.every(t=>t.gp===56&&t.pts===t.w*2&&t.w+t.l===t.gp));
 assert.equal(table.reduce((n,t)=>n+t.w,0),224);
 assert.equal(table.reduce((n,t)=>n+t.gf,0),table.reduce((n,t)=>n+t.ga,0));
 assert.ok(bots.every(p=>p.points===p.goals+p.assists&&p.gp===56));
});
test('season date calculation clamps to valid future days',async()=>{
 const {newSeason,dateAt,seasonDay}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('ironvale','2026-10-30');
 assert.equal(dateAt(s,0),'2026-10-30');
 assert.equal(seasonDay('2026-11-09',s.startDate),10);
 assert.equal(seasonDay('2026-01-01',s.startDate),0);
});

test('new season begins October 1 and finishes April 15 with visible T/R days',async()=>{
 const {newSeason,dateAt,dayPlan,MAX_SEASON_DAY,SEASON_START_DATE,SEASON_END_DATE}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('northport');
 assert.equal(dateAt(s,0),SEASON_START_DATE);
 assert.equal(dateAt(s,MAX_SEASON_DAY),SEASON_END_DATE);
 assert.equal(MAX_SEASON_DAY,196);
 assert.equal(dayPlan(s,0).kind,'game');
 assert.equal(dayPlan(s,1).kind,'rest');
 assert.equal(dayPlan(s,2).kind,'training');
 const matchDays=Array.from({length:MAX_SEASON_DAY+1},(_,i)=>dayPlan(s,i)).filter(d=>d.kind==='game');
 assert.equal(matchDays.length,56);
 assert.ok(matchDays.every(d=>d.fixture?.homeId===s.teamId||d.fixture?.awayId===s.teamId));
});
test('day-by-day sim advances exactly one day and reveals scores on game dates only',async()=>{
 const {newSeason,simulateThrough,dayPlan,dateAt}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('northport');
 assert.equal(dayPlan(s,0).fixture?.homeGoals,undefined);
 const day0=simulateThrough(s,0);
 assert.equal(day0.games,4);
 assert.equal(s.day,0);
 const day1=simulateThrough(s,1);
 assert.equal(day1.games,0);
 assert.equal(s.day,1);
 const next=s.fixtures.find(f=>f.day>0);
 assert.ok(next);
 assert.equal(next.homeGoals,undefined);
 for(let day=2;day<=next.day;day++)simulateThrough(s,day);
 assert.ok(next.homeGoals!==undefined&&next.awayGoals!==undefined);
 assert.equal(dateAt(s,s.day).slice(0,7),'2026-10');
 const prior=JSON.stringify(s.fixtures);
 assert.equal(simulateThrough(s,s.day).games,0);
 assert.equal(JSON.stringify(s.fixtures),prior,'re-simulation never overwrites final scores');
});
test('legacy PR100 seasons retain previously simulated and played results in migration',async()=>{
 const {newSeason,normalizeSeason}=await loadTS('src/game/seasonLeague.ts');
 const full=newSeason('northport');
 const first14=full.fixtures.filter(f=>Number(f.id.split('-')[0].slice(1))<14).map(f=>({...f}));
 assert.equal(first14.length,56);
 const original=first14.find(f=>f.id==='R0-0');
 original.homeGoals=4;original.awayGoals=2;original.played=true;
 const original2=first14.find(f=>f.id==='R7-0');
 original2.homeGoals=1;original2.awayGoals=5;original2.played=false;
 const old={version:1,startDate:'2026-10-30',day:31,teamId:'northport',fixtures:first14};
 const migrated=normalizeSeason(old,'northport');
 assert.equal(migrated.version,2);
 assert.equal(migrated.startDate,'2026-10-01');
 assert.equal(migrated.fixtures.length,224);
 assert.equal(migrated.fixtures.find(f=>f.id==='R0-0').homeGoals,4);
 assert.equal(migrated.fixtures.find(f=>f.id==='R7-0').awayGoals,5);
 assert.equal(migrated.fixtures.find(f=>f.id==='R0-0').played,true);
 assert.equal(normalizeSeason(migrated,'northport').fixtures.length,224);
});
test('home and away balance is four games each against every opponent',async()=>{
 const {newSeason}=await loadTS('src/game/seasonLeague.ts');
 const s=newSeason('lakehaven');
 for(const team of new Set(s.fixtures.flatMap(f=>[f.homeId,f.awayId]))){
  const opponents=new Set(s.fixtures.filter(f=>f.homeId===team||f.awayId===team)
   .map(f=>f.homeId===team?f.awayId:f.homeId));
  assert.equal(opponents.size,7);
  for(const opponent of opponents){
   assert.equal(s.fixtures.filter(f=>f.homeId===team&&f.awayId===opponent).length,4);
   assert.equal(s.fixtures.filter(f=>f.awayId===team&&f.homeId===opponent).length,4);
  }
 }
});

test('goalie simulated stats include saves, shot volume, GAA and save percentage',async()=>{
 const {newSeason,simulateThrough}=await loadTS('src/game/seasonLeague.ts');
 const {emptyPositionStats,applySimulatedCareerFixture,savePercentage,goalsAgainstAverage,statCards}=await loadTS('src/game/careerPositionStats.ts');
 const season=newSeason('northport');simulateThrough(season,40);
 const stats=emptyPositionStats();
 for(const f of season.fixtures.filter(f=>f.homeGoals!==undefined&&(f.homeId==='northport'||f.awayId==='northport')))
  applySimulatedCareerFixture(stats,'G',f,'northport');
 assert.ok(stats.gp>0&&stats.saves>0&&stats.shotsAgainst>stats.goalsAgainst);
 assert.ok(stats.saves<=stats.shotsAgainst);
 assert.ok(savePercentage(stats)>0&&savePercentage(stats)<1);
 assert.ok(goalsAgainstAverage(stats)>=0);
 assert.ok(statCards('G',stats).some(c=>c.label==='Save %'));
 assert.equal(stats.simulatedGames,stats.gp);
});
test('career skaters show role-based stats without goalie save metrics',async()=>{
 const {emptyPositionStats,applyCareerResult,statCards}=await loadTS('src/game/careerPositionStats.ts');
 for(const role of ['C','LW','RW','LD','RD']){
  const stats=emptyPositionStats();
  applyCareerResult(stats,role,4,2,{goals:2,assists:1},false);
  assert.equal(stats.gp,1);
  assert.equal(stats.goals+stats.assists,3);
  assert.equal(stats.saves,0);
  const cards=statCards(role,stats);
  assert.ok(cards.some(c=>c.label==='Points'));
  assert.ok(!cards.some(c=>c.label==='Save %'));
 }
});
test('player statistics update exactly once for one simulated fixture and preserve reloads',async()=>{
 const {newSeason,simulateThrough}=await loadTS('src/game/seasonLeague.ts');
 const {emptyPositionStats,applySimulatedCareerFixture,normalizePositionStats}=await loadTS('src/game/careerPositionStats.ts');
 const s=newSeason('ironvale'),stats=emptyPositionStats();
 const pending=s.fixtures.filter(f=>f.day<=8&&(f.homeId==='ironvale'||f.awayId==='ironvale'));
 simulateThrough(s,8);
 for(const f of pending)applySimulatedCareerFixture(stats,'C',f,'ironvale');
 assert.equal(stats.gp,pending.length);
 assert.deepEqual(normalizePositionStats(stats),stats);
 assert.equal(simulateThrough(s,8).userGames,0);
 assert.equal(stats.gp,pending.length);
});
test('existing career save retains prior stats with unknown historical save percentage',async()=>{
 const {normalizePositionStats,savePercentage}=await loadTS('src/game/careerPositionStats.ts');
 const legacy={games:8,wins:5,losses:3,goals:0,assists:0,saves:57};
 const stats=normalizePositionStats(null,legacy);
 assert.equal(stats.gp,8);
 assert.equal(stats.saves,57);
 assert.equal(savePercentage(stats),null,'never invent old shots-against numbers');
});

test('goalie GAA uses actual minutes of played-game ice time',async()=>{
 const {emptyPositionStats,applyCareerResult,goalsAgainstAverage}=await loadTS('src/game/careerPositionStats.ts');
 const goalie=emptyPositionStats();
 applyCareerResult(goalie,'G',3,2,{saves:18,shotsAgainst:20},false,15);
 assert.equal(goalie.minutesPlayed,15);
 assert.equal(goalsAgainstAverage(goalie),8);
 applyCareerResult(goalie,'G',1,0,{saves:22,shotsAgainst:22},false,60);
 assert.equal(goalsAgainstAverage(goalie),1.6);
});

test('Peewee U13 league accepts ages 11 and 12, but not younger or older',async()=>{
 const {eligibleDivisions,startingPath}=await loadTS('src/game/careerPath.ts');
 assert.ok(eligibleDivisions(11).some(d=>d.id==='u13'));
 assert.ok(eligibleDivisions(12).some(d=>d.id==='u13'));
 assert.equal(eligibleDivisions(10).some(d=>d.id==='u13'),false);
 assert.equal(eligibleDivisions(13).some(d=>d.id==='u13'),false);
 const p=startingPath('2009-08-26',12,'u13','aaa');
 assert.deepEqual({age:p.age,division:p.division,tier:p.tier,seasonYear:p.seasonYear},
 {age:12,division:'u13',tier:'aaa',seasonYear:2021});
 assert.throws(()=>startingPath('2009-08-26',12,'u9','house'));
 assert.throws(()=>startingPath('2009-08-26',12,'u13','jra'));
});
test('junior ages may choose between eligible junior and U18 paths',async()=>{
 const {eligibleDivisions,startingPath}=await loadTS('src/game/careerPath.ts');
 const choices=eligibleDivisions(16).map(d=>d.id);
 assert.ok(choices.includes('u18')&&choices.includes('junior'));
 assert.deepEqual(eligibleDivisions(12).map(d=>d.id),['u13']);
 assert.equal(startingPath('2009-08-26',18,'junior','jrb').seasonYear,2027);
 assert.throws(()=>startingPath('2009-08-26',11,'junior','jra'));
});
test('career birthdate stays consistent with Dec 31 registration age and legacy saves',async()=>{
 const {startingPath,ageOnDec31,actualAgeOn,normalizeCareerStart,leagueTitle}=await loadTS('src/game/careerPath.ts');
 const p=startingPath('2014-12-12',12,'u13','aa');
 assert.equal(p.seasonYear,2026);
 assert.equal(ageOnDec31('2014-12-12',2026),12);
 assert.equal(actualAgeOn('2014-12-12','2026-10-01'),11);
 assert.match(leagueTitle(p),/Peewee/);
 const legacy=normalizeCareerStart(null,'2009-08-26','2026-10-01');
 assert.equal(legacy.division,'development');
 assert.equal(legacy.seasonYear,2026);
 assert.match(leagueTitle(legacy),/Development League/);
});
test('different divisions create different season schedules while preserving old careers',async()=>{
 const {newSeason,normalizeSeason,leagueStandings}=await loadTS('src/game/seasonLeague.ts');
 const {startingPath,startCycles,startPace}=await loadTS('src/game/careerPath.ts');
 const data=[
  {age:12,division:'u13',tier:'house',games:28},
  {age:14,division:'u15',tier:'aa',games:42},
  {age:18,division:'junior',tier:'jra',games:56}
 ];
 let last=0;
 for(const d of data){
  const p=startingPath('2009-08-26',d.age,d.division,d.tier);
  const season=newSeason('northport',p.seasonYear+'-10-01',startCycles(p));
  assert.equal(season.fixtures.length,d.games*4);
  assert.equal(season.fixtures.filter(f=>f.homeId==='northport'||f.awayId==='northport').length,d.games);
  assert.equal(normalizeSeason(season,'northport').fixtures.length,season.fixtures.length);
  assert.equal(season.fixtures[0].day,0);
  assert.equal(Math.max(...season.fixtures.map(f=>f.day)),196);
  assert.ok(startPace(p)>last);last=startPace(p);
  assert.equal(leagueStandings(season)[0].gp,0);
 }
});
test('youth career match pace is lower than junior match pace',async()=>{
 const {startingPath,startPace}=await loadTS('src/game/careerPath.ts');
 const youth=startPace(startingPath('2009-08-26',12,'u13','house'));
 const junior=startPace(startingPath('2009-08-26',18,'junior','jra'));
 const a=new HockeyMatch(true,{speed:50,shot:50,handling:50,defense:50},()=>.5,5,youth);
 const b=new HockeyMatch(true,{speed:50,shot:50,handling:50,defense:50},()=>.5,5,junior);
 assert.ok(a.paceFactor<b.paceFactor);
});

test('top-four seeded playoff bracket advances by best-of-five in Peewee',async()=>{
 const {newSeason,simulateThrough,MAX_SEASON_DAY,leagueStandings}=await loadTS('src/game/seasonLeague.ts');
 const {createPlayoffs,nextSeries,recordPlayoffGame,simulateRemainingPlayoffs}=await loadTS('src/game/careerPlayoffs.ts');
 const season=newSeason('northport','2026-10-01',4);
 simulateThrough(season,MAX_SEASON_DAY);
 const seeds=leagueStandings(season).slice(0,4).map(x=>x.team.id);
 const p=createPlayoffs(season,'u13');
 assert.equal(p.bestOf,5);assert.equal(p.series.length,2);
 assert.deepEqual([p.series[0].seedA,p.series[0].seedB],[seeds[0],seeds[3]]);
 for(let k=0;k<3;k++)recordPlayoffGame(p,p.series[0],2,1);
 assert.equal(p.series[0].winsA,3);
 const remaining=nextSeries(p);assert.equal(remaining,p.series[1]);
 simulateRemainingPlayoffs(p);
 assert.ok(p.champion);assert.equal(p.series.length,3);
 assert.ok(seeds.includes(p.champion));
});
test('playoffs cannot start with unfinished regular games or allow extra games after elimination',async()=>{
 const {newSeason,simulateThrough,MAX_SEASON_DAY}=await loadTS('src/game/seasonLeague.ts');
 const {createPlayoffs,recordPlayoffGame}=await loadTS('src/game/careerPlayoffs.ts');
 const s=newSeason('ironvale');assert.throws(()=>createPlayoffs(s,'junior'));
 simulateThrough(s,MAX_SEASON_DAY);
 const p=createPlayoffs(s,'junior');assert.equal(p.bestOf,7);
 for(let i=0;i<4;i++)recordPlayoffGame(p,p.series[0],1,2);
 assert.throws(()=>recordPlayoffGame(p,p.series[0],1,2));
 assert.throws(()=>recordPlayoffGame(p,p.series[1],2,2));
});
test('offseason preserves birthdate and promotes eligible Peewee player to Bantam',async()=>{
 const {newSeason,simulateThrough,MAX_SEASON_DAY}=await loadTS('src/game/seasonLeague.ts');
 const {startingPath}=await loadTS('src/game/careerPath.ts');
 const {createPlayoffs,simulateRemainingPlayoffs,advanceCareerSeason,nextCareerStart}=await loadTS('src/game/careerPlayoffs.ts');
 const birth='2014-08-26',start=startingPath(birth,12,'u13','aa');
 const season=newSeason('northport','2026-10-01',4);simulateThrough(season,MAX_SEASON_DAY);
 const playoffs=createPlayoffs(season,'u13');simulateRemainingPlayoffs(playoffs);
 const rolled=advanceCareerSeason(season,playoffs,start,birth);
 assert.equal(rolled.start.age,13);assert.equal(rolled.start.division,'u15');
 assert.equal(rolled.start.seasonYear,2027);assert.equal(rolled.season.startDate,'2027-10-01');
 assert.equal(rolled.season.fixtures.length,168);
 assert.equal(rolled.history.seasonYear,2026);
 assert.equal(nextCareerStart(start,birth).division,'u15');
});
test('players aging out of junior continue in development without invalid age eligibility',async()=>{
 const {startingPath}=await loadTS('src/game/careerPath.ts');
 const {nextCareerStart}=await loadTS('src/game/careerPlayoffs.ts');
 const p=startingPath('2006-02-02',20,'junior','jra');
 const next=nextCareerStart(p,'2006-02-02');
 assert.equal(next.age,21);assert.equal(next.division,'development');
});
