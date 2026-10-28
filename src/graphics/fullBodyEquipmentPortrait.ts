import type {PlayerDraft} from '../player/types';
import {COLORS} from '../player/equipment';

const skinColors:Record<string,string>={Porcelain:'#f6d9c7',Fair:'#eac1a7',Light:'#d6a487',Medium:'#b97d5d',Tan:'#a66b4b',Deep:'#754832',Rich:'#482c25'};
const hairColors:Record<string,string>={Black:'#1e2026','Dark brown':'#352720',Brown:'#704b36',Blonde:'#c6a36b',Platinum:'#ded8c4',Red:'#a14b31',Auburn:'#82432f',Blue:'#436aab',Pink:'#c477a1'};
let seq=0;
/** Front-facing, full-body 2D equipment illustration. Every item is vector-drawn
 * and colour-linked to the existing creator settings. Goalie gear is distinct.
 */
export function fullBodyEquipmentPortrait(p:PlayerDraft):string {
 const id='equipment-figure-'+(++seq),g=p.position==='G';
 const jersey=COLORS[p.equipment.jersey]??'#b73348',helmet=COLORS[p.equipment.helmet]??'#182d42',glove=COLORS[p.equipment.gloves]??'#172d40',pad=COLORS[p.equipment.pads]??'#f2f4f5',stick=(p.equipment.stick==='Natural'?'#c9aa7b':COLORS[p.equipment.stick])??'#ded9ca';
 const skin=skinColors[p.appearance.skinTone]??'#eac1a7',hair=hairColors[p.appearance.hairColor]??'#704b36';
 const num=Number.isFinite(p.jerseyNumber)?p.jerseyNumber:0;
 const cage=g?`<g><path d="M124 90Q119 42 150 31Q170 23 190 31Q221 42 216 90L207 139Q193 158 170 165Q147 158 133 139Z" fill="${helmet}" stroke="#b7c7d3" stroke-width="4"/><path d="M137 80Q170 64 203 80L201 122Q190 140 170 149Q150 140 139 122Z" fill="#0e1c2b" stroke="#a7b9c7" stroke-width="3"/><path d="M125 91L140 94L149 133L170 152L191 133L200 94L215 91L208 138Q192 158 170 165Q148 158 132 138Z" fill="${helmet}" stroke="#d4dfe7" stroke-width="3"/><g stroke="#d8e2e9" stroke-width="2.6" fill="none"><path d="M139 88Q170 80 201 88M138 101Q170 95 202 101M142 114Q170 110 198 114M149 129Q170 126 191 129"/><path d="M145 86Q142 109 154 132M157 83Q155 115 163 142M170 82V147M183 83Q185 115 177 142M195 86Q198 109 186 132"/></g><g fill="#dce5eb"><circle cx="140" cy="89" r="3"/><circle cx="200" cy="89" r="3"/><circle cx="150" cy="134" r="3"/><circle cx="190" cy="134" r="3"/></g><g fill="#132335"><ellipse cx="152" cy="48" rx="4" ry="7"/><ellipse cx="188" cy="48" rx="4" ry="7"/><circle cx="161" cy="153" r="3"/><circle cx="170" cy="156" r="3"/><circle cx="179" cy="153" r="3"/></g></g>`:`<path d="M143 104Q170 116 197 104" fill="none" stroke="#d9e4ec" stroke-width="3"/>`;
 const goaliePads=g?`<g stroke-linejoin="round"><path d="M108 336Q110 324 125 323L155 326Q165 329 164 346L163 487Q159 508 143 511L119 505Q105 499 105 483Z M185 326L215 323Q230 324 232 336L235 483Q235 499 221 505L197 511Q181 508 177 487L176 346Q175 329 185 326Z" fill="${pad}" stroke="#bdcbd5" stroke-width="4"/><g fill="#ffffff" fill-opacity=".15" stroke="#8499aa" stroke-width="2"><path d="M109 347Q135 334 162 348L161 382Q136 392 108 381Z M179 348Q206 334 232 347L233 381Q205 392 178 382Z"/><path d="M109 393Q135 401 162 392L161 430Q135 440 108 430Z M179 392Q206 401 232 393L233 430Q205 440 178 430Z"/><path d="M109 443Q135 450 161 441L159 485Q143 502 117 493Z M180 441Q206 450 232 443L224 493Q198 502 182 485Z"/></g><g stroke="#71899c" stroke-width="3"><path d="M110 357H161M110 407H161M110 460H160M179 357H231M179 407H231M180 460H230"/></g></g>`:`<g fill="#263748" stroke="#8ca4b8" stroke-width="3"><path d="M113 347L157 345L157 444L115 446Z"/><path d="M183 345L225 347L225 446L182 444Z"/></g><g stroke="#c5d3dd" stroke-width="4"><path d="M116 380H155M116 406H155M185 380H223M185 406H223"/></g>`;
 const hands=g?`<g stroke-linejoin="round"><path d="M88 269Q65 249 49 262Q31 273 36 294Q39 315 60 323Q81 330 99 308L105 282Z" fill="${glove}" stroke="#b9cbd8" stroke-width="4"/><path d="M49 272Q61 254 82 266L87 285Q67 278 48 296Z" fill="#3b5368" stroke="#d0dce6" stroke-width="3"/><path d="M48 289Q67 275 88 285L86 308Q65 320 48 305Z" fill="#0c1d2c" stroke="#e0e8ee" stroke-width="3"/><g stroke="#b8cad7" stroke-width="1.7" fill="none"><path d="M49 290L83 307M50 302L83 282M57 281L87 301M65 280L86 293M49 297L77 282"/></g><path d="M237 273Q247 259 264 265L277 275L267 318Q252 330 240 310Z" fill="#283f54" stroke="#a8bdcb" stroke-width="4"/><path d="M246 259L290 264Q301 267 298 282L293 320Q289 332 277 330L244 316Z" fill="${glove}" stroke="#d3dfe7" stroke-width="4"/><path d="M253 270L289 274L285 316L251 309Z" fill="#ffffff" fill-opacity=".14" stroke="#95aabb" stroke-width="2"/><path d="M253 284L288 289M251 300L285 306" stroke="#b5c7d5" stroke-width="2.5"/></g>`:`<g fill="${glove}" stroke="#8ea4b7" stroke-width="4"><path d="M66 268L98 268L101 307Q79 324 63 304Z"/><path d="M242 268L274 268L277 305Q259 322 240 306Z"/></g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 560" role="img" aria-label="Full-body 2D ${g?'goaltender':'skater'} equipment preview with helmet, jersey, gloves, pads and stick">
 <defs><linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#294a61"/><stop offset="1" stop-color="#0b1c2c"/></linearGradient><linearGradient id="${id}-jersey" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".2"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".3"/></linearGradient></defs>
 <rect width="340" height="560" rx="18" fill="url(#${id}-bg)"/><ellipse cx="170" cy="518" rx="119" ry="19" fill="#06121d" opacity=".5"/>
 <path d="M132 302L165 304L160 467L109 465L111 342Z M176 304L209 302L231 465L180 467Z" fill="#15273a" stroke="#3c5266" stroke-width="5"/>
 <path d="M111 452L161 452L164 510Q135 524 103 510Z M178 452L228 452L238 510Q206 524 176 510Z" fill="#182432" stroke="#afc1ce" stroke-width="4"/>
 ${goaliePads}
 <path d="M116 153L99 168L61 265L100 284L135 214Z M224 153L241 168L279 265L240 284L205 214Z" fill="${jersey}" stroke="#25394d" stroke-width="5"/>
 <path d="M122 149Q170 136 218 149L243 190L221 334Q170 346 119 334L97 190Z" fill="${jersey}" stroke="#273d52" stroke-width="5"/>
 <path d="M118 149Q170 135 222 149L240 195L219 332Q170 343 121 332L99 195Z" fill="url(#${id}-jersey)"/>
 <path d="M133 150L170 177L207 150" stroke="#e8edf2" stroke-width="9" fill="none"/><path d="M123 315Q170 325 217 315" stroke="#f2f5f6" stroke-width="9" fill="none"/>
 <text x="170" y="261" font-family="system-ui,sans-serif" font-size="60" text-anchor="middle" font-weight="900" fill="#f4f6f8" stroke="#1b3043" stroke-width="2" paint-order="stroke">${num}</text>
 <path d="M154 128L154 153L186 153L186 128" fill="${g?'#152b40':skin}"/>
 <ellipse cx="170" cy="99" rx="39" ry="48" fill="${g?'#152335':skin}"/>${g?'':`<path d="M131 93Q130 46 170 44Q212 44 209 93Q189 75 170 79Q147 75 131 93Z" fill="${hair}"/>`}
 ${g?'':`<path d="M125 93Q123 38 169 34Q219 35 215 94L204 103L201 75Q170 58 138 75L135 103Z" fill="${helmet}" stroke="#8198ab" stroke-width="4"/>`}
 ${cage}
 ${g?'':'<path d="M138 129Q170 148 202 129" fill="none" stroke="#e1e8ee" stroke-width="4"/>'}
 ${hands}
 <path d="${g?'M270 320L288 505L297 505L279 320Z':'M265 304L282 475L290 475L275 302Z'}" fill="${stick}" stroke="#879bab" stroke-width="3"/>
 <path d="M${g?'287 496L323 496L323 512L288 512':'282 466L319 466L319 480L283 480'}" fill="${stick}" stroke="#879bab" stroke-width="3"/>
 <text x="170" y="543" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#c9d8e4">${g?'GOALTENDER · MASK / TRAPPER / BLOCKER / PADS':'SKATER · HELMET / GLOVES / SKATES'}</text>
 </svg>`;
}
