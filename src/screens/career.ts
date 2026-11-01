import {newPlayoffLedger,normalizePlayoffLedger,addPlayoffResult,seasonSummary,combineSummaries,careerSummary,statTableSummary,type PlayoffStatLedger} from '../game/careerStatsHistory';
import {newDevelopment,normalizeDevelopment,overallRating,trainingFocuses,processTrainingThrough,offseasonDevelopment,scoutingEstimate,type DevelopmentSave} from '../game/careerDevelopment';
import {ATTRIBUTES,visibleAttributes,normalizeAttributes,upgradeAttribute,matchRatings,type AttributeValues} from '../game/careerAttributes';
import {newSeasonLedger,normalizeSeasonLedger,addSimulatedStat,addPlayedStat,ledgerTotals,type SeasonPlayerLedger} from '../game/seasonPlayerLedger';
import {emptyTrophyCase,normalizeTrophyCase,checkMilestoneAwards,awardSeason,playedGameXP,simulatedGameXP,levelFromXP,type TrophyCase} from '../game/careerAwards';
import {teamCrest,leagueCrest} from '../game/fictionalBranding';
import {createPlayoffs,nextSeries,recordPlayoffGame,simPlayoffGame,simulateRemainingPlayoffs,calendarPlayoffGames,simulatePlayoffDay,playoffGameDay,playoffGameId,playoffBotStats,PLAYOFF_LAST_DAY,isQualified,advanceCareerSeason,type PlayoffSave,type SeasonHistory} from '../game/careerPlayoffs';
import {normalizeCareerStart,leagueTitle,startCycles,startPace,actualAgeOn,type CareerStart} from '../game/careerPath';
import {emptyPositionStats,normalizePositionStats,applyCareerResult,applySimulatedCareerFixture,type CareerPositionStats} from '../game/careerPositionStats';
import {newSeason,normalizeSeason,dateAt,seasonDay,dayPlan,MAX_SEASON_DAY,simulateThrough,nextUserFixture,recordUserResult,leagueStandings,botStats,type SeasonSave,type Fixture} from '../game/seasonLeague';
import {DEFAULT_TEAM_ID,getTeam,nextOpponent,teamChoiceOptions} from '../game/fictionalLeague';
import {loadPeriodMinutes,validPeriodMinutes,type PeriodMinutes} from '../config/matchSettings';
import type {PlayerDraft} from '../player/types';
import {playerPortrait} from '../graphics/playerPortrait';
import {mountHockeyMatch} from './hockeyMatch';
import {drawHockeyCharacter,drawRink} from '../graphics/animatedHockey2d';

