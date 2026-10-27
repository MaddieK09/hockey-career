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
 const cage=g?`<path d="M151 83 Q170 65 189 83 L187 132 Q170 154 153 132Z" fill="#111e2d" stroke="#e4e8ed" stroke-width="4"/><g fill="none" stroke="#c8d2dc" stroke-width="2.8"><path d="M152 91Q170 84 188 91 M151 103Q170 97 189 103 M152 116Q170 110 188 116 M154 129Q170 124 186 129 M161 82L159 132 M170 78L170 141 M179 82L181 132"/></g>`:`<path d="M143 104Q170 116 197 104" fill="none" stroke="#d9e4ec" stroke-width="3"/>`;
 const goaliePads=g?`<g stroke="#b6c4ce" stroke-width="3"><path d="M107 333 Q106 325 123 325 L156 325 Q164 330 162 347 L161 493 Q157 508 143 508 L117 506 Q106 503 106 490Z" fill="${pad}"/><path d="M178 325L214 325Q230 326 230 344L230 489Q228 506 216 507L190 507Q176 506 175 493Z" fill="${pad}"/><path d="M112 354H159M110 386H160M110 420H160M110 453H160M179 354H226M178 386H227M178 420H227M178 453H227" fill="none" stroke="#889cae" stroke-width="3"/></g>`:`<g fill="#263748" stroke="#8ca4b8" stroke-width="3"><path d="M113 347L157 345L157 444L115 446Z"/><path d="M183 345L225 347L225 446L182 444Z"/></g><g stroke="#c5d3dd" stroke-width="4"><path d="M116 380H155M116 406H155M185 380H223M185 406H223"/></g>`;
 const hands=g?`<g><path d="M77 257 Q48 245 43 273 L46 312 Q69 326 94 304 L100 272Z" fill="${glove}" stroke="#aabcca" stroke-width="5"/><path d="M42 271Q63 254 91 275M47 288Q69 277 93 294" stroke="#c7d4df" stroke-width="3" fill="none"/><path d="M242 262 L295 262 L295 327 L242 327Z" fill="${glove}" stroke="#bdcad5" stroke-width="6"/><path d="M249 272H288M249 316H288" stroke="#6d8397" stroke-width="3"/></g>`:`<g fill="${glove}" stroke="#8ea4b7" stroke-width="4"><path d="M66 268L98 268L101 307Q79 324 63 304Z"/><path d="M242 268L274 268L277 305Q259 322 240 306Z"/></g>`;
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
 <path d="M154 128L154 153L186 153L186 128" fill="${skin}"/>
 <ellipse cx="170" cy="99" rx="39" ry="48" fill="${skin}"/><path d="M131 93Q130 46 170 44Q212 44 209 93Q189 75 170 79Q147 75 131 93Z" fill="${hair}"/>
 <path d="M125 93Q123 38 169 34Q219 35 215 94L204 103L201 75Q170 58 138 75L135 103Z" fill="${helmet}" stroke="#8198ab" stroke-width="4"/>
 ${cage}
 <path d="M138 129Q170 148 202 129" fill="none" stroke="#e1e8ee" stroke-width="4"/>
 ${hands}
 <path d="${g?'M270 320L288 505L297 505L279 320Z':'M265 304L282 475L290 475L275 302Z'}" fill="${stick}" stroke="#879bab" stroke-width="3"/>
 <path d="M${g?'287 496L323 496L323 512L288 512':'282 466L319 466L319 480L283 480'}" fill="${stick}" stroke="#879bab" stroke-width="3"/>
 <text x="170" y="543" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#c9d8e4">${g?'GOALTENDER · MASK / TRAPPER / BLOCKER / PADS':'SKATER · HELMET / GLOVES / SKATES'}</text>
 </svg>`;
}
