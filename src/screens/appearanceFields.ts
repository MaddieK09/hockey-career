import {PlayerAppearance,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,FACE_SHAPES,EYE_COLORS} from '../player/appearance';
const COLOR_MAP:Record<string,string>={'Black':'#24212a','Dark brown':'#39251f','Brown':'#77503a','Blonde':'#d6ad61','Platinum':'#ece3c6','Red':'#a63e29','Auburn':'#86422b','Blue':'#427fd2','Pink':'#d878a4','Porcelain':'#f8dfd1','Fair':'#edc5a9','Light':'#dba88a','Medium':'#bd8464','Tan':'#a76a4b','Deep':'#774632','Rich':'#4c2e27'};
const EYE_MAP:Record<string,string>={'Brown':'#63422c','Blue':'#5b9ed0','Green':'#568969','Hazel':'#96804a','Grey':'#8394a0','Amber':'#c58c42'};
const select=(name:string,label:string,options:readonly string[],value:string)=>`<label>${label}<select name="${name}">${options.map(v=>`<option value="${v}" ${v===value?'selected':''}>${v}</option>`).join('')}</select></label>`;
export function appearanceFields(p:PlayerAppearance):string {
 return `<fieldset class="appearance-fields"><legend>Appearance</legend><p class="section-help">Your player can be customized further in future updates.</p><div class="form-grid">
 <label>Height (cm)<input name="heightCm" type="number" min="140" max="215" step="1" inputmode="numeric" required value="${p.heightCm}"></label>
 <label>Weight (kg)<input name="weightKg" type="number" min="40" max="180" step="1" inputmode="numeric" required value="${p.weightKg}"></label>
 ${select('skinTone','Skin tone',SKIN_TONES,p.skinTone)}
 ${select('faceShape','Face shape',FACE_SHAPES,p.faceShape)}
 ${select('eyeColor','Eye colour',EYE_COLORS,p.eyeColor)}
 ${select('hairStyle','Hair style',HAIR_STYLES,p.hairStyle)}
 ${select('hairColor','Hair colour',HAIR_COLORS,p.hairColor)}
 </div></fieldset>`;
}
export function renderAppearancePreview(root:HTMLElement,p:PlayerAppearance):void {
 const preview=root.querySelector<HTMLElement>('[data-appearance-preview]');if(!preview)return;
 preview.style.setProperty('--skin',COLOR_MAP[p.skinTone]);
 preview.style.setProperty('--hair',COLOR_MAP[p.hairColor]);
 preview.style.setProperty('--eyes',EYE_MAP[p.eyeColor]);
 preview.dataset.hair=p.hairStyle.toLowerCase().replace(' ','-');
 preview.dataset.face=p.faceShape.toLowerCase();
 const detail=preview.querySelector<HTMLElement>('[data-appearance-details]');
 if(detail)detail.textContent=`${p.heightCm} cm · ${p.weightKg} kg · ${p.hairStyle} ${p.hairColor.toLowerCase()} hair`;
}
export function appearancePreviewMarkup():string {
 return `<section class="appearance-preview" data-appearance-preview aria-label="Illustrated appearance preview"><div class="portrait" aria-hidden="true"><div class="portrait-body"></div><div class="portrait-neck"></div><div class="portrait-hair-back"></div><div class="portrait-face"><div class="portrait-eye eye-left"></div><div class="portrait-eye eye-right"></div><div class="portrait-nose"></div><div class="portrait-mouth"></div></div><div class="portrait-hair-front"></div></div><p class="preview-title">Appearance preview</p><p class="preview-details" data-appearance-details></p><p class="preview-note">Stylized 2D concept · 3D player model coming later</p></section>`;
}
