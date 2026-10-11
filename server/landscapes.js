import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {landscapeTags} from '../src/landscape-data.js';
export function normalizeLandscape(input,existing){
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 if(!input||typeof input!=='object'||Array.isArray(input))fail('请填写风光资料');
 const text=(key,max)=>{if(input[key]!=null&&typeof input[key]!=='string')fail('资料格式不正确');const value=(input[key]||'').trim();if(value.length>max)fail('填写内容过长');return value;};
 const title=text('title',100),city=text('city',100),location=text('location',150),note=text('note',3000),takenAt=text('takenAt',10);
 if(!title)fail('请填写照片标题');
 if(takenAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(takenAt)||!Number.isFinite(Date.parse(takenAt))||new Date(takenAt).toISOString().slice(0,10)!==takenAt))fail('请选择有效的拍摄日期');
 if(!Array.isArray(input.tags)||input.tags.some(tag=>!landscapeTags.includes(tag)))fail('请选择有效的风光题材');
 const photo=existing?.photo||input.photo;
 if(typeof photo!=='string'||!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(photo))fail('请先上传照片');
 const gps=input.gps;if(gps!=null&&(!Number.isFinite(gps.latitude)||!Number.isFinite(gps.longitude)||Math.abs(gps.latitude)>90||Math.abs(gps.longitude)>180))fail('照片定位格式不正确');
 return {gps:gps?{latitude:gps.latitude,longitude:gps.longitude}:null,id:existing?.id||randomUUID(),photo,title,city,location,note,takenAt,tags:[...new Set(input.tags)],cover:input.cover===true,created:existing?.created||new Date().toISOString(),updated:new Date().toISOString()};
}
export function mountLandscapes(app,data){
 const filename=path.join(data,'landscapes.json');let queue=Promise.resolve();
 const read=async()=>{try{return JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}};
 app.get('/api/landscapes',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json(await read());}catch(e){next(e);}});
 function save(req,res,next){
  if(!req.is('application/json'))return res.status(415).json({error:'需要 JSON 请求'});
  if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'只允许本站保存风光'});
  if(req.get('origin')){try{if(new URL(req.get('origin')).host!==req.get('host'))return res.status(403).json({error:'只允许本站保存风光'});}catch{return res.status(403).json({error:'无效来源'});}}
  const job=queue.then(async()=>{const items=await read();const existing=req.params.id?items.find(x=>x.id===req.params.id):null;if(req.params.id&&!existing)return res.status(404).json({error:'这张风光记录已不存在'});
   let item;try{item=normalizeLandscape(req.body,existing);}catch(e){if(e.status)return res.status(e.status).json({error:e.message});throw e;}
   try{await fs.access(path.join(data,item.photo));}catch(e){if(e.code==='ENOENT')return res.status(400).json({error:'照片文件不存在，请重新上传'});throw e;}
   const result=[item,...items.filter(x=>x.id!==item.id).map(x=>item.cover&&x.city===item.city?{...x,cover:false}:x)];
   const temp=filename+'.tmp';await fs.writeFile(temp,JSON.stringify(result,null,2),{mode:0o600});await fs.rename(temp,filename);res.json({item,items:result});
  });queue=job.catch(()=>{});job.catch(next);
 }
 app.post('/api/landscapes',save);app.put('/api/landscapes/:id',save);return save;
}
export const landscapePrompt='你是风光摄影整理助手。只根据图片可见内容推荐标题和题材，不猜测城市、地点或拍摄日期。只返回JSON：{"title":"20字内中文摄影标题","tags":["题材"],"confidence":0.0}。confidence 是0至1的识别置信度。题材只能从山川、河流、湖泊、海岸、森林、草原、日出日落、云雾星空、城市风光、其他中选择，可多选。';
export function normalizeLandscapeRecognition(value){if(!value||typeof value.title!=='string'||!value.title.trim()||!Array.isArray(value.tags))throw Error('Invalid recognition');return {...(typeof value.confidence==='number'?{confidence:value.confidence}:{}),title:value.title.trim().slice(0,100),tags:[...new Set(value.tags.filter(tag=>landscapeTags.includes(tag)))]};}
