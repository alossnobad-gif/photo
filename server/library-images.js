import fs from 'node:fs/promises';import path from 'node:path';import {createHash,randomUUID} from 'node:crypto';import sharp from 'sharp';
import {decodeRaw} from './raw-decoder.js';import {workingJpeg,workingPhotoPolicy} from './photo-working.js';import {createPreviewPool} from '../src/preview-pool.js';
export async function clearEditorCache(data,ids){const folder=path.join(data,'editor-previews'),prefixes=new Set(ids.map(id=>createHash('sha256').update(String(id)).digest('hex').slice(0,16)));let files;try{files=await fs.readdir(folder);}catch(e){if(e.code==='ENOENT')return 0;throw e;}let freed=0;for(const name of files)if(/^[a-f0-9]{16}\.[a-f0-9]{64}\.jpeg$/.test(name)&&prefixes.has(name.split('.')[0])){const file=path.join(folder,name);try{const stat=await fs.stat(file);await fs.unlink(file);freed+=stat.size;}catch(e){if(e.code!=='ENOENT')throw e;}}return freed;}
const raw=new Set(['arw','nef','nrw','cr2','cr3','dng','raf','rw2','orf','pef','srw','raw','rwl','3fr','iiq']);
export function mountLibraryImages(app,data,{decode=decodeRaw}={}){
 const cache=path.join(data,'editor-previews'),pool=createPreviewPool(1);
 app.get('/api/library/:id/image',async(req,res,next)=>{
  const mode=req.query.view||'working';if(!['working','render','original'].includes(mode))return res.status(400).json({error:'无效预览类型'});
  const controller=new AbortController(),stop=()=>controller.abort();req.once('aborted',stop);res.once('close',stop);
  try{
   const rows=JSON.parse(await fs.readFile(path.join(data,'library.json'),'utf8')),item=rows.find(row=>row.id===req.params.id);if(!item)return res.status(404).json({error:'照片已不存在'});
   if(!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(item.photo))return res.status(400).json({error:'照片路径无效'});
   let source=path.join(data,item.photo),origin='current';
   if(mode==='original'&&typeof item.sourceFile==='string'&&/^[a-f0-9-]+\.[a-z0-9]+$/.test(item.sourceFile)){const original=path.join(data,'library-originals',item.sourceFile);try{await fs.access(original);source=original;origin='source';}catch(e){if(e.code!=='ENOENT')throw e;}}
   const stat=await fs.stat(source);const send=file=>{if(!res.destroyed)res.set({'Cache-Control':'private, max-age=0, must-revalidate','X-Photo-Origin':origin}).sendFile(file,{dotfiles:'allow'},error=>{if(error&&!res.destroyed&&!res.headersSent)next(error);});};
   if(mode==='render'&&item.imagePolicy===workingPhotoPolicy||mode==='original'&&origin==='current'){send(source);return;}
   const key=createHash('sha256').update([source,stat.size,stat.mtimeMs,stat.ctimeMs,mode,workingPhotoPolicy].join(':')).digest('hex'),target=path.join(cache,createHash('sha256').update(String(item.id)).digest('hex').slice(0,16)+'.'+key+'.jpeg');
   try{await fs.access(target);}catch(e){if(e.code!=='ENOENT')throw e;await pool.acquire(target,async signal=>{
    signal.throwIfAborted();try{await fs.access(target);return;}catch(e){if(e.code!=='ENOENT')throw e;}await fs.mkdir(cache,{recursive:true,mode:0o700});const temp=path.join(cache,randomUUID()+'.tmp'),tiff=path.join(cache,randomUUID()+'.tiff');let input=source;
    try{if(raw.has(path.extname(source).slice(1))){const disk=await fs.statfs(data);if(Number(disk.bavail)*Number(disk.bsize)<stat.size*8+256*1024*1024)throw Error('空间不足，无法生成原图预览，请先清理图库');await decode(source,tiff,{signal});input=tiff;}signal.throwIfAborted();if(mode==='working')await sharp(input,{limitInputPixels:80_000_000,failOn:'error'}).rotate().resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true}).jpeg({quality:88}).toFile(temp);else if(mode==='render')await workingJpeg(input).toFile(temp);else await sharp(input,{limitInputPixels:80_000_000,failOn:'error'}).rotate().jpeg({quality:95}).toFile(temp);signal.throwIfAborted();await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true}).catch(()=>{});await fs.rm(tiff,{force:true}).catch(()=>{});}
    const files=await fs.readdir(cache);const sizes=await Promise.all(files.filter(name=>/^[a-f0-9]{16}\.[a-f0-9]{64}\.jpeg$/.test(name)).map(async name=>{const info=await fs.stat(path.join(cache,name)).catch(()=>null);return {name,size:info?.size||0,time:info?.mtimeMs||0};}));let total=sizes.reduce((sum,x)=>sum+x.size,0);for(const file of sizes.sort((a,b)=>a.time-b.time)){if(total<=192*1024*1024)break;if(file.name===path.basename(target))continue;await fs.rm(path.join(cache,file.name),{force:true});total-=file.size;}
   },{signal:controller.signal});}
   controller.signal.throwIfAborted();send(target);
  }catch(e){if(!res.destroyed&&!res.headersSent){if(e.code==='ENOENT')res.status(404).json({error:'照片已不存在'});else next(e);}}finally{req.off('aborted',stop);res.off('close',stop);}
 });
}
