import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import {COLORS} from '../player/equipment';

const SKIN:Record<string,string>={Porcelain:'#f6d9c7',Fair:'#eac1a7',Light:'#d6a487',Medium:'#b97d5d',Tan:'#a66b4b',Deep:'#754832',Rich:'#482c25'};
const HAIR:Record<string,string>={Black:'#1e2026','Dark brown':'#352720',Brown:'#704b36',Blonde:'#c6a36b',Platinum:'#ded8c4',Red:'#a14b31',Auburn:'#82432f',Blue:'#436aab',Pink:'#c477a1'};
const EYES:Record<string,string>={Brown:'#6b4a34',Blue:'#568eb2',Green:'#56846b',Hazel:'#8b8554',Grey:'#788b9c',Amber:'#ba8545'};
let portraitSequence=0;

/** Studio-inspired vector portrait, with hairstyle layers anchored to one head silhouette. */
export function playerPortrait(p:PlayerAppearance,e:Equipment):string {
 const id='headshot-'+(++portraitSequence);
 const skin=SKIN[p.skinTone]??SKIN.Fair,hair=HAIR[p.hairColor]??HAIR.Brown,iris=EYES[p.eyeColor]??EYES.Blue;
 const jersey=COLORS[e.jersey]??'#9b2836';
 const round=p.faceShape==='Round',square=p.faceShape==='Square',heart=p.faceShape==='Heart',angular=p.faceShape==='Angular';
 const cheek=round?70:square?73:angular?64:heart?68:67;
 const jaw=round?57:square?64:heart?48:angular?51:55;
 const chinY=round?278:283;
 const face=`M160 91 C119 89 ${160-cheek+5} 113 ${160-cheek} 163 C${160-cheek-1} 218 ${160-jaw-3} 254 160 ${chinY} C${160+jaw+3} 254 ${160+cheek+1} 218 ${160+cheek} 163 C${160+cheek-5} 113 201 89 160 91Z`;
 const style=p.hairStyle;
 const longBack=style==='Mullet'?`<path d="M105 132 Q90 173 96 218 Q90 244 96 276 L103 268 L107 287 L114 274 L119 279 Q118 247 124 218 L126 132Z M215 132 Q230 173 224 218 Q230 244 224 276 L217 268 L213 287 L206 274 L201 279 Q202 247 196 218 L194 132Z" fill="url(#${id}-hair)"/>`:style==='Ponytail'?`<path d="M208 112 Q232 125 231 154 Q246 180 237 207 Q242 226 226 245 Q216 251 221 234 Q227 202 221 178 L203 127Z" fill="url(#${id}-hair)"/><path d="M229 165 Q239 198 227 229" stroke="${hair}" stroke-width="3" opacity=".6" fill="none"/>`:style==='Medium'?`<path d="M99 125 Q88 150 95 186 L106 205 L117 145Z M221 125 Q232 150 225 186 L214 205 L203 145Z" fill="url(#${id}-hair)"/>`:'';
 const cap=style==='Bald'?'':style==='Buzz cut'?`<path d="M93 132 Q91 84 129 76 Q163 64 197 77 Q229 90 227 132 Q191 115 159 119 Q125 115 93 132Z" fill="${hair}" opacity=".47"/>`:style==='Curly'?`<path d="M89 144 Q78 99 112 76 Q151 49 198 72 Q237 91 231 145 L217 128 Q178 110 142 124 Q117 122 101 139Z" fill="url(#${id}-hair)"/>`:style==='Ponytail'?`<path d="M89 147 Q80 111 102 83 Q123 60 162 62 Q206 61 227 91 L227 143 Q207 120 181 119 Q143 123 101 140Z" fill="url(#${id}-hair)"/><path d="M106 116 Q164 93 217 120" fill="none" stroke="${hair}" stroke-width="6" opacity=".8"/>`:style==='Mullet'?`<path d="M90 145 Q82 108 103 84 Q130 58 169 63 Q211 59 228 94 Q233 114 225 144 L217 124 Q185 110 155 122 Q125 126 101 140Z" fill="url(#${id}-hair)"/><path d="M101 127 Q126 107 151 111 Q181 104 205 116 Q173 125 147 134 L105 141Z" fill="${hair}" opacity=".85"/>`:style==='Medium'?`<path d="M89 147 Q78 112 99 83 Q127 54 166 60 Q216 58 231 97 L225 146 Q210 123 184 115 Q147 131 102 144Z" fill="url(#${id}-hair)"/><path d="M101 130 Q144 104 178 109 Q202 104 217 116 Q182 121 160 138 Q128 135 104 146Z" fill="${hair}" opacity=".83"/>`:`<path d="M91 144 Q81 113 103 85 Q131 58 165 65 Q208 60 227 95 L226 140 Q201 114 176 115 Q143 119 104 137Z" fill="url(#${id}-hair)"/><path d="M103 129 Q140 107 170 111 Q191 104 208 117 Q177 122 153 131 L107 141Z" fill="${hair}" opacity=".78"/>`;
 const curls=style==='Curly'?Array.from({length:30},(_,i)=>{const row=Math.floor(i/10),col=i%10,x=93+col*14+(row%2)*5,y=80+row*15+Math.sin(col*1.7+row)*5;return `<path d="M${x-7} ${y+7} Q${x-13} ${y-3} ${x-1} ${y-9} Q${x+11} ${y-13} ${x+10} ${y+2} Q${x+7} ${y+9} ${x-3} ${y+8}" fill="${i%4===0?'url(#'+id+'-hair)':hair}" opacity=".94"/>`;}).join(''):'';
 const fibers=style==='Bald'||style==='Buzz cut'||style==='Curly'?'':Array.from({length:23},(_,i)=>{const x=101+i*5.2,y=86+Math.sin(i*.74)*9;return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q-8 12 -8 25" stroke="${i%3===0?'#fff':'#1a1516'}" stroke-opacity="${i%3===0?.11:.13}" stroke-width="${i%4===0?1.8:1}" fill="none"/>`;}).join('');
 const stubble=style==='Buzz cut'?Array.from({length:64},(_,i)=>{const x=106+(i%16)*7,y=92+Math.floor(i/16)*8;return `<path d="M${x} ${y}l1 -2" stroke="${hair}" stroke-width=".8" opacity=".45"/>`;}).join(''):'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390" role="img" aria-label="Studio hockey portrait, ${p.hairStyle.toLowerCase()} ${p.hairColor.toLowerCase()} hair, ${p.eyeColor.toLowerCase()} eyes">
 <defs>
 <radialGradient id="${id}-bg" cx="46%" cy="30%" r="86%"><stop stop-color="#385468"/><stop offset=".55" stop-color="#182d41"/><stop offset="1" stop-color="#081522"/></radialGradient>
 <linearGradient id="${id}-skin" x1="0" y1=".15" x2="1" y2=".8"><stop stop-color="#fff" stop-opacity=".22"/><stop offset=".32" stop-color="#fff" stop-opacity=".04"/><stop offset=".72" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#20100e" stop-opacity=".27"/></linearGradient>
 <radialGradient id="${id}-cheek" cx="50%" cy="50%" r="50%"><stop stop-color="#b65e58" stop-opacity=".18"/><stop offset="1" stop-color="#b65e58" stop-opacity="0"/></radialGradient>
 <linearGradient id="${id}-hair" x1=".1" y1=".2" x2=".9" y2=".75"><stop stop-color="#10151b"/><stop offset=".23" stop-color="${hair}"/><stop offset=".7" stop-color="${hair}"/><stop offset="1" stop-color="#151b24"/></linearGradient>
 <linearGradient id="${id}-shirt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${jersey}"/><stop offset=".6" stop-color="${jersey}"/><stop offset="1" stop-color="#0a1725"/></linearGradient>
 <clipPath id="${id}-faceclip"><path d="${face}"/></clipPath>
 </defs>
 <rect width="320" height="390" fill="url(#${id}-bg)"/><ellipse cx="160" cy="175" rx="110" ry="152" fill="#9fc5db" opacity=".04"/>
 <path d="M0 332L320 250 M0 365L320 284" fill="none" stroke="#a9c8df" stroke-opacity=".09" stroke-width="1.5"/>
 ${longBack}
 <path d="M131 259 L130 309 Q160 331 190 309 L189 259Z" fill="${skin}"/>
 <path d="M132 262 Q159 297 188 262 L189 280 Q159 308 131 281Z" fill="#38221d" opacity=".16"/>
 <path d="M-12 390 Q-2 327 88 297 L126 282 L160 317 L194 282 L232 297 Q322 327 332 390Z" fill="url(#${id}-shirt)"/>
 <path d="M125 285L160 321L195 285" stroke="#eef3f6" stroke-width="8" fill="none"/><path d="M27 351L102 327 M293 351L218 327" stroke="#e7eefa" stroke-opacity=".28" stroke-width="4" fill="none"/>
 <path d="M91 171 Q74 167 80 194 Q83 205 96 207 L103 185Z M229 171 Q246 167 240 194 Q237 205 224 207 L217 185Z" fill="${skin}"/>
 <path d="${face}" fill="${skin}"/><path d="${face}" fill="url(#${id}-skin)"/>
 <g clip-path="url(#${id}-faceclip)">
 <ellipse cx="117" cy="211" rx="37" ry="30" fill="url(#${id}-cheek)"/><ellipse cx="203" cy="211" rx="37" ry="30" fill="url(#${id}-cheek)"/>
 <path d="M103 205 Q115 210 138 205 M182 205 Q205 210 217 205" stroke="#fff" stroke-opacity=".08" stroke-width="5" fill="none"/>
 <path d="M114 158 Q160 145 206 158" stroke="#fff" stroke-opacity=".055" stroke-width="12" fill="none"/>
 </g>
 <path d="M108 174 Q127 165 145 174 M175 174 Q194 165 212 174" stroke="#3a2827" stroke-opacity=".52" stroke-width="3.5" stroke-linecap="round" fill="none"/>
 <path d="M109 190 Q128 182 147 189 Q127 198 109 190Z M173 189 Q192 182 211 190 Q192 198 173 189Z" fill="#e5e5e0"/>
 <circle cx="129" cy="190" r="5.8" fill="${iris}"/><circle cx="191" cy="190" r="5.8" fill="${iris}"/><circle cx="129" cy="190" r="2.8" fill="#15191e"/><circle cx="191" cy="190" r="2.8" fill="#15191e"/>
 <circle cx="131" cy="188" r="1.6" fill="#fff"/><circle cx="193" cy="188" r="1.6" fill="#fff"/>
 <path d="M109 189 Q129 180 147 189 M173 189 Q192 180 211 189" stroke="#45302a" stroke-opacity=".72" stroke-width="2.1" stroke-linecap="round" fill="none"/>
 <path d="M160 194 Q159 211 154 226 Q160 231 168 226" stroke="#6c433a" stroke-opacity=".43" stroke-width="2.2" stroke-linecap="round" fill="none"/>
 <path d="M145 252 Q160 248 175 252 Q160 257 145 252Z" fill="#8a5c55" opacity=".64"/><path d="M149 253 Q160 255 171 253" stroke="#fff" stroke-opacity=".15" stroke-width="1.3" fill="none"/>
 <path d="M138 267 Q160 276 182 267" stroke="#fff" stroke-opacity=".10" stroke-width="1.5" fill="none"/>
 ${cap}${fibers}${stubble}${curls}
 </svg>`;
}
