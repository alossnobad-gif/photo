import {rematchBirds} from './rematch-collection.js';
import {applyCatalogue,catalogueStatus} from './protection-catalogue.js';
import {recognitionPrompt,normalizeRecognitionResult} from './recognition-result.js';
import {normalizeClassification,normalizeRarity,normalizeProtection} from '../src/species-classification.js';
import {prepareRecognitionImage} from './recognition-image.js';
import {createSettings} from './settings.js';
import express from 'express';import multer from 'multer';import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {saveSpecies} from './store.js';
const root=process.cwd(), data=path.join(root,'.data');await fs.mkdir(path.join(data,'photos'),{recursive:true});
const settings=await createSettings(data);
const app=express();app.use(express.json({limit:'100kb'}));app.use('/photos',express.static(path.join(data,'photos')));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:50*1024*1024},fileFilter:(req,f,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(f.mimetype))});
async function read(){try{return JSON.parse(await fs.readFile(path.join(data,'collection.json'),'utf8')).map(item=>applyCatalogue(normalizeClassification(item)));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
let writeQueue=Promise.resolve();
app.get('/api/protection-catalogue',(req,res)=>res.json(catalogueStatus()));
app.get('/api/status',(req,res)=>{res.set('Cache-Control','no-store');res.json(settings.status());});
app.get('/api/settings',(req,res)=>{res.set('Cache-Control','no-store');res.json(settings.status());});
app.put('/api/settings',async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!req.is('application/json'))return res.status(415).json({error:'需要 JSON 请求'});
  const origin=req.get('origin');
  if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'只允许本站修改设置'});
  if(origin){try{if(new URL(origin).host!==req.get('host'))return res.status(403).json({error:'只允许本站修改设置'});}catch{return res.status(403).json({error:'无效来源'});}}
  try{res.json(await settings.update(req.body));}catch(error){
  const validationMessages=['请选择支持的服务平台','无效设置','密钥格式不正确','内容超过密钥长度，请只复制 API Key，不要复制整段代码','内容含非英文字符，请只复制 API Key','模型名称格式不正确','请先填写千问 API Key'];
  if(validationMessages.includes(error.message))return res.status(400).json({error:error.message});
  console.error('Settings save failed:',error.code||'UNKNOWN');
  if(['EACCES','EPERM','EROFS'].includes(error.code))return res.status(500).json({error:'服务器数据目录没有写入权限，请修复 /opt/photo/.data 的权限后重试。'});
  if(error.code==='ENOSPC')return res.status(500).json({error:'服务器磁盘空间不足，配置尚未保存。'});
  return res.status(500).json({error:'服务器无法保存配置，请查看服务日志中的 Settings save failed 错误代码。'});
}
});
app.get('/api/exploration-goal',async(req,res,next)=>{res.set('Cache-Control','no-store');try{let goal=100;try{const saved=JSON.parse(await fs.readFile(path.join(data,'exploration-goal.json'),'utf8'));if(Number.isInteger(saved.goal)&&saved.goal>=1&&saved.goal<=10000)goal=saved.goal;}catch(e){if(e.code!=='ENOENT')throw e;}res.json({goal});}catch(e){next(e);}});
let goalQueue=Promise.resolve();
app.put('/api/exploration-goal',(req,res,next)=>{if(!req.is('application/json'))return res.status(415).json({error:'需要 JSON 请求'});if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'只允许本站修改'});const origin=req.get('origin');if(origin){try{if(new URL(origin).host!==req.get('host'))return res.status(403).json({error:'只允许本站修改'});}catch{return res.status(403).json({error:'无效来源'});}}const goal=req.body?.goal;if(!Number.isInteger(goal)||goal<1||goal>10000)return res.status(400).json({error:'请输入 1–10000 的整数'});const job=goalQueue.then(async()=>{const tmp=path.join(data,'exploration-goal.tmp');await fs.writeFile(tmp,JSON.stringify({goal}),{mode:0o600});await fs.rename(tmp,path.join(data,'exploration-goal.json'));res.json({goal});});goalQueue=job.catch(()=>{});job.catch(next);});
app.get('/api/collection',async(req,res,next)=>{try{res.json(await read());}catch(e){next(e);}});
app.post('/api/upload',upload.single('photo'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({error:'请上传 JPG、PNG 或 WebP 照片（最大 50 MB）'});const signatures={jpeg:b=>b[0]===255&&b[1]===216,png:b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),webp:b=>b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'};const ext=req.file.mimetype.split('/')[1];if(!signatures[ext](req.file.buffer))return res.status(400).json({error:'照片格式不正确'});const file=randomUUID()+'.'+ext;await fs.writeFile(path.join(data,'photos',file),req.file.buffer);res.json({photo:'/photos/'+file});}catch(e){next(e);}});
app.post('/api/identify',async(req,res,next)=>{try{const recognition=settings.current();if(!recognition.apiKey)return res.status(503).json({error:'千问识别尚未配置。请打开「识别设置」填写 API Key，或手动录入物种。'});const file=path.basename(String(req.body.photo||''));if(!/^[a-f0-9-]+\.(jpeg|png|webp)$/.test(file))return res.status(400).json({error:'无效照片'});const buffer=await fs.readFile(path.join(data,'photos',file));const type=file.split('.').pop();let image;try{image=await prepareRecognitionImage(buffer,`image/${type}`);}catch{return res.status(400).json({error:'无法处理这张图片，请上传有效的 JPG、PNG 或 WebP 照片（不超过 8000 万像素）。原图仍保留在服务器。'});}console.info('Recognition image bytes',buffer.length,'->',image.buffer.length);const response=await fetch(`${recognition.baseUrl}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${recognition.apiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),body:JSON.stringify({model:recognition.model,max_tokens:1200,messages:[{role:'user',content:[{type:'image_url',image_url:{url:`data:${image.mime};base64,${image.buffer.toString('base64')}`}},{type:'text',text:recognitionPrompt}]}],temperature:0.1})});if(!response.ok){console.error('Qwen request status',response.status);const reason=response.status===401?'身份验证失败（401），请确认密钥与所选平台匹配。':response.status===403?'访问被拒绝（403），请检查模型权限。':response.status===404?'接口或模型不存在（404），请核对视觉模型名称。':response.status===429?'请求受限（429），请检查额度或稍后重试。':`识别服务返回 HTTP ${response.status}，请检查模型和图片输入支持。`;return res.status(502).json({error:reason});}const json=await response.json();const content=json.choices?.[0]?.message?.content||'';let result;try{result=normalizeRecognitionResult(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g,'')));}catch{return res.status(502).json({error:'模型没有返回完整的图鉴数据，请重新识别。照片已保留。'});}res.json(result);}catch(e){if(e.name==='TimeoutError'||e.name==='AbortError'){console.error('Recognition timeout after 120 seconds');return res.status(504).json({error:'千问响应超过 120 秒，识别超时。照片已保留，可以稍后重试或在识别设置中选择支持图片的更快模型。'});}if(e instanceof TypeError&&e.message==='fetch failed'){console.error('Recognition connection failed',e.cause?.code||'UNKNOWN');return res.status(502).json({error:'服务器暂时无法连接识别平台，请稍后重试。照片已保留。'});}next(e);}});
app.post('/api/collection/rematch',(req,res,next)=>{
 if(!req.is('application/json'))return res.status(415).json({error:'需要 JSON 请求'});
 if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'只允许本站重新匹配'});
 const origin=req.get('origin');if(origin){try{if(new URL(origin).host!==req.get('host'))return res.status(403).json({error:'只允许本站重新匹配'});}catch{return res.status(403).json({error:'无效来源'});}}
 const job=writeQueue.then(async()=>{
  let original;try{original=await fs.readFile(path.join(data,'collection.json'));}catch(e){if(e.code==='ENOENT')original=Buffer.from('[]');else throw e;}
  const result=rematchBirds(JSON.parse(original));
  if(result.changed){
   const stamp=new Date().toISOString().replace(/[:.]/g,'-');
   const backup='collection.before-rematch-'+stamp+'.json';
   await fs.writeFile(path.join(data,backup),original,{flag:'wx',mode:0o600});
   const temp=path.join(data,'collection.rematch.tmp');await fs.writeFile(temp,JSON.stringify(result.items,null,2),{mode:0o600});await fs.rename(temp,path.join(data,'collection.json'));
   await fs.writeFile(path.join(data,'rematch-report-'+stamp+'.json'),JSON.stringify(result.changes,null,2),{mode:0o600});
  }
  res.json(result);
 });writeQueue=job.catch(()=>{});job.catch(next);
});
app.post('/api/collection',(req,res,next)=>{const job=writeQueue.then(async()=>{const input=req.body;const file=path.basename(String(input.photo||''));if(input.photo!='/photos/'+file||!/^[a-f0-9-]+\.(jpeg|png|webp)$/.test(file))return res.status(400).json({error:'请先上传照片'});await fs.access(path.join(data,'photos',file));if(!['鸟类','动物','植物','昆虫','菌类'].includes(input.category))return res.status(400).json({error:'请选择分类'});const result=saveSpecies(await read(),applyCatalogue({name:input.name,latin:input.latin,photo:input.photo,category:input.category,description:String(input.description||''),habitat:String(input.habitat||''),rarity:normalizeRarity(input.rarity),protection:normalizeProtection(input.protection),note:String(input.note||'')}),input.replace===true);if(result.duplicate)return res.status(409).json(result);const temp=path.join(data,'collection.tmp');await fs.writeFile(temp,JSON.stringify(result.items,null,2));await fs.rename(temp,path.join(data,'collection.json'));res.json(result.item);});writeQueue=job.catch(()=>{});job.catch(next);});
if(process.env.NODE_ENV==='production'){app.use(express.static(path.join(root,'dist')));app.get('/{*path}',(req,res)=>res.sendFile(path.join(root,'dist','index.html')));}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.use((err,req,res,next)=>{console.error(err.name,err.message);res.status(err.code==='LIMIT_FILE_SIZE'?413:400).json({error:err.code==='LIMIT_FILE_SIZE'?'照片最大支持 50 MB':'操作失败，请稍后重试。'});});
app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Nature compendium listening on port '+(process.env.PORT||3000)));
