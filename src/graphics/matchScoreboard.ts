import type {HockeyMatch} from '../game/hockeyMatchEngine';

/** Broadcast-style hockey scoreboard, independent of camera transforms.
 * Intentionally uses the career's placeholder team codes until team
 * identities are available from the career save.
 */
export function drawMatchScoreboard(c:CanvasRenderingContext2D,m:HockeyMatch):void{
 const remaining=Math.max(0,Math.ceil(m.timeRemaining));
 const clock=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
 const x=17,y=15;
 c.save();
 c.shadowColor='rgba(0,11,22,.32)';c.shadowBlur=13;c.shadowOffsetY=3;
 c.fillStyle='#122333';c.beginPath();c.roundRect(x,y,344,77,7);c.fill();
 c.shadowBlur=0;c.shadowOffsetY=0;
 c.fillStyle='#20384b';c.fillRect(x+174,y+4,1,69);
 for(let team=0;team<2;team++){
  const row=y+4+team*35,home=team===0;
  c.fillStyle=home?'#ad3c4b':'#23649b';c.fillRect(x+4,row,6,32);
  c.fillStyle=home?'#71343d':'#214e77';c.fillRect(x+10,row,122,32);
  c.textAlign='left';c.textBaseline='middle';
  c.fillStyle='#f4f8fc';c.font='bold 18px system-ui';
  c.fillText(home?'HME':'AWY',x+22,row+16);
  c.fillStyle='#f7fafc';c.fillRect(x+132,row,37,32);
  c.fillStyle='#142838';c.font='bold 21px system-ui';c.textAlign='center';
  c.fillText(String(m.scores[team]),x+151,row+16);
 }
 c.textAlign='center';c.fillStyle='#f5faff';c.font='bold 25px system-ui';
 c.fillText(clock,x+265,y+24);
 c.fillStyle='#9ac3d5';c.font='bold 11px system-ui';
 const p=m.period===1?'1ST':m.period===2?'2ND':'3RD';
 c.fillText(p+' PERIOD',x+266,y+44);
 c.fillStyle='#e6eff5';c.font='bold 11px system-ui';
 c.fillText('SOG   '+m.shots[0]+'  –  '+m.shots[1],x+266,y+62);
 c.restore();
 if(m.phase==='goal'){
  const away=m.message.includes('AWAY');
  c.save();
  const gx=386,gy=20;
  const grad=c.createLinearGradient(gx,gy,gx+205,gy);
  grad.addColorStop(0,'#087e8e');grad.addColorStop(1,'#00bac1');
  c.shadowColor='rgba(0,17,30,.4)';c.shadowBlur=12;
  c.fillStyle=grad;c.beginPath();c.roundRect(gx,gy,196,63,6);c.fill();
  c.shadowBlur=0;c.textBaseline='middle';c.textAlign='center';
  c.fillStyle='#f7ffff';c.font='900 30px system-ui';
  c.fillText('GOAL!',gx+98,gy+26);
  c.font='bold 12px system-ui';
  c.fillText((away?'AWAY':'HOME')+' SCORES',gx+98,gy+49);
  c.restore();
 }
}
