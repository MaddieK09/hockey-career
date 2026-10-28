/** Lightweight vector animation renderer for the top-down 2D hockey match.
 * Characters have heads, torsos, arms, legs, skates, sticks, and animated strides.
 * No spritesheet download or WebGL required: runs on mobile Canvas 2D.
 */
export type HockeyPose = 'skate'|'glide'|'shoot'|'save'|'butterfly'|'blocker';
export interface CharacterFrame {
 x:number;y:number;team:0|1;goalie?:boolean;angle:number;
 time:number;speed:number;pose?:HockeyPose;selected?:boolean;number?:number;
 hasPuck?:boolean;
}
const PI=Math.PI;
export function drawHockeyCharacter(ctx:CanvasRenderingContext2D,p:CharacterFrame):void {
 const home=p.team===0,main=home?'#bf344d':'#23568a',dark=home?'#701d34':'#123250';
 const stripe=home?'#f3f5f6':'#e4edf7',gear='#f3f6f8';
 const motion=Math.min(1,p.speed/155),stride=Math.sin(p.time*12+((p.x+p.y)*.015))*motion;
 const goalie=!!p.goalie,pose=p.pose??'glide';
 ctx.save();ctx.translate(p.x,p.y);
 // Ground contact and selection are visible even at the iPhone rink scale.
 ctx.fillStyle='rgba(12,30,49,.24)';ctx.beginPath();ctx.ellipse(2,6,goalie?26:19,goalie?22:14,0,0,PI*2);ctx.fill();
 if(p.selected){ctx.strokeStyle='#ffd65d';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,goalie?31:24,goalie?27:21,0,0,PI*2);ctx.stroke();}
 ctx.rotate(p.angle);
 const segment=(x1:number,y1:number,x2:number,y2:number,w:number,color:string)=>{
  ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 };
 const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,PI*2);ctx.fill();
 };
 if(goalie){
  // Mask, cage, leg pads, trapper, blocker and stick all remain distinct.
  const butterfly=pose==='butterfly';
  const flare=butterfly?9:0;
  ctx.fillStyle=gear;ctx.strokeStyle='#8ea5b7';ctx.lineWidth=1.8;
  for(const s of [-1,1]){
   ctx.save();ctx.translate(-6,s*(10+flare));ctx.rotate(s*(butterfly?.36:.05));
   ctx.fillRect(-17,-7,25,14);ctx.strokeRect(-17,-7,25,14);
   segment(-11,-5,-11,5,1.5,'#a6b8c7');segment(-3,-5,-3,5,1.5,'#a6b8c7');
   ctx.restore();
  }
  ellipse(1,0,15,17,dark);ellipse(2,0,13,14,main);
  segment(-3,-11,-3,11,2,stripe);
  // Glove: curved catcher's pocket. Blocker: squared paddle.
  ellipse(4,-23,pose==='save'?11:9,9,'#f0f3f7');
  ctx.strokeStyle='#607c91';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(4,-23,5,-1.2,1.6);ctx.stroke();
  ctx.fillStyle='#e8edf2';ctx.fillRect(-2,pose==='blocker'?17:16,15,12);
  ctx.strokeStyle='#8299aa';ctx.strokeRect(-2,pose==='blocker'?17:16,15,12);
  segment(7,23,37,31,3,'#ad8656');segment(37,31,48,35,5,'#202a35');
  ellipse(7,0,11,10,'#e9eff4');
  ctx.strokeStyle='#6f879a';ctx.lineWidth=1.5;
  for(let i=-1;i<=1;i++)segment(0,i*4,15,i*4,1.2,'#6f879a');
  segment(5,-8,5,8,1.4,'#6f879a');
 }else{
  // Facing-right local axes; stride moves skates and legs in opposite phases.
  const swing=pose==='shoot'?7:stride*6;
  segment(-9,-9,-23-swing,-11,8,dark);
  segment(-9,9,-23+swing,11,8,dark);
  segment(-24-swing,-11,-30-swing,-11,5,'#182a3a');
  segment(-24+swing,11,-30+swing,11,5,'#182a3a');
  ellipse(0,0,18,13,dark);ellipse(1,0,15,11,main);
  segment(-8,-10,-8,10,3,stripe);segment(9,-10,9,10,2,stripe);
  // Arms extend toward the stick and animate when shooting.
  segment(1,-11,16,-18-stride*2,7,main);
  segment(1,11,16,17+stride*2,7,main);
  segment(16,-18-stride*2,25,-12,5,'#1e2b39');
  segment(16,17+stride*2,25,13,5,'#1e2b39');
  segment(23,-12,32,16+(pose==='shoot'?7:0),3.3,'#c19a65');
  segment(32,16+(pose==='shoot'?7:0),41,19+(pose==='shoot'?7:0),4.2,'#202b38');
  ellipse(5,0,9,9,'#e5ecf1');
  segment(1,-5,1,5,1.3,'#647b8c');segment(6,-7,6,7,1.3,'#647b8c');
  ctx.fillStyle=dark;ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText(String(p.number??(home?10:17)),-5,3);
 }
 ctx.restore();
 if(p.hasPuck){ctx.strokeStyle='#ffd65d';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,goalie?29:23,0,PI*2);ctx.stroke();}
}
export function drawRink(ctx:CanvasRenderingContext2D,time:number):void {
 const W=800,H=440;
 const ice=ctx.createLinearGradient(0,0,0,H);ice.addColorStop(0,'#f2faff');ice.addColorStop(1,'#cde5f1');
 ctx.fillStyle=ice;ctx.fillRect(0,0,W,H);
 // Subtle ice grain and skate scratches without costly texture loading.
 ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1;
 for(let i=0;i<26;i++){const y=24+i*15;ctx.beginPath();ctx.moveTo(30+(i*41)%100,y);ctx.lineTo(700+(i*31)%80,y+2);ctx.stroke();}
 ctx.strokeStyle='#284b64';ctx.lineWidth=8;ctx.strokeRect(18,18,764,404);
 ctx.strokeStyle='#d04958';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(400,22);ctx.lineTo(400,418);ctx.stroke();
 ctx.strokeStyle='#4088bc';ctx.lineWidth=4;for(const x of [261,539]){ctx.beginPath();ctx.moveTo(x,22);ctx.lineTo(x,418);ctx.stroke();}
 ctx.strokeStyle='#c34757';ctx.lineWidth=3;ctx.beginPath();ctx.arc(400,220,58,0,PI*2);ctx.stroke();
 for(const x of [166,634])for(const y of [125,315]){
  ctx.beginPath();ctx.arc(x,y,40,0,PI*2);ctx.stroke();
  ctx.fillStyle='#c34757';ctx.beginPath();ctx.arc(x,y,4,0,PI*2);ctx.fill();
 }
 for(const x of [58,742]){
  ctx.fillStyle='rgba(80,158,206,.18)';ctx.beginPath();ctx.ellipse(x,220,65,84,0,0,PI*2);ctx.fill();
  ctx.fillStyle='#d04b55';ctx.fillRect(x-4,175,8,90);
  ctx.fillStyle='#f8fcff';ctx.strokeStyle='#bd4651';ctx.lineWidth=3;
  ctx.fillRect(x===58?25:755,184,20,72);ctx.strokeRect(x===58?25:755,184,20,72);
 }
 // Faceoff dots and goal creases.
 ctx.fillStyle='#bd4354';for(const x of [166,634])for(const y of [125,315]){ctx.beginPath();ctx.arc(x,y,3,0,PI*2);ctx.fill();}
 void time;
}
