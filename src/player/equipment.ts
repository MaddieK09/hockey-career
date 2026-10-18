import type {Position} from './types';
export const GEAR_COLORS=['Navy','Red','White','Black','Blue','Green','Gold'] as const;
export type GearColor=typeof GEAR_COLORS[number];
export const COLORS:Record<GearColor,string>={Navy:'#27648d',Red:'#b53c43',White:'#e7edf2',Black:'#202735',Blue:'#357bd0',Green:'#2b7a63',Gold:'#d7a544'};
export interface Equipment {jersey:GearColor;helmet:GearColor;gloves:GearColor;pads:GearColor;stick:'Black'|'White'|'Natural'}
export const DEFAULT_EQUIPMENT:Equipment={jersey:'Navy',helmet:'Navy',gloves:'Navy',pads:'White',stick:'Black'};
export function normalizeEquipment(value:unknown):Equipment {
 const p=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const color=(key:keyof Equipment,fallback:GearColor)=>GEAR_COLORS.find(x=>x===p[key])??fallback;
 return {jersey:color('jersey','Navy'),helmet:color('helmet','Navy'),gloves:color('gloves','Navy'),pads:color('pads','White'),stick:p.stick==='White'?'White':p.stick==='Natural'?'Natural':'Black'};
}
export const goalie=(position:Position)=>position==='G';
