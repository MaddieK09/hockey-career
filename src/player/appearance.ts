export const HAIR_STYLES=['Buzz cut','Short','Medium','Long','Ponytail','Curly','Bald'] as const;
export const HAIR_COLORS=['Black','Dark brown','Brown','Blonde','Platinum','Red','Auburn','Blue','Pink'] as const;
export const SKIN_TONES=['Porcelain','Fair','Light','Medium','Tan','Deep','Rich'] as const;
export const FACE_SHAPES=['Oval','Round','Square','Heart','Angular'] as const;
export const EYE_COLORS=['Brown','Blue','Green','Hazel','Grey','Amber'] as const;
export type HairStyle=typeof HAIR_STYLES[number];
export type HairColor=typeof HAIR_COLORS[number];
export type SkinTone=typeof SKIN_TONES[number];
export type FaceShape=typeof FACE_SHAPES[number];
export type EyeColor=typeof EYE_COLORS[number];
export interface PlayerAppearance {heightCm:number;weightKg:number;hairStyle:HairStyle;hairColor:HairColor;skinTone:SkinTone;faceShape:FaceShape;eyeColor:EyeColor}
export const DEFAULT_APPEARANCE:PlayerAppearance={heightCm:180,weightKg:77,hairStyle:'Short',hairColor:'Brown',skinTone:'Fair',faceShape:'Oval',eyeColor:'Blue'};
export const APPEARANCE_LIMITS={heightCm:{min:140,max:215},weightKg:{min:40,max:180}} as const;
export function pickOption<T extends string>(value:unknown,options:readonly T[],fallback:T):T{return typeof value==='string'&&options.includes(value as T)?value as T:fallback;}
export function normalizeAppearance(value:unknown):PlayerAppearance {
 const p=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const numeric=(key:'heightCm'|'weightKg')=>{const v=p[key];const {min,max}=APPEARANCE_LIMITS[key];return typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max?v:DEFAULT_APPEARANCE[key];};
 return {heightCm:numeric('heightCm'),weightKg:numeric('weightKg'),hairStyle:pickOption(p.hairStyle,HAIR_STYLES,DEFAULT_APPEARANCE.hairStyle),hairColor:pickOption(p.hairColor,HAIR_COLORS,DEFAULT_APPEARANCE.hairColor),skinTone:pickOption(p.skinTone,SKIN_TONES,DEFAULT_APPEARANCE.skinTone),faceShape:pickOption(p.faceShape,FACE_SHAPES,DEFAULT_APPEARANCE.faceShape),eyeColor:pickOption(p.eyeColor,EYE_COLORS,DEFAULT_APPEARANCE.eyeColor)};
}
