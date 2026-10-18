import {DEFAULT_APPEARANCE,PlayerAppearance} from './appearance';
export const POSITIONS=['C','LW','RW','LD','RD','G'] as const;
export type Position=typeof POSITIONS[number];
export type Hand='Left'|'Right';
export interface PlayerIdentity {firstName:string;lastName:string;birthdate:string;nationality:string;position:Position;hand:Hand;jerseyNumber:number}
export interface PlayerDraft extends PlayerIdentity {appearance:PlayerAppearance}
export const DEFAULT_PLAYER:PlayerDraft={firstName:'',lastName:'',birthdate:'',nationality:'Canada',position:'C',hand:'Left',jerseyNumber:10,appearance:{...DEFAULT_APPEARANCE}};
