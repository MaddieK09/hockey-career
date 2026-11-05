/** Desktop bindings are saved independently of career progress. */
export type DesktopAction='up'|'down'|'left'|'right'|'primary'|'secondary'|'switch'|'glove'|'cover'|'release'|'vh'|'rvh'|'pause';
export type DesktopBindings=Record<DesktopAction,string>;
export const DEFAULT_BINDINGS:DesktopBindings={
 up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',
 primary:'Space',secondary:'KeyE',switch:'Tab',glove:'KeyQ',cover:'KeyF',
 release:'KeyR',vh:'KeyV',rvh:'KeyB',pause:'Escape'
};
export const DESKTOP_BINDINGS_KEY='hockey-career-desktop-bindings-v1';
export const ACTIONS:DesktopAction[]=['up','down','left','right','primary','secondary','switch','glove','cover','release','vh','rvh','pause'];
export const ACTION_LABELS:Record<DesktopAction,string>={
 up:'Skate up',down:'Skate down',left:'Skate left',right:'Skate right',
 primary:'Shoot / Butterfly',secondary:'Pass / Blocker',switch:'Switch / Poke',
 glove:'Goalie glove',cover:'Goalie cover / freeze',release:'Goalie pass puck',
 vh:'VH post',rvh:'RVH post',pause:'Pause / Resume'
};
export const formatKey=(code:string):string=>{
 if(code==='Space')return 'Space';
 if(code==='Escape')return 'Esc';
 if(code.startsWith('Key'))return code.slice(3);
 if(code.startsWith('Digit'))return code.slice(5);
 return code.replace('Arrow','↑↓←→ ').replace(/^Numpad/,'Num ');
};
export const allowedBinding=(code:string):boolean=>
 /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|ShiftLeft|ShiftRight|ControlLeft|ControlRight|Numpad[0-9])$/.test(code);
export const loadBindings=(raw:unknown):DesktopBindings=>{
 const out={...DEFAULT_BINDINGS};
 if(!raw||typeof raw!=='object')return out;
 const value=raw as Record<string,unknown>,used=new Set<string>();
 for(const action of ACTIONS){
  const key=value[action];
  if(typeof key==='string'&&allowedBinding(key)&&!used.has(key)){
   out[action]=key;used.add(key);
  }else{
   let fallback=DEFAULT_BINDINGS[action];
   if(used.has(fallback)){
    fallback=Object.values(DEFAULT_BINDINGS).find(k=>!used.has(k))??fallback;
   }
   out[action]=fallback;used.add(fallback);
  }
 }
 return out;
};
export const rebind=(current:DesktopBindings,action:DesktopAction,code:string):DesktopBindings=>{
 if(!allowedBinding(code))return current;
 const next={...current},taken=ACTIONS.find(a=>a!==action&&current[a]===code);
 if(taken)next[taken]=current[action];
 next[action]=code;
 return next;
};
export const pressedDirection=(pressed:ReadonlySet<string>,bindings:DesktopBindings):{x:number;y:number}=>{
 const x=Number(pressed.has(bindings.right))-Number(pressed.has(bindings.left));
 const y=Number(pressed.has(bindings.down))-Number(pressed.has(bindings.up));
 const len=Math.max(1,Math.hypot(x,y));
 return {x:x/len,y:y/len};
};
