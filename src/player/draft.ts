import {DEFAULT_PLAYER,PlayerDraft,POSITIONS} from './types';
import {normalizeAppearance} from './appearance';
const KEY='hockey-career.player-creator.draft.v1'; // Keep existing key to preserve v0.2 drafts.
export function loadPlayerDraft():PlayerDraft {
 try {
  const raw=localStorage.getItem(KEY);if(!raw)return {...DEFAULT_PLAYER,appearance:{...DEFAULT_PLAYER.appearance}};
  const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))return {...DEFAULT_PLAYER,appearance:{...DEFAULT_PLAYER.appearance}};
  const p=value as Record<string,unknown>;
  return {firstName:typeof p.firstName==='string'?p.firstName:'',lastName:typeof p.lastName==='string'?p.lastName:'',birthdate:typeof p.birthdate==='string'?p.birthdate:'',nationality:typeof p.nationality==='string'?p.nationality:'Canada',position:POSITIONS.find(x=>x===p.position)??'C',hand:p.hand==='Right'?'Right':'Left',jerseyNumber:typeof p.jerseyNumber==='number'?p.jerseyNumber:10,appearance:normalizeAppearance(p.appearance)};
 }catch{return {...DEFAULT_PLAYER,appearance:{...DEFAULT_PLAYER.appearance}};}
}
export function savePlayerDraft(p:PlayerDraft):void {try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* Storage may be unavailable. */}}