export interface CareerSave {
 player:PlayerDraft;playoffLedger?:PlayoffStatLedger;playoffLedgers?:PlayoffStatLedger[];development?:DevelopmentSave;attributes?:AttributeValues;seasonLedger?:SeasonPlayerLedger;seasonLedgers?:SeasonPlayerLedger[];trophyCase?:TrophyCase; playoffs?:PlayoffSave;seasonHistory?:SeasonHistory[]; startingPath?:CareerStart; teamId?:string; yearDay?:number;season?:SeasonSave; positionStats?:CareerPositionStats; periodMinutes?:PeriodMinutes; games:number;wins:number;losses:number;goals:number;assists:number;saves:number;
 xp:number;level:number;skillPoints:number;speed:number;shot:number;handling:number;defense:number;
}
const KEY='hockey-career-save-v1';
export function loadCareer():CareerSave|null {
 try {const raw=localStorage.getItem(KEY);if(!raw)return null;const s=JSON.parse(raw) as CareerSave;return s?.player&&Number.isFinite(s.games)?s:null;}catch{return null;}
}
export function startCareer(p:PlayerDraft,path?:CareerStart):CareerSave {
 const start=path??normalizeCareerStart(null,p.birthdate,'2026-10-01');
 const firstSeason=start.seasonYear+'-10-01';
 const s:CareerSave={player:p,startingPath:start,teamId:DEFAULT_TEAM_ID,
  season:newSeason(DEFAULT_TEAM_ID,firstSeason,startCycles(start)),yearDay:0,positionStats:emptyPositionStats(),trophyCase:emptyTrophyCase(),attributes:normalizeAttributes(null,p.position,{speed:50,shot:50,handling:50,defense:50}),seasonLedger:newSeasonLedger(start.seasonYear),seasonLedgers:[],playoffLedger:newPlayoffLedger(start.seasonYear),playoffLedgers:[],periodMinutes:loadPeriodMinutes(),games:0,wins:0,losses:0,goals:0,assists:0,saves:0,xp:0,level:1,skillPoints:0,speed:50,shot:50,handling:50,defense:50};
 saveCareer(s);return s;
}
export function updateCareerPeriodMinutes(minutes:PeriodMinutes):void {
 const career=loadCareer();if(!career)return;
 career.periodMinutes=validPeriodMinutes(minutes);saveCareer(career);
}
function saveCareer(s:CareerSave){localStorage.setItem(KEY,JSON.stringify(s));}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function renderCareer(root:HTMLElement,career:CareerSave,onMenu:()=>void):void {
 let match:ReturnType<typeof startMatch>|null=null;
 const p=career.player;
 // Older saves keep working and inherit the current menu preference.
 career.periodMinutes=validPeriodMinutes(career.periodMinutes??loadPeriodMinutes());
 career.teamId=getTeam(career.teamId).id;
 career.season=normalizeSeason(career.season,career.teamId);
 career.startingPath=normalizeCareerStart(career.startingPath,p.birthdate,career.season.startDate);
 if(!career.positionStats){
  // Existing PR100/101 careers already have simulated league fixtures. Recover
  // their individual projections once without counting the same games twice.
  const previousSim=career.season.fixtures.filter(f=>
   f.homeGoals!==undefined&&f.awayGoals!==undefined&&f.played===false&&
   (f.homeId===career.teamId||f.awayId===career.teamId));
  const simWins=previousSim.filter(f=>{
   const own=f.homeId===career.teamId?f.homeGoals!:f.awayGoals!;
   const against=f.homeId===career.teamId?f.awayGoals!:f.homeGoals!;
   return own>against;
  }).length;
  const baseline={...career,games:Math.max(0,career.games-previousSim.length),
   wins:Math.max(0,career.wins-simWins),
   losses:Math.max(0,career.losses-(previousSim.length-simWins))};
  const upgraded=normalizePositionStats(null,baseline);
  for(const fixture of previousSim)
   applySimulatedCareerFixture(upgraded,p.position,fixture,career.teamId);
  career.positionStats=upgraded;
  saveCareer(career);
 }else{
  career.positionStats=normalizePositionStats(career.positionStats,career);
 }
 career.yearDay=clamp(Number(career.yearDay??(career.playoffs?Math.max(MAX_SEASON_DAY,career.season.day):career.season.day)),0,PLAYOFF_LAST_DAY);
 let selectedDay=career.yearDay;
 career.seasonHistory??=[];
 career.trophyCase=normalizeTrophyCase(career.trophyCase);
 career.attributes=normalizeAttributes(career.attributes,p.position,career);
 career.development=normalizeDevelopment(career.development,career.startingPath,career.attributes,
  p.firstName+' '+p.lastName+'|'+p.birthdate,p.position,career.season.day);
 career.seasonLedger=normalizeSeasonLedger(career.seasonLedger,Number(career.season.startDate.slice(0,4)));
 career.seasonLedgers??=[];
 career.playoffLedger=normalizePlayoffLedger(career.playoffLedger,Number(career.season.startDate.slice(0,4)));
 career.playoffLedgers??=[];
 // Recover existing completed simulation records into the new annual ledger,
 // without replaying career statistics, awarding XP again, or altering scores.
 for(const fixture of career.season.fixtures){
  if(fixture.played===false&&(fixture.homeId===career.teamId||fixture.awayId===career.teamId))
   addSimulatedStat(career.seasonLedger,fixture,p.position,career.teamId);
 }
 checkMilestoneAwards(career.trophyCase,career.positionStats,p.position,
  Number(career.season.startDate.slice(0,4)),leagueTitle(career.startingPath));
 saveCareer(career);
 const addXP=(amount:number)=>{
  career.xp+=Math.max(0,Math.floor(amount));
  const newLevel=levelFromXP(career.xp);
  if(newLevel>career.level){career.skillPoints+=newLevel-career.level;career.level=newLevel;}
 };
 const persist=()=>saveCareer(career);
 const trainThrough=(season:SeasonSave,day:number)=>processTrainingThrough(career.development!,career.attributes!,season,p.position,career.startingPath!.age,day);
 const creditSimulation=(season:SeasonSave,day:number)=>{
  const pending=season.fixtures.filter(f=>f.homeGoals===undefined&&(f.homeId===career.teamId||f.awayId===career.teamId)&&f.day<=day);
  trainThrough(season,day);
  const report=simulateThrough(season,day);
  for(const fixture of pending){
   if(fixture.homeGoals===undefined||fixture.awayGoals===undefined)continue;
   const before={goals:career.positionStats!.goals,assists:career.positionStats!.assists,saves:career.positionStats!.saves};
   applySimulatedCareerFixture(career.positionStats!,p.position,fixture,career.teamId!);
   addSimulatedStat(career.seasonLedger!,fixture,p.position,career.teamId!);
   career.development!.scoutingObservations++;
   const own=fixture.homeId===career.teamId?fixture.homeGoals:fixture.awayGoals;
   const opponent=fixture.homeId===career.teamId?fixture.awayGoals:fixture.homeGoals;
   addXP(simulatedGameXP(
    career.positionStats!.goals-before.goals,
    career.positionStats!.assists-before.assists,
    career.positionStats!.saves-before.saves,
    own>opponent
   ));
  }
  checkMilestoneAwards(career.trophyCase!,career.positionStats!,p.position,
   Number(season.startDate.slice(0,4)),leagueTitle(career.startingPath!));
  career.games+=report.userGames;career.wins+=report.wins;career.losses+=report.losses;
  persist();return report;
 };
 // The season is seven browsable months rather than a single 197-cell strip.
 let months=[...new Set(Array.from({length:PLAYOFF_LAST_DAY+1},(_,i)=>dateAt(career.season!,i).slice(0,7)))];
 let visibleMonth=Math.max(0,months.indexOf(dateAt(career.season,selectedDay).slice(0,7)));
 let simRunning=false;
 let simTimer:ReturnType<typeof setTimeout>|null=null;
 let simDelay=70;
 let simTarget=career.yearDay;
 const cancelSim=()=>{
  if(simTimer!==null){clearTimeout(simTimer);simTimer=null;}
  simRunning=false;
 };
 const monthTitle=()=>new Date(months[visibleMonth]+'-01T12:00:00Z')
  .toLocaleDateString('en-CA',{month:'long',year:'numeric',timeZone:'UTC'});
 const renderCalendarMonth=()=>{
  const season=career.season!,month=months[visibleMonth],post=career.playoffs;
  const playoffEntries=post?calendarPlayoffGames(post):[];
  const first=new Date(month+'-01T12:00:00Z').getUTCDay();
  const pads=(first+6)%7; // Monday-first column order
  let html=Array.from({length:pads},()=>'<span class="season-day-empty"></span>').join('');
  for(let d=0;d<=MAX_SEASON_DAY;d++){
   const iso=dateAt(season,d);if(iso.slice(0,7)!==month)continue;
   const plan=d<=MAX_SEASON_DAY?dayPlan(season,d):null,fixture=plan?.fixture;
   const event=playoffEntries.filter(e=>e.day===d)
    .sort((a,b)=>Number((b.homeId===career.teamId||b.awayId===career.teamId))-Number((a.homeId===career.teamId||a.awayId===career.teamId)))[0];
   const game=fixture??event;
   const score=fixture&&fixture.homeGoals!==undefined&&fixture.awayGoals!==undefined
    ?'<em class="season-day-score">'+fixture.homeGoals+'–'+fixture.awayGoals+'</em>'
    :event&&event.scoreA!==undefined?'<em class="season-day-score">'+event.scoreA+'–'+event.scoreB+'</em>':'';
   const content=game
    ?'<small class="season-day-match">'+(event?'🏆 ':'')+getTeam(game.homeId).abbr+' vs. '+getTeam(game.awayId).abbr+'</small>'+score
    :d>MAX_SEASON_DAY?'<small class="season-day-activity">'+(d%7===6?'R':'T')+'</small>'
    :'<small class="season-day-activity '+(plan?.kind==='rest'?'season-rest':'season-training')+'">'+(plan?.kind==='rest'?'R':'T')+'</small>';
   html+='<button type="button" data-day="'+d+'" class="season-date'+
    (selectedDay===d?' selected':'')+(d<career.yearDay!?' elapsed':'')+
    (d===career.yearDay?' current':'')+(game?' player-game':'')+(event?' playoff-day':'')+
    '" title="'+iso+' · '+(game?getTeam(game.homeId).abbr+' vs. '+getTeam(game.awayId).abbr:(plan?.kind??'offseason'))+
    '"><span class="season-day-number">'+iso.slice(8)+'</span>'+content+'</button>';
  }
  return html;
 };
 const renderDayResults=(day:number)=>{
  const season=career.season!,games=season.fixtures.filter(f=>f.day===day);
  if(day>MAX_SEASON_DAY){
   const entries=career.playoffs?calendarPlayoffGames(career.playoffs).filter(e=>e.day===day):[];
   return entries.length?entries.map(e=>'<div class="season-sim-line"><span>🏆 '+
    getTeam(e.homeId).abbr+' vs. '+getTeam(e.awayId).abbr+'</span><strong>'+
    (e.scoreA===undefined?'Scheduled':e.scoreA+'–'+e.scoreB)+'</strong></div>').join(''):
    '<div class="season-sim-line">POSTSEASON · '+dateAt(season,day)+'</div>';
  }
  if(!games.length){
   const plan=dayPlan(season,day);
   return '<div class="season-sim-line">'+(plan.kind==='rest'?'R · REST DAY':'T · TRAINING DAY')+' — '+dateAt(season,day)+'</div>';
  }
  return games.map(f=>'<div class="season-sim-line"><span>'+
   getTeam(f.homeId).abbr+' vs. '+getTeam(f.awayId).abbr+'</span><strong>'+
   (f.homeGoals!==undefined?f.homeGoals+'–'+f.awayGoals:'Scheduled')+'</strong></div>').join('');
 };
 const creditPlayoffEvents=(events:ReturnType<typeof simulatePlayoffDay>)=>{
  for(const event of events){
   const series=event.series;
   if(series.seedA!==career.teamId&&series.seedB!==career.teamId)continue;
   const fixture:Fixture={id:playoffGameId(series,event.index),day:event.day,
    homeId:series.seedA,awayId:series.seedB,homeGoals:event.a,awayGoals:event.b};
   if(career.playoffLedger!.games.some(g=>g.fixtureId===fixture.id))continue;
   const before={goals:career.positionStats!.goals,assists:career.positionStats!.assists,saves:career.positionStats!.saves};
   applySimulatedCareerFixture(career.positionStats!,p.position,fixture,career.teamId!);
   addSimulatedStat(career.playoffLedger!,fixture,p.position,career.teamId!);
   const own=fixture.homeId===career.teamId?event.a:event.b;
   const against=fixture.homeId===career.teamId?event.b:event.a;
   career.games++;if(own>against)career.wins++;else career.losses++;
   addXP(simulatedGameXP(career.positionStats!.goals-before.goals,career.positionStats!.assists-before.assists,
    career.positionStats!.saves-before.saves,own>against));
   career.development!.scoutingObservations++;
  }
  checkMilestoneAwards(career.trophyCase!,career.positionStats!,p.position,
   career.startingPath!.seasonYear,leagueTitle(career.startingPath!));
 };
 const simulateCareerDay=(day:number)=>{
  const season=career.season!;
  if(day<=MAX_SEASON_DAY)creditSimulation(season,day);
  else{
   if(!career.playoffs&&season.fixtures.every(f=>f.homeGoals!==undefined))
    career.playoffs=createPlayoffs(season,career.startingPath!.division);
   if(career.playoffs)creditPlayoffEvents(simulatePlayoffDay(career.playoffs,day));
  }
  career.yearDay=day;persist();
 };
 const simTick=()=>{
  if(!simRunning)return;
  if(!root.isConnected||!root.querySelector('[data-calendar-grid]')){cancelSim();return;}
  const season=career.season!,now=career.yearDay!;
  if(now>=simTarget){cancelSim();selectedDay=now;activeTab='calendar';drawHub();return;}
  const pending=now<=MAX_SEASON_DAY&&season.fixtures.some(f=>f.day===now&&f.homeGoals===undefined);
  const next=pending?now:now+1;
  simulateCareerDay(next);
  selectedDay=next;
  const index=months.indexOf(dateAt(season,next).slice(0,7));
  if(index>=0)visibleMonth=index;
  const grid=root.querySelector<HTMLElement>('[data-calendar-grid]');
  const monthName=root.querySelector<HTMLElement>('[data-month-name]');
  const current=root.querySelector<HTMLElement>('[data-calendar-today]');
  const progress=root.querySelector<HTMLProgressElement>('[data-sim-progress]');
  const status=root.querySelector<HTMLElement>('[data-sim-status]');
  const results=root.querySelector<HTMLElement>('[data-sim-results]');
  if(grid)grid.innerHTML=renderCalendarMonth();
  if(monthName)monthName.textContent=monthTitle();
  if(current)current.textContent=dateAt(season,next);
  if(progress){progress.value=next;progress.max=simTarget;}
  if(status)status.textContent='SIMULATING · '+dateAt(season,next)+' · Day '+next+' / '+simTarget;
  if(results)results.innerHTML=renderDayResults(next);
  if(next>=simTarget){cancelSim();activeTab='calendar';drawHub();return;}
  simTimer=setTimeout(simTick,simDelay);
 };
 const name=(p.firstName+' '+p.lastName).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
 const drawHub=()=>{
  match?.stop();match=null;
  const season=career.season!,home=getTeam(career.teamId),fixture=nextUserFixture(season);
  const regularComplete=season.fixtures.every(f=>f.homeGoals!==undefined);
  if(regularComplete&&!career.playoffs){
   career.playoffs=createPlayoffs(season,career.startingPath!.division);persist();
  }
  const post=career.playoffs,series=post?nextSeries(post):undefined;
  if(post?.champion&&awardSeason(career.trophyCase!,season,post,p.position,career.positionStats!,leagueTitle(career.startingPath!),career.seasonLedger))persist();
  const mySeries=series&&(series.seedA===home.id||series.seedB===home.id);
  const isPostseason=!!post;
  const bracket=post?post.series.map((round,i)=>{
   const first=getTeam(round.seedA),second=getTeam(round.seedB);
   const roundTitle=round.round===0?'SEMIFINAL '+(i+1):'CHAMPIONSHIP FINAL';
   return '<div class="playoff-series"><strong>'+roundTitle+'</strong><div>'+
     teamCrest(first.id,35)+' '+first.abbr+' '+round.winsA+' – '+round.winsB+' '+second.abbr+' '+teamCrest(second.id,35)+'</div>'+
     '<small>'+round.results.map(g=>g.a+'–'+g.b).join(' · ')+
     (round.winsA===0&&round.winsB===0?'Awaiting first game':'')+'</small></div>';
  }).join(''):'';

  const start=career.startingPath!,leagueName=leagueTitle(start);
  const actualAge=actualAgeOn(p.birthdate,dateAt(season,season.day));
  const away=fixture?getTeam(fixture.homeId===home.id?fixture.awayId:fixture.homeId):undefined;
  const standings=leagueStandings(season),leaders=botStats(season).filter(x=>x.position!=='G')
   .sort((a,b)=>b.points-a.points||b.goals-a.goals).slice(0,10);
  const goalieLeaders=botStats(season).filter(x=>x.position==='G').sort((a,b)=>b.wins-a.wins||b.saves-a.saves);
  const selected=dateAt(season,selectedDay),current=dateAt(season,season.day);
  const schedule=season.fixtures.filter(f=>f.day>=season.day&&f.day<=season.day+28)
   .sort((x,y)=>x.day-y.day||x.id.localeCompare(y.id));
  const scheduleMarkup=schedule.slice(0,24).map(f=>{
   const done=f.homeGoals!==undefined,ours=f.homeId===home.id||f.awayId===home.id;
   return '<div class="season-fixture'+(ours?' season-ours':'')+'"><span>'+dateAt(season,f.day).slice(5)+'</span><span>'+getTeam(f.homeId).abbr+' vs '+getTeam(f.awayId).abbr+'</span><strong>'+(done?f.homeGoals+'–'+f.awayGoals:ours?'YOUR GAME':'Scheduled')+'</strong></div>';
  }).join('');
  const calendar=renderCalendarMonth();
  const ovr=overallRating(career.attributes!,p.position),scout=scoutingEstimate(career.development!);
  const activeDev=career.development!;
  const progressReport=activeDev.reports.slice().reverse().slice(0,4);
  const comparison=visibleAttributes(p.position).filter(a=>(activeDev.trainingGains[a.key]??0)>0).map(a=>({
   label:a.label,old:career.attributes![a.key]-activeDev.trainingGains[a.key],
   current:career.attributes![a.key]
  }));
    const renderMyStats=()=>{
   const node=root.querySelector<HTMLElement>('[data-my-stats-content]');
   if(!node)return;
   const all=statsSelectedYear===null;
   const regular=[...career.seasonLedgers!,career.seasonLedger!].filter(l=>all||l.year===statsSelectedYear);
   const playoffs=[...career.playoffLedgers!,career.playoffLedger!].filter(l=>all||l.year===statsSelectedYear);
   const selected=statsScope==='regular'?regular:statsScope==='playoffs'?playoffs:[...regular,...playoffs];
   const projected=selected.map(l=>seasonSummary(l,career.periodMinutes!*3));
   const tally=combineSummaries(projected);
   const value=all&&statsScope==='combined'?careerSummary(career.positionStats!,p.position):tally;
   const duration=all&&statsScope==='combined'?career.positionStats!.minutesPlayed:
    projected.reduce((sum,item)=>sum+item.gp*career.periodMinutes!*3,0);
   const totals={...value,gaa:duration>0?value.goalsAgainst*60/duration:null};
   node.innerHTML='<div class="my-stats-highlights">'+statTableSummary(p.position,totals)
     .map(v=>'<div><strong>'+v.value+'</strong><span>'+v.label+'</span></div>').join('')+
     '</div><p class="career-muted">'+(all?'Career':'Season '+statsSelectedYear+'–'+String(statsSelectedYear!+1).slice(-2))+
     ' · '+(statsScope==='regular'?'Regular season':statsScope==='playoffs'?'Playoffs':'Combined')+
     '</p>'+(totals.gp===0?'<p class="career-muted">No recorded games for this selection.</p>':'');
  };
root.innerHTML=`<main class="career-shell">
   <header class="career-top"><button data-menu>← Menu</button><span class="league-brand">${leagueCrest(start,35)}<strong>${leagueName.toUpperCase()}</strong></span><span>LEVEL ${career.level}</span></header>
   <section class="career-hero"><div class="career-avatar">${playerPortrait(p.appearance,p.equipment,home.id)}</div><div><p class="eyebrow">${leagueCrest(start,32)} ${teamCrest(home.id,34)} ${career.seasonHistory?.length ? `SEASON ${career.seasonHistory.length+1}` : "ROOKIE SEASON"} · ${leagueName.toUpperCase()}</p><h1>${name}</h1><p>#${p.jerseyNumber} · ${p.position} · ${p.nationality} · Age ${actualAge} (season age ${start.age})</p><p>${career.games} GP · ${career.wins} W · ${career.losses} L</p></div></section>
   <nav class="season-tabs" aria-label="Career sections"><button data-tab="home">Hub</button><button data-tab="my-stats">My Stats</button><button data-tab="development">Development</button><button data-tab="calendar">Calendar</button><button data-tab="standings">Standings</button><button data-tab="stats">League stats</button><button data-tab="playoffs">Playoffs</button><button data-tab="trophies">Trophies</button></nav>
   <div data-season-view="my-stats" hidden><section class="career-panel">
    <h2>📊 My Stats</h2><p class="career-muted">Season and lifetime statistics with separate playoff records. Older careers may have incomplete historical detail.</p>
    <div class="my-stats-controls"><label>Season
    <select data-my-stats-season><option value="career" ${statsSelectedYear===null?'selected':''}>Entire career</option>
    ${[...new Set([...career.seasonLedgers!.map(l=>l.year),...career.playoffLedgers!.map(l=>l.year),career.seasonLedger!.year])].sort((a,b)=>b-a).map(year=>
      '<option value="'+year+'"'+(year===statsSelectedYear?' selected':'')+'>'+year+'–'+String(year+1).slice(-2)+'</option>').join('')}</select></label>
    <div class="my-stats-scope" role="group" aria-label="Stat category">
      <button data-stats-scope="regular" aria-pressed="${statsScope==='regular'}">Regular</button>
      <button data-stats-scope="playoffs" aria-pressed="${statsScope==='playoffs'}">Playoffs</button>
      <button data-stats-scope="combined" aria-pressed="${statsScope==='combined'}">Combined</button>
    </div></div><div data-my-stats-content></div>
   </section></div>
   <div data-season-view="home">
    <section class="career-panel"><h2>${leagueCrest(start,28)} ${teamCrest(home.id,30)} ${leagueName} · Next scheduled game</h2><p>${fixture&&away?home.city+' '+home.name+' vs. '+away.city+' '+away.name+' · '+dateAt(season,fixture.day):'Season schedule complete'} · 3 × ${career.periodMinutes}-minute periods</p><button class="career-primary" data-play ${fixture?'':'disabled'}>PLAY NEXT GAME 🏒</button><p class="career-muted">Current season day: ${current}. Upcoming games can be played or simulated from the calendar.</p></section>
    <section class="career-panel career-hub-summary">
     <h2>Player development</h2><div class="career-hub-development">
      <div><strong>${ovr}</strong><span>OVR</span></div>
      <div><strong>${career.level}</strong><span>Level</span></div>
      <div><strong>${career.skillPoints}</strong><span>Skill points</span></div>
     </div>
     <p class="career-muted">${activeDev.trainingDays} training days completed this season · ${comparison.length} attributes improved through training</p>
     <button type="button" data-open-development class="career-primary">DEVELOPMENT, SCOUTING & UPGRADES →</button>
    </section>
    <section class="career-panel"><h2>${teamCrest(home.id,36)} Your team</h2><p>Change clubs before the season begins. Once a game is complete, the season stays attached to your team.</p><select data-team-choice ${season.fixtures.some(f=>f.homeGoals!==undefined)?'disabled':''}>${teamChoiceOptions(home.id)}</select></section>
   </div>
   <div data-season-view="development" hidden>
    <section class="career-panel"><h2>🏒 Player development & scouting</h2>
      <div class="development-overview"><div><strong class="development-ovr">${ovr}</strong><span>OVERALL</span></div>
       <div><strong>${scout.label}</strong><span>Potential projection · ${scout.min}–${scout.max}</span></div>
       <div><strong>${scout.confidence}</strong><span>Scouting confidence</span></div></div>
      <p class="career-muted">Your true potential stays hidden. Scouting estimates improve as you play more games.</p>
      <label class="development-focus-label">Training focus
       <select data-training-focus>${trainingFocuses(p.position).map(f=>'<option value="'+f.id+'"'+(activeDev.focus===f.id?' selected':'')+'>'+f.label+'</option>').join('')}</select>
      </label>
      <p class="career-muted">${activeDev.trainingDays} training days completed this season. Training can gradually improve attributes without spending XP.</p>
      <h3>Attribute growth this season</h3>
      <div class="development-changes">${comparison.length?comparison.map(a=>'<div class="development-change"><span>'+a.label+'</span><strong>'+a.old+' → '+a.current+' ('+(a.current>a.old?'+':'')+(a.current-a.old)+')</strong></div>').join(''):'<p>No training growth yet. Advance through training days.</p>'}</div>
      <h3>Season development reports</h3>
      <div class="development-reports">${progressReport.length?progressReport.map(r=>'<article><strong>'+r.year+'–'+String(r.year+1).slice(-2)+' · '+r.summary+'</strong><span>OVR '+r.startOverall+' → '+r.endOverall+' · '+r.games+' GP · '+r.wins+' wins</span></article>').join(''):'<p>Your first report appears after the offseason.</p>'}</div>
     </section>
    <section class="career-panel"><h2>Player development · ${p.position==='G'?'Goalie':'Skater'} attributes</h2><p>Spend one point to improve an attribute by exactly <strong>+1</strong> (maximum 99). Ratings influence gameplay through their category averages.</p>
     <p class="attribute-available">Available points: <strong>${career.skillPoints}</strong> · XP: ${career.xp} · Level ${career.level}</p>
     ${[...new Set(visibleAttributes(p.position).map(a=>a.category))].map(category=>
      `<div class="attribute-category"><h3>${category}</h3><div class="attribute-grid">${visibleAttributes(p.position).filter(a=>a.category===category).map(a=>
       `<div class="attribute-row"><div class="attribute-caption"><strong>${a.label}</strong><small>${a.description}</small></div><div class="attribute-meter"><div style="width:${career.attributes![a.key]}%"></div></div><span class="attribute-number">${career.attributes![a.key]}</span><button type="button" data-attribute="${a.key}" aria-label="Increase ${a.label} by one" ${career.skillPoints<1||career.attributes![a.key]>=99?'disabled':''}>+1</button></div>`).join('')}</div></div>`
     ).join('')}
    </section>
   </div>
   <div data-season-view="trophies" hidden>
    <section class="career-panel">
     <h2>🏆 Career Trophy Case</h2>
     <p>Permanent awards from every season. Simulated games can earn milestones too.</p>
     <div class="trophy-summary"><strong>${career.trophyCase!.items.length}</strong><span>Career honours collected</span></div>
     <div class="trophy-shelf">${career.trophyCase!.items.length?career.trophyCase!.items.slice().reverse().map(t=>
      '<article class="trophy-card"><div class="trophy-emoji">'+t.icon+'</div><strong>'+t.title+'</strong><span>'+t.year+'–'+String(t.year+1).slice(-2)+'</span><small>'+t.league+'</small><p>'+t.detail+'</p></article>'
     ).join(''):'<p class="career-muted">No trophies yet. Complete games, chase milestones and finish a season to earn awards.</p>'}</div>
    </section>
   </div>
   <div data-season-view="playoffs" hidden>
    <section class="career-panel"><h2>🏆 Playoff bracket</h2>
    ${!regularComplete?'<p>Complete the regular season before playoffs begin. The top four teams qualify.</p><button data-finish-regular>SIM REGULAR SEASON TO APRIL 15</button>':
     '<p>Top four teams qualify. '+(post?.bestOf===5?'Best of five':'Best of seven')+' series · 1 vs 4 and 2 vs 3.</p>'+
      '<p>'+(post?.champion?'CHAMPIONS: '+getTeam(post.champion).city+' '+getTeam(post.champion).name:
      isQualified(post!,home.id)?'Your team qualified for the postseason!':'Your team missed the playoffs; you can still simulate the championship.')+'</p>'+
      '<div class="playoff-bracket">'+bracket+'</div>'+
      (post?.champion?'<button data-next-season>BEGIN NEXT SEASON →</button>':
       '<div class="playoff-actions"><button data-play-playoff '+(mySeries?'':'disabled')+'>PLAY NEXT PLAYOFF GAME</button><button data-sim-playoff>SIM NEXT PLAYOFF GAME</button><button data-sim-postseason>SIM REMAINING PLAYOFFS</button></div>')}
    <h3>Career season history</h3><div class="season-history">${(career.seasonHistory??[]).slice().reverse().map(h=>'<p>'+h.seasonYear+'–'+String(h.seasonYear+1).slice(-2)+' · '+h.division+' · Rank #'+h.clubRank+' · '+(h.champion?'Champion '+getTeam(h.champion).abbr:'—')+'</p>').join('')||'<p>No completed seasons yet</p>'}</div>
    </section>
   </div>
   <div data-season-view="calendar" hidden>
    <section class="career-panel">
      <h2>Season calendar · October–April</h2>
      <p>Today: <strong data-calendar-today>${current}</strong>. Every game day shows the matchup and its final score after simulation. <b>T</b> = training placeholder; <b>R</b> = rest.</p>
      <div class="season-month-bar">
        <button type="button" data-month-step="-1" ${visibleMonth===0?'disabled':''} aria-label="Previous month">‹</button>
        <strong data-month-name>${monthTitle()}</strong>
        <button type="button" data-month-step="1" ${visibleMonth===months.length-1?'disabled':''} aria-label="Next month">›</button>
      </div>
      <div class="season-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div class="season-calendar" data-calendar-grid>${calendar}</div>
      <div class="season-sim-controls">
       <label for="season-target">Simulate until</label>
       <input type="date" data-target-date id="season-target" min="${current}" max="${dateAt(season,MAX_SEASON_DAY)}" value="${selected}">
       <label for="season-speed">Simulation speed</label>
       <select data-sim-speed id="season-speed">
        <option value="130" ${simDelay===130?'selected':''}>Steady · 130ms/day</option>
        <option value="70" ${simDelay===70?'selected':''}>Fast · 70ms/day</option>
        <option value="35" ${simDelay===35?'selected':''}>Turbo · 35ms/day</option>
       </select>
       <button type="button" data-sim-target ${selectedDay<=season.day?'disabled':''}>SIM DAY BY DAY</button>
      </div>
      <progress class="season-sim-progress" data-sim-progress max="${Math.max(1,selectedDay)}" value="${season.day}" hidden></progress>
      <p class="season-sim-status" data-sim-status aria-live="polite">Ready · Select a future date and simulate.</p>
      <div class="season-sim-results" data-sim-results>${renderDayResults(season.day)}</div>
      <p class="career-muted">Simulation runs visibly one day at a time, saves each day's results and can be stopped. It simulates your team's unplayed games too. T and R have no training or recovery mechanics yet.</p>
    </section>
    <section class="career-panel"><h2>Upcoming fixtures & results</h2><div class="season-fixtures">${scheduleMarkup||'All league games completed.'}</div></section>
   </div>
   <div data-season-view="standings" hidden><section class="career-panel"><h2>League standings</h2><p>Two points for a win. Ties are settled in overtime.</p><div class="season-table-wrap"><table class="season-table"><thead><tr><th>Club</th><th>GP</th><th>W</th><th>L</th><th>GF</th><th>GA</th><th>PTS</th></tr></thead><tbody>${standings.map((t,i)=>'<tr'+(t.team.id===home.id?' class="season-highlight"':'')+'><td>'+(i+1)+'. '+t.team.abbr+'</td><td>'+t.gp+'</td><td>'+t.w+'</td><td>'+t.l+'</td><td>'+t.gf+'</td><td>'+t.ga+'</td><td>'+t.pts+'</td></tr>').join('')}</tbody></table></div></section></div>
   <div data-season-view="stats" hidden>
    <section class="career-panel"><h2>AI skater leaders</h2><p>Generated from the actual league results in this saved season.</p><div class="season-table-wrap"><table class="season-table"><thead><tr><th>Player</th><th>Team</th><th>GP</th><th>G</th><th>A</th><th>PTS</th></tr></thead><tbody>${leaders.map(x=>'<tr><td>'+x.name+'</td><td>'+getTeam(x.teamId).abbr+'</td><td>'+x.gp+'</td><td>'+x.goals+'</td><td>'+x.assists+'</td><td>'+x.points+'</td></tr>').join('')}</tbody></table></div></section>
    <section class="career-panel"><h2>AI goalie statistics</h2><div class="season-table-wrap"><table class="season-table"><thead><tr><th>Goalie</th><th>Team</th><th>GP</th><th>W</th><th>SV</th></tr></thead><tbody>${goalieLeaders.map(x=>'<tr><td>'+x.name+'</td><td>'+getTeam(x.teamId).abbr+'</td><td>'+x.gp+'</td><td>'+x.wins+'</td><td>'+x.saves+'</td></tr>').join('')}</tbody></table></div></section>
   </div></main>`;
  root.querySelector('[data-menu]')?.addEventListener('click',()=>{cancelSim();onMenu();});
  const tabs=root.querySelectorAll<HTMLButtonElement>('[data-tab]');
  const showTab=(tab:string,scroll=false)=>{
   tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
   root.querySelectorAll<HTMLElement>('[data-season-view]').forEach(v=>v.hidden=v.dataset.seasonView!==tab);
   if(tab==='my-stats')renderMyStats();
   if(scroll)root.querySelector<HTMLElement>('[data-season-view="'+tab+'"]')?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  tabs.forEach(b=>b.addEventListener('click',()=>{if(simRunning)return;activeTab=b.dataset.tab!;showTab(activeTab,true);}));
  showTab(activeTab);
  root.querySelector<HTMLSelectElement>('[data-my-stats-season]')?.addEventListener('change',e=>{
   const value=(e.currentTarget as HTMLSelectElement).value;statsSelectedYear=value==='career'?null:Number(value);renderMyStats();
  });
  root.querySelectorAll<HTMLButtonElement>('[data-stats-scope]').forEach(button=>button.addEventListener('click',()=>{
   statsScope=button.dataset.statsScope as typeof statsScope;
   root.querySelectorAll<HTMLButtonElement>('[data-stats-scope]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
   renderMyStats();
  }));
  root.querySelector<HTMLButtonElement>('[data-open-development]')?.addEventListener('click',()=>{activeTab='development';showTab(activeTab,true);});
  root.querySelector('[data-play]')?.addEventListener('click',()=>{if(fixture&&!simRunning){cancelSim();match=startMatch(fixture);}});
  root.querySelector('[data-finish-regular]')?.addEventListener('click',()=>{
   if(simRunning)return;
   creditSimulation(career.season!,MAX_SEASON_DAY);selectedDay=MAX_SEASON_DAY;
   activeTab='playoffs';drawHub();
  });
  root.querySelector('[data-sim-playoff]')?.addEventListener('click',()=>{
   if(series){simPlayoffGame(post!,series);nextSeries(post!);persist();activeTab='playoffs';drawHub();}
  });
  root.querySelector('[data-sim-postseason]')?.addEventListener('click',()=>{
   if(post){simulateRemainingPlayoffs(post);persist();activeTab='playoffs';drawHub();}
  });
  root.querySelector('[data-play-playoff]')?.addEventListener('click',()=>{
   if(series&&mySeries&&!simRunning){cancelSim();match=startPlayoffGame(post!,series);}
  });
  root.querySelector('[data-next-season]')?.addEventListener('click',()=>{
   if(!post?.champion)return;
   const year=Number(career.season!.startDate.slice(0,4));
   trainThrough(career.season!,MAX_SEASON_DAY);
   const seasonStats=ledgerTotals(career.seasonLedger!);
   offseasonDevelopment(career.development!,career.attributes!,p.position,career.startingPath!.age,year,
    {games:seasonStats.gp,points:seasonStats.goals+seasonStats.assists,wins:seasonStats.wins});
   const result=advanceCareerSeason(career.season!,post,career.startingPath!,p.birthdate);
   career.seasonHistory!.push(result.history);
   career.seasonLedgers!.push(career.seasonLedger!);
   career.playoffLedgers!.push(career.playoffLedger!);
   career.playoffLedger=newPlayoffLedger(result.start.seasonYear);
   career.seasonLedger=newSeasonLedger(result.start.seasonYear);
   career.startingPath=result.start;career.season=result.season;career.playoffs=undefined;
   // Career-wide experience and records persist; new season has fresh standings.
   selectedDay=0;visibleMonth=0;
   months=[...new Set(Array.from({length:MAX_SEASON_DAY+1},(_,i)=>dateAt(result.season,i).slice(0,7)))];
   persist();activeTab='home';drawHub();
  });

  root.querySelector<HTMLSelectElement>('[data-team-choice]')?.addEventListener('change',e=>{
   if(simRunning)return;
   career.teamId=getTeam((e.currentTarget as HTMLSelectElement).value).id;
   career.season=newSeason(career.teamId,season.startDate,startCycles(career.startingPath!));selectedDay=0;visibleMonth=0;
   persist();drawHub();
  });
  root.querySelector<HTMLSelectElement>('[data-training-focus]')?.addEventListener('change',e=>{
   if(simRunning)return;
   const selection=(e.currentTarget as HTMLSelectElement).value;
   if(trainingFocuses(p.position).some(f=>f.id===selection)){
    career.development!.focus=selection as DevelopmentSave['focus'];persist();drawHub();
   }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-attribute]').forEach(b=>b.addEventListener('click',()=>{
   if(simRunning)return;
   const k=b.dataset.attribute!;
   if(upgradeAttribute(career.attributes!,k,career.skillPoints)){
    career.skillPoints--;persist();drawHub();
   }
  }));
  const calendarGrid=root.querySelector<HTMLElement>('[data-calendar-grid]');
  calendarGrid?.addEventListener('click',e=>{
   if(simRunning)return;
   const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-day]');
   if(!button)return;
   selectedDay=Number(button.dataset.day);activeTab='calendar';drawHub();
  });
  root.querySelectorAll<HTMLButtonElement>('[data-month-step]').forEach(b=>b.addEventListener('click',()=>{
   if(simRunning)return;
   visibleMonth=clamp(visibleMonth+Number(b.dataset.monthStep),0,months.length-1);
   activeTab='calendar';drawHub();
  }));
  const input=root.querySelector<HTMLInputElement>('[data-target-date]');
  input?.addEventListener('change',()=>{
   if(simRunning)return;
   selectedDay=Math.max(season.day,seasonDay(input.value,season.startDate));
   visibleMonth=Math.max(0,months.indexOf(dateAt(season,selectedDay).slice(0,7)));
   activeTab='calendar';drawHub();
  });
  root.querySelector<HTMLSelectElement>('[data-sim-speed]')?.addEventListener('change',e=>{
   const speed=Number((e.currentTarget as HTMLSelectElement).value);
   simDelay=[35,70,130].includes(speed)?speed:70;
  });
  root.querySelector<HTMLButtonElement>('[data-sim-target]')?.addEventListener('click',()=>{
   if(simRunning){cancelSim();selectedDay=season.day;activeTab='calendar';drawHub();return;}
   if(selectedDay<=season.day)return;
   simTarget=selectedDay;simRunning=true;
   const button=root.querySelector<HTMLButtonElement>('[data-sim-target]');
   if(button)button.textContent='STOP SIM';
   const progress=root.querySelector<HTMLProgressElement>('[data-sim-progress]');
   if(progress){progress.hidden=false;progress.max=simTarget;progress.value=season.day;}
   const status=root.querySelector<HTMLElement>('[data-sim-status]');
   if(status)status.textContent='Advancing day by day from '+dateAt(season,season.day)+'…';
   simTimer=setTimeout(simTick,simDelay);
  });
 };
 let activeTab='home';
 let statsSelectedYear:number|null=null;
 let statsScope:'regular'|'playoffs'|'combined'='combined';
 const startPlayoffGame=(post:PlayoffSave,series:PlayoffSave['series'][number])=>{
  // The engine controls the first side. Even as the lower seed, the player
  // must skate for their own club and scores must map back to bracket seeds.
  const reversed=series.seedB===career.teamId;
  const home=getTeam(reversed?series.seedB:series.seedA);
  const away=getTeam(reversed?series.seedA:series.seedB);
  return mountHockeyMatch(root,p.position==='G',{...career,...matchRatings(career.attributes!,p.position)},(result)=>{
   // Until on-ice overtime is added, resolve regulation ties as a short
   // simulated extra-time goal before recording the elimination result.
   const overtime=result.home===result.away;
   const homeGoals=overtime&&Math.random()>.5?result.home+1:result.home;
   const awayGoals=overtime&&homeGoals===result.home?result.away+1:result.away;
   const a=reversed?awayGoals:homeGoals;
   const b=reversed?homeGoals:awayGoals;
   recordPlayoffGame(post,series,a,b);
   nextSeries(post);
   const own=homeGoals,against=awayGoals;
   addPlayoffResult(career.playoffLedger!,post.seasonYear+':'+series.round+':'+series.seedA+':'+series.seedB+':'+series.results.length,
    {goals:p.position==='G'?0:result.goals,assists:p.position==='G'?0:result.assists,
     saves:p.position==='G'?result.saves:0,shotsAgainst:p.position==='G'?Math.max(result.awayShots,result.saves+against):0,
     goalsAgainst:p.position==='G'?against:0,won:own>against,simulated:false});
   career.games++;if(own>against)career.wins++;else career.losses++;
   career.development!.scoutingObservations+=2;
   applyCareerResult(career.positionStats!,p.position,own,against,
    {goals:result.goals,assists:result.assists,saves:result.saves,
     shotsAgainst:result.awayShots},false,career.periodMinutes!*3);
   addXP(playedGameXP(result.goals,result.assists,result.saves,own>against));
   checkMilestoneAwards(career.trophyCase!,career.positionStats!,p.position,
    Number(career.season!.startDate.slice(0,4)),leagueTitle(career.startingPath!));
   persist();
  },()=>{activeTab='playoffs';drawHub();},(minutes)=>{
   career.periodMinutes=minutes;persist();
  },home,away,startPace(career.startingPath!),leagueTitle(career.startingPath!)+' · PLAYOFFS');
 };
 const startMatch=(fixture:Fixture)=>{
  const season=career.season!;
  // Skip off-days and simulate other clubs up to the day before this game.
  creditSimulation(season,Math.max(season.day,fixture.day-1));
  season.day=Math.max(season.day,fixture.day);
  persist();
  const home=getTeam(career.teamId);
  const opponent=getTeam(fixture.homeId===home.id?fixture.awayId:fixture.homeId);
  return mountHockeyMatch(root,p.position==='G',{...career,...matchRatings(career.attributes!,p.position)},(result)=>{
   recordUserResult(season,fixture,result.home,result.away);
   creditSimulation(season,season.day);
   career.development!.scoutingObservations+=2;
   career.games+=1;
   addPlayedStat(career.seasonLedger!,fixture.id,p.position,result.home,result.away,
    {goals:result.goals,assists:result.assists,saves:result.saves,shotsAgainst:result.awayShots});
   applyCareerResult(career.positionStats!,p.position,result.home,result.away,{goals:result.goals,assists:result.assists,saves:result.saves,shotsAgainst:result.awayShots},false,career.periodMinutes!*3);
   if(result.home>result.away)career.wins++;else if(result.home<result.away)career.losses++;
   career.goals+=result.goals;career.assists+=result.assists;career.saves+=result.saves;
   addXP(playedGameXP(result.goals,result.assists,result.saves,result.home>result.away));
   checkMilestoneAwards(career.trophyCase!,career.positionStats!,p.position,
    Number(season.startDate.slice(0,4)),leagueTitle(career.startingPath!));
   persist();
  },()=>{activeTab='home';drawHub();},(minutes)=>{
   career.periodMinutes=minutes;persist();
  },home,opponent,startPace(career.startingPath!),leagueTitle(career.startingPath!));
 };
 drawHub();
}
