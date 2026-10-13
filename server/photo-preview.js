import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export function mountPhotoPreviews(app,data){
 const cache=path.join(data,'photo-previews'),pending=new Map();
 let tail=Promise.resolve();
 app.get('/api/photo-preview/:file',async(req,res,next)=>{
  const file=req.params.file;
  if(!/^[a-f0-9-]+\.(jpeg|png|webp)$/.test(file))return res.status(400).json({error:'无效照片'});
  try{
   const source=path.join(data,'photos',file),stat=await fs.stat(source);
   const key=file+'.'+stat.size+'.'+stat.mtimeMs+'.jpeg',target=path.join(cache,key);
   try{await fs.access(target);}catch(e){
    if(e.code!=='ENOENT')throw e;
    if(!pending.has(key)){
     const task=tail.then(async()=>{await fs.mkdir(cache,{recursive:true});await sharp(source,{limitInputPixels:80_000_000}).rotate().resize({width:720,height:720,fit:'inside',withoutEnlargement:true}).jpeg({quality:74}).toFile(target+'.tmp');await fs.rename(target+'.tmp',target);});
     tail=task.catch(()=>{});pending.set(key,task);task.finally(()=>pending.delete(key)).catch(()=>{});
    }
    await pending.get(key);
   }
   res.set('Cache-Control','private, max-age=0, must-revalidate');
   res.sendFile(target,{dotfiles:'allow'},error=>{if(error)next(error);});
  }catch(e){if(e.code==='ENOENT')return res.status(404).json({error:'照片不存在'});next(e);}
 });
}
