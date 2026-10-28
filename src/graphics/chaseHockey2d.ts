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
 const goalieMode=mode==='goalie'||m.goalieCareer;
 const controlled=goalieMode?m.goalies[0]:m.skaters[m.selected];
 // Always look toward the opposing end from behind the controlled player.
 const direction=goalieMode?1:(m.skaters[m.selected].team===0?1:-1);
 const goalDepth=direction===1?controlled.x:800-controlled.x;
 if(previousMode!==mode){cameraDepth=goalDepth;cameraLateral=controlled.y;previousMode=mode;}
 cameraDepth+=(goalDepth-cameraDepth)*.13;
 cameraLateral+=(controlled.y-cameraLateral)*.1;
 const eye=goalieMode?Math.max(0,cameraDepth-48):Math.max(0,cameraDepth-55);
 const horizon=goalieMode?109:117;
 // Perspective: width grows toward camera. Near bodies are much larger.
 const project=(x:number,y:number)=>{
  const along=(direction===1?x:800-x)-eye;
  const depth=Math.max(-30,along);
  const z=clamp(260/(260+depth),.27,1.15);
  return {x:400+(y-cameraLateral)*z*1.52,y:horizon+300*z,scale:z*1.45,behind:along< -25};
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
 type Actor={x:number;y:number;team:number;goalie:boolean;pose:string;selected:boolean;vx:number;num:number};
 const actors:Actor[]=[
  ...m.skaters.map((s,i)=>({x:s.x,y:s.y,team:s.team,goalie:false,pose:s.shotAnimation>0?'shoot':'skate',selected:!goalieMode&&m.selected===i,vx:s.vx,num:i+10})),
  ...m.goalies.map((g,i)=>({x:g.x,y:g.y,team:g.team,goalie:true,pose:g.pose,selected:goalieMode&&i===0,vx:0,num:30+i}))
 ];
 // Distant skaters first; selected goalie drawn last, as an NHL goalie camera.
 actors.sort((a,b)=>(direction===1?b.x-a.x:a.x-b.x));
 const selectedGoalie=goalieMode?actors.find(a=>a.goalie&&a.team===0):undefined;
 for(const a of actors){
  if(a===selectedGoalie)continue;
  const p=project(a.x,a.y);if(p.behind)continue;
  drawActor(c,p.x,p.y,clamp(p.scale*.92,.34,1.7),a,time,false,m.goalies.find(g=>g.team===a.team)?.poseTime??0);
 }
 if(selectedGoalie){
  // Near goalie stays anchored in the foreground as the camera follows the crease.
  const p=project(selectedGoalie.x,selectedGoalie.y);
  drawActor(c,400+(selectedGoalie.y-cameraLateral)*1.25,420,1.65,selectedGoalie,time,true,m.goalies[0].poseTime);
  // Goal frame behind goalie, NHL-style.
  const gw=78,gy=405;
  ln(c,400-gw,gy,400-gw,gy-88,5,'#ca3d4c');
  ln(c,400+gw,gy,400+gw,gy-88,5,'#ca3d4c');
  ln(c,400-gw,gy-88,400+gw,gy-88,5,'#ca3d4c');
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
/** Goalie save is articulated: hips drop, knees meet, toes flare outward,
 * pads seal the ice, chest stays upright, catcher/blocker remain separate.
 * The 0.12s landing and 0.18s recovery avoid instantaneous pose snapping.
 */
function drawActor(c:CanvasRenderingContext2D,x:number,y:number,s:number,a:{team:number;goalie:boolean;pose:string;selected:boolean;num:number},time:number,back:boolean,poseTime=0):void{
 const jersey=a.team===0?'#c83e51':'#2864a5',trim=a.team===0?'#f8f5f1':'#dceeff';
 const dark='#193146';
 const butterfly=a.goalie&&a.pose==='butterfly';
 const drop=butterfly?clamp(Math.min((1.05-poseTime)/.13,poseTime/.18),0,1):0;
 const gloveSave=a.goalie&&a.pose==='blocker';
 c.save();c.translate(x,y);c.scale(s,s);
 // Contact shadow widens as pads flare out.
 oval(c,0,0,23+drop*34,7+drop*3,'rgba(15,41,60,.22)');
 const stride=a.goalie?0:Math.sin(time*12+a.num)*7;
 // Legs first so the jersey correctly occludes the knee attachment.
 for(const side of [-1,1]){
  c.save();
  const spread=side*(11+drop*17);
  const kneeX=side*(11+drop*2),kneeY=-24+drop*11;
  // The knees come together; each pad rotates to seal the lower outside.
  ln(c,side*10,-33,kneeX,kneeY,11,dark);
  if(a.goalie){
   const toeX=spread+side*drop*8;
   const toeY=-1+drop*1;
   ln(c,kneeX,kneeY,toeX,toeY,14,'#dfeaf1');
   c.translate(toeX,toeY);
   c.rotate(side*drop*.94);
   c.fillStyle='#f8fbfd';c.strokeStyle='#8096a7';c.lineWidth=1.6;
   c.beginPath();c.roundRect(-9,-32,18,34,4);c.fill();c.stroke();
   c.fillStyle='#d5e1e9';c.fillRect(-7,-30,14,5);
   for(let j=-22;j<=-6;j+=8)ln(c,-7,j,7,j,1.5,'#9bb0c0');
   ln(c,-10,0,11,0,3,'#1c3448');
  }else{
   ln(c,kneeX,kneeY,side*11+side*stride,-2,8,dark);
   ln(c,side*stride+side*11-8,0,side*stride+side*11+10,0,4,'#1b2d3e');
  }
  c.restore();
 }
 // Padded shorts and articulated torso move down during the save.
 c.save();c.translate(0,drop*13);
 c.fillStyle=dark;c.beginPath();c.roundRect(-17,-41,34,22,6);c.fill();
 c.fillStyle=jersey;c.beginPath();c.moveTo(-14,-74);c.lineTo(14,-74);c.lineTo(23,-60);c.lineTo(17,-37);c.lineTo(-17,-37);c.lineTo(-23,-60);c.closePath();c.fill();
 ln(c,-17,-41,17,-41,3,trim);ln(c,-18,-64,18,-64,2,trim);
 // A dropped goalie holds the hands forward, not straight out at shoulder height.
 const handY=-44+drop*12;
 const handX=31+drop*4;
 ln(c,-19,-64,-handX,handY,12,jersey);
 ln(c,19,-64,handX,handY,12,jersey);
 if(a.goalie){
  // Trapper: wide cuff, curved pocket and actual cross-webbing.
  c.fillStyle='#f1f6fa';c.strokeStyle='#7996aa';c.lineWidth=2;
  c.beginPath();c.ellipse(-handX-4,handY-1,14,13,-.2,0,TAU);c.fill();c.stroke();
  oval(c,-handX-7,handY-3,8,8,'#9fb5c5');
  for(let j=-2;j<=2;j++)ln(c,-handX-12+j*3,handY-10,-handX-6+j*3,handY+5,1,'#5f8096');
  // Blocker is a flat rectangular board, not a second catcher.
  c.fillStyle='#f1f6fa';c.strokeStyle='#8199aa';c.lineWidth=2;
  c.beginPath();c.roundRect(handX-8,handY-12,22,26,3);c.fill();c.stroke();
  ln(c,handX-5,handY+7,handX+10,handY+7,2,'#aec3d0');
  // Stick blade remains flat on the ice during butterfly saves.
  ln(c,handX+8,handY+5,handX+14,-5-drop*12,3.3,'#aa8358');
  ln(c,handX+14,-5-drop*12,handX+34,-3-drop*12,5,'#20374b');
 }else{
  oval(c,-handX,handY,6,6,dark);oval(c,handX,handY,6,6,dark);
  ln(c,handX+5,handY,handX+12,-5,3,'#b28c64');
  ln(c,handX+12,-5,handX+31,-3,5,'#21384b');
 }
 // Full-shell mask and face cage.
 oval(c,0,-86,16,18,a.team===0?'#f3f6f8':'#1b4068');
 oval(c,0,-82,12,12,'#a7bdce');
 ln(c,-14,-83,-12,-69,2,'#d7e4eb');ln(c,14,-83,12,-69,2,'#d7e4eb');
 for(const k of [-8,0,8])ln(c,k,-92,k,-71,1.8,'#536f83');
 for(const k of [-89,-82,-75])ln(c,-12,k,12,k,1.6,'#536f83');
 if(back){c.fillStyle=trim;c.textAlign='center';c.font='bold 13px system-ui';c.fillText(String(a.num),0,-50);}
 c.restore();
 if(a.selected){
  c.strokeStyle='#ffd34e';c.lineWidth=2.7;c.beginPath();c.ellipse(0,1,32+drop*27,9,0,0,TAU);c.stroke();
 }
 c.restore();
}
