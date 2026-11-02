import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

// Only durable file references and progress live here, never credentials or photo bytes.
export async function createBaiduImportQueue(data,{importOne,accountId}){
 const filename=path.join(data,'baidu-import-queue.json');
 let jobs=[];try{jobs=JSON.parse(await fs.readFile(filename,'utf8'));if(!Array.isArray(jobs))throw Error('网盘导入记录格式错误');}catch(e){if(e.code!=='ENOENT')throw e;}
 let writes=Promise.resolve(),running=false,scheduled=false,failure='';
 const active=job=>['queued','processing'].includes(job.status);
 function mutate(fn){const work=writes.then(async()=>{const next=structuredClone(jobs),result=fn(next);const terminal=next.filter(job=>!active(job));const keep=new Set(terminal.slice(-200).map(job=>job.id));const trimmed=next.filter(job=>active(job)||keep.has(job.id));await fs.writeFile(filename+'.tmp',JSON.stringify(trimmed),{mode:0o600});await fs.rename(filename+'.tmp',filename);jobs=trimmed;return result;});writes=work.catch(()=>{});return work;}
 function schedule(){if(scheduled||running||failure)return;scheduled=true;setImmediate(()=>{scheduled=false;pump().catch(()=>{failure='导入进度保存失败，请检查服务器磁盘并重启服务；已提交任务仍保留。';console.error('网盘导入队列写入失败；任务已保留，请检查磁盘后重启服务');});});}
 async function pump(){if(running)return;running=true;try{while(true){const job=jobs.find(j=>j.status==='queued');if(!job)break;await mutate(next=>{const row=next.find(j=>j.id===job.id);row.status='processing';row.updated=new Date().toISOString();});let patch;
   try{if(job.accountId!==accountId())throw Error('网盘连接已改变，请重新选择照片导入');const result=await importOne(job.fsId,job.accountId,job.id);patch={status:'completed',libraryId:result.item.id,name:result.item.name,duplicate:!!result.duplicate,error:''};}
   catch(e){patch={status:'failed',error:e.message||'导入失败，请重试'};}
   await mutate(next=>Object.assign(next.find(j=>j.id===job.id),patch,{updated:new Date().toISOString()}));
  }}finally{running=false;}}
 const publicJob=({accountId:privateAccount,...job})=>job;
 function list(){return {jobs:jobs.map(publicJob).reverse(),...(failure?{error:failure}:{})};}
 async function enqueue(files){if(!Array.isArray(files)||!files.length||files.length>100)throw Error('每批请选择 1–100 张照片');const normalized=files.map(file=>{const id=String(file?.id||'');if(!/^\d{1,20}$/.test(id))throw Error('照片编号无效');return {id,name:typeof file.name==='string'?file.name.slice(0,300):id};});const account=accountId();if(!account)throw Error('请先连接百度网盘');const ids=await mutate(next=>{const selected=[];const unique=new Map(normalized.map(file=>[file.id,file]));let additions=0;for(const file of unique.values())if(!next.some(job=>job.accountId===account&&job.fsId===file.id&&active(job)))additions++;if(next.filter(active).length+additions>500)throw Error('等待导入的照片已达 500 张，请稍后再添加');for(const file of unique.values()){let job=next.find(row=>row.accountId===account&&row.fsId===file.id&&active(row));if(!job){job={id:randomUUID(),fsId:file.id,name:file.name,accountId:account,status:'queued',created:new Date().toISOString(),error:''};next.push(job);}selected.push(job.id);}return selected;});schedule();return {ids,...list()};}
 async function retry(id){await mutate(next=>{const job=next.find(row=>row.id===id);if(!job||job.status!=='failed')throw Error('只能重试失败的导入任务');if(!accountId()||job.accountId!==accountId())throw Error('网盘连接已改变，请重新选择照片导入');if(next.filter(active).length>=500)throw Error('导入队列已满，请稍后重试');job.status='queued';job.error='';});schedule();return list();}
 // A crash after library save is safe: importOne checks its stable remote ID before downloading.
 if(jobs.some(job=>job.status==='processing'))await mutate(next=>next.forEach(job=>{if(job.status==='processing')job.status='queued';}));
 schedule();return {list,enqueue,retry};
}
