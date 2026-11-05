/** Persistent PC keyboard layout. Keys use KeyboardEvent.code so bindings do
 * not change when the user changes keyboard language or presses Shift. */
export type PCAction='up'|'down'|'left'|'right'|'primary'|'secondary'|'tertiary'|
 'glove'|'cover'|'release'|'vh'|'rvh'|'pause';
export type PCBindings=Record<PCAction,string>;
export const PC_DEFAULT_BINDINGS:PCBindings={
 up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',
 primary:'Space',secondary:'KeyE',tertiary:'Tab',glove:'KeyQ',
 cover:'KeyF',release:'KeyR',vh:'KeyV',rvh:'KeyB',pause:'Escape'
};
export const PC_ACTIONS:readonly PCAction[]=[
 'up','down','left','right','primary','secondary','tertiary','glove',
 'cover','release','vh','rvh','pause'
] as const;
export const PC_BINDING_STORAGE='hockey-career.pc-controls.v1';
const allowed=(code:string)=>/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|Shift(Left|Right)|Control(Left|Right))$/.test(code);
export function normalizePCBindings(raw:unknown):PCBindings{
 const result={...PC_DEFAULT_BINDINGS};
 if(!raw||typeof raw!=='object')return result;
 const proposed=raw as Record<string,unknown>;
 const occupied=new Set<string>();
 for(const action of PC_ACTIONS){
  const code=proposed[action];
  if(typeof code==='string'&&allowed(code)&&!occupied.has(code)){
   result[action]=code;occupied.add(code);
  }else if(occupied.has(result[action])){
   result[action]=PC_DEFAULT_BINDINGS[action];
  }
 }
 // Invalid or duplicate custom bindings must not break the default layout.
 return new Set(Object.values(result)).size===PC_ACTIONS.length?result:{...PC_DEFAULT_BINDINGS};
}
export function rebindPCAction(bindings:PCBindings,action:PCAction,code:string):PCBindings|null{
 if(!allowed(code))return null;
 if(Object.entries(bindings).some(([name,binding])=>name!==action&&binding===code))return null;
 return {...bindings,[action]:code};
}
export function pcKeyName(code:string):string{
 if(code.startsWith('Key'))return code.slice(3);
 if(code.startsWith('Digit'))return code.slice(5);
 return {Space:'SPACE',Tab:'TAB',Escape:'ESC',
 ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
 ShiftLeft:'L SHIFT',ShiftRight:'R SHIFT',ControlLeft:'L CTRL',ControlRight:'R CTRL'}[code]??code;
}
export function loadPCBindings():PCBindings{
 try{return normalizePCBindings(JSON.parse(localStorage.getItem(PC_BINDING_STORAGE)??'null'));}
 catch{return {...PC_DEFAULT_BINDINGS};}
}
export function savePCBindings(bindings:PCBindings):void{
 try{localStorage.setItem(PC_BINDING_STORAGE,JSON.stringify(bindings));}catch{/* unavailable */}
}
export const pcBindingLabels=(goalie:boolean):Record<PCAction,string>=>({
 up:'Move up',down:'Move down',left:'Move left',right:'Move right',
 primary:goalie?'Butterfly / stand':'Shoot',
 secondary:goalie?'Blocker save':'Pass',tertiary:goalie?'Poke check':'Switch player',
 glove:'Glove save',cover:'Cover / freeze puck',release:'Release / pass puck',
 vh:'VH post',rvh:'RVH post',pause:'Pause game'
});
export function pcActionForKey(bindings:PCBindings,code:string):PCAction|null{
 return PC_ACTIONS.find(x=>bindings[x]===code)??null;
}
