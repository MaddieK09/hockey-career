import {newSeason,normalizeSeason,dateAt,seasonDay,dayPlan,MAX_SEASON_DAY,simulateThrough,nextUserFixture,recordUserResult,leagueStandings,botStats,type SeasonSave,type Fixture} from '../game/seasonLeague';
import {DEFAULT_TEAM_ID,getTeam,nextOpponent,teamChoiceOptions} from '../game/fictionalLeague';
import {loadPeriodMinutes,validPeriodMinutes,type PeriodMinutes} from '../config/matchSettings';
import type {PlayerDraft} from '../player/types';
import {playerPortrait} from '../graphics/playerPortrait';
import {mountHockeyMatch} from './hockeyMatch';
import {drawHockeyCharacter,drawRink} from '../graphics/animatedHockey2d';

export interface CareerSave {
 player:PlayerDraft; teamId?:string; season?:SeasonSave; periodMinutes?:PeriodMinutes; games:number;wins:number;losses:number;goals:number;assists:number;saves:number;
 xp:number;level:number;skillPoints:number;speed:number;shot:number;handling:number;defense:number;
}
const KEY='hockey-career-save-v1';
export function loadCareer():CareerSave|null {
 try {const raw=localStorage.getItem(KEY);if(!raw)return null;const s=JSON.parse(raw) as CareerSave;return s?.player&&Number.isFinite(s.games)?s:null;}catch{return null;}
}
export function startCareer(p:PlayerDraft):CareerSave {
 const s:CareerSave={player:p,teamId:DEFAULT_TEAM_ID,season:newSeason(DEFAULT_TEAM_ID),periodMinutes:loadPeriodMinutes(),games:0,wins:0,losses:0,goals:0,assists:0,saves:0,xp:0,level:1,skillPoints:0,speed:50,shot:50,handling:50,defense:50};
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
 let selectedDay=career.season.day;
 const persist=()=>saveCareer(career);
 // The season is seven browsable months rather than a single 197-cell strip.
 const months=[...new Set(Array.from({length:MAX_SEASON_DAY+1},(_,i)=>dateAt(career.season!,i).slice(0,7)))];
 let visibleMonth=Math.max(0,months.indexOf(dateAt(career.season,selectedDay).slice(0,7)));
 let simRunning=false;
 let simTimer:ReturnType<typeof setTimeout>|null=null;
 let simDelay=70;
 let simTarget=career.season.day;
 const cancelSim=()=>{
  if(simTimer!==null){clearTimeout(simTimer);simTimer=null;}
  simRunning=false;
 };
 const monthTitle=()=>new Date(months[visibleMonth]+'-01T12:00:00Z')
  .toLocaleDateString('en-CA',{month:'long',year:'numeric',timeZone:'UTC'});
 const renderCalendarMonth=()=>{
  const season=career.season!,month=months[visibleMonth];
  const first=new Date(month+'-01T12:00:00Z').getUTCDay();
  const pads=(first+6)%7; // Monday-first column order
  let html=Array.from({length:pads},()=>'<span class="season-day-empty"></span>').join('');
  for(let d=0;d<=MAX_SEASON_DAY;d++){
   const iso=dateAt(season,d);if(iso.slice(0,7)!==month)continue;
   const plan=dayPlan(season,d),fixture=plan.fixture;
   const score=fixture&&fixture.homeGoals!==undefined&&fixture.awayGoals!==undefined
    ?'<em class="season-day-score">'+fixture.homeGoals+'–'+fixture.awayGoals+'</em>':'';
   const content=fixture
    ?'<small class="season-day-match">'+getTeam(fixture.homeId).abbr+' vs. '+getTeam(fixture.awayId).abbr+'</small>'+score
    :'<small class="season-day-activity '+(plan.kind==='rest'?'season-rest':'season-training')+'">'+(plan.kind==='rest'?'R':'T')+'</small>';
   html+='<button type="button" data-day="'+d+'" class="season-date'+
    (selectedDay===d?' selected':'')+(d<season.day?' elapsed':'')+
    (d===season.day?' current':'')+(fixture?' player-game':'')+
    '" title="'+iso+' · '+(fixture?getTeam(fixture.homeId).abbr+' vs. '+getTeam(fixture.awayId).abbr:plan.kind)+
    '"><span class="season-day-number">'+iso.slice(8)+'</span>'+content+'</button>';
  }
  return html;
 };
 const renderDayResults=(day:number)=>{
  const season=career.season!,games=season.fixtures.filter(f=>f.day===day);
  if(!games.length){
   const plan=dayPlan(season,day);
   return '<div class="season-sim-line">'+(plan.kind==='rest'?'R · REST DAY':'T · TRAINING DAY')+' — '+dateAt(season,day)+'</div>';
  }
  return games.map(f=>'<div class="season-sim-line"><span>'+
   getTeam(f.homeId).abbr+' vs. '+getTeam(f.awayId).abbr+'</span><strong>'+
   (f.homeGoals!==undefined?f.homeGoals+'–'+f.awayGoals:'Scheduled')+'</strong></div>').join('');
 };
 const simTick=()=>{
  if(!simRunning)return;
  if(!root.isConnected||!root.querySelector('[data-calendar-grid]')){cancelSim();return;}
  const season=career.season!;
  if(season.day>=simTarget){cancelSim();selectedDay=season.day;activeTab='calendar';drawHub();return;}
  // Simulate the opening day's fixtures before advancing the calendar.
  // Otherwise Oct 1 scores only appear once the clock reaches Oct 2.
  const hasUnplayedToday=season.fixtures.some(f=>f.day===season.day&&f.homeGoals===undefined);
  const next=hasUnplayedToday?season.day:season.day+1;
  const summary=simulateThrough(season,next);
  career.games+=summary.userGames;career.wins+=summary.wins;career.losses+=summary.losses;
  persist();
  selectedDay=season.day;
  const currentMonth=months.indexOf(dateAt(season,season.day).slice(0,7));
  if(currentMonth>=0)visibleMonth=currentMonth;
  const grid=root.querySelector<HTMLElement>('[data-calendar-grid]');
  const monthName=root.querySelector<HTMLElement>('[data-month-name]');
  const current=root.querySelector<HTMLElement>('[data-calendar-today]');
  const progress=root.querySelector<HTMLProgressElement>('[data-sim-progress]');
  const status=root.querySelector<HTMLElement>('[data-sim-status]');
  const results=root.querySelector<HTMLElement>('[data-sim-results]');
  if(grid)grid.innerHTML=renderCalendarMonth();
  if(monthName)monthName.textContent=monthTitle();
  if(current)current.textContent=dateAt(season,season.day);
  if(progress){progress.value=season.day;progress.max=simTarget;}
  if(status)status.textContent='SIMULATING · '+dateAt(season,season.day)+' · Day '+season.day+' / '+simTarget;
  if(results)results.innerHTML=renderDayResults(season.day);
  if(season.day>=simTarget){cancelSim();activeTab='calendar';drawHub();return;}
  simTimer=setTimeout(simTick,simDelay);
 };
 const name=(p.firstName+' '+p.lastName).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
 const drawHub=()=>{
  match?.stop();match=null;
  const season=career.season!,home=getTeam(career.teamId),fixture=nextUserFixture(season);
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
  root.innerHTML=`<main class="career-shell">
   <header class="career-top"><button data-menu>← Menu</button><strong>FICTIONAL DEVELOPMENT LEAGUE</strong><span>LEVEL ${career.level}</span></header>
   <section class="career-hero"><div class="career-avatar">${playerPortrait(p.appearance,p.equipment)}</div><div><p class="eyebrow">ROOKIE SEASON · DEVELOPMENT LEAGUE</p><h1>${name}</h1><p>#${p.jerseyNumber} · ${p.position} · ${p.nationality}</p><p>${career.games} GP · ${career.wins} W · ${career.losses} L</p></div></section>
   <section class="career-stats"><div><strong>${career.goals}</strong><span>Goals</span></div><div><strong>${career.assists}</strong><span>Assists</span></div><div><strong>${career.saves}</strong><span>Saves</span></div><div><strong>${career.xp}</strong><span>XP</span></div></section>
   <nav class="season-tabs" aria-label="Career sections"><button data-tab="home">Hub</button><button data-tab="calendar">Calendar</button><button data-tab="standings">Standings</button><button data-tab="stats">League stats</button></nav>
   <div data-season-view="home">
    <section class="career-panel"><h2>Next scheduled game</h2><p>${fixture&&away?home.city+' '+home.name+' vs. '+away.city+' '+away.name+' · '+dateAt(season,fixture.day):'Season schedule complete'} · 3 × ${career.periodMinutes}-minute periods</p><button class="career-primary" data-play ${fixture?'':'disabled'}>PLAY NEXT GAME 🏒</button><p class="career-muted">Current season day: ${current}. Upcoming games can be played or simulated from the calendar.</p></section>
    <section class="career-panel"><h2>Player development</h2><p>Earn XP by playing games to level up and unlock attribute points.</p><div class="skill-grid">${(['speed','shot','handling','defense'] as const).map(k=>`<div class="skill-row"><span>${k.toUpperCase()} · ${career[k]}</span><button data-skill="${k}" ${career.skillPoints<1||career[k]>=99?'disabled':''}>+ Upgrade</button></div>`).join('')}</div><p>Available skill points: <b>${career.skillPoints}</b></p></section>
    <section class="career-panel"><h2>Your team</h2><p>Change clubs before the season begins. Once a game is complete, the season stays attached to your team.</p><select data-team-choice ${season.fixtures.some(f=>f.homeGoals!==undefined)?'disabled':''}>${teamChoiceOptions(home.id)}</select></section>
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
  const showTab=(tab:string)=>{tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));root.querySelectorAll<HTMLElement>('[data-season-view]').forEach(v=>v.hidden=v.dataset.seasonView!==tab);};
  tabs.forEach(b=>b.addEventListener('click',()=>{if(simRunning)return;activeTab=b.dataset.tab!;showTab(activeTab);}));
  showTab(activeTab);
  root.querySelector('[data-play]')?.addEventListener('click',()=>{if(fixture&&!simRunning){cancelSim();match=startMatch(fixture);}});
  root.querySelector<HTMLSelectElement>('[data-team-choice]')?.addEventListener('change',e=>{
   if(simRunning)return;
   career.teamId=getTeam((e.currentTarget as HTMLSelectElement).value).id;
   career.season=newSeason(career.teamId,season.startDate);selectedDay=0;visibleMonth=0;
   persist();drawHub();
  });
  root.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(b=>b.addEventListener('click',()=>{
   if(simRunning)return;
   const k=b.dataset.skill as 'speed'|'shot'|'handling'|'defense';
   if(career.skillPoints&&career[k]<99){career[k]=clamp(career[k]+3,0,99);career.skillPoints--;persist();drawHub();}
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
 const startMatch=(fixture:Fixture)=>{
  const season=career.season!;
  // Skip off-days and simulate other clubs up to the day before this game.
  const warmup=simulateThrough(season,Math.max(season.day,fixture.day-1));
  career.games+=warmup.userGames;career.wins+=warmup.wins;career.losses+=warmup.losses;
  season.day=Math.max(season.day,fixture.day);
  persist();
  const home=getTeam(career.teamId);
  const opponent=getTeam(fixture.homeId===home.id?fixture.awayId:fixture.homeId);
  return mountHockeyMatch(root,p.position==='G',career,(result)=>{
   recordUserResult(season,fixture,result.home,result.away);
   const after=simulateThrough(season,season.day);
   career.games+=1+after.userGames;
   if(result.home>result.away)career.wins++;else if(result.home<result.away)career.losses++;
   career.wins+=after.wins;career.losses+=after.losses;
   career.goals+=result.goals;career.assists+=result.assists;career.saves+=result.saves;
   const gained=40+result.goals*35+result.assists*20+result.saves*10+(result.home>result.away?30:0);
   career.xp+=gained;
   const newLevel=1+Math.floor(career.xp/200);
   if(newLevel>career.level){career.skillPoints+=newLevel-career.level;career.level=newLevel;}
   persist();
  },()=>{activeTab='home';drawHub();},(minutes)=>{
   career.periodMinutes=minutes;persist();
  },home,opponent);
 };
 drawHub();
}
