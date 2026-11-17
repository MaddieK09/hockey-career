/** Exponential damping keeps chase-camera response consistent across frame rates. */
export function easeCamera(current:number,target:number,dt:number,responsiveness=6):number{
 if(!Number.isFinite(dt)||dt<=0)return current;
 const step=Math.min(.05,dt);
 return current+(target-current)*(-Math.expm1(-Math.max(0,responsiveness)*step));
}
