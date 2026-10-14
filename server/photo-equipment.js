import fs from 'node:fs/promises';import path from 'node:path';
import {photoMetadata} from './photo-metadata.js';import {normalizeEquipment} from '../src/camera-equipment.js';
export function mountPhotoEquipment(app,data){
 const cache=new Map();let writes=Promise.resolve();
 const sidecar=path.join(data,'photo-equipment.json');
 const read=async file=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}};
 const remember=(photo,input)=>{const equipment=normalizeEquipment(input);if(!Object.keys(equipment).length)return Promise.resolve();const task=writes.then(async()=>{const entries=await read(sidecar);entries[photo]=equipment;await fs.writeFile(sidecar+'.tmp',JSON.stringify(entries),{mode:0o600});await fs.rename(sidecar+'.tmp',sidecar);});writes=task.catch(()=>{});return task;};
 app.get('/api/photo-equipment/:file',async(req,res,next)=>{const file=req.params.file;if(!/^[a-f0-9-]+\.(jpeg|png|webp)$/.test(file))return res.status(400).json({error:'无效照片'});try{
  const photo='/photos/'+file;let equipment=normalizeEquipment((await read(sidecar))[photo]);
  if(!Object.keys(equipment).length){let library=[];try{library=JSON.parse(await fs.readFile(path.join(data,'library.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}const item=library.find(item=>item.photo===photo);equipment=normalizeEquipment(item?.equipment);
   if(!Object.keys(equipment).length){let source=path.join(data,'photos',file);if(item?.sourceFile&&/^[a-f0-9-]+\.[a-z0-9]+$/.test(item.sourceFile)){const original=path.join(data,'library-originals',item.sourceFile);try{await fs.access(original);source=original;}catch{}}
    try{const stat=await fs.stat(source),key=source+':'+stat.size+':'+stat.mtimeMs;if(cache.has(key))equipment=cache.get(key);else{const handle=await fs.open(source,'r');let bytes;try{const buffer=Buffer.alloc(Math.min(stat.size,1024*1024));const result=await handle.read(buffer,0,buffer.length,0);bytes=buffer.subarray(0,result.bytesRead);}finally{await handle.close();}equipment=normalizeEquipment((await photoMetadata(bytes)).equipment);if(cache.size>1000)cache.clear();cache.set(key,equipment);}}catch(e){if(e.code!=='ENOENT')throw e;}
   }
   await remember(photo,equipment);
  }
  res.set('Cache-Control','private, max-age=300').json({equipment});
 }catch(e){next(e);}});
 return remember;
}
