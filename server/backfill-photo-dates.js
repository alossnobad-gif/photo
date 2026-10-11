import fs from 'node:fs/promises';
import path from 'node:path';
import {photoMetadata} from './photo-metadata.js';
export async function backfillPhotoDates(data){
 const report={checked:0,dated:0,unknown:0};
 for(const name of ['collection','landscapes']){
  const filename=path.join(data,name+'.json');let original;
  try{original=await fs.readFile(filename);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  const items=JSON.parse(original);if(!Array.isArray(items))throw Error('Invalid collection');let changed=false;
  for(const item of items){
   // An existing value, including an explicitly cleared date, belongs to the user.
   if(Object.hasOwn(item,'takenAt'))continue;
   let takenAt='';
   if(typeof item.photo==='string'&&/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(item.photo)){
    try{takenAt=(await photoMetadata(await fs.readFile(path.join(data,item.photo)))).takenAt||'';}catch(e){if(e.code!=='ENOENT')throw e;}
   }
   item.takenAt=takenAt;changed=true;report.checked++;if(takenAt)report.dated++;else report.unknown++;
  }
  if(changed){
   await fs.writeFile(filename+'.before-photo-dates-'+Date.now(),original,{mode:0o600,flag:'wx'});
   const temporary=filename+'.photo-dates.tmp';await fs.writeFile(temporary,JSON.stringify(items,null,2),{mode:0o600});await fs.rename(temporary,filename);
  }
 }
 return report;
}
