import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export function buildCatalogue(sources){
 const entries=new Map(),conflicts=[];const levels={'一级':'国家一级','二级':'国家二级','国家一级':'国家一级','国家二级':'国家二级','三有':'三有动物'};
 const sourceIds=new Set();
 for(const source of sources){
  if(!source.id||sourceIds.has(source.id)||!Array.isArray(source.records)||!source.records.length||!/^[a-f0-9]{40}$/.test(source.commit)||!/^[a-f0-9]{64}$/.test(source.upstreamSha256))throw Error('名录来源或版本元数据不完整');
  sourceIds.add(source.id);
  const names=new Set();
  for(const row of source.records){
   if(!row.name||typeof row.name!=='string'||names.has(row.name)||!row.category)throw Error('名录存在空名称、重复名称或缺少类别');names.add(row.name);
   if(row.level==='未列入')continue; // An omission is never proof of absence from protection lists.
   const protection=levels[row.level];if(!protection)throw Error(`未知等级: ${row.name} ${row.level}`);
   const remark=row.remark||'';
   const entry={name:row.name,latin:row.latin||null,category:row.category,protection,remark,scope:/所有种|所有物种|spp\./i.test(row.name)?'group':(/仅限|种群|除.*外/.test(remark)?'restricted':'species'),sourceId:source.id,verification:source.verification,aliases:[]};
   const oldName=remark.match(/原名[“"]([^”"]+)[”"]/);if(oldName)entry.aliases.push(oldName[1]);
   const existing=entries.get(entry.name);
   if(existing){
    if(existing.protection!==entry.protection)conflicts.push({name:entry.name,preferred:existing.protection,other:entry.protection,sourceIds:[existing.sourceId,entry.sourceId]});
    // Sources ordered by priority: national animal table before regional bird compilation.
    // Regional table supplements scientific names, but never erases scope restrictions.
    if(!existing.latin&&entry.latin)existing.latin=entry.latin;
   }else entries.set(entry.name,entry);
  }
 }
 const sorted=[...entries.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
 return {schemaVersion:1,complete:false,verification:'third-party',sources:sources.map(({records,...meta})=>({...meta,recordCount:records.length})),entries:sorted,conflicts};
}
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function rebuildCatalogue(){
 const files=['national-animals.json','beijing-birds.json'];
 const sources=await Promise.all(files.map(file=>fs.readFile(path.join(project,'data/catalogue',file),'utf8').then(JSON.parse)));
 const result=buildCatalogue(sources),body=JSON.stringify(result,null,2)+'\n',output=path.join(project,'data/catalogue/protection-catalogue.json');
 if(process.argv.includes('--check')){if(await fs.readFile(output,'utf8')!==body)throw Error('名录生成文件过期，请运行 npm run catalogue:build');}
 else{const temp=output+'.tmp';await fs.writeFile(temp,body);await fs.rename(temp,output);}
 console.log(JSON.stringify({entries:result.entries.length,groups:result.entries.filter(x=>x.scope==='group').length,restricted:result.entries.filter(x=>x.scope==='restricted').length,conflicts:result.conflicts.length,sha256:createHash('sha256').update(body).digest('hex')}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await rebuildCatalogue();
