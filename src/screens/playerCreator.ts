import {GAME_VERSION} from '../config/game';
import {loadPlayerDraft,savePlayerDraft} from '../player/draft';
import {PlayerDraft,POSITIONS} from '../player/types';
import {validatePlayer} from '../player/validation';
import {appearanceFields,appearancePreviewMarkup,renderAppearanceDetails} from './appearanceFields';
import {mountImportedPlayer3D} from '../graphics/importedPlayer3d';
import {equipmentFields} from './equipmentFields';
const LABELS:Record<PlayerDraft['position'],string>={C:'Centre',LW:'Left wing',RW:'Right wing',LD:'Left defence',RD:'Right defence',G:'Goaltender'};
function esc(s:string):string{return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));}
export function renderPlayerCreator(root:HTMLElement,onBack:()=>void):void {
 const p=loadPlayerDraft();
 root.innerHTML=`<main class="menu-shell creator-shell"><div class="ice-lines" aria-hidden="true"></div><section class="menu-card creator-card" aria-labelledby="creator-title"><button type="button" class="back-button" data-back>← Main menu</button><p class="eyebrow">NEW CAREER · PLAYER CREATOR</p><h1 id="creator-title" class="creator-title">CREATE YOUR PLAYER</h1><p class="subtitle">Build your hockey identity and look. Your draft is saved on this device.</p>
 ${appearancePreviewMarkup()}
 <form id="player-form" novalidate><fieldset class="identity-fields"><legend>Player identity</legend><div class="form-grid">
 <label>First name<input name="firstName" autocomplete="given-name" maxlength="40" required value="${esc(p.firstName)}"></label>
 <label>Last name<input name="lastName" autocomplete="family-name" maxlength="40" required value="${esc(p.lastName)}"></label>
 <label>Date of birth<input name="birthdate" type="date" required value="${esc(p.birthdate)}"></label>
 <label>Nationality<input name="nationality" autocomplete="country-name" maxlength="80" required value="${esc(p.nationality)}"></label>
 <label>Position<select name="position">${POSITIONS.map(pos=>`<option value="${pos}" ${p.position===pos?'selected':''}>${LABELS[pos]}</option>`).join('')}</select></label>
 <label><span data-hand-label>${p.position==='G'?'Catching hand':'Shooting hand'}</span><select name="hand"><option value="Left" ${p.hand==='Left'?'selected':''}>Left</option><option value="Right" ${p.hand==='Right'?'selected':''}>Right</option></select></label>
 <label>Jersey number<input name="jerseyNumber" type="number" inputmode="numeric" min="0" max="99" step="1" required value="${p.jerseyNumber}"></label>
 </div></fieldset>
 ${appearanceFields(p.appearance)}
 ${equipmentFields(p.equipment,p.position)}
 <p class="field-errors" role="alert" aria-live="polite" data-errors></p><button type="submit" class="primary-action">Review player →</button></form><section class="player-review" data-review hidden aria-live="polite"></section><p class="version">Draft saved on this device · v${GAME_VERSION}</p></section></main>`;
 let preview=mountImportedPlayer3D(root.querySelector<HTMLElement>('[data-3d-host]')!,p.appearance,p.equipment,p.position);
 let modelObjectUrl:string|null=null;
 const modelInput=root.querySelector<HTMLInputElement>('[data-model-upload]');
 modelInput?.addEventListener('change',()=>{
  const file=modelInput.files?.[0];if(!file)return;
  const message=root.querySelector<HTMLElement>('[data-model-status]');
  if(!/\\.glb$/i.test(file.name)){if(message)message.textContent='Please choose a .glb 3D model.';return;}
  if(file.size>25*1024*1024){if(message)message.textContent='Model is too large for mobile preview (25 MB maximum).';return;}
  const nextUrl=URL.createObjectURL(file);
  preview.dispose();
  if(modelObjectUrl)URL.revokeObjectURL(modelObjectUrl);
  modelObjectUrl=nextUrl;
  const current=read();
  preview=mountImportedPlayer3D(root.querySelector<HTMLElement>('[data-3d-host]')!,current.appearance,current.equipment,current.position,modelObjectUrl);
  if(message)message.textContent=`Trying imported model: ${file.name}. This preview does not yet fit hockey equipment or apply customization.`;
 });
 const form=root.querySelector<HTMLFormElement>('#player-form')!;
 const review=root.querySelector<HTMLElement>('[data-review]')!;
 const errors=root.querySelector<HTMLElement>('[data-errors]')!;
 const read=():PlayerDraft=>{const f=new FormData(form);return {firstName:String(f.get('firstName')??'').trim(),lastName:String(f.get('lastName')??'').trim(),birthdate:String(f.get('birthdate')??''),nationality:String(f.get('nationality')??'').trim(),position:String(f.get('position')??'') as PlayerDraft['position'],hand:String(f.get('hand')??'') as PlayerDraft['hand'],jerseyNumber:Number(f.get('jerseyNumber')??NaN),appearance:{heightCm:Number(f.get('heightCm')??NaN),weightKg:Number(f.get('weightKg')??NaN),hairStyle:String(f.get('hairStyle')) as PlayerDraft['appearance']['hairStyle'],hairColor:String(f.get('hairColor')) as PlayerDraft['appearance']['hairColor'],skinTone:String(f.get('skinTone')) as PlayerDraft['appearance']['skinTone'],faceShape:String(f.get('faceShape')) as PlayerDraft['appearance']['faceShape'],eyeColor:String(f.get('eyeColor')) as PlayerDraft['appearance']['eyeColor']},equipment:{jersey:String(f.get('gearJersey')) as PlayerDraft['equipment']['jersey'],helmet:String(f.get('gearHelmet')) as PlayerDraft['equipment']['helmet'],gloves:String(f.get('gearGloves')) as PlayerDraft['equipment']['gloves'],pads:String(f.get('gearPads')) as PlayerDraft['equipment']['pads'],stick:String(f.get('gearStick')) as PlayerDraft['equipment']['stick']}};};
 const update=()=>{const current=read();savePlayerDraft(current);review.hidden=true;errors.textContent='';root.querySelector<HTMLElement>('[data-hand-label]')!.textContent=current.position==='G'?'Catching hand':'Shooting hand';root.querySelector<HTMLElement>('[data-goalie-gear]')!.hidden=current.position!=='G';preview.update(current.appearance,current.equipment,current.position);renderAppearanceDetails(root,current.appearance);};
 form.addEventListener('input',update);form.addEventListener('change',update);
 root.querySelector<HTMLButtonElement>('[data-back]')!.addEventListener('click',()=>{preview.dispose();if(modelObjectUrl)URL.revokeObjectURL(modelObjectUrl);onBack();});
 renderAppearanceDetails(root,p.appearance);
 form.addEventListener('submit',event=>{event.preventDefault();const player=read();const invalid=validatePlayer(player);if(Object.keys(invalid).length){errors.textContent=Object.values(invalid).join(' ');review.hidden=true;return;}savePlayerDraft(player);errors.textContent='';review.hidden=false;review.innerHTML=`<h2>Player preview</h2><p><strong>${esc(player.firstName)} ${esc(player.lastName)}</strong> · #${player.jerseyNumber}</p><p>${LABELS[player.position]} · ${esc(player.nationality)}</p><p>Born ${esc(player.birthdate)} · ${player.hand}-handed ${player.position==='G'?'catch':'shot'}</p><p>${player.appearance.heightCm} cm · ${player.appearance.weightKg} kg · ${esc(player.appearance.faceShape)} face · ${esc(player.appearance.eyeColor)} eyes</p><p>${esc(player.appearance.hairStyle)} ${esc(player.appearance.hairColor.toLowerCase())} hair · ${esc(player.appearance.skinTone)} skin tone</p><p class="review-note">Your draft is saved locally. Full career saves and progression are coming later.</p><button type="button" class="secondary-action" data-edit>Edit details</button>`;review.querySelector<HTMLButtonElement>('[data-edit]')!.addEventListener('click',()=>{review.hidden=true;form.querySelector<HTMLInputElement>('input')?.focus();});review.scrollIntoView({behavior:'smooth',block:'nearest'});});
}
