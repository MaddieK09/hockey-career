import type {HairStyle} from '../player/appearance';

export interface PortraitHairLayers {back:string;front:string}

/**
 * Six restrained, scalp-aligned hockey hairstyles. The rear layer is painted
 * behind the face; the front layer covers the crown/hairline. All geometry
 * shares the same head coordinate system (viewBox 320 x 390).
 */
export function portraitHair(style:HairStyle,color:string,gradientId:string):PortraitHairLayers {
 const shaded=`url(#${gradientId})`;
 switch(style){
  case 'Bald':
   return {back:'',front:''};
  case 'Buzz cut':{
   const scalp=`<path d="M93 132 Q91 88 129 78 Q158 68 194 77 Q229 91 227 132 Q195 117 163 120 Q125 114 93 132Z" fill="${color}" opacity=".38"/>`;
   const texture=Array.from({length:50},(_,i)=>{
    const row=Math.floor(i/10),col=i%10,x=111+col*10+(row%2)*3,y=91+row*7;
    return `<path d="M${x} ${y}l1.2 -2" stroke="${color}" stroke-width=".9" stroke-linecap="round" opacity=".48"/>`;
   }).join('');
   return {back:'',front:scalp+texture};
  }
  case 'Short':
   return {back:'',front:`<path d="M91 143 Q83 114 101 89 Q123 64 153 68 Q186 57 212 78 Q229 90 229 119 L225 140 Q210 122 191 116 Q170 111 149 121 Q122 121 103 138Z" fill="${shaded}"/>
    <path d="M103 126 Q123 106 152 113 Q171 102 194 112 Q180 124 152 131 Q124 127 106 142Z" fill="${color}" opacity=".68"/>
    <path d="M112 110 Q135 93 158 101 M165 98 Q184 94 200 105" stroke="#fff" stroke-opacity=".12" stroke-width="2" stroke-linecap="round" fill="none"/>`};
  case 'Curly':
   return {back:`<path d="M101 113 Q86 142 92 176 Q92 190 102 202 L111 173 L115 125Z M219 113 Q234 142 228 176 Q228 190 218 202 L209 173 L205 125Z" fill="${shaded}"/>`,
    front:`<path d="M89 142 Q80 136 86 121 Q74 110 88 97 Q85 84 101 79 Q105 64 121 69 Q132 54 147 65 Q160 54 173 65 Q189 53 199 70 Q216 65 221 81 Q238 86 232 101 Q243 117 232 129 L228 145 Q214 129 203 127 Q191 134 182 125 Q168 137 154 124 Q139 138 128 128 Q111 141 100 133Z" fill="${shaded}"/>
    <path d="M99 105 Q115 90 127 103 Q138 86 151 98 M161 94 Q176 85 189 101 Q206 89 221 108 M108 126 Q119 113 131 122 Q146 111 159 125 Q178 112 190 124" stroke="${color}" stroke-width="5" stroke-linecap="round" opacity=".72" fill="none"/>
    <path d="M110 89 Q121 81 133 91 M167 81 Q178 77 188 89 M196 115 Q207 107 215 119" stroke="#fff" stroke-opacity=".095" stroke-width="1.9" stroke-linecap="round" fill="none"/>`};
  case 'Flow':
   return {back:`<path d="M103 116 Q90 140 91 174 Q88 195 105 217 L113 207 Q112 176 122 146 L130 118Z M217 116 Q230 140 229 174 Q232 195 215 217 L207 207 Q208 176 198 146 L190 118Z" fill="${shaded}"/>`,
    front:`<path d="M88 145 Q78 119 97 92 Q118 60 159 63 Q206 58 226 87 Q236 104 229 147 L217 128 Q199 115 180 115 Q148 112 124 128 Q109 138 100 148Z" fill="${shaded}"/>
    <path d="M105 132 Q131 103 155 101 Q174 94 199 105 Q182 109 164 122 Q140 130 111 145Z" fill="${color}" opacity=".67"/>
    <path d="M103 114 Q139 79 180 83 M131 122 Q161 101 202 102" stroke="#fff" stroke-opacity=".13" stroke-width="2.2" stroke-linecap="round" fill="none"/>`};
  case 'Mullet':
   return {back:`<path d="M104 134 Q91 157 94 196 Q90 220 94 245 L92 268 L99 264 L104 284 L111 273 L117 281 Q117 251 122 218 L126 133Z M216 134 Q229 157 226 196 Q230 220 226 245 L228 268 L221 264 L216 284 L209 273 L203 281 Q203 251 198 218 L194 133Z" fill="${shaded}"/>
    <path d="M98 215 Q95 240 103 267 M222 215 Q225 240 217 267" stroke="#fff" stroke-opacity=".12" stroke-width="1.8" fill="none"/>`,
    front:`<path d="M91 144 Q82 111 103 86 Q127 60 165 64 Q208 57 228 93 Q232 113 227 143 L218 125 Q202 114 184 117 Q160 112 142 122 Q121 126 102 138Z" fill="${shaded}"/>
    <path d="M102 126 Q128 102 156 111 Q177 100 202 114 Q178 120 152 131 Q126 127 106 141Z" fill="${color}" opacity=".71"/>
    <path d="M112 107 Q142 90 168 97 M177 97 Q193 96 208 108" stroke="#fff" stroke-opacity=".10" stroke-width="2" stroke-linecap="round" fill="none"/>`};
 }
}
