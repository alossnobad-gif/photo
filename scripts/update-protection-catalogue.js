import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {buildCatalogue} from './build-protection-catalogue.js';
const exec=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),destination=path.join(root,'data/catalogue');
const definitions=[{id:'national-animals',repository:'https://github.com/RavenWang1103/wildlife-map',file:'data/species_raw.json',title:'国家重点保护野生动物名录（2021年调整版）公开整理',version:'2021',minimum:800},{id:'beijing-birds',repository:'https://github.com/Chocoer/birdle',file:'server/src/data/birds.json',title:'北京鸟类数据（2021年国保、2023年三有名录公开整理）',version:'2021 / 2023',minimum:400}];
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'catalogue-update-'));const snapshots=[];
try{
 for(const definition of definitions){
  const checkout=path.join(temporary,definition.id);
  await exec('git',['clone','--depth','1',definition.repository+'.git',checkout],{timeout:90000,maxBuffer:1024*1024});
  const commit=(await exec('git',['-C',checkout,'rev-parse','HEAD'])).stdout.trim();
  const raw=await fs.readFile(path.join(checkout,definition.file));const rows=JSON.parse(raw);
  if(!Array.isArray(rows)||rows.length<definition.minimum)throw Error(`${definition.id} 数据量异常，停止更新`);
  const records=definition.id==='national-animals'?rows.map(({name,level,category,remark})=>({name,level,category,remark})):rows.map(row=>({name:row.name,latin:row.sciName,level:row.chinaProtection,category:'鸟类',remark:''}));
  const {minimum,...metadata}=definition;
  snapshots.push({...metadata,commit,upstreamSha256:createHash('sha256').update(raw).digest('hex'),retrievedAt:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),verification:'third-party',records});
 }
 const catalogue=buildCatalogue(snapshots);
 // All downloads and validation must succeed before any active file is replaced.
 const stage=path.join(destination,'.update-stage');await fs.mkdir(stage,{recursive:true});
 for(const source of snapshots)await fs.writeFile(path.join(stage,source.id+'.json'),JSON.stringify(source,null,2)+'\n');
 await fs.writeFile(path.join(stage,'protection-catalogue.json'),JSON.stringify(catalogue,null,2)+'\n');
 for(const file of [...snapshots.map(s=>s.id+'.json'),'protection-catalogue.json'])await fs.rename(path.join(stage,file),path.join(destination,file));
 await fs.rmdir(stage);
 console.log(JSON.stringify({entries:catalogue.entries.length,conflicts:catalogue.conflicts.length,verification:catalogue.verification,sources:snapshots.map(s=>({id:s.id,commit:s.commit}))}));
 console.log('请审查名录变更及冲突后提交代码。生产服务器通过 git pull 更新，不在运行中自动替换。');
}finally{await fs.rm(temporary,{recursive:true,force:true});}
