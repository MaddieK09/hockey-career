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
 const cheek=round?71:square?74:angular?65:heart?69:68;
 const jaw=round?58:square?65:heart?48:angular?53:56;
 const shadow=p.skinTone==='Deep'||p.skinTone==='Rich'?'#211518':'#653d37';
 const bald=p.hairStyle==='Bald',buzz=p.hairStyle==='Buzz cut',curly=p.hairStyle==='Curly';
 const facePath=`M 160 89 C 116 86 ${160-cheek+3} 111 ${160-cheek} 162 C ${160-cheek-1} 216 ${160-jaw-4} 258 160 ${round?280:284} C ${160+jaw+4} 258 ${160+cheek+1} 216 ${160+cheek} 162 C ${160+cheek-3} 111 204 86 160 89 Z`;
 const style=p.hairStyle;
 const back=style==='Mullet'?`<path d="M105 142 C94 168 98 192 94 218 C89 240 92 259 88 279 L95 275 L99 291 L106 280 L113 288 C113 269 119 245 123 217 L125 143Z M215 142 C226 168 222 192 226 218 C231 240 228 259 232 279 L225 275 L221 291 L214 280 L207 288 C207 269 201 245 197 217 L195 143Z" fill="url(#hair-shade)" opacity=".94"/><path d="M99 230 Q94 249 100 276 M221 230 Q226 249 220 276" fill="none" stroke="${h}" stroke-width="2.5" opacity=".67"/><path d="M106 239 Q104 260 107 277 M214 239 Q216 260 213 277" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="1.6"/>`:style==='Medium'?`<path d="M98 137 Q91 159 96 184 Q101 198 109 194 L114 145Z M222 137 Q229 159 224 184 Q219 198 211 194 L206 145Z" fill="url(#hair-shade)"/>`:style==='Ponytail'?`<path d="M214 115 Q231 123 233 143 Q239 157 233 170 L229 178 Q236 193 234 207 Q236 218 229 228 L222 238 Q226 214 223 195 Q222 171 214 152Z" fill="url(#hair-shade)" opacity=".92"/><path d="M230 177 Q236 199 227 222" fill="none" stroke="${h}" stroke-width="2.5" opacity=".5"/>`:style==='Curly'?`<path d="M97 106 Q79 135 86 186 Q90 217 102 223 L112 139Z M223 106 Q241 135 234 186 Q230 217 218 223 L208 139Z" fill="url(#hair-shade)"/>`:'';
 const shortTop=`<path d="M89 143 Q80 117 94 92 Q111 60 153 64 Q206 55 226 87 Q232 110 225 137 L220 125 Q210 115 197 116 Q170 104 146 120 Q119 129 100 130Z" fill="url(#hair-shade)"/>`;
 const mediumTop=`<path d="M89 150 Q73 115 94 83 Q115 54 153 59 Q208 47 230 87 Q236 112 226 144 L222 132 Q203 115 181 113 Q146 134 103 136Z" fill="url(#hair-shade)"/>`;
 const fringe=bald?'':buzz?`<path d="M91 132 Q90 79 160 75 Q230 79 229 132 Q203 120 179 119 Q139 116 110 128Z" fill="${h}" opacity=".48"/><path d="M94 125 Q158 101 226 125" stroke="${h}" stroke-width="1.4" opacity=".35" fill="none"/>`:style==='Short'?`${shortTop}<path d="M101 124 Q128 106 154 111 Q178 94 206 113 Q184 116 164 127 Q134 127 109 140Z" fill="${h}" opacity=".83"/><path d="M99 131 Q129 121 153 121" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>`:style==='Medium'?`${mediumTop}<path d="M100 132 Q126 108 158 111 Q189 88 217 113 Q189 120 168 137 Q136 127 108 150Z" fill="${h}" opacity=".85"/><path d="M95 145 Q92 167 99 186 M226 142 Q230 166 222 186" stroke="${h}" stroke-width="9" stroke-linecap="round" fill="none"/>`:style==='Mullet'?`<path d="M92 143 Q88 107 102 86 Q126 52 169 63 Q208 56 229 90 Q233 109 225 135 L219 127 Q203 120 190 120 Q159 101 139 119 Q115 125 102 137Z" fill="url(#hair-shade)"/><path d="M99 128 Q123 103 149 111 Q173 101 204 115 Q177 126 152 132 Q124 128 108 143Z" fill="${h}" opacity=".9"/><path d="M96 143 Q91 156 96 169 M224 143 Q229 156 224 169" stroke="${h}" stroke-width="6" fill="none"/>`:style==='Ponytail'?`<path d="M89 149 Q82 114 100 86 Q127 53 164 60 Q213 58 231 98 L224 146 Q203 119 176 119 Q137 127 100 139Z" fill="url(#hair-shade)"/><path d="M104 121 Q156 99 215 118" fill="none" stroke="${h}" stroke-width="9"/><path d="M107 125 Q164 104 218 126" fill="none" stroke="${h}" stroke-width="5" stroke-linecap="round" opacity=".68"/>`:style==='Curly'?`<path d="M88 153 Q62 106 101 74 Q141 40 195 61 Q253 78 232 156 L218 127 Q163 115 100 136Z" fill="url(#hair-shade)"/>`:shortTop;
 const curls=curly?Array.from({length:27},(_,i)=>{const row=Math.floor(i/9),col=i%9;const x=100+col*15+(row%2)*6,y=79+row*17+Math.sin(col*1.9+row)*5;return `<path d="M${x-9} ${y+6} Q${x-14} ${y-7} ${x} ${y-9} Q${x+13} ${y-12} ${x+10} ${y+3} Q${x+8} ${y+11} ${x-1} ${y+9}" fill="${i%4===0?'url(#hair-shade)':h}" stroke="${h}" stroke-width="1.5" opacity="${row===2?.93:1}"/>`;}).join(''):'';
 const flow=style==='Mullet'?`<path d="M95 210 Q90 238 96 261 L99 280 M225 210 Q230 238 224 261 L221 280" fill="none" stroke="#fff" stroke-opacity=".11" stroke-width="1.6" stroke-linecap="round"/>`:'';
 const strands=!bald&&!buzz&&!curly?Array.from({length:7},(_,i)=>`<path d="M${111+i*15} ${76+Math.sin(i)*6} Q${103+i*15} 93 ${107+i*14} ${109+Math.sin(i)*6}" fill="none" stroke="#fff" stroke-opacity=".075" stroke-width="1.5"/>`).join(''):'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390" role="img" aria-label="Hockey player headshot with ${p.hairColor.toLowerCase()} hair and ${p.eyeColor.toLowerCase()} eyes">
 <defs>
 <radialGradient id="portrait-bg" cx="45%" cy="28%" r="90%"><stop stop-color="#30546c"/><stop offset=".58" stop-color="#142d44"/><stop offset="1" stop-color="#071726"/></radialGradient>
 <radialGradient id="face-light" cx="37%" cy="27%" r="78%"><stop stop-color="#fff" stop-opacity=".28"/><stop offset=".46" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="${shadow}" stop-opacity=".38"/></radialGradient>
 <linearGradient id="portrait-jersey" x1="0" x2=".8" y2="1"><stop stop-color="${jersey}"/><stop offset=".62" stop-color="${jersey}"/><stop offset="1" stop-color="#0b1929"/></linearGradient>
 <linearGradient id="hair-shade" x1="0" x2="1" y2=".65"><stop stop-color="${shadow}"/><stop offset=".32" stop-color="${h}"/><stop offset=".68" stop-color="${h}"/><stop offset="1" stop-color="#161720"/></linearGradient>
 </defs>
 <rect width="320" height="390" fill="url(#portrait-bg)"/><ellipse cx="160" cy="187" rx="120" ry="170" fill="#91c7e8" opacity=".045"/>
 <path d="M0 330L320 238 M0 374L320 282" stroke="#d7eafa" stroke-width="2" opacity=".09"/>
 ${back}${flow}
 <path d="M132 257 L131 307 Q160 334 189 307 L188 257" fill="${s}"/><path d="M133 265 Q159 298 187 265 L188 279 Q162 312 132 280Z" fill="${shadow}" opacity=".18"/>
 <path d="M-8 390 Q1 320 91 295 L127 281 L160 314 L193 281 L229 295 Q319 320 328 390Z" fill="url(#portrait-jersey)"/>
 <path d="M124 282 L160 321 L196 282" fill="none" stroke="#f1f5f9" stroke-width="9"/><path d="M27 353 L100 325 M293 353 L220 325" stroke="#e7f2fc" stroke-opacity=".34" stroke-width="5"/>
 <path d="M91 171 C74 165 78 201 94 208 L101 188Z M229 171 C246 165 242 201 226 208 L219 188Z" fill="${s}"/>
 <path d="${facePath}" fill="${s}"/><path d="${facePath}" fill="url(#face-light)"/>
 <path d="M99 207 Q119 219 141 209 M179 209 Q202 219 222 207" fill="none" stroke="${shadow}" stroke-opacity=".075" stroke-width="8" stroke-linecap="round"/>
 <path d="M106 171 Q125 163 146 173 M174 173 Q195 163 214 171" fill="none" stroke="${shadow}" stroke-width="3.5" stroke-linecap="round" opacity=".62"/>
 <path d="M110 189 Q128 182 147 189 Q128 197 110 189Z M173 189 Q192 182 210 189 Q192 197 173 189Z" fill="#eee8df"/>
 <circle cx="129" cy="189" r="6" fill="${iris}"/><circle cx="191" cy="189" r="6" fill="${iris}"/><circle cx="129" cy="189" r="3" fill="#171c22"/><circle cx="191" cy="189" r="3" fill="#171c22"/>
 <circle cx="131" cy="186" r="2.1" fill="#fff"/><circle cx="193" cy="186" r="2.1" fill="#fff"/>
 <path d="M108 188 Q127 177 148 187 M172 187 Q193 177 212 188" fill="none" stroke="${shadow}" stroke-width="2.4" stroke-linecap="round"/>
 <path d="M160 193 Q158 215 154 227 Q161 232 169 226" fill="none" stroke="${shadow}" stroke-opacity=".43" stroke-width="2.5" stroke-linecap="round"/>
 <path d="M144 253 Q160 250 176 253 Q160 259 144 253Z" fill="${shadow}" opacity=".43"/><path d="M146 251 Q160 254 174 251" fill="none" stroke="#fff" stroke-opacity=".21" stroke-width="1.8"/>
 <path d="M131 275 Q160 287 189 275" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2"/>
 ${fringe}${strands}${curls}
 </svg>`;
}
