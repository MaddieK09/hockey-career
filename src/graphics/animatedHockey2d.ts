import {GOAL_HALF_WIDTH} from '../game/puckCollision';
/** Hockey Career V5 — layered, resolution-independent Canvas 2D renderer.
 * Players are purpose-built top-down illustrated sprites drawn procedurally:
 * no WebGL, downloads, or external assets needed on iPhone.
 */
export type HockeyPose='skate'|'glide'|'shoot'|'save'|'butterfly'|'blocker'|'vh'|'rvh';
export interface CharacterFrame {
 x:number;y:number;team:0|1;goalie?:boolean;angle:number;
 time:number;speed:number;pose?:HockeyPose;selected?:boolean;number?:number;hasPuck?:boolean;
}
const TAU=Math.PI*2;
const line=(c:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number,w:number,color:string)=>{
 c.beginPath();c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
};
const oval=(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,fill:string,stroke?:string)=>{
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();
 if(stroke){c.lineWidth=1.6;c.strokeStyle=stroke;c.stroke();}
};
const rounded=(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string)=>{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
 if(stroke){c.lineWidth=1.4;c.strokeStyle=stroke;c.stroke();}
};
export function drawHockeyCharacter(c:CanvasRenderingContext2D,p:CharacterFrame):void{
 const home=p.team===0,goalie=!!p.goalie;
 const jersey=home?'#d43c4e':'#2364a1',dark=home?'#8f2438':'#16426b';
 const trim=home?'#fff4eb':'#dceeff',helmet=home?'#f7f7f4':'#12385e';
 const pace=Math.min(1,p.speed/175);
 const stride=Math.sin(p.time*13+p.number!*.17)*pace;
 c.save();c.translate(p.x,p.y);
 // Direction-independent ground shadow and clear user indicator.
 oval(c,2,8,goalie?27:22,goalie?18:13,'rgba(9,33,53,.22)');
 if(p.selected){
  c.save();c.rotate(-p.angle);
  c.setLineDash([7,4]);c.strokeStyle='#fbd351';c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,goalie?33:28,goalie?29:24,0,0,TAU);c.stroke();c.restore();
 }
 c.rotate(p.angle);
 if(goalie){
  const butterfly=p.pose==='butterfly',blocker=p.pose==='blocker';
  // Chest protector and arms are visually distinct from leg pads.
  for(const side of [-1,1]){
   c.save();c.translate(-10,side*(12+(butterfly?8:0)));
   c.rotate(side*(butterfly?.46:.07));
   rounded(c,-17,-8,35,16,4,'#f9fcff','#a0afbe');
   for(let seam=-8;seam<=10;seam+=9)line(c,seam,-7,seam,7,1,'#b0becb');
   rounded(c,-19,-8,5,16,2,trim);
   c.restore();
  }
  oval(c,-1,0,18,18,dark,'#203a4b');
  oval(c,1,0,15,15,jersey);
  line(c,-5,-14,8,-14,3,trim);line(c,-5,14,8,14,3,trim);
  // Catching glove with an open pocket, blocker with squared face.
  line(c,0,-13,8,-25,8,jersey);
  oval(c,11,-27,11,10,'#f5f8fa','#73889c');
  oval(c,13,-27,6,6,'#b5c6d1','#61788c');
  for(let k=-1;k<=1;k++)line(c,10+k*3,-31,16+k*2,-23,1,'#607c92');
  line(c,1,13,9,23,8,jersey);
  rounded(c,5,17,19,14,3,'#f0f3f6','#738ca0');
  if(blocker)line(c,6,19,21,19,2,'#607c92');
  line(c,19,23,37,34,3,'#b98b5e');
  line(c,36,34,51,36,6,'#222c36');
  // Fully enclosed goalie mask with forward cage and vent holes.
  oval(c,9,0,12,11,helmet,'#6d8191');
  rounded(c,9,-8,10,16,4,'#cdd8df','#566b7b');
  for(const y of [-5,0,5])line(c,10,y,19,y,1.5,'#516776');
  for(const x of [12,17])line(c,x,-7,x,7,1.3,'#516776');
  oval(c,3,-6,1.6,1.6,'#455e71');oval(c,3,6,1.6,1.6,'#455e71');
 }else{
  // Distinct shoulders, skates, stride animation and articulated stick hands.
  const kick=stride*8;
  line(c,-9,-8,-24-kick,-12,8,dark);
  line(c,-9,8,-24+kick,12,8,dark);
  rounded(c,-35-kick,-15,13,5,2,'#172f42');
  rounded(c,-35+kick,10,13,5,2,'#172f42');
  line(c,-31-kick,-10,-39-kick,-10,1.6,'#d5e2ea');
  line(c,-31+kick,15,-39+kick,15,1.6,'#d5e2ea');
  oval(c,0,0,19,14,dark,'#172f42');
  oval(c,2,0,16,12,jersey);
  line(c,-8,-11,-8,11,3.3,trim);
  line(c,10,-10,10,10,2.8,trim);
  const windup=p.pose==='shoot'?8:0;
  line(c,3,-11,17,-19-stride*2,8,jersey);
  line(c,3,11,17,19+stride*2,8,jersey);
  oval(c,18,-18-stride*2,4.4,4.4,'#1a2e3f');
  oval(c,18,19+stride*2,4.4,4.4,'#1a2e3f');
  line(c,18,-18-stride*2,27,-8-windup,3.5,'#b18a5d');
  line(c,27,-8-windup,38,18+windup,3.5,'#b18a5d');
  line(c,38,18+windup,49,21+windup,5,'#202c36');
  // Helmet shell, ear covers and narrow metallic visor.
  oval(c,8,0,10.5,10,helmet,'#637b8e');
  line(c,12,-7,12,7,2,'#8b9dac');
  line(c,17,-5,17,5,1.5,'#8b9dac');
  oval(c,5,-9,3,2.5,dark);oval(c,5,9,3,2.5,dark);
  c.fillStyle=trim;c.font='bold 10px system-ui';c.textAlign='center';
  c.fillText(String(p.number??10),-5,3.5);
 }
 c.restore();
 if(p.hasPuck){
  c.strokeStyle='rgba(255,209,67,.9)';c.lineWidth=2;
  c.beginPath();c.arc(p.x,p.y,goalie?30:26,0,TAU);c.stroke();
 }
}
export function drawRink(c:CanvasRenderingContext2D,time:number):void{
 const ice=c.createLinearGradient(0,0,0,440);
 ice.addColorStop(0,'#f5fbff');ice.addColorStop(.5,'#e4f3fa');ice.addColorStop(1,'#d0e7f2');
 c.fillStyle=ice;c.fillRect(0,0,800,440);
 // Arena boards, rounded rink edges and glass reflections.
 c.fillStyle='#e7f4fc';rounded(c,14,15,772,410,48,'#f5fbff','#294f68');
 c.save();c.beginPath();c.roundRect(22,23,756,394,42);c.clip();
 c.fillStyle='#e4f2f9';c.fillRect(22,23,756,394);
 c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1;
 for(let i=0;i<28;i++){const y=32+i*14;c.beginPath();c.moveTo(32+(i*37)%80,y);c.lineTo(735+(i*29)%35,y+1);c.stroke();}
 // Center and blue lines.
 line(c,400,23,400,417,4,'#bd4555');
 for(const x of [262,538])line(c,x,23,x,417,4,'#428fbd');
 c.strokeStyle='#c74857';c.lineWidth=3;
 c.beginPath();c.arc(400,220,57,0,TAU);c.stroke();
 oval(c,400,220,4,4,'#c74857');
 for(const x of [166,634])for(const y of [126,314]){
  c.beginPath();c.arc(x,y,41,0,TAU);c.stroke();
  oval(c,x,y,4,4,'#bd4655');
  // Hash marks outside faceoff circles.
  for(const s of [-1,1])line(c,x+s*35,y-49,x+s*35,y-37,2,'#c74857');
 }
 // Nets have the same world-space dimensions used by goal collision.
 for(const side of [0,1]){
  const x=side===0?60:740,netBack=side===0?30:740;
  const mouthTop=220-GOAL_HALF_WIDTH;
  const mouthBottom=220+GOAL_HALF_WIDTH;
  c.fillStyle='rgba(67,158,212,.18)';
  c.beginPath();c.ellipse(x,220,57,GOAL_HALF_WIDTH+20,0,0,TAU);c.fill();
  line(c,x,24,x,416,2.5,'#cb4557');
  rounded(c,netBack,mouthTop,30,GOAL_HALF_WIDTH*2,4,'#eef8fc','#b63d4d');
  for(let n=1;n<10;n++){
   const y=mouthTop+n*(GOAL_HALF_WIDTH*2)/10;
   line(c,netBack+1,y,netBack+29,y,1,'#b5ccd8');
  }
  for(let n=1;n<5;n++){
   const xx=netBack+n*30/5;
   line(c,xx,mouthTop+2,xx,mouthBottom-2,1,'#b5ccd8');
  }
  line(c,x,mouthTop,x,mouthBottom,4,'#ca3e51');
 }
 c.restore();
 c.strokeStyle='#2e5c78';c.lineWidth=7;c.beginPath();c.roundRect(18,19,764,402,45);c.stroke();
 c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=2;c.beginPath();c.roundRect(24,25,752,390,40);c.stroke();
 void time;
}
