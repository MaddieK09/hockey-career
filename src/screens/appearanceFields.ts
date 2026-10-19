import {PlayerAppearance,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,FACE_SHAPES,EYE_COLORS} from '../player/appearance';
const select=(name:string,label:string,options:readonly string[],value:string)=>`<label>${label}<select name="${name}">${options.map(v=>`<option value="${v}" ${v===value?'selected':''}>${v}</option>`).join('')}</select></label>`;
export function appearanceFields(p:PlayerAppearance):string {
 return `<fieldset class="appearance-fields"><legend>Appearance</legend><p class="section-help">Change your settings to update your 2D player portrait immediately.</p><div class="form-grid">
 <label>Height (cm)<input name="heightCm" type="number" min="140" max="215" step="1" inputmode="numeric" required value="${p.heightCm}"></label>
 <label>Weight (kg)<input name="weightKg" type="number" min="40" max="180" step="1" inputmode="numeric" required value="${p.weightKg}"></label>
 ${select('skinTone','Skin tone',SKIN_TONES,p.skinTone)}
 ${select('faceShape','Face shape',FACE_SHAPES,p.faceShape)}
 ${select('eyeColor','Eye colour',EYE_COLORS,p.eyeColor)}
 ${select('hairStyle','Hair style',HAIR_STYLES,p.hairStyle)}
 ${select('hairColor','Hair colour',HAIR_COLORS,p.hairColor)}
 </div></fieldset>`;
}
export function appearancePreviewMarkup():string {
 return `<section class="appearance-preview appearance-preview-3d" aria-label="Player preview"><div class="creator-preview-switch" role="group" aria-label="Creator editing mode"><button type="button" class="secondary-action" data-mode="appearance" aria-pressed="true">Appearance · 2D</button><button type="button" class="secondary-action" data-mode="equipment" aria-pressed="false">Equipment · 3D</button></div><div class="player-portrait-host" data-portrait-host></div><div class="player-3d-host" data-3d-host hidden></div><p class="preview-title" data-preview-title>2D player portrait</p><p class="preview-details" data-appearance-details></p><p class="preview-note">Edit appearance for the 2D portrait · switch to equipment for rotatable 3D</p></section>`;
}
export function renderAppearanceDetails(root:HTMLElement,p:PlayerAppearance):void {
 const detail=root.querySelector<HTMLElement>('[data-appearance-details]');
 if(detail)detail.textContent=`${p.heightCm} cm · ${p.weightKg} kg · ${p.hairStyle} ${p.hairColor.toLowerCase()} hair`;
}
