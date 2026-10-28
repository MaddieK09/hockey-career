/** Menu-only match duration settings. Active games snapshot these at puck drop. */
export const PERIOD_OPTIONS=[1,2,3,5,10,20] as const;
export type PeriodMinutes=typeof PERIOD_OPTIONS[number];
const KEY='hockey-career.match-settings.v1';
export function validPeriodMinutes(value:unknown):PeriodMinutes {
 return PERIOD_OPTIONS.find(x=>x===value)??5;
}
export function loadPeriodMinutes():PeriodMinutes {
 try{return validPeriodMinutes(JSON.parse(localStorage.getItem(KEY)??'5'));}catch{return 5;}
}
export function savePeriodMinutes(value:PeriodMinutes):void {
 try{localStorage.setItem(KEY,JSON.stringify(validPeriodMinutes(value)));}catch{/* Storage unavailable */}
}
export function periodOptions(selected:PeriodMinutes):string {
 return PERIOD_OPTIONS.map(m=>'<option value="'+m+'"'+(m===selected?' selected':'')+'>'+m+' minute'+(m===1?'':'s')+' per period</option>').join('');
}
