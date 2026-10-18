import {GAME_VERSION} from '../config/game';
import {loadPlayerDraft,savePlayerDraft} from '../player/draft';
import {PlayerIdentity,POSITIONS} from '../player/types';
import {validatePlayer} from '../player/validation';
const LABELS:Record<PlayerIdentity['position'],string>={C:'Centre',LW:'Left wing',RW:'Right wing',LD:'Left defence',RD:'Right defence',G:'Goaltender'};
function esc(s:string):string{return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));}
export function renderPlayerCreator(root:HTMLElement,onBack:()=>void):void {
 const p=loadPlayerDraft();
 root.innerHTML=`<main class="menu-shell creator-shell"><div class="ice-lines" aria-hidden="true"></div><section class="menu-card creator-card" aria-labelledby="creator-title"><button type="button" class="back-button" data-back>← Main menu</button><p class="eyebrow">NEW CAREER · STEP 1</p><h1 id="creator-title" class="creator-title">CREATE YOUR PLAYER</h1><p class="subtitle">Start your hockey story. Your draft is saved on this device.</p><form id="player-form" novalidate><div class="form-grid">
 <label>First name<input name="firstName" autocomplete="given-name" maxlength="40" required value="${esc(p.firstName)}"></label>
 <label>Last name<input name="lastName" autocomplete="family-name" maxlength="40" required value="${esc(p.lastName)}"></label>
 <label>Date of birth<input name="birthdate" type="date" required value="${esc(p.birthdate)}"></label>
 <label>Nationality<input name="nationality" autocomplete="country-name" maxlength="80" required value="${esc(p.nationality)}"></label>
 <label>Position<select name="position">${POSITIONS.map(pos=>`<option value="${pos}" ${p.position===pos?'selected':''}>${LABELS[pos]}</option>`).join('')}</select></label>
 <label><span data-hand-label>${p.position==='G'?'Catching hand':'Shooting hand'}</span><select name="hand"><option value="Left" ${p.hand==='Left'?'selected':''}>Left</option><option value="Right" ${p.hand==='Right'?'selected':''}>Right</option></select></label>
 <label>Jersey number<input name="jerseyNumber" type="number" inputmode="numeric" min="0" max="99" step="1" required value="${p.jerseyNumber}"></label>
 </div><p class="field-errors" role="alert" aria-live="polite" data-errors></p><button type="submit" class="primary-action">Review player →</button></form><section class="player-review" data-review hidden aria-live="polite"></section><p class="version">Draft saved on this device · v${GAME_VERSION}</p></section></main>`;
 const form=root.querySelector<HTMLFormElement>('#player-form')!;
 const review=root.querySelector<HTMLElement>('[data-review]')!;
 const errors=root.querySelector<HTMLElement>('[data-errors]')!;
 const read=():PlayerIdentity=>{const f=new FormData(form);return {firstName:String(f.get('firstName')??'').trim(),lastName:String(f.get('lastName')??'').trim(),birthdate:String(f.get('birthdate')??''),nationality:String(f.get('nationality')??'').trim(),position:String(f.get('position')??'') as PlayerIdentity['position'],hand:String(f.get('hand')??'') as PlayerIdentity['hand'],jerseyNumber:Number(f.get('jerseyNumber')??NaN)};};
 const update=()=>{savePlayerDraft(read());review.hidden=true;errors.textContent='';const position=(form.elements.namedItem('position') as HTMLSelectElement).value;root.querySelector<HTMLElement>('[data-hand-label]')!.textContent=position==='G'?'Catching hand':'Shooting hand';};
 form.addEventListener('input',update);form.addEventListener('change',update);
 root.querySelector<HTMLButtonElement>('[data-back]')!.addEventListener('click',onBack);
 form.addEventListener('submit',event=>{event.preventDefault();const player=read();const invalid=validatePlayer(player);if(Object.keys(invalid).length){errors.textContent=Object.values(invalid).join(' ');review.hidden=true;return;}savePlayerDraft(player);errors.textContent='';review.hidden=false;review.innerHTML=`<h2>Player preview</h2><p><strong>${esc(player.firstName)} ${esc(player.lastName)}</strong> · #${player.jerseyNumber}</p><p>${LABELS[player.position]} · ${esc(player.nationality)}</p><p>Born ${esc(player.birthdate)} · ${player.hand}-handed ${player.position==='G'?'catch':'shot'}</p><p class="review-note">Your draft is saved locally. Full career saves and progression are coming later.</p><button type="button" class="secondary-action" data-edit>Edit details</button>`;review.querySelector<HTMLButtonElement>('[data-edit]')!.addEventListener('click',()=>{review.hidden=true;form.querySelector<HTMLInputElement>('input')?.focus();});review.scrollIntoView({behavior:'smooth',block:'nearest'});});
}
