// Explicit species entries only: this is NOT a complete national catalogue.
// Broader taxa, geographic populations and unverified synonyms are never inferred.
export const catalogueVersion='国家重点保护野生动物名录（2021年调整版）';
const entries=[
 {name:'长尾鸭',latin:'Clangula hyemalis',protection:'国家二级'},
 {name:'卷羽鹈鹕',latin:'Pelecanus crispus',protection:'国家一级'},
];
const byLatin=new Map(entries.map(entry=>[entry.latin.toLowerCase(),entry]));
export function lookupProtection(item){
 const latin=String(item.latin||'').trim().replace(/\s+/g,' ').toLowerCase();
 const name=String(item.name||'').trim();
 const entry=byLatin.get(latin);
 // A contradictory Chinese name may indicate an identification or transcription error.
 if(!entry||name!==entry.name)return null;
 return {protection:entry.protection,protectionSource:catalogueVersion+' · 内置物种条目（部分名录）',protectionMethod:'catalogue'};
}
export function applyCatalogue(item,{recognition=false}={}){
 const match=(!recognition||item.uncertain===false)&&lookupProtection(item);
 if(match)return {...item,...match};
 if(recognition)return {...item,protection:'未核实',protectionMethod:'unverified',protectionSource:'未匹配内置名录，需核实'};
 // Never accept browser/model claims of having checked an official catalogue.
 return {...item,protectionMethod:item.protection==='未核实'?'unverified':'manual',protectionSource:item.protection==='未核实'?'未核实': '手动或历史记录，需对照现行名录核实'};
}
