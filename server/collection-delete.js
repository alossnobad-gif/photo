import fs from 'node:fs/promises';
import path from 'node:path';
const latin=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
export function collectionDeleteHandler({data,read,serialize,jobs=()=>[]}){
 return async(req,res,next)=>{
  if(req.get('sec-fetch-site')==='cross-site'||req.get('origin')&&req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'请从本站删除收藏'});
  const id=req.params.id;if(typeof id!=='string'||!id||id.length>100)return res.status(400).json({error:'无效的收藏记录'});
  try{await serialize(async()=>{
   const items=await read(),item=items.find(row=>row.id===id);
   if(!item)return res.json({removed:id,alreadyDeleted:true});
   if(req.body?.expectedPhoto!==undefined&&req.body.expectedPhoto!==item.photo||req.body?.expectedUpdated!==undefined&&(req.body.expectedUpdated??null)!==(item.updated??null))return res.status(409).json({error:'这条收藏已更新，请关闭后重新打开，再确认删除'});
   const active=jobs().some(job=>(job.kind||'species')==='species'&&['queued','processing','saving','confirming'].includes(job.status)&&(job.photo===item.photo||job.saved?.id===id||latin(item.latin)&&latin(job.result?.latin)===latin(item.latin)));
   if(active)return res.status(409).json({error:'这个物种有正在处理的识别任务，请先完成或停止对应任务再删除'});
   const temp=path.join(data,'collection.tmp');await fs.writeFile(temp,JSON.stringify(items.filter(row=>row.id!==id),null,2),{mode:0o600});await fs.rename(temp,path.join(data,'collection.json'));
   res.json({removed:id});
  });}catch(e){next(e);}
 };
}
