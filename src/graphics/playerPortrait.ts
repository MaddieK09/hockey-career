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
 const facePath=`M 160 82 C 111 80 ${160-cheek} 107 ${160-cheek} 161 C ${160-cheek-3} 216 ${160-jaw-7} 261 160 288 C ${160+jaw+7} 261 ${160+cheek+3} 216 ${160+cheek} 161 C ${160+cheek} 107 209 80 160 82 Z`;
 const style=p.hairStyle;
 const back=style==='Long'?`<path d="M99 107 Q66 133 68 239 Q63 305 54 371 Q78 388 110 362 L121 137Z M221 107 Q254 133 252 239 Q257 305 266 371 Q242 388 210 362 L199 137Z" fill="url(#hair-shade)"/>`:style==='Medium'?`<path d="M96 108 Q72 141 75 224 L65 301 Q90 308 111 284 L120 138Z M224 108 Q248 141 245 224 L255 301 Q230 308 209 284 L200 138Z" fill="url(#hair-shade)"/>`:style==='Ponytail'?`<path d="M208 90 Q261 104 262 178 Q271 217 249 284 Q231 301 220 269 Q240 217 223 155Z" fill="url(#hair-shade)"/>`:style==='Curly'?`<path d="M96 99 Q57 125 70 227 Q70 263 84 279 Q108 290 116 253 L115 135Z M224 99 Q263 125 250 227 Q250 263 236 279 Q212 290 204 253 L205 135Z" fill="url(#hair-shade)"/>`:'';
 const cap=`<path d="M88 156 Q76 110 95 83 Q113 51 160 54 Q215 51 233 89 Q248 117 231 157 L221 124 Q194 117 184 97 Q143 122 100 125Z" fill="url(#hair-shade)"/>`;
 const fringe=bald?'':buzz?`<path d="M91 138 Q89 76 160 73 Q231 76 229 138 Q160 111 91 138Z" fill="url(#hair-shade)"/>`:style==='Short'?`${cap}<path d="M96 123 Q130 103 187 95 Q171 120 112 138Z" fill="${h}"/>`:style==='Medium'?`${cap}<path d="M95 120 Q134 102 184 91 Q167 124 106 143Z" fill="${h}"/><path d="M95 122 Q83 155 92 203" stroke="${h}" stroke-width="12" fill="none"/>`:style==='Long'?`${cap}<path d="M98 121 Q142 105 195 91 Q179 129 103 143Z" fill="${h}"/><path d="M90 138 Q83 188 92 249 M229 135 Q241 188 230 249" stroke="${h}" stroke-width="11" fill="none"/>`:style==='Ponytail'?`${cap}<path d="M100 119 Q157 98 218 116" fill="none" stroke="${h}" stroke-width="12"/><path d="M218 111 Q243 122 235 149 Q226 162 218 148Z" fill="${h}"/>`:style==='Curly'?`<path d="M88 153 Q62 106 101 74 Q141 40 195 61 Q253 78 232 156 L218 127 Q163 115 100 136Z" fill="url(#hair-shade)"/>`:cap;
 const curls=curly?Array.from({length:19},(_,i)=>{const t=i/18*Math.PI;const x=160-76*Math.cos(t),y=112-51*Math.sin(t)+Math.sin(i*2.7)*5;return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${11+(i%3)}" ry="${12+(i%2)*3}" fill="${i%3===0?'url(#hair-shade)':h}"/>`;}).join(''):'';
 const strands=!bald&&!buzz&&!curly?Array.from({length:8},(_,i)=>`<path d="M${106+i*13} 76 Q${105+i*13} 91 ${100+i*13} ${107+Math.sin(i)*6}" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.6"/>`).join(''):'';
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
