import {readFileSync} from 'node:fs';
const catalogue=JSON.parse(readFileSync(new URL('../data/catalogue/protection-catalogue.json',import.meta.url),'utf8'));
export const catalogueVersion='2021年国保 / 2023年三有 · 公开整理候选';
const sources=new Map(catalogue.sources.map(source=>[source.id,source]));
const byName=new Map(),byLatin=new Map();
const conflicts=new Set(catalogue.conflicts.map(row=>row.name));
const key=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
for(const entry of catalogue.entries){
 for(const name of [entry.name,...entry.aliases]){const k=key(name);if(byName.has(k)&&byName.get(k)!==entry)byName.set(k,null);else byName.set(k,entry);}
 if(entry.latin){const k=key(entry.latin);if(byLatin.has(k))byLatin.set(k,null);else byLatin.set(k,entry);}
}
export function catalogueStatus(){return {version:catalogueVersion,complete:false,verification:catalogue.verification,entries:catalogue.entries.length,groups:catalogue.entries.filter(x=>x.scope==='group').length,restricted:catalogue.entries.filter(x=>x.scope==='restricted').length,conflicts:catalogue.conflicts.length,sources:catalogue.sources.map(({id,title,repository,commit,version,retrievedAt,recordCount})=>({id,title,repository,commit,version,retrievedAt,recordCount}))};}
export function lookupProtection(item){
 const name=key(item.name),latin=key(item.latin),named=byName.get(name);
 const entry=named||byLatin.get(latin);
 if(!entry||!latin||!name||entry.scope==='group')return null;
 if(![entry.name,...entry.aliases].map(key).includes(name))return null;
 if(entry.latin&&key(entry.latin)!==latin)return null;
 const category=entry.category==='鸟类'?'鸟类':entry.category==='昆虫'?'昆虫':'动物';
 if(item.category&&item.category!==category)return null;
 const source=sources.get(entry.sourceId);
 const provenance={protectionSource:source.title+' · 公开整理，待官方原件复核',protectionSourceUrl:source.repository+'/blob/'+source.commit+'/'+source.file,protectionVersion:source.version,protectionMethod:'catalogue-candidate',protectionNote:entry.remark||'仅匹配名录名称；请核实物种及当前适用名录'};
 if(conflicts.has(entry.name))return {...provenance,protection:'未核实',protectionMethod:'unverified',protectionNote:'公开来源的保护等级存在冲突，需核对官方名录'};
 if(entry.scope==='restricted')return {...provenance,protection:'未核实',protectionMethod:'unverified',protectionNote:entry.protection+'候选；'+entry.remark+'。照片不能确认适用种群，需核实'};
 return {...provenance,protection:entry.protection};
}
export function applyCatalogue(item,{recognition=false}={}){
 const match=(!recognition||item.uncertain===false)&&lookupProtection(item);
 if(match)return {...item,...match};
 const result={...item,protectionMethod:'unverified',protectionSource:'未匹配名录或物种不确定，需核实',protectionSourceUrl:null,protectionVersion:null,protectionNote:null};
 if(recognition)return {...result,protection:'未核实'};
 if(item.protection&&item.protection!=='未核实')return {...result,protectionMethod:'manual',protectionSource:'手动或历史记录，需对照现行名录核实'};
 return result;
}
