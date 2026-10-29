import {GOAL_HALF_WIDTH,GOAL_HEIGHT} from '../game/puckCollision';
/** Side-on 2D hockey presentation, projected from the existing rink simulation.
 * This is NOT a top-down sprite view. Skaters have full-height illustrated bodies.
 */
import type {HockeyMatch} from '../game/hockeyMatchEngine';
export type CameraMode='player'|'broadcast'|'sideline'|'goalie'|'overhead';
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const ellipse=(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string)=>{
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
};
const line=(c:CanvasRenderingContext2D,x:number,y:number,ex:number,ey:number,width:number,color:string)=>{
 c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.lineWidth=width;c.lineCap='round';c.strokeStyle=color;c.stroke();
};
let smoothedCameraX=400,smoothedCameraY=220,lastCameraMode:CameraMode|null=null;
export function drawSideHockey(c:CanvasRenderingContext2D,match:HockeyMatch,mode:CameraMode,time:number):void{
 const player=match.goalieCareer?match.goalies[0]:match.skaters[match.selected];
 // The camera angles must actually be different, not five names for the same
 // flat side view. A following camera tracks the controlled player; goalie
 // follows the crease and shot lane; broadcast keeps both nets in view.
 const zoom=mode==='player'?2.15:mode==='goalie'?1.65:mode==='sideline'?1.48:1.12;
 const focusX=mode==='broadcast'?400+(match.puck.x-400)*.65:mode==='sideline'?match.puck.x:
  mode==='goalie'?match.goalies[0].x*.7+match.puck.x*.3:player.x;
 const focusY=mode==='player'?player.y:mode==='goalie'?220:mode==='sideline'?match.puck.y:220;
 if(lastCameraMode!==mode){smoothedCameraX=focusX;smoothedCameraY=focusY;lastCameraMode=mode;}
 smoothedCameraX+=(focusX-smoothedCameraX)*(mode==='broadcast'?.08:.15);
 smoothedCameraY+=(focusY-smoothedCameraY)*.12;
 const cameraX=clamp(smoothedCameraX,400/zoom,800-400/zoom);
 const project=(x:number,y:number)=>{
  const depth=clamp((y-24)/392,0,1);
  const vertical=mode==='sideline'?280:mode==='goalie'?275:mode==='player'?285:235;
  const base=mode==='player'?175:mode==='goalie'?148:130;
  return {x:400+(x-cameraX)*zoom,y:base+(depth-(mode==='player'?(smoothedCameraY-24)/392:0))*vertical,
   scale:(.62+depth*.48)*(mode==='player'?1.17:mode==='goalie'?1.12:mode==='sideline'?1.08:1)};
 };
 // Arena backdrop: seating, glass, boards and a slanted ice plane.
 const sky=c.createLinearGradient(0,0,0,290);
 sky.addColorStop(0,'#10273c');sky.addColorStop(.65,'#294a61');sky.addColorStop(1,'#8cb1c7');
 c.fillStyle=sky;c.fillRect(0,0,800,440);
 for(let r=0;r<4;r++){
  c.fillStyle=r%2?'#1a364b':'#193146';c.fillRect(0,18+r*27,800,21);
  for(let x=12;x<800;x+=24){ellipse(c,x+(r%2)*11,30+r*27,4,3,r%2?'#456478':'#527185');}
 }
 // Overhead arena lamps and scoreboard ribbon.
 c.fillStyle='#dbeaf5';for(let x=35;x<800;x+=135){c.fillRect(x,8,68,3);}
 c.fillStyle='#0c1d2c';c.fillRect(0,101,800,16);
 c.fillStyle='#e6f6ff';c.font='bold 11px system-ui';c.textAlign='center';
 c.fillText(match.teams[0].abbr+'  '+match.scores[0]+'   -   '+match.scores[1]+'  '+match.teams[1].abbr,400,113);
 c.fillStyle='#d5e5ed';c.fillRect(0,120,800,9);
 c.fillStyle='rgba(205,236,249,.25)';c.fillRect(0,129,800,19);
 c.strokeStyle='rgba(238,249,255,.5)';c.lineWidth=1;
 for(let x=0;x<=800;x+=70){c.beginPath();c.moveTo(x,113);c.lineTo(x,158);c.stroke();}
 const ice=c.createLinearGradient(0,135,0,440);
 ice.addColorStop(0,'#d5ebf5');ice.addColorStop(.5,'#f4fcff');ice.addColorStop(1,'#c6e4f2');
 c.fillStyle=ice;c.fillRect(0,132,800,308);
 // Ice skate scratches and long arena reflections, subtle enough to preserve puck visibility.
 c.strokeStyle='rgba(255,255,255,.42)';c.lineWidth=1;
 for(let i=0;i<18;i++){const y=166+i*15;c.beginPath();c.moveTo((i*137)%500,y);c.lineTo(800,y+3);c.stroke();}
 const sheen=c.createLinearGradient(0,130,0,440);
 sheen.addColorStop(0,'rgba(255,255,255,.35)');sheen.addColorStop(.5,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(43,124,168,.1)');
 c.fillStyle=sheen;c.fillRect(0,132,800,308);
 const rinkLine=(x:number,color:string,width:number)=>{
  const p=project(x,24),q=project(x,416);line(c,p.x,p.y,q.x,q.y,width*zoom,color);
 };
 rinkLine(400,'rgba(195,48,70,.65)',3);
 rinkLine(262,'rgba(49,124,185,.6)',4);rinkLine(538,'rgba(49,124,185,.6)',4);
 for(const x of [166,634]){
  const p=project(x,220);
  c.save();c.translate(p.x,p.y);c.scale(zoom,.37);
  c.beginPath();c.arc(0,0,46,0,Math.PI*2);c.strokeStyle='rgba(184,55,77,.52)';c.lineWidth=2;c.stroke();c.restore();
 }
 for(const x of [60,740]){
  const p=project(x,220);
  c.save();c.translate(p.x,p.y);
  c.fillStyle='rgba(83,164,210,.22)';c.beginPath();c.ellipse(0,0,40*zoom,GOAL_HALF_WIDTH*.48,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#cf4254';c.lineWidth=5;
  const netDepth=12*zoom,netHeight=GOAL_HEIGHT*.82;
  c.strokeRect(-netDepth,-netHeight,netDepth*2,netHeight);
  for(let k=1;k<7;k++)line(c,-netDepth,-netHeight+k*netHeight/7,netDepth,-netHeight+k*netHeight/7,1.2,'#9bb5c4');
  for(let k=1;k<5;k++)line(c,-netDepth+k*netDepth*2/5,-netHeight,-netDepth+k*netDepth*2/5,0,1,'#9bb5c4');
  c.restore();
 }
 const characters:{x:number;y:number;goalie:boolean;team:0|1;number:number;speed:number;pose:string;selected:boolean;vx:number}[]=[
  ...match.skaters.map((s,i)=>({x:s.x,y:s.y,goalie:false,team:s.team,number:s.team===0?10+i:17+i-5,
   speed:Math.hypot(s.vx,s.vy),pose:s.shotAnimation>0?'shoot':'skate',selected:!match.goalieCareer&&match.selected===i,vx:s.vx})),
  ...match.goalies.map(g=>({x:g.x,y:g.y,goalie:true,team:g.team,number:g.team===0?10:30,
   speed:0,pose:g.pose,selected:match.goalieCareer&&g.team===0,vx:0}))
 ];
 // Draw back-to-front so players correctly overlap on the ice.
 characters.sort((a,b)=>a.y-b.y);
 for(const a of characters){
  const p=project(a.x,a.y),s=p.scale*(mode==='player'?1.26:mode==='goalie'?1.12:mode==='broadcast'?.70:.79);
  const red=a.team===0,shirt=match.teams[a.team].primary,trim=match.teams[a.team].accent;
  c.save();c.translate(p.x,p.y);c.scale(s,s);
  // Body direction changes with team and attacking direction.
  // Goalie always faces toward center ice.
  const facing=a.goalie?(a.team===0?1:-1):(Math.abs(a.vx)>25?(a.vx>0?1:-1):(a.team===0?1:-1));
  c.scale(facing,1);
  if(!a.goalie)c.rotate(Math.min(.13,a.speed/180*.13)*facing);
  ellipse(c,2,2,18,5,'rgba(16,43,64,.22)');
  const step=Math.sin(time*(8+Math.min(9,a.speed/22))+a.number)*Math.min(1,a.speed/160)*11;
  const low=a.pose==='butterfly';
  // Upright skates, trousers, padded legs and a real torso silhouette.
  // Knee flex and skate push are phase-shifted for each player.
  const crouch=a.goalie?(low?12:4):Math.min(8,a.speed/32);
  c.translate(0,crouch*.35);
  for(const side of [-1,1]){
   const offset=side*9;
   const stride=a.goalie?0:step*side;
   line(c,offset,-19,offset+stride,-4,a.goalie?14:8,a.goalie?'#e9f2f8':'#172a3d');
   line(c,offset+stride-7,-2,offset+stride+8,-2,4,'#132739');
   if(a.goalie){
    c.fillStyle='#f4f8fa';c.strokeStyle='#9eb2c1';c.lineWidth=1.3;
    c.fillRect(offset-7+(low?side*5:0),-28,14,27);c.strokeRect(offset-7+(low?side*5:0),-28,14,27);
    for(let j=0;j<3;j++)line(c,offset-5+(low?side*5:0),-22+j*7,offset+5+(low?side*5:0),-22+j*7,1,'#9caebd');
   }
  }
  c.fillStyle='#132c42';c.beginPath();c.moveTo(-14,-35);c.lineTo(15,-35);c.lineTo(12,-18);c.lineTo(-11,-18);c.closePath();c.fill();
  line(c,-12,-25,12,-25,2,'#526f85');
  // Shoulder pads, tapered jersey and colored elbow bands.
  c.fillStyle='#0d2436';c.beginPath();c.moveTo(-13,-67);c.lineTo(15,-67);c.lineTo(21,-57);c.lineTo(14,-33);c.lineTo(-15,-33);c.lineTo(-21,-57);c.closePath();c.fill();
  c.fillStyle=shirt;c.beginPath();c.moveTo(-13,-66);c.lineTo(15,-66);c.lineTo(19,-56);c.lineTo(14,-35);c.lineTo(-14,-35);c.lineTo(-19,-56);c.closePath();c.fill();
  line(c,-16,-51,17,-51,1.5,'rgba(255,255,255,.28)');
  line(c,-16,-39,16,-39,3,trim);line(c,-17,-60,17,-60,3,trim);
  line(c,-14,-36,14,-36,2,'#173149');
  const armSwing=a.goalie?0:step*.65;
  line(c,-17,-61,-26+armSwing,-43,a.goalie?12:9,shirt);
  line(c,17,-61,27-armSwing,-43,a.goalie?12:9,shirt);
  line(c,-24+armSwing,-46,-27+armSwing,-42,4,trim);
  line(c,25-armSwing,-46,28-armSwing,-42,4,trim);
  if(a.goalie){
   ellipse(c,-28,-42,11,10,'#f4f8fb');
   c.strokeStyle='#829aa9';c.lineWidth=1.4;c.strokeRect(20,-50,15,16);
  }else{
   ellipse(c,-26,-42,5,6,'#1c2d40');ellipse(c,27,-42,5,6,'#1c2d40');
  }
  // Side-profile helmet: domed shell, rear ear cup, face opening and cage.
  ellipse(c,-2,-76,13,14,red?'#f1f3f5':'#173b62');
  ellipse(c,-10,-74,5,6,'#8ba6b9');
  ellipse(c,8,-72,7,9,'#c9d9e4');
  c.strokeStyle='#49657a';c.lineWidth=2;c.beginPath();c.arc(-2,-76,13,Math.PI*1.18,Math.PI*1.91);c.stroke();
  line(c,10,-82,17,-76,2,'#6e8597');
  line(c,17,-76,15,-65,2,'#6e8597');
  for(const y of [-78,-73,-68])line(c,9,y,17,y+1,1.5,'#4e697c');
  line(c,13,-79,13,-66,1.5,'#4e697c');
  if(a.goalie){line(c,6,-88,13,-65,2,'#718b9e');}
  c.fillStyle=trim;c.font='bold 12px system-ui';c.textAlign='center';c.fillText(String(a.number),0,-45);
  // Stick, catcher and blocker are visually distinct.
  if(a.pose==='shoot'&&!a.goalie){line(c,27,-44,34,-23,3,'#b78d61');}
  line(c,27,-44,31,-10,3.4,'#b78d61');
  line(c,31,-10,45,-7,5,'#1a2b3a');
  line(c,45,-7,52,-9,3,'#182b3c');
  if(a.selected){
   c.strokeStyle='#ffd24d';c.lineWidth=3;c.beginPath();c.ellipse(0,2,29,8,0,0,Math.PI*2);c.stroke();
   c.fillStyle='#ffd24d';c.beginPath();c.moveTo(0,-102);c.lineTo(-8,-113);c.lineTo(8,-113);c.closePath();c.fill();
  }
  c.restore();
 }
 const puck=project(match.puck.x,match.puck.y);
 ellipse(c,puck.x,puck.y,8*zoom,4.5*zoom,'#172331');
 c.strokeStyle='#ffcf54';c.lineWidth=2;c.beginPath();c.ellipse(puck.x,puck.y,13*zoom,8*zoom,0,0,Math.PI*2);c.stroke();
 // Non-top-down views show a camera label so orientation is always clear.
 c.fillStyle='rgba(8,30,49,.76)';c.fillRect(12,12,185,30);
 c.fillStyle='#e7f6ff';c.font='bold 13px system-ui';c.textAlign='left';
 c.fillText(mode==='player'?'PLAYER FOLLOW':mode==='goalie'?'GOALIE CREASE':mode==='broadcast'?'TV BROADCAST':'SIDE BOARDS',24,32);
 // Small rink radar keeps the puck visible when the player-follow camera zooms.
 if(mode==='player'||mode==='goalie'){
  c.fillStyle='rgba(9,33,51,.85)';c.fillRect(618,12,169,84);
  c.strokeStyle='#a7d6e9';c.lineWidth=1.5;c.strokeRect(629,23,147,61);
  line(c,702.5,23,702.5,84,1,'#bd6070');
  for(const a of match.skaters){
   ellipse(c,629+a.x/800*147,23+a.y/440*61,2.8,2.8,match.teams[a.team].accent);
  }
  ellipse(c,629+match.puck.x/800*147,23+match.puck.y/440*61,3.5,3.5,'#ffda50');
  const you=project(player.x,player.y);
  if(you.x<0||you.x>800){
   c.fillStyle='#ffda50';c.font='bold 13px system-ui';
   c.fillText(you.x<0?'◀ PLAYER':'PLAYER ▶',you.x<0?25:680,105);
  }
 }
}
