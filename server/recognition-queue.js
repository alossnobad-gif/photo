import sharp from 'sharp';
import {normalizeProvince} from '../src/landscape-progress.js';
import {photoMetadata} from './photo-metadata.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {validPhotoDate} from '../src/photo-date.js';
export function automaticRecognition(result,kind){return typeof result?.confidence==='number'&&Number.isFinite(result.confidence)&&result.confidence>.85&&result.confidence<=1&&(kind==='landscape'?!!result.title:result.uncertain===false&&!!result.name&&!!result.latin&&['鸟类','动物','植物','昆虫','菌类'].includes(result.category));}
export async function createRecognitionQueue(data,{identify,save,concurrency=1}){
 const filename=path.join(data,'recognition-queue.json');let jobs=[];try{jobs=JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const controllers=new Map();let writes=Promise.resolve(),active=0,closed=false;const persist=()=>{const content=JSON.stringify(jobs,null,2);const task=writes.then(async()=>{await fs.writeFile(filename+'.tmp',content,{mode:0o600});await fs.rename(filename+'.tmp',filename);});writes=task.catch(()=>{});return task;};
 for(const job of jobs){if(job.saved?.item&&Array.isArray(job.saved.items))job.saved=job.saved.item;if(job.status==='processing')job.status='queued';if(job.status==='saving')job.status='review';if(job.status==='confirming')job.status='review';}await persist();
 function pump(){if(closed)return;while(active<concurrency){const job=[...jobs].reverse().find(x=>x.status==='queued');if(!job)break;job.status='processing';active++;run(job).finally(()=>{active--;pump();});}}
 async function run(job){const controller=new AbortController();controllers.set(job.id,controller);try{await persist();if(!jobs.includes(job)||job.status==='stopped'||controller.signal.aborted)return;job.result=await identify({...job.fields,photo:job.photo,kind:job.kind,signal:controller.signal});if(!jobs.includes(job)||job.status==='stopped'||controller.signal.aborted)return;if(automaticRecognition(job.result,job.kind)){try{job.status='saving';job.saved=await save(job.kind,{...job.result,...job.fields,...(job.kind==='landscape'?{province:job.fields.province||job.result.placeCandidate?.province||'',city:job.fields.city||job.result.placeCandidate?.city||'',location:job.fields.location||job.result.placeCandidate?.location||''}:{}),photo:job.photo});job.status='completed';}catch(e){job.status='review';job.error=e.message;}}else job.status='review';}catch(e){if(!jobs.includes(job)||job.status==='stopped'||controller.signal.aborted)return;job.status='failed';job.error=e.message||'识别失败，请重试';}finally{controllers.delete(job.id);}job.updated=new Date().toISOString();await persist().catch(e=>console.error('Queue persistence failed',e.code));}
 async function enqueue(input){if(!input||typeof input.photo!=='string'||!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(input.photo))throw Error('请先上传照片');await fs.access(path.join(data,input.photo));const existing=jobs.find(j=>j.photo===input.photo&&j.kind===(input.kind==='landscape'?'landscape':'species'));if(existing)return existing;const metadata=await photoMetadata(await fs.readFile(path.join(data,input.photo)));const fields={province:normalizeProvince(input.province),takenAt:validPhotoDate(input.takenAt)?input.takenAt:metadata.takenAt||'',city:String(input.city||'').slice(0,100),location:String(input.location||'').slice(0,150),note:String(input.note||'').slice(0,3000)};const gps=input.gps||metadata.gps;if(gps&&Number.isFinite(gps.latitude)&&Number.isFinite(gps.longitude)&&Math.abs(gps.latitude)<=90&&Math.abs(gps.longitude)<=180)fields.gps=gps;const job={id:randomUUID(),photo:input.photo,kind:input.kind==='landscape'?'landscape':'species',fields,status:'queued',created:new Date().toISOString()};jobs.unshift(job);try{await persist();}catch(e){jobs=jobs.filter(j=>j!==job);throw e;}pump();return job;}
 async function retry(id){const job=jobs.find(j=>j.id===id);if(!job||!['failed','review','stopped'].includes(job.status))throw Error('这个任务不能重试');if(controllers.has(id))throw Error('正在停止，请稍后继续');job.status='queued';job.error='';await persist();pump();return job;}
 async function confirm(id,fields){const job=jobs.find(j=>j.id===id);if(job?.status==='completed')return job;if(!job||job.status!=='review')throw Error('任务不在待确认列表');job.status='confirming';try{job.saved=await save(job.kind,{...job.result,...job.fields,...fields,photo:job.photo});job.status='completed';job.manual=true;job.error='';await persist();return job;}catch(e){job.status='review';job.error=e.message;await persist();throw e;}}
 async function stop(id){
 const targets=jobs.filter(j=>(id==null||j.id===id)&&['queued','processing'].includes(j.status));
 if(id!=null&&!targets.length)throw Error('此任务当前不能停止');
 for(const job of targets){job.status='stopped';job.updated=new Date().toISOString();controllers.get(job.id)?.abort();}
 await persist();return {stopped:targets.map(j=>j.id)};
 }
 async function removeMany(ids){
 if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'))throw Error('请选择要删除的任务');
 const chosen=new Set(ids),targets=jobs.filter(j=>chosen.has(j.id)&&!['saving','confirming'].includes(j.status)),skipped=jobs.filter(j=>chosen.has(j.id)&&['saving','confirming'].includes(j.status)).map(j=>j.id);
 const removed=new Set(targets.map(j=>j.id));jobs=jobs.filter(j=>!removed.has(j.id));
 try{await persist();}catch(e){jobs.push(...targets);throw e;}
 for(const job of targets)controllers.get(job.id)?.abort();
 // Read references once for the whole batch; never delete photographs used elsewhere.
 try{
 const referenced=new Set(jobs.map(j=>j.photo));
 for(const file of ['collection.json','landscapes.json','library.json']){
 let rows=[];try{rows=JSON.parse(await fs.readFile(path.join(data,file),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const row of rows){referenced.add(row.photo);referenced.add(row.originalPhoto);}
 }
 for(const photo of new Set(targets.filter(j=>j.status!=='completed').map(j=>j.photo))){
 if(typeof photo==='string'&&/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(photo)&&!referenced.has(photo)&&!jobs.some(j=>j.photo===photo))await fs.rm(path.join(data,photo),{force:true});
 }
 }catch(e){console.error('Abandoned photo cleanup skipped',e.code||e.name);}
 return {removed:[...removed],skipped};
 }
 async function remove(id){if(!jobs.some(j=>j.id===id))throw Error('任务已不存在');const result=await removeMany([id]);if(result.skipped.length)throw Error('正在入库，请稍后再删除队列记录');return {removed:id};}
 // A confirmation interrupted by restart can safely be reviewed again.
 for(const job of jobs)if(job.status==='confirming')job.status='review';pump();
 return {data,list:()=>jobs,enqueue,retry,confirm,remove,removeMany,stop,close:()=>{closed=true;}};
}
export function mountRecognitionQueue(app,queue){
 let thumbnailWork=Promise.resolve();const inFlight=new Map();
 app.get('/api/recognition-queue/:id/thumbnail',async(req,res)=>{
 try{
 const job=queue.list().find(j=>j.id===req.params.id);if(!job)return res.sendStatus(404);
 if(!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(job.photo))return res.sendStatus(400);
 const source=path.join(queue.data,job.photo),info=await fs.stat(source);
 const dir=path.join(queue.data,'queue-thumbnails'),target=path.join(dir,path.basename(job.photo)+'.'+info.mtimeMs+'.jpg');
 try{await fs.access(target);}catch{
 if(!inFlight.has(target)){
 const work=thumbnailWork.catch(()=>{}).then(async()=>{await fs.mkdir(dir,{recursive:true});await sharp(source,{limitInputPixels:80_000_000}).rotate().resize({width:480,height:360,fit:'inside',withoutEnlargement:true}).jpeg({quality:65}).toFile(target);});
 thumbnailWork=work;inFlight.set(target,work);work.finally(()=>inFlight.delete(target)).catch(()=>{});
 }
 await inFlight.get(target);
 }
 if(!res.destroyed)res.set('Cache-Control','private, max-age=60').sendFile(target);
 }catch{if(!res.headersSent)res.sendStatus(404);}
 });
app.get('/api/recognition-queue',(req,res)=>res.set('Cache-Control','no-store').json(queue.list()));const allowed=req=>req.get('sec-fetch-site')!=='cross-site'&&(!req.get('origin')||req.get('origin')===`${req.protocol}://${req.get('host')}`);for(const [route,action] of [['/api/recognition-queue/stop-all',()=>queue.stop()],['/api/recognition-queue/delete-batch',req=>queue.removeMany(req.body.ids)],['/api/recognition-queue/:id/stop',req=>queue.stop(req.params.id)],['/api/recognition-queue',req=>queue.enqueue(req.body)],['/api/recognition-queue/:id/retry',req=>queue.retry(req.params.id)],['/api/recognition-queue/:id/confirm',req=>queue.confirm(req.params.id,req.body)],['/api/recognition-queue/:id/delete',req=>queue.remove(req.params.id)]])app.post(route,async(req,res,next)=>{if(!allowed(req))return res.status(403).json({error:'请从本站操作'});try{const started=performance.now();const result=await action(req);console.info('Queue action',req.route.path,Math.round(performance.now()-started)+'ms');res.json(result);}catch(e){res.status(400).json({error:e.message});}});}
