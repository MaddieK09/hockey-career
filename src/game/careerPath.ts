/** Fictional starting pathways, using Hockey Canada's traditional division ages.
 * Season age is age on December 31, not necessarily age at puck drop. */
export type DivisionId='u9'|'u11'|'u13'|'u15'|'u18'|'junior'|'development';
export type TierId='house'|'select'|'aa'|'aaa'|'jrb'|'jra'|'development';
export interface Division {
 id:DivisionId;label:string;minAge:number;maxAge:number;cycles:number;pace:number;
 tiers:readonly TierId[];
}
export const DIVISIONS:readonly Division[]=[
 {id:'u9',label:'U9 · Novice',minAge:7,maxAge:8,cycles:4,pace:.73,tiers:['house','select']},
 {id:'u11',label:'U11 · Atom',minAge:9,maxAge:10,cycles:4,pace:.78,tiers:['house','select','aa','aaa']},
 {id:'u13',label:'U13 · Peewee',minAge:11,maxAge:12,cycles:4,pace:.83,tiers:['house','select','aa','aaa']},
 {id:'u15',label:'U15 · Bantam',minAge:13,maxAge:14,cycles:6,pace:.89,tiers:['house','select','aa','aaa']},
 {id:'u18',label:'U18 · Midget',minAge:15,maxAge:17,cycles:6,pace:.95,tiers:['house','select','aa','aaa']},
 {id:'junior',label:'Junior Development',minAge:16,maxAge:20,cycles:8,pace:1,tiers:['jrb','jra']}
];
export const TIER_LABELS:Readonly<Record<TierId,string>>={
 house:'House League',select:'Select',aa:'AA',aaa:'AAA',jrb:'Junior B',jra:'Junior A',development:'Development'
};
export interface CareerStart {age:number;division:DivisionId;tier:TierId;seasonYear:number;legacy?:boolean}
export const eligibleDivisions=(age:number):readonly Division[]=>
 DIVISIONS.filter(d=>Number.isInteger(age)&&age>=d.minAge&&age<=d.maxAge);
export const findDivision=(id:DivisionId):Division|undefined=>DIVISIONS.find(d=>d.id===id);
export const suggestedDivision=(age:number):Division=>
 eligibleDivisions(age)[0]??DIVISIONS[4];
export const ageOnDec31=(birthdate:string,year:number):number=>{
 const birthYear=Number(birthdate.slice(0,4));
 return Number.isInteger(birthYear)&&birthYear>1800?year-birthYear:16;
};
export const actualAgeOn=(birthdate:string,isoDate:string):number=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||!/^\d{4}-\d{2}-\d{2}$/.test(isoDate))return 0;
 let age=Number(isoDate.slice(0,4))-Number(birthdate.slice(0,4));
 if(isoDate.slice(5)<birthdate.slice(5))age--;
 return Math.max(0,age);
};
export function startingPath(birthdate:string,age:number,division:DivisionId,tier:TierId):CareerStart{
 const birthYear=Number(birthdate.slice(0,4));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||!Number.isInteger(birthYear))throw Error('Choose a valid birthday.');
 const d=findDivision(division);
 if(!d||!eligibleDivisions(age).some(v=>v.id===d.id))throw Error('Starting age is not eligible for this division.');
 if(!d.tiers.includes(tier))throw Error('The selected competition level is not available in this division.');
 return {age,division,tier,seasonYear:birthYear+age};
}
export function normalizeCareerStart(raw:unknown,birthdate:string,seasonStartDate:string):CareerStart{
 if(raw&&typeof raw==='object'){
  const p=raw as Partial<CareerStart>;
  if(p.legacy===true&&p.division==='development'&&Number.isInteger(p.age)&&
    Number.isInteger(p.seasonYear))return {...p,age:p.age!,tier:'development',seasonYear:p.seasonYear!} as CareerStart;
  try{return startingPath(birthdate,p.age!,p.division!,p.tier!);}catch{/* old or invalid */ }
 }
 // Existing careers retain both their original season date and league;
 // newly created careers explicitly pick a pathway before starting.
 const year=Number(seasonStartDate.slice(0,4))||2026;
 return {age:Math.max(7,Math.min(20,ageOnDec31(birthdate,year))),
  division:'development',tier:'development',seasonYear:year,legacy:true};
}
export const leagueTitle=(p:CareerStart):string=>{
 if(p.division==='development')return 'Fictional Development League';
 return 'Northern Ice '+findDivision(p.division)!.label+' · '+TIER_LABELS[p.tier];
};
export const startPace=(p:CareerStart):number=>{
 if(p.division==='development')return 1;
 const base=findDivision(p.division)?.pace??1;
 return Math.max(.68,Math.min(1.06,base+(
  p.tier==='house'?-.03:p.tier==='aaa'?.05:p.tier==='aa'?.025:p.tier==='jra'?.04:0
 )));
};
export const startCycles=(p:CareerStart):number=>
 findDivision(p.division)?.cycles??8;
export function divisionChoices(age:number,selected?:DivisionId):string{
 return eligibleDivisions(age).map(d=>'<option value="'+d.id+'"'+(d.id===selected?' selected':'')+'>'+
  d.label+' · '+(d.cycles*7)+' games</option>').join('');
}
export function tierChoices(division:DivisionId,selected?:TierId):string{
 return (findDivision(division)?.tiers??['house']).map(t=>'<option value="'+t+'"'+(t===selected?' selected':'')+'>'+
  TIER_LABELS[t]+'</option>').join('');
}
