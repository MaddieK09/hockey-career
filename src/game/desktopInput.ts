/** Keyboard and mouse bindings live in one place so the on-screen help,
 * input handlers, and regression tests cannot silently disagree. */
export type DesktopAction='a'|'b'|'c'|'d'|'e'|'f'|'g'|'h';
export type DesktopView='goalie'|'player'|'broadcast'|'sideline'|'overhead';
export type MovementMode='camera'|'rink';
export interface MovementVector {x:number;y:number}

const SKATER_KEYS:Readonly<Record<string,DesktopAction>>={
 Space:'a',KeyE:'b',Tab:'c',KeyC:'c'
};
const GOALIE_KEYS:Readonly<Record<string,DesktopAction>>={
 Space:'a',KeyE:'b',Tab:'c',KeyX:'c',
 KeyQ:'d',KeyF:'e',KeyR:'f',KeyV:'g',KeyB:'h'
};
const SCROLL_KEYS=new Set(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const MOVE_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
export const isMovementKey=(code:string):boolean=>MOVE_KEYS.has(code);
export const shouldBlockDefault=(code:string):boolean=>SCROLL_KEYS.has(code);
export const pauseKey=(code:string):boolean=>code==='Escape'||code==='KeyP';
export const helpKey=(code:string):boolean=>code==='KeyH';
export function keyboardAction(code:string,goalie:boolean):DesktopAction|null{
 return (goalie?GOALIE_KEYS:SKATER_KEYS)[code]??null;
}
export function mouseAction(button:number,goalie:boolean):DesktopAction|null{
 if(button===0)return goalie?'d':'a';
 if(button===2)return 'b';
 if(button===1)return 'c';
 return null;
}
const held=(pressed:ReadonlySet<string>,...codes:string[]):boolean=>codes.some(code=>pressed.has(code));
/** Screen-relative movement is the default for third-person cameras. Screen
 * right is +rink Y in both chase cameras, while screen up is the attacking
 * direction (toward +X for home and -X for away). Broadcast/overhead use
 * original rink axes. Goalie precision shuffles are slower while Shift held. */
export function desktopMovement(
 pressed:ReadonlySet<string>,touchX:number,touchY:number,view:DesktopView,
 goalie:boolean,selectedTeam:0|1=0,mode:MovementMode='camera'
):MovementVector{
 const left=held(pressed,'KeyA','ArrowLeft'),right=held(pressed,'KeyD','ArrowRight');
 const up=held(pressed,'KeyW','ArrowUp'),down=held(pressed,'KeyS','ArrowDown');
 const hasKeyboard=left||right||up||down;
 let screenX=hasKeyboard?Number(right)-Number(left):touchX;
 let screenY=hasKeyboard?Number(down)-Number(up):touchY;
 const length=Math.hypot(screenX,screenY);
 if(length>1){screenX/=length;screenY/=length;}
 let x=screenX,y=screenY;
 if(mode==='camera'&&(view==='goalie'||view==='player')){
  x=-screenY*(goalie||selectedTeam===0?1:-1);
  y=screenX;
 }
 if(held(pressed,'ShiftLeft','ShiftRight')){
  const scale=goalie?.42:.65;
  x*=scale;y*=scale;
 }
 return {x,y};
}
/** Aim at a lane *inside* the goal opening, not an arbitrary teleport
 * destination. In a chase camera lateral rink Y projects onto screen X;
 * overhead/broadcast cameras project the lane onto screen Y.
 * Real shot spread/obstacles are still handled by the match engine. */
export function pointerShotLane(relX:number,relY:number,view:DesktopView):number{
 const fraction=(view==='player'||view==='goalie'?relX:relY);
 const t=Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:.5));
 return 220+(t-.5)*62;
}
export const PC_CONTROLS={
 skater:[
  ['WASD / Arrows','Skate in the current camera'],
  ['Hold Shift','Precision skating'],
  ['Mouse move','Aim shot lane in rink'],
  ['Left click / Space','Shoot with puck'],
  ['Right click / E','Pass'],
  ['Middle click / Tab / C','Switch skater'],
  ['Esc / P','Pause and camera settings'],
  ['H','Open control guide']
 ],
 goalie:[
  ['WASD / Arrows','Move in the crease'],
  ['Hold Shift','Precision crease shuffle'],
  ['Left click / Q','Glove save'],
  ['Right click / E','Blocker save'],
  ['Middle click / X / Tab','Poke check'],
  ['Space','Butterfly / stand'],
  ['F','Cover puck / freeze'],
  ['R','Pass held puck'],
  ['V / B','Manual VH / RVH'],
  ['Esc / P','Pause and camera settings'],
  ['H','Open control guide']
 ]
} as const;
