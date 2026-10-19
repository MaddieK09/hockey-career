import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import {COLORS} from '../player/equipment';
const skin:Record<string,string>={Porcelain:'#f8dfd1',Fair:'#edc5a9',Light:'#dba88a',Medium:'#bd8464',Tan:'#a76a4b',Deep:'#774632',Rich:'#4c2e27'};
const hair:Record<string,string>={Black:'#24212a','Dark brown':'#39251f',Brown:'#77503a',Blonde:'#d6ad61',Platinum:'#ece3c6',Red:'#a63e29',Auburn:'#86422b',Blue:'#427fd2',Pink:'#d878a4'};
const eyes:Record<string,string>={Brown:'#63422c',Blue:'#5b9ed0',Green:'#568969',Hazel:'#96804a',Grey:'#8394a0',Amber:'#c58c42'};
/** Deterministic, responsive vector portrait: no external image request or canvas required. */
export function playerPortrait(p:PlayerAppearance,e:Equipment):string{
 const face=skin[p.skinTone]??skin.Fair,h=hair[p.hairColor]??hair.Brown,eye=eyes[p.eyeColor]??eyes.Blue,jersey=COLORS[e.jersey];
 const cheek=skin[p.skinTone]??skin.Fair;
 const shadow=p.skinTone==='Rich'||p.skinTone==='Deep'?'#2d1b1c':'#7b3f3b';
 const wide=p.faceShape==='Round'||p.faceShape==='Square',angular=p.faceShape==='Angular';
 const rx=wide?79:angular?64:72,chin=p.faceShape==='Heart'?59:wide?73:64;
 const outline=`M ${160-rx} 144 Q ${160-rx-7} 224 ${160-chin} 261 Q 160 310 ${160+chin} 261 Q ${160+rx+7} 224 ${160+rx} 144 Q ${160+rx} 78 160 75 Q ${160-rx} 78 ${160-rx} 144 Z`;
 const hairTop=p.hairStyle==='Bald'?'':`<path d="M78 165 Q69 83 111 64 Q150 38 197 62 Q248 66 243 166 L224 133 Q208 109 192 100 Q145 122 98 118 Z" fill="${h}"/>`;
 const longHair=['Long','Medium','Ponytail','Curly'].includes(p.hairStyle);
 const hairBack=longHair?`<path d="M91 124 Q60 205 67 ${p.hairStyle==='Long'?354:281} L101 ${p.hairStyle==='Long'?357:278} L112 152 M228 125 Q255 213 254 ${p.hairStyle==='Long'?354:281} L222 ${p.hairStyle==='Long'?357:278} L207 151" fill="${h}"/>`:'';
 const curls=p.hairStyle==='Curly'?Array.from({length:11},(_,i)=>`<circle cx="${91+i*14}" cy="${81+Math.sin(i*.8)*12}" r="18" fill="${h}"/>`).join(''):'';
 const shortHair=p.hairStyle==='Buzz cut'?`<path d="M83 130 Q78 72 158 70 Q239 69 237 130 Q160 93 83 130" fill="${h}"/>`:hairTop;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390" role="img" aria-label="Illustrated player portrait with ${p.hairColor.toLowerCase()} hair and ${p.eyeColor.toLowerCase()} eyes">
 <defs><radialGradient id="face-light" cx="40%" cy="31%" r="75%"><stop stop-color="#fff" stop-opacity=".21"/><stop offset=".5" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="${shadow}" stop-opacity=".24"/></radialGradient><linearGradient id="portrait-bg" x2="1" y2="1"><stop stop-color="#1d4362"/><stop offset="1" stop-color="#09192b"/></linearGradient><linearGradient id="portrait-jersey" x2="0" y2="1"><stop stop-color="${jersey}"/><stop offset="1" stop-color="#101f32"/></linearGradient></defs>
 <rect width="320" height="390" fill="url(#portrait-bg)"/><path d="M0 320 L320 225 M0 366 L320 271" stroke="#87b4d3" opacity=".11" stroke-width="3"/>
 ${hairBack}
 <path d="M135 254 L135 304 L185 304 L185 254" fill="${face}"/>
 <path d="M18 390 Q17 306 106 293 L137 275 L160 314 L183 275 L214 293 Q303 307 302 390 Z" fill="url(#portrait-jersey)"/>
 <path d="M108 292 L160 332 L212 292" fill="none" stroke="#e9edf2" stroke-width="8"/>
 <path d="M100 328 L54 353 M220 328 L266 353" stroke="#ffffff" stroke-opacity=".3" stroke-width="5"/>
 <ellipse cx="85" cy="181" rx="15" ry="26" fill="${face}"/><ellipse cx="235" cy="181" rx="15" ry="26" fill="${face}"/>
 <path d="${outline}" fill="${face}"/><path d="${outline}" fill="url(#face-light)"/><path d="M99 216 Q113 225 132 218 M188 218 Q208 225 221 215" fill="none" stroke="${shadow}" opacity=".12" stroke-width="9" stroke-linecap="round"/><path d="M160 235 Q151 247 158 248" fill="none" stroke="#fff" opacity=".2" stroke-width="2"/>
 <path d="M109 174 Q128 162 147 174 M173 174 Q192 162 211 174" fill="none" stroke="#3e2929" stroke-width="5" stroke-linecap="round" opacity=".75"/>
 <path d="M110 190 Q130 176 149 189 Q131 202 110 190 Z" fill="#f4eae2"/><path d="M171 189 Q190 176 210 190 Q189 202 171 189 Z" fill="#f4eae2"/><path d="M110 190 Q130 176 149 189 M171 189 Q190 176 210 190" fill="none" stroke="${shadow}" opacity=".65" stroke-width="2"/>
 <circle cx="130" cy="189" r="8" fill="${eye}"/><circle cx="190" cy="189" r="8" fill="${eye}"/>
 <circle cx="130" cy="189" r="4" fill="#1a1d28"/><circle cx="190" cy="189" r="4" fill="#1a1d28"/>
 <circle cx="133" cy="186" r="2" fill="white"/><circle cx="193" cy="186" r="2" fill="white"/>
 <path d="M160 189 L152 229 Q160 235 168 229" fill="none" stroke="#865b4d" stroke-opacity=".55" stroke-width="3"/>
 <path d="M140 253 Q160 260 180 253 Q160 269 140 253" fill="${shadow}" opacity=".48"/><path d="M148 251 Q160 255 172 251" fill="none" stroke="#fff" opacity=".22" stroke-width="2"/><path d="M115 232 Q128 236 140 232 M181 232 Q193 236 205 231" fill="none" stroke="#fff" opacity=".09" stroke-width="3"/>
 ${p.hairStyle==='Bald'?'':shortHair}${curls}
 </svg>`;
}
