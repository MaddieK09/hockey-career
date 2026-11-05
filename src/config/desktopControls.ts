/** Shared, testable keyboard mapping for PC gameplay. Touch controls are independent. */
export type DesktopRole='skater'|'goalie';
export type MoveCommand='moveUp'|'moveDown'|'moveLeft'|'moveRight';
export type HockeyCommand=MoveCommand|'shoot'|'pass'|'switch'|'butterfly'|'glove'|'blocker'|
 'poke'|'cover'|'release'|'vh'|'rvh'|'camera';
export type DesktopBindings=Partial<Record<HockeyCommand,string>>;
export const MOVEMENT:MoveCommand[]=['moveUp','moveLeft','moveDown','moveRight'];
export const SKATER_ACTIONS:HockeyCommand[]=['shoot','pass','switch','camera'];
export const GOALIE_ACTIONS:HockeyCommand[]=['butterfly','glove','blocker','poke','cover','release','vh','rvh','camera'];
export const DEFAULT_SKATER:DesktopBindings={
 moveUp:'KeyW',moveLeft:'KeyA',moveDown:'KeyS',moveRight:'KeyD',
 shoot:'Space',pass:'KeyE',switch:'Tab',camera:'KeyC'
};
export const DEFAULT_GOALIE:DesktopBindings={
 moveUp:'KeyW',moveLeft:'KeyA',moveDown:'KeyS',moveRight:'KeyD',
 butterfly:'Space',glove:'KeyQ',blocker:'KeyE',poke:'Tab',cover:'KeyF',
 release:'KeyR',vh:'KeyV',rvh:'KeyB',camera:'KeyC'
};
const STORAGE='hockey-career.pc-controls-v1';
const blocked=new Set(['Escape','CapsLock','NumLock','ScrollLock','MetaLeft','MetaRight',
 'ControlLeft','ControlRight','AltLeft','AltRight','ShiftLeft','ShiftRight',
 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Backspace','Delete']);
export const actionsFor=(role:DesktopRole):HockeyCommand[]=>
 [...MOVEMENT,...(role==='goalie'?GOALIE_ACTIONS:SKATER_ACTIONS)];
export const defaultsFor=(role:DesktopRole):DesktopBindings=>({...role==='goalie'?DEFAULT_GOALIE:DEFAULT_SKATER});
export function normalizeBindings(raw:unknown,role:DesktopRole):DesktopBindings{
 const defaults=defaultsFor(role);
 if(!raw||typeof raw!=='object')return defaults;
 const source=raw as Record<string,unknown>;
 const mapped=defaultsFor(role);
 for(const cmd of actionsFor(role)){
  const key=source[cmd];
  if(typeof key==='string'&&key.length<24&&!blocked.has(key)){
   mapped[cmd]=key;
  }
 }
 // Reject corrupt/conflicting saves; keep the first valid command's assignment.
 const used=new Set<string>();
 for(const cmd of actionsFor(role)){
  const code=mapped[cmd]!;
  if(used.has(code))mapped[cmd]=defaults[cmd];
  used.add(mapped[cmd]!);
 }
 // If a restored default also collides, fall back to the safe complete set.
 return new Set(Object.values(mapped)).size===actionsFor(role).length?mapped:defaults;
}
export function remapBinding(bindings:DesktopBindings,role:DesktopRole,command:HockeyCommand,
 code:string):{bindings:DesktopBindings;error?:string}{
 if(!actionsFor(role).includes(command))return {bindings,error:'Unavailable action for this role'};
 if(!code||code.length>23||blocked.has(code)||/^F([1-9]|1[0-2])$/.test(code)||
  /^Digit[1-5]$/.test(code))return {bindings,error:'That key is reserved for game or camera controls'};
 const next=normalizeBindings(bindings,role),previous=next[command]!;
 const existing=actionsFor(role).find(x=>x!==command&&next[x]===code);
 // Swap duplicates so changing a binding never silently unbinds an action.
 if(existing)next[existing]=previous;
 next[command]=code;
 return {bindings:next};
}
export function commandFor(code:string,bindings:DesktopBindings,role:DesktopRole):HockeyCommand|undefined{
 return actionsFor(role).find(cmd=>bindings[cmd]===code);
}
export function movementFor(keys:ReadonlySet<string>,bindings:DesktopBindings):{x:number;y:number}{
 const is=(cmd:MoveCommand,arrow:string)=>keys.has(bindings[cmd]??'')||keys.has(arrow);
 let x=Number(is('moveRight','ArrowRight'))-Number(is('moveLeft','ArrowLeft'));
 let y=Number(is('moveDown','ArrowDown'))-Number(is('moveUp','ArrowUp'));
 const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;return {x,y};
}
export function rinkMovement(move:{x:number;y:number},goalie:boolean,goalieCamera:boolean){
 return goalie&&goalieCamera?{x:-move.y,y:move.x}:move;
}
export function labelKey(code:string):string{
 if(code==='Space')return 'SPACE';
 if(code==='Tab')return 'TAB';
 if(code.startsWith('Key'))return code.slice(3);
 if(code.startsWith('Digit'))return code.slice(5);
 if(code.startsWith('Numpad'))return 'NUM '+code.slice(6);
 return code.replace('Arrow','').toUpperCase();
}
export const labelCommand=(command:HockeyCommand):string=>({
 moveUp:'Move up',moveDown:'Move down',moveLeft:'Move left',moveRight:'Move right',
 shoot:'Shoot',pass:'Pass',switch:'Switch player',butterfly:'Butterfly (toggle)',
 glove:'Glove save',blocker:'Blocker save',poke:'Poke check',cover:'Cover / freeze puck',
 release:'Pass held puck',vh:'VH post',rvh:'RVH post',camera:'Cycle camera'
} as Record<HockeyCommand,string>)[command];
export function loadBindings(role:DesktopRole):DesktopBindings{
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE)??'{}');
  return normalizeBindings(saved?.[role],role);
 }catch{return defaultsFor(role);}
}
export function saveBindings(role:DesktopRole,bindings:DesktopBindings):void{
 try{
  const old=JSON.parse(localStorage.getItem(STORAGE)??'{}')??{};
  localStorage.setItem(STORAGE,JSON.stringify({...old,[role]:normalizeBindings(bindings,role)}));
 }catch{/* Gameplay works if private browsing blocks persistence. */}
}
/** Translating the mouse over the goal mouth works for every camera:
 * overhead uses vertical position, chase/side cameras use lateral position.
 * The actual physics still applies accuracy scatter. */
export function mouseShotTarget(canvasX:number,canvasY:number,
 camera:'overhead'|'player'|'goalie'|'broadcast'|'sideline'):number{
 const normalized=camera==='overhead'?(canvasY-220)/185:(canvasX-400)/355;
 return Math.max(166,Math.min(274,220+normalized*54));
}
