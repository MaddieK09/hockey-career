import type {Position} from '../player/types';
import {statCards,savePercentage,goalsAgainstAverage,type CareerPositionStats} from '../game/careerPositionStats';
export function positionStatsMarkup(position:Position,s:CareerPositionStats):string{
 const positionName:{[P in Position]:string}={
  C:'Centre',LW:'Left Wing',RW:'Right Wing',LD:'Left Defense',RD:'Right Defense',G:'Goaltender'
 };
 const row=(label:string,value:string|number)=>'<div class="position-stat-row"><span>'+label+'</span><strong>'+value+'</strong></div>';
 const cards=statCards(position,s).map(v=>'<div><strong>'+v.value+'</strong><span>'+v.label+'</span></div>').join('');
 const common='<p>'+s.gp+' GP · '+s.wins+' W · '+s.losses+' L · '+s.playedGames+' played · '+s.simulatedGames+' simulated</p>';
 const details=position==='G'
  ?row('Games / wins',s.gp+' / '+s.wins)
   +row('Saves / shots faced',s.saves+' / '+(s.shotsAgainst||'—'))
   +row('Save percentage',savePercentage(s)===null?'—':(savePercentage(s)!*100).toFixed(1)+'%')
   +row('Goals-against average',goalsAgainstAverage(s)===null?'—':goalsAgainstAverage(s)!.toFixed(2))
   +row('Shutouts',s.shutouts)
  :row('Goals / assists / points',s.goals+' / '+s.assists+' / '+(s.goals+s.assists))
   +row('Points per game',s.gp?((s.goals+s.assists)/s.gp).toFixed(2):'—')
   +row('Team goal differential',s.teamGoalsFor-s.teamGoalsAgainst);
 return '<section class="career-stats">'+cards+'</section>'+
  '<section class="career-panel position-profile"><h2>'+positionName[position]+' career stats</h2>'+
  common+details+
  '<p class="career-muted">Simulated games use projected contributions; played games use recorded performance. Historical save percentage may be unavailable for older careers.</p></section>';
}
