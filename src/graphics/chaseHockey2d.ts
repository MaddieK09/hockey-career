/** NHL-inspired end-zone chase cameras. Perspective is drawn in Canvas 2D;
 * match coordinates remain authoritative and gameplay stays 5-on-5.
 */
import type {HockeyMatch} from '../game/hockeyMatchEngine';
const TAU=Math.PI*2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ln=(c:CanvasRenderingContext2D,x:number,y:number,u:number,v:number,w:number,color:string)=>{
 c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.lineWidth=w;c.strokeStyle=color;c.lineCap='round';c.stroke();
};
const oval=(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string)=>{
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();
};
let cameraDepth=0,cameraLateral=220,previousMode='';
export function drawChaseHockey(c:CanvasRenderingContext2D,m:HockeyMatch,mode:'player'|'goalie',time:number):void{
 const goalieMode=mode==='goalie';
 const controlled=goalieMode?m.goalies[0]:m.skaters[m.selected];
 // Always look toward the opposing end from behind the controlled player.
 const direction=goalieMode?1:(m.skaters[m.selected].team===0?1:-1);
 const goalDepth=direction===1?controlled.x:800-controlled.x;
 if(previousMode!==mode){cameraDepth=goalieMode?60:goalDepth;cameraLateral=goalieMode?220:controlled.y;previousMode=mode;}
 if(goalieMode){cameraDepth=60;cameraLateral=220;}
 else {cameraDepth+=(goalDepth-cameraDepth)*.13;cameraLateral+=(controlled.y-cameraLateral)*.1;}
 const eye=goalieMode?Math.max(0,cameraDepth-125):Math.max(0,cameraDepth-55);
 const horizon=goalieMode?95:117;
 // Perspective: width grows toward camera. Near bodies are much larger.
 const project=(x:number,y:number)=>{
  const along=(direction===1?x:800-x)-eye;
  const depth=Math.max(-30,along);
  const z=clamp((goalieMode?360:260)/((goalieMode?360:260)+depth),goalieMode?.42:.27,1.15);
  return {x:400+(y-cameraLateral)*z*(goalieMode?1.75:1.52),y:horizon+300*z,scale:z*(goalieMode?1.7:1.45),behind:along< -25};
 };
 // Stands and glass.
 const sky=c.createLinearGradient(0,0,0,190);
 sky.addColorStop(0,'#0c1b2b');sky.addColorStop(.7,'#1c3a50');sky.addColorStop(1,'#7297af');
 c.fillStyle=sky;c.fillRect(0,0,800,440);
 for(let row=0;row<5;row++){
  c.fillStyle=row%2?'#223c50':'#172e40';c.fillRect(0,20+row*17,800,15);
  for(let x=8;x<800;x+=18)oval(c,x+(row%2)*7,26+row*17,3,2.4,row%2?'#537186':'#405c70');
 }
 c.fillStyle='#dceef7';c.fillRect(0,105,800,8);
 c.fillStyle='rgba(196,229,245,.20)';c.fillRect(0,113,800,31);
 for(let x=0;x<800;x+=80)ln(c,x,105,x,148,1,'rgba(220,242,251,.35)');
 const ice=c.createLinearGradient(0,horizon,0,440);
 ice.addColorStop(0,'#c9e4f3');ice.addColorStop(.55,'#f4fbff');ice.addColorStop(1,'#d0eaf6');
 c.fillStyle=ice;c.fillRect(0,horizon,800,440-horizon);
 // Perspective boards, continuous rink rails and red goal lines.
 const leftNear=project(eye-15,25),rightNear=project(eye-15,415);
 const leftFar=project(800,25),rightFar=project(800,415);
 ln(c,leftNear.x,leftNear.y,leftFar.x,leftFar.y,9,'#f9fcff');
 ln(c,rightNear.x,rightNear.y,rightFar.x,rightFar.y,9,'#f9fcff');
 ln(c,leftNear.x,leftNear.y-7,leftFar.x,leftFar.y-7,3,'#d8a43e');
 ln(c,rightNear.x,rightNear.y-7,rightFar.x,rightFar.y-7,3,'#d8a43e');
 const rinkLine=(x:number,color:string,w:number)=>{
  const a=project(x,25),b=project(x,415);
  if(a.behind&&b.behind)return;
  ln(c,a.x,a.y,b.x,b.y,w*a.scale,color);
 };
 rinkLine(400,'#c85060',4);
 rinkLine(262,'#5a9dcb',7);rinkLine(538,'#5a9dcb',7);
 rinkLine(60,'#c95060',3);rinkLine(740,'#c95060',3);
 for(const x of [166,634]){
  const center=project(x,220);if(center.behind)continue;
  c.beginPath();c.ellipse(center.x,center.y,80*center.scale,23*center.scale,0,0,TAU);
  c.strokeStyle='rgba(196,59,75,.65)';c.lineWidth=Math.max(1,2.5*center.scale);c.stroke();
 }
 const center=project(400,220);
 if(!center.behind)oval(c,center.x,center.y,4*center.scale,2.5*center.scale,'#bb4356');
 // Opposing net and crease: net is at the far end of the visible rink.
 const farGoal=direction===1?740:60,net=project(farGoal,220);
 if(!net.behind){
  oval(c,net.x,net.y,48*net.scale,17*net.scale,'rgba(78,160,208,.22)');
  const w=38*net.scale,h=38*net.scale;
  ln(c,net.x-w,net.y,net.x-w,net.y-h,4*net.scale,'#b94352');
  ln(c,net.x+w,net.y,net.x+w,net.y-h,4*net.scale,'#b94352');
  ln(c,net.x-w,net.y-h,net.x+w,net.y-h,4*net.scale,'#b94352');
  for(let i=1;i<6;i++)ln(c,net.x-w+i*w*2/6,net.y-h,net.x-w+i*w*2/6,net.y,1,'#9cb8c9');
  for(let i=1;i<5;i++)ln(c,net.x-w,net.y-h+i*h/5,net.x+w,net.y-h+i*h/5,1,'#9cb8c9');
 }
 type Actor={x:number;y:number;team:number;goalie:boolean;pose:string;selected:boolean;vx:number;num:number;stance:number};
 const actors:Actor[]=[
  ...m.skaters.map((s,i)=>({x:s.x,y:s.y,team:s.team,goalie:false,pose:s.shotAnimation>0?'shoot':'skate',selected:!goalieMode&&m.selected===i,vx:s.vx,num:i+10,stance:0})),
  ...m.goalies.map((g,i)=>({x:g.x,y:g.y,team:g.team,goalie:true,pose:g.pose,selected:goalieMode&&i===0,vx:g.vy,num:30+i,stance:g.stance}))
 ];
 // Distant skaters first; selected goalie drawn last, as an NHL goalie camera.
 actors.sort((a,b)=>(direction===1?b.x-a.x:a.x-b.x));
 const selectedGoalie=goalieMode?actors.find(a=>a.goalie&&a.team===0):undefined;
 for(const a of actors){
  if(a===selectedGoalie)continue;
  const p=project(a.x,a.y);if(p.behind)continue;
  drawActor(c,p.x,p.y,clamp(p.scale*.92,.34,1.7),a,time,false);
 }
 if(selectedGoalie){
  // Fixed end-zone camera: only the goalie changes position, never the rink or net.
  const p=project(selectedGoalie.x,selectedGoalie.y);
  drawActor(c,400+(selectedGoalie.y-220)*1.25,433+(selectedGoalie.x-60)*.42,2.1,selectedGoalie,time,true);
  void p;
 }
 const puck=project(m.puck.x,m.puck.y);
 if(!puck.behind){
  oval(c,puck.x,puck.y,Math.max(3,8*puck.scale),Math.max(2,3*puck.scale),'#182631');
  c.beginPath();c.ellipse(puck.x,puck.y,Math.max(8,15*puck.scale),Math.max(5,9*puck.scale),0,0,TAU);
  c.strokeStyle='#ffd34f';c.lineWidth=2;c.stroke();
 }
 c.fillStyle='rgba(8,29,47,.8)';c.fillRect(12,12,220,30);
 c.fillStyle='#e9f7ff';c.font='bold 14px system-ui';c.textAlign='left';
 c.fillText(goalieMode?'BEHIND GOALIE • NHL STYLE':'BEHIND PLAYER • NHL STYLE',22,32);
}
function drawActor(c:CanvasRenderingContext2D,x:number,y:number,s:number,a:{team:number;goalie:boolean;pose:string;selected:boolean;num:number;stance:number},time:number,back:boolean){
 const jersey=a.team===0?'#c83e51':'#2864a5',trim=a.team===0?'#f8f5f1':'#dceeff';
 const dark='#193146',drop=a.goalie?clamp(a.stance,0,1):0;
 c.save();c.translate(x,y);c.scale(s,s);
 oval(c,0,0,22+drop*15,7,'rgba(21,53,77,.22)');
 const stride=a.goalie?0:Math.sin(time*12+a.num)*7;
 // Butterfly mechanics: knees close together, shins and pads flare outward to seal ice.
 // Interpolate each leg through the drop so the pose never instantly snaps.
 for(const side of [-1,1]){
  const hipX=side*11, kneeX=side*(11+drop*2), kneeY=-22+drop*14;
  const footX=side*(12+drop*27),footY=-2;
  ln(c,hipX,-33,kneeX,kneeY,a.goalie?12:8,dark);
  ln(c,kneeX,kneeY,footX,footY,a.goalie?13:8,a.goalie?'#e8f2f8':dark);
  if(a.goalie){
   c.save();
   c.translate(kneeX,kneeY);
   c.rotate(-side*drop*.82);
   c.fillStyle='#f5f9fd';c.strokeStyle='#7893a7';c.lineWidth=1.6;
   c.beginPath();c.roundRect(-8,-9,16,33,4);c.fill();c.stroke();
   for(let j=0;j<23;j+=8)ln(c,-6,j,6,j,1.3,'#9bb3c3');
   c.restore();
  }
  ln(c,footX-8,footY,footX+8,footY,4,'#182a3a');
 }
 // Pants, jersey, shoulders.
 c.fillStyle=dark;c.beginPath();c.roundRect(-15,-39+drop*5,30,19,5);c.fill();
 c.save();c.translate(0,drop*7);c.fillStyle=jersey;c.beginPath();c.moveTo(-14,-73);c.lineTo(14,-73);c.lineTo(23,-58);c.lineTo(16,-36);c.lineTo(-16,-36);c.lineTo(-23,-58);c.closePath();c.fill();c.restore();
 ln(c,-17,-41,17,-41,3,trim);ln(c,-18,-64,18,-64,2,trim);
 const armY=-43+drop*8;
 ln(c,-19,-64,-31,armY,12,jersey);ln(c,19,-64,31,armY,12,jersey);
 if(a.goalie){
  // Left hand: open catcher pocket with webbing. Right: rectangular blocker.
  oval(c,-32,armY,12,11,'#f7fbfd');
  oval(c,-35,armY-2,6,7,'#aabeca');
  for(let i=-1;i<=1;i++)ln(c,-38+i*3,armY-7,-31+i*3,armY+5,1,'#718a9c');
  c.fillStyle='#eef5f9';c.strokeStyle='#8ba3b2';c.lineWidth=1.5;
  c.beginPath();c.roundRect(25,armY-11,17,23,3);c.fill();c.stroke();
 }else{oval(c,-31,armY,6,6,dark);oval(c,31,armY,6,6,dark);}
 // Stick blade sits on the ice rather than floating through the body.
 ln(c,35,armY,42,-5,3,'#ad865c');ln(c,42,-5,57,-3,5,'#182b3a');
 // Helmet and cage fully enclose head.
 oval(c,0,-85,15,17,a.team===0?'#f2f4f5':'#193d67');
 oval(c,0,-82,12,11,'#b8cbd8');
 for(const k of [-8,0,8])ln(c,k,-91,k,-72,1.7,'#557386');
 for(const k of [-88,-81,-74])ln(c,-12,k,12,k,1.5,'#557386');
 if(back){c.fillStyle=trim;c.textAlign='center';c.font='bold 13px system-ui';c.fillText(String(a.num),0,-49);}
 if(a.selected){
  c.strokeStyle='#ffd34e';c.lineWidth=3;c.beginPath();c.ellipse(0,1,32,9,0,0,TAU);c.stroke();
 }
 c.restore();
}
