import type {PlayerAppearance} from '../player/appearance';
const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
type Part={center:[number,number,number];scale:[number,number,number];color:string};
const hex=(value:string):[number,number,number]=>{const h=value.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255) as [number,number,number];};
function parts(p:PlayerAppearance):Part[]{
 const tall=p.heightCm/180,bulk=Math.max(.72,Math.min(1.5,p.weightKg/77)),s=skin[p.skinTone],h=hair[p.hairColor],e=eyes[p.eyeColor];
 const faceWidth=p.faceShape==='Round'?1.12:p.faceShape==='Angular'?.88:p.faceShape==='Square'?1.06:1;
 const a:Part[]=[];
 const add=(center:Part['center'],scale:Part['scale'],color:string)=>a.push({center,scale,color});
 add([0,-.08,0],[.39*bulk,.57,.23*bulk],'#27648d'); // sweater
 add([0,-.72,0],[.31*bulk,.22,.22*bulk],'#193a57');
 for(const x of [-1,1]){add([x*.48*bulk,-.12,0],[.15,.49,.16],'#27648d');add([x*.49*bulk,-.63,.015],[.13,.12,.14],s);add([x*.17,-1.18,0],[.155,.49,.17],'#1b3048');add([x*.17,-1.66,.10],[.18,.14,.3],'#101b2a');}
 add([0,.56,0],[.14,.19,.14],s);
 if(p.hairStyle==='Long'||p.hairStyle==='Medium'||p.hairStyle==='Curly'||p.hairStyle==='Ponytail')add([0,.95,-.12],[.34,.51,.22],h);
 const headHeight=p.faceShape==='Heart'?.35:p.faceShape==='Round'?.32:.38;
 add([0,1.03,.03],[.31*faceWidth,headHeight,.275],s);
 for(const x of [-1,1]){add([x*.128,1.055,.292],[.048,.033,.022],'#f4f2e9');add([x*.128,1.055,.312],[.024,.025,.014],e);add([x*.128,1.055,.323],[.009,.013,.008],'#171923');}
 add([0,.965,.313],[.044,.075,.052],s);add([0,.825,.272],[.09,.012,.016],'#995f5d');
 if(p.hairStyle!=='Bald'){
  const height=p.hairStyle==='Buzz cut'?.09:p.hairStyle==='Curly'?.22:.16;
  add([0,1.35,.00],[.33*faceWidth,height,.27],h);
  if(p.hairStyle!=='Buzz cut')add([-.19,1.21,.17],[.12,.17,.16],h);
  if(p.hairStyle==='Curly'){for(let i=0;i<9;i++){const angle=i*Math.PI*2/9;add([Math.cos(angle)*.25,1.39+Math.sin(angle)*.08,Math.sin(angle)*.18],[.115,.115,.115],h);}}
  if(p.hairStyle==='Ponytail')add([0,1.1,-.37],[.12,.34,.12],h);
 }
 // height scales vertically in the renderer so changes are visible
 return a.map(part=>({...part,center:[part.center[0],part.center[1]*tall,part.center[2]],scale:[part.scale[0],part.scale[1]*tall,part.scale[2]]}));
}
const vertex=`attribute vec3 position;attribute vec3 normal;uniform mat4 projection;uniform float angle;uniform vec3 center;uniform vec3 scale;varying vec3 lightNormal;void main(){vec3 p=position*scale+center;float c=cos(angle),s=sin(angle);mat3 rot=mat3(c,0.,-s,0.,1.,0.,s,0.,c);vec3 world=rot*p;lightNormal=normalize(rot*(normal/scale));gl_Position=projection*vec4(world.x,world.y,world.z-5.3,1.);}`;
const fragment=`precision mediump float;uniform vec3 tint;varying vec3 lightNormal;void main(){float light=.34+.66*max(dot(normalize(lightNormal),normalize(vec3(-.4,.8,1.))),0.);gl_FragColor=vec4(tint*light,1.);}`;
function shader(gl:WebGLRenderingContext,type:number,source:string){const s=gl.createShader(type);if(!s)throw Error('Shader unavailable');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(String(gl.getShaderInfoLog(s)));return s;}
function sphere(){const verts:number[]=[],norms:number[]=[],indices:number[]=[];const rows=16,cols=20;for(let y=0;y<=rows;y++){const v=y/rows,theta=v*Math.PI;for(let x=0;x<=cols;x++){const phi=x/cols*Math.PI*2,nx=Math.sin(theta)*Math.cos(phi),ny=Math.cos(theta),nz=Math.sin(theta)*Math.sin(phi);verts.push(nx,ny,nz);norms.push(nx,ny,nz);}}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*(cols+1)+x;indices.push(i,i+cols+1,i+1,i+1,i+cols+1,i+cols+2);}return {verts:new Float32Array(verts),norms:new Float32Array(norms),indices:new Uint16Array(indices)};}
export function mountPlayer3D(host:HTMLElement,initial:PlayerAppearance){
 const canvas=document.createElement('canvas');canvas.className='player-3d-canvas';canvas.setAttribute('aria-label','Rotatable three-dimensional hockey player preview');canvas.setAttribute('role','img');host.replaceChildren(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
 if(!gl){host.textContent='3D preview unavailable on this device.';return {update:(_p:PlayerAppearance)=>{},dispose:()=>{}};}
 let program:WebGLProgram|null=null;try{program=gl.createProgram();if(!program)throw Error('No WebGL program');gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link failed');}catch{host.textContent='3D graphics are unavailable.';return {update:(_p:PlayerAppearance)=>{},dispose:()=>{}};}
 gl.useProgram(program);
 const mesh=sphere();const buffers=[gl.createBuffer(),gl.createBuffer(),gl.createBuffer()];
 if(buffers.some(b=>!b)){host.textContent='3D graphics are unavailable.';return {update:(_p:PlayerAppearance)=>{},dispose:()=>{}};}
 const bind=(buffer:WebGLBuffer|null,data:BufferSource,target:number)=>{gl.bindBuffer(target,buffer);gl.bufferData(target,data,gl.STATIC_DRAW);};
 bind(buffers[0],mesh.verts,gl.ARRAY_BUFFER);bind(buffers[1],mesh.norms,gl.ARRAY_BUFFER);bind(buffers[2],mesh.indices,gl.ELEMENT_ARRAY_BUFFER);
 const attr=(name:string,buffer:WebGLBuffer|null)=>{const loc=gl.getAttribLocation(program!,name);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);};
 attr('position',buffers[0]);attr('normal',buffers[1]);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers[2]);
 const uniforms={projection:gl.getUniformLocation(program,'projection'),angle:gl.getUniformLocation(program,'angle'),center:gl.getUniformLocation(program,'center'),scale:gl.getUniformLocation(program,'scale'),tint:gl.getUniformLocation(program,'tint')};
 gl.enable(gl.DEPTH_TEST);let angle=0,model=parts(initial),frame=0,disposed=false;
 const draw=()=>{if(disposed)return;const w=Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,2))),h=Math.max(1,Math.round(canvas.clientHeight*Math.min(devicePixelRatio||1,2)));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clearColor(.055,.13,.21,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const aspect=w/h,f=1/Math.tan(Math.PI/6),near=.1,far=100;gl.uniformMatrix4fv(uniforms.projection,false,new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]));gl.uniform1f(uniforms.angle,angle);for(const part of model){gl.uniform3fv(uniforms.center,part.center);gl.uniform3fv(uniforms.scale,part.scale);gl.uniform3fv(uniforms.tint,hex(part.color));gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);}};
 let startX:number|null=null;const down=(e:PointerEvent)=>{startX=e.clientX;canvas.setPointerCapture(e.pointerId);};const move=(e:PointerEvent)=>{if(startX===null)return;angle+=(e.clientX-startX)*.012;startX=e.clientX;draw();};const up=()=>{startX=null;};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});observer.observe(canvas);frame=requestAnimationFrame(draw);
 return {update:(p:PlayerAppearance)=>{model=parts(p);draw();},dispose:()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);buffers.forEach(b=>gl.deleteBuffer(b));gl.deleteProgram(program);}};
}
