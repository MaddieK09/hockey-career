import {PlayerDraft,POSITIONS} from './types';
import {APPEARANCE_LIMITS,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,FACE_SHAPES,EYE_COLORS} from './appearance';
export type PlayerErrors=Partial<Record<keyof PlayerDraft|string,string>>;
function validDate(s:string):boolean {if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const [y,m,d]=s.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;}
export function validatePlayer(p:PlayerDraft):PlayerErrors {
 const e:PlayerErrors={};
 if(!p.firstName.trim()||p.firstName.length>40)e.firstName='Enter a first name (up to 40 characters).';
 if(!p.lastName.trim()||p.lastName.length>40)e.lastName='Enter a last name (up to 40 characters).';
 if(!validDate(p.birthdate)||p.birthdate>new Date().toISOString().slice(0,10))e.birthdate='Enter a valid date of birth, not in the future.';
 if(!p.nationality.trim()||p.nationality.length>80)e.nationality='Enter a nationality (up to 80 characters).';
 if(!POSITIONS.includes(p.position))e.position='Choose a valid position.';
 if(p.hand!=='Left'&&p.hand!=='Right')e.hand='Choose left or right.';
 if(!Number.isInteger(p.jerseyNumber)||p.jerseyNumber<0||p.jerseyNumber>99)e.jerseyNumber='Jersey number must be between 0 and 99.';
 for(const key of ['heightCm','weightKg'] as const){const v=p.appearance[key],{min,max}=APPEARANCE_LIMITS[key];if(!Number.isInteger(v)||v<min||v>max)e[key]=`${key==='heightCm'?'Height':'Weight'} must be between ${min} and ${max} ${key==='heightCm'?'cm':'kg'}.`;}
 for(const [key,options] of [['hairStyle',HAIR_STYLES],['hairColor',HAIR_COLORS],['skinTone',SKIN_TONES],['faceShape',FACE_SHAPES],['eyeColor',EYE_COLORS]] as const){if(!(options as readonly string[]).includes(p.appearance[key]))e[key]=`Choose a valid ${key}.`;}
 return e;
}
