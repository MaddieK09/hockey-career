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
export function drawSideHockey(c:CanvasRenderingContext2D,match:HockeyMatch,mode:CameraMode,time:number):void{
 const player=match.goalieCareer?match.goalies[0]:match.skaters[match.selected];
 const focus=mode==='broadcast'?400:mode==='sideline'?400:mode==='goalie'?match.goalies[0].x:player.x;
 const zoom=mode==='player'?1.65:mode==='goalie'?1.36:mode==='sideline'?1.12:1;
 const cameraX=clamp(focus,400/zoom,800-400/zoom);
 const project=(x:number,y:number)=>{
  const depth=clamp((y-24)/392,0,1);
  return {x:400+(x-cameraX)*zoom,y:132+depth*210,scale:(.66+depth*.50)*(mode==='player'?1.07:1)};
 };
 // Arena backdrop: seating, glass, boards and a slanted ice plane.
 const sky=c.createLinearGradient(0,0,0,290);
 sky.addColorStop(0,'#10273c');sky.addColorStop(.65,'#294a61');sky.addColorStop(1,'#8cb1c7');
 c.fillStyle=sky;c.fillRect(0,0,800,440);
 for(let r=0;r<4;r++){
  c.fillStyle=r%2?'#1a364b':'#193146';c.fillRect(0,18+r*27,800,21);
  for(let x=12;x<800;x+=24){ellipse(c,x+(r%2)*11,30+r*27,4,3,r%2?'#456478':'#527185');}
 }
 c.fillStyle='#d5e5ed';c.fillRect(0,110,800,9);
 c.fillStyle='rgba(205,236,249,.25)';c.fillRect(0,119,800,19);
 c.strokeStyle='rgba(238,249,255,.5)';c.lineWidth=1;
 for(let x=0;x<=800;x+=70){c.beginPath();c.moveTo(x,113);c.lineTo(x,158);c.stroke();}
 const ice=c.createLinearGradient(0,135,0,440);
 ice.addColorStop(0,'#d5ebf5');ice.addColorStop(.5,'#f4fcff');ice.addColorStop(1,'#c6e4f2');
 c.fillStyle=ice;c.beginPath();c.moveTo(0,132);c.lineTo(800,132);c.lineTo(800,440);c.lineTo(0,440);c.closePath();c.fill();
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
 for(const x of [59,741]){
  const p=project(x,220);
  c.save();c.translate(p.x,p.y);
  c.fillStyle='rgba(83,164,210,.22)';c.beginPath();c.ellipse(0,0,40*zoom,25,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#cf4254';c.lineWidth=5;
  c.strokeRect(-9*zoom,-48,18*zoom,48);
  for(let k=1;k<5;k++)line(c,-9*zoom,-48+k*10,9*zoom,-48+k*10,1.2,'#9bb5c4');
  c.restore();
 }
 const characters:{x:number;y:number;goalie:boolean;team:0|1;number:number;speed:number;pose:string;selected:boolean}[]=[
  ...match.skaters.map((s,i)=>({x:s.x,y:s.y,goalie:false,team:s.team,number:s.team===0?10+i:17+i-5,
   speed:Math.hypot(s.vx,s.vy),pose:s.shotAnimation>0?'shoot':'skate',selected:!match.goalieCareer&&match.selected===i})),
  ...match.goalies.map(g=>({x:g.x,y:g.y,goalie:true,team:g.team,number:g.team===0?10:30,
   speed:0,pose:g.pose,selected:match.goalieCareer&&g.team===0}))
 ];
 // Draw back-to-front so players correctly overlap on the ice.
 characters.sort((a,b)=>a.y-b.y);
 for(const a of characters){
  const p=project(a.x,a.y),s=p.scale*zoom*(mode==='player'?.98:1);
  const red=a.team===0,shirt=red?'#c63c50':'#245c9a',trim=red?'#fff3e9':'#dbeefa';
  c.save();c.translate(p.x,p.y);c.scale(s,s);
  ellipse(c,2,2,18,5,'rgba(16,43,64,.22)');
  const step=Math.sin(time*12+a.number)*Math.min(1,a.speed/160)*7;
  const low=a.pose==='butterfly';
  // Upright skates, trousers, padded legs and a real torso silhouette.
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
  c.fillStyle='#132c42';c.fillRect(-13,-35,26,17);
  c.fillStyle=shirt;c.beginPath();c.moveTo(-18,-66);c.lineTo(18,-66);c.lineTo(16,-32);c.lineTo(-16,-32);c.closePath();c.fill();
  line(c,-16,-39,16,-39,3,trim);line(c,-17,-60,17,-60,3,trim);
  line(c,-17,-61,-26,-43,a.goalie?12:9,shirt);
  line(c,17,-61,27,-43,a.goalie?12:9,shirt);
  if(a.goalie){
   ellipse(c,-28,-42,11,10,'#f4f8fb');
   c.strokeStyle='#829aa9';c.lineWidth=1.4;c.strokeRect(20,-50,15,16);
  }else{
   ellipse(c,-26,-42,5,6,'#1c2d40');ellipse(c,27,-42,5,6,'#1c2d40');
  }
  // Helmet encloses the head, cage wraps the face.
  ellipse(c,0,-75,12,14,red?'#f6f6f2':'#183d67');
  c.fillStyle='#d8e6ef';c.fillRect(-9,-77,18,12);
  for(const x of [-7,0,7])line(c,x,-77,x,-65,1.5,'#5e798c');
  for(const y of [-74,-68])line(c,-9,y,9,y,1.3,'#5e798c');
  if(a.goalie){line(c,0,-87,0,-64,1.6,'#69889d');}
  c.fillStyle=trim;c.font='bold 12px system-ui';c.textAlign='center';c.fillText(String(a.number),0,-45);
  // Stick, catcher and blocker are visually distinct.
  line(c,27,-44,33,-5,3.4,'#b78d61');
  line(c,33,-5,51,-3,5,'#1a2b3a');
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
}
