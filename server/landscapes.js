import {provinceForCity} from '../src/city-provinces.js';
import {normalizeProvince} from '../src/landscape-progress.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {landscapeTags} from '../src/landscape-data.js';
export function normalizeLandscape(input,existing){
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 if(!input||typeof input!=='object'||Array.isArray(input))fail('请填写风光资料');
 const text=(key,max)=>{if(input[key]!=null&&typeof input[key]!=='string')fail('资料格式不正确');const value=(input[key]||'').trim();if(value.length>max)fail('填写内容过长');return value;};
 const provinceInput=text('province',50),province=normalizeProvince(provinceInput);if(provinceInput&&!province)fail('请选择有效省份');
 const description=text('description',1500),shareText=text('shareText',1500),title=text('title',100),city=text('city',100),location=text('location',150),note=text('note',3000),takenAt=text('takenAt',10);
 if(!title)fail('请填写照片标题');
 if(takenAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(takenAt)||!Number.isFinite(Date.parse(takenAt))||new Date(takenAt).toISOString().slice(0,10)!==takenAt))fail('请选择有效的拍摄日期');
 if(!Array.isArray(input.tags)||input.tags.some(tag=>!landscapeTags.includes(tag)))fail('请选择有效的风光题材');
 const photo=existing?.photo||input.photo;
 if(typeof photo!=='string'||!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(photo))fail('请先上传照片');
 const gps=input.gps;if(gps!=null&&(!Number.isFinite(gps.latitude)||!Number.isFinite(gps.longitude)||Math.abs(gps.latitude)>90||Math.abs(gps.longitude)>180))fail('照片定位格式不正确');
 return {gps:gps?{latitude:gps.latitude,longitude:gps.longitude}:null,id:existing?.id||randomUUID(),photo,title,province:province||provinceForCity(city),city,location,note,takenAt,description,shareText,placeCandidate:normalizePlaceCandidate(input.placeCandidate),tags:[...new Set(input.tags)],cover:input.cover===true,created:existing?.created||new Date().toISOString(),updated:new Date().toISOString()};
}
export function mountLandscapes(app,data){
 const filename=path.join(data,'landscapes.json');let queue=Promise.resolve();
 const read=async()=>{try{return JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}};
 app.get('/api/landscapes',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json((await read()).map(item=>({...item,province:item.province||provinceForCity(item.city)})));}catch(e){next(e);}});
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
 save.removeMisclassified=async(id,photo)=>{const task=queue.then(async()=>{const items=await read();const record=items.find(x=>x.id===id);if(!record)return;if(record.photo!==photo)throw Error('修复照片与风光记录不匹配');await fs.writeFile(filename+'.repair-backup-'+randomUUID(),JSON.stringify(items),{mode:0o600});await fs.writeFile(filename+'.tmp',JSON.stringify(items.filter(x=>x.id!==id),null,2),{mode:0o600});await fs.rename(filename+'.tmp',filename);});queue=task.catch(()=>{});return task;};
 app.post('/api/landscapes/delete-batch',(req,res,next)=>{
  if(!req.is('application/json'))return res.status(415).json({error:'需要 JSON 请求'});
  if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'只允许本站删除风光'});
  if(req.get('origin')){try{if(new URL(req.get('origin')).host!==req.get('host'))return res.status(403).json({error:'只允许本站删除风光'});}catch{return res.status(403).json({error:'无效来源'});}}
  const ids=req.body?.ids;if(!Array.isArray(ids)||!ids.length||ids.length>10000||ids.some(id=>typeof id!=='string'||!id))return res.status(400).json({error:'请选择要删除的风光记录'});
  const task=queue.then(async()=>{const items=await read(),chosen=new Set(ids),removed=items.filter(item=>chosen.has(item.id)).map(item=>item.id);if(removed.length){await fs.writeFile(filename+'.tmp',JSON.stringify(items.filter(item=>!chosen.has(item.id)),null,2),{mode:0o600});await fs.rename(filename+'.tmp',filename);}res.json({removed});});queue=task.catch(()=>{});task.catch(next);
 });
 app.post('/api/landscapes',save);app.put('/api/landscapes/:id',save);return save;
}
export const landscapePrompt=`你是熟悉中国及世界著名景点的旅行摄影地标识别助手。首要任务是辨认照片里的具体景点及所属城市，其次才是整理标题和文案。可以使用你已有的地理、建筑和景点知识；没有联网检索能力，不声称已查询地图或核验。
先检查画面里的招牌、匾额、题字、建筑轮廓与层数、桥梁结构、山形、水系、建筑群组合；结合提供的文件名线索与用户地点，判断最可能的地标。著名地标即使没有GPS或文字，只要独特视觉特征足够，也应给出候选名称，并用已有知识补充所属城市和省份。不要把没有GPS、不能联网或不是百分之百确定当成必须留空的理由。
只有一般性的山水、沙丘、日落、普通建筑或几个地点难以区分时才留空，不能随便挑一个热门景点。文件名只是线索，需与画面相符；不能只抄文件名，不能虚构画面中看不到的文字。只看出城市时可以只给城市，不要补造具体景点。
返回一个JSON对象，不要markdown：
{"title":"20字内中文摄影标题","tags":["题材"],"description":"80至120字画面描述","shareText":"简短自然的分享文案，不含未经确认的地名","confidence":0.0,"placeCandidate":{"province":"中国省级行政区简称，国外或无法确定留空","city":"城市或地区，无法判断留空","location":"最可能的具体地标名称，无法判断留空","confidence":0.0,"evidence":["画面实际可见且支持判断的独特特征","可选：文件名提供的辅助线索，明确其来源"]}}
confidence为标题和题材的0至1置信度；placeCandidate.confidence独立反映地标判断可靠程度，不是事实核验。0.85以上表示多项独特特征吻合；0.6至0.85表示有合理依据但仍需核实；低于0.6表示较弱候选。缺乏依据时返回placeCandidate:null。不要因为标题很确定就把地点置信度也设为很高。
题材可多选，仅限山川、河流、湖泊、海岸、森林、草原、沙漠、戈壁、日出日落、云雾星空、城市风光、建筑地标、其他。
候选城市和景点只写在placeCandidate里，不混入description或shareText。证据简洁具体，最多3条，不输出长篇推理。
不要返回takenAt或gps，不从文件名、季节、光线猜拍摄日期；日期由系统读取EXIF或用户填写。GPS仅作辅助，不宣称做过逆地理编码。`;

const confidence=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1?value:null;
export function normalizePlaceCandidate(value){if(!value||typeof value!=='object'||Array.isArray(value))return null;const city=typeof value.city==='string'?value.city.trim().slice(0,100):'',location=typeof value.location==='string'?value.location.trim().slice(0,150):'';if(!city&&!location)return null;return {province:normalizeProvince(value.province)||provinceForCity(city),city,location,confidence:confidence(value.confidence),evidence:Array.isArray(value.evidence)?value.evidence.filter(x=>typeof x==='string').map(x=>x.trim().slice(0,200)).filter(Boolean).slice(0,5):[]};}
export function normalizeLandscapeRecognition(value){if(!value||typeof value.title!=='string'||!value.title.trim()||!Array.isArray(value.tags))throw Error('Invalid recognition');const score=confidence(value.confidence);return {...(score!==null?{confidence:score}:{}),title:value.title.trim().slice(0,100),tags:[...new Set(value.tags.filter(tag=>landscapeTags.includes(tag)))],description:typeof value.description==='string'?value.description.trim().slice(0,1500):'',shareText:typeof value.shareText==='string'?value.shareText.trim().slice(0,1500):'',placeCandidate:normalizePlaceCandidate(value.placeCandidate)};}
