import {PlayerAppearance,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,FACE_SHAPES,EYE_COLORS} from '../player/appearance';
const select=(name:string,label:string,options:readonly string[],value:string)=>`<label>${label}<select name="${name}">${options.map(v=>`<option value="${v}" ${v===value?'selected':''}>${v}</option>`).join('')}</select></label>`;
export function appearanceFields(p:PlayerAppearance):string {
 return `<fieldset class="appearance-fields"><legend>Appearance</legend><p class="section-help">Change your settings to update the 3D player immediately.</p><div class="form-grid">
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
 return `<section class="appearance-preview appearance-preview-3d" aria-label="3D player preview"><div class="player-3d-host" data-3d-host></div><p class="preview-title">3D player preview</p><label class="model-import-label">Test an imported 3D character (.glb)<input type="file" accept=".glb,model/gltf-binary" data-model-upload></label><p class="preview-note" data-model-status aria-live="polite">Optional test: select a GLB file from your device. It stays on your device.</p><p class="preview-details" data-appearance-details></p><p class="preview-note">Drag to rotate · Pinch to zoom · Double-tap to reset</p></section>`;
}
export function renderAppearanceDetails(root:HTMLElement,p:PlayerAppearance):void {
 const detail=root.querySelector<HTMLElement>('[data-appearance-details]');
 if(detail)detail.textContent=`${p.heightCm} cm · ${p.weightKg} kg · ${p.hairStyle} ${p.hairColor.toLowerCase()} hair`;
}
