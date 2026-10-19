import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import {COLORS} from '../player/equipment';

const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};

/** Layered, responsive hockey headshot. Every appearance option remains deterministic and editable. */
export function playerPortrait(p:PlayerAppearance,e:Equipment):string{
 const s=skin[p.skinTone]??skin.Fair,h=hair[p.hairColor]??hair.Brown,iris=eyes[p.eyeColor]??eyes.Blue,jersey=COLORS[e.jersey]??'#27648d';
 const round=p.faceShape==='Round',square=p.faceShape==='Square',heart=p.faceShape==='Heart',angular=p.faceShape==='Angular';
 const cheek=round?78:square?77:angular?66:heart?72:70;
 const jaw=round?65:square?69:heart?48:angular?53:58;
 const shadow=p.skinTone==='Deep'||p.skinTone==='Rich'?'#211518':'#653d37';
 const bald=p.hairStyle==='Bald',buzz=p.hairStyle==='Buzz cut',curly=p.hairStyle==='Curly';
 const long=['Long','Medium','Curly','Ponytail'].includes(p.hairStyle);
 const facePath=`M 160 82 C 111 80 ${160-cheek} 107 ${160-cheek} 161 C ${160-cheek-3} 216 ${160-jaw-7} 261 160 288 C ${160+jaw+7} 261 ${160+cheek+3} 216 ${160+cheek} 161 C ${160+cheek} 107 209 80 160 82 Z`;
 const back=long?`<path d="M96 108 C61 134 67 216 55 ${p.hairStyle==='Long'?379:311} Q80 397 107 ${p.hairStyle==='Long'?371:302} L119 120Z M224 108 C259 134 253 216 265 ${p.hairStyle==='Long'?379:311} Q240 397 213 ${p.hairStyle==='Long'?371:302} L201 120Z" fill="url(#hair-shade)"/>`:'';
 const fringe=bald?'':buzz?`<path d="M91 139 C87 79 124 65 160 65 C200 65 233 85 229 139 Q163 105 91 139Z" fill="url(#hair-shade)"/>`:`<path d="M86 163 C72 112 88 74 116 61 C147 42 197 48 220 70 C246 87 244 137 232 165 L221 119 C204 119 195 98 188 91 C163 111 131 121 101 115Z" fill="url(#hair-shade)"/><path d="M102 116 Q141 109 187 90 Q175 119 126 131" fill="${h}" opacity=".75"/>`;
 const curls=curly?Array.from({length:12},(_,i)=>{const x=89+i*13;const y=95+Math.sin(i*.85)*16;return `<ellipse cx="${x}" cy="${y}" rx="15" ry="18" fill="${h}" opacity="${i%2?.9:1}"/>`;}).join(''):'';
 const strands=!bald&&!buzz?Array.from({length:9},(_,i)=>`<path d="M${103+i*13} 69 Q${97+i*13} 87 ${92+i*13} ${112+Math.sin(i)*8}" fill="none" stroke="#fff" stroke-opacity=".085" stroke-width="2"/>`).join(''):'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390" role="img" aria-label="Hockey player headshot with ${p.hairColor.toLowerCase()} hair and ${p.eyeColor.toLowerCase()} eyes">
 <defs>
 <radialGradient id="portrait-bg" cx="45%" cy="28%" r="90%"><stop stop-color="#30546c"/><stop offset=".58" stop-color="#142d44"/><stop offset="1" stop-color="#071726"/></radialGradient>
 <radialGradient id="face-light" cx="37%" cy="27%" r="78%"><stop stop-color="#fff" stop-opacity=".28"/><stop offset=".46" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="${shadow}" stop-opacity=".38"/></radialGradient>
 <linearGradient id="portrait-jersey" x1="0" x2=".8" y2="1"><stop stop-color="${jersey}"/><stop offset=".62" stop-color="${jersey}"/><stop offset="1" stop-color="#0b1929"/></linearGradient>
 <linearGradient id="hair-shade" x1="0" x2="1" y2=".65"><stop stop-color="${shadow}"/><stop offset=".32" stop-color="${h}"/><stop offset=".68" stop-color="${h}"/><stop offset="1" stop-color="#161720"/></linearGradient>
 </defs>
 <rect width="320" height="390" fill="url(#portrait-bg)"/><ellipse cx="160" cy="187" rx="120" ry="170" fill="#91c7e8" opacity=".045"/>
 <path d="M0 330L320 238 M0 374L320 282" stroke="#d7eafa" stroke-width="2" opacity=".09"/>
 ${back}
 <path d="M132 257 L131 307 Q160 334 189 307 L188 257" fill="${s}"/><path d="M133 265 Q159 298 187 265 L188 279 Q162 312 132 280Z" fill="${shadow}" opacity=".18"/>
 <path d="M-8 390 Q1 320 91 295 L127 281 L160 314 L193 281 L229 295 Q319 320 328 390Z" fill="url(#portrait-jersey)"/>
 <path d="M124 282 L160 321 L196 282" fill="none" stroke="#f1f5f9" stroke-width="9"/><path d="M27 353 L100 325 M293 353 L220 325" stroke="#e7f2fc" stroke-opacity=".34" stroke-width="5"/>
 <path d="M86 169 C67 160 73 203 92 213 L102 188Z M234 169 C253 160 247 203 228 213 L218 188Z" fill="${s}"/>
 <path d="${facePath}" fill="${s}"/><path d="${facePath}" fill="url(#face-light)"/>
 <path d="M99 207 Q119 219 141 209 M179 209 Q202 219 222 207" fill="none" stroke="${shadow}" stroke-opacity=".13" stroke-width="14" stroke-linecap="round"/>
 <path d="M106 171 Q125 163 146 173 M174 173 Q195 163 214 171" fill="none" stroke="${shadow}" stroke-width="4.5" stroke-linecap="round" opacity=".74"/>
 <path d="M108 189 Q127 178 148 188 Q129 201 108 189Z M172 188 Q193 178 212 189 Q191 201 172 188Z" fill="#eee8df"/>
 <circle cx="129" cy="189" r="7.5" fill="${iris}"/><circle cx="191" cy="189" r="7.5" fill="${iris}"/><circle cx="129" cy="189" r="3.5" fill="#171c22"/><circle cx="191" cy="189" r="3.5" fill="#171c22"/>
 <circle cx="131" cy="186" r="2.1" fill="#fff"/><circle cx="193" cy="186" r="2.1" fill="#fff"/>
 <path d="M108 188 Q127 177 148 187 M172 187 Q193 177 212 188" fill="none" stroke="${shadow}" stroke-width="2.4" stroke-linecap="round"/>
 <path d="M160 188 Q157 211 151 228 Q158 235 170 228" fill="none" stroke="${shadow}" stroke-opacity=".43" stroke-width="2.5" stroke-linecap="round"/>
 <path d="M141 253 Q160 246 179 253 Q160 265 141 253Z" fill="${shadow}" opacity=".43"/><path d="M146 251 Q160 254 174 251" fill="none" stroke="#fff" stroke-opacity=".21" stroke-width="1.8"/>
 <path d="M131 275 Q160 287 189 275" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2"/>
 ${fringe}${strands}${curls}
 </svg>`;
}
