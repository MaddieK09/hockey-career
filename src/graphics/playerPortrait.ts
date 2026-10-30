import {teamCrest} from '../game/fictionalBranding';
import type {PlayerAppearance} from '../player/appearance';
import {portraitHair} from './portraitHair';
import type {Equipment} from '../player/equipment';
import {COLORS} from '../player/equipment';

const SKIN:Record<string,string>={Porcelain:'#f6d9c7',Fair:'#eac1a7',Light:'#d6a487',Medium:'#b97d5d',Tan:'#a66b4b',Deep:'#754832',Rich:'#482c25'};
const HAIR:Record<string,string>={Black:'#1e2026','Dark brown':'#352720',Brown:'#704b36',Blonde:'#c6a36b',Platinum:'#ded8c4',Red:'#a14b31',Auburn:'#82432f',Blue:'#436aab',Pink:'#c477a1'};
const EYES:Record<string,string>={Brown:'#6b4a34',Blue:'#568eb2',Green:'#56846b',Hazel:'#8b8554',Grey:'#788b9c',Amber:'#ba8545'};
let portraitSequence=0;

/** V3 broadcast-style vector portrait, with hairstyle layers anchored to one head silhouette. */
export function playerPortrait(p:PlayerAppearance,e:Equipment,teamId?:string):string {
 const id='headshot-v3-'+(++portraitSequence);
 const skin=SKIN[p.skinTone]??SKIN.Fair,hair=HAIR[p.hairColor]??HAIR.Brown,iris=EYES[p.eyeColor]??EYES.Blue;
 const jersey=COLORS[e.jersey]??'#9b2836';
 const round=p.faceShape==='Round',square=p.faceShape==='Square',heart=p.faceShape==='Heart',angular=p.faceShape==='Angular';
 const cheek=round?67:square?70:angular?61:heart?64:63;
 const jaw=round?56:square?61:heart?47:angular?49:53;
 const chinY=round?278:283;
 const face=`M160 91 C119 89 ${160-cheek+5} 113 ${160-cheek} 163 C${160-cheek-1} 218 ${160-jaw-3} 254 160 ${chinY} C${160+jaw+3} 254 ${160+cheek+1} 218 ${160+cheek} 163 C${160+cheek-5} 113 201 89 160 91Z`;
 const {back:longBack,front:cap}=portraitHair(p.hairStyle,hair,`${id}-hair`);
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
 ${teamId?`<g transform="translate(127 321)">${teamCrest(teamId,66)}</g>`:""}
 <path d="M125 285L160 321L195 285" stroke="#eef3f6" stroke-width="8" fill="none"/><path d="M27 351L102 327 M293 351L218 327" stroke="#e7eefa" stroke-opacity=".28" stroke-width="4" fill="none"/>
 <path d="M91 171 Q74 167 80 194 Q83 205 96 207 L103 185Z M229 171 Q246 167 240 194 Q237 205 224 207 L217 185Z" fill="${skin}"/>
 <path d="${face}" fill="${skin}"/><path d="${face}" fill="url(#${id}-skin)"/>
 <g clip-path="url(#${id}-faceclip)">
 <ellipse cx="117" cy="211" rx="37" ry="30" fill="url(#${id}-cheek)"/><ellipse cx="203" cy="211" rx="37" ry="30" fill="url(#${id}-cheek)"/>
 <path d="M103 205 Q115 210 138 205 M182 205 Q205 210 217 205" stroke="#fff" stroke-opacity=".08" stroke-width="5" fill="none"/>
 <path d="M114 158 Q160 145 206 158" stroke="#fff" stroke-opacity=".055" stroke-width="12" fill="none"/>
 </g>
 <path d="M108 174 Q127 165 145 174 M175 174 Q194 165 212 174" stroke="#3a2827" stroke-opacity=".52" stroke-width="3.5" stroke-linecap="round" fill="none"/>
 <path d="M109 190 Q128 185 147 189 Q127 195 109 190Z M173 189 Q192 185 211 190 Q192 195 173 189Z" fill="#e5e5e0"/>
 <circle cx="129" cy="190" r="4.8" fill="${iris}"/><circle cx="191" cy="190" r="4.8" fill="${iris}"/><circle cx="129" cy="190" r="2.4" fill="#15191e"/><circle cx="191" cy="190" r="2.4" fill="#15191e"/>
 <circle cx="131" cy="188" r="1.6" fill="#fff"/><circle cx="193" cy="188" r="1.6" fill="#fff"/>
 <path d="M109 189 Q129 180 147 189 M173 189 Q192 180 211 189" stroke="#45302a" stroke-opacity=".72" stroke-width="2.1" stroke-linecap="round" fill="none"/>
 <path d="M160 194 Q159 211 154 226 Q160 231 168 226" stroke="#6c433a" stroke-opacity=".43" stroke-width="2.2" stroke-linecap="round" fill="none"/>
 <path d="M145 252 Q160 248 175 252 Q160 257 145 252Z" fill="#8a5c55" opacity=".64"/><path d="M149 253 Q160 255 171 253" stroke="#fff" stroke-opacity=".15" stroke-width="1.3" fill="none"/>
 <path d="M138 267 Q160 276 182 267" stroke="#fff" stroke-opacity=".10" stroke-width="1.5" fill="none"/>
 ${cap}
 </svg>`;
}
