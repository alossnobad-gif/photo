import {randomUUID} from 'node:crypto';
export function saveSpecies(items, input, replace=false){
 const latin=String(input.latin||'').trim();const name=String(input.name||'').trim();
 if(!name||!latin||!input.photo) throw new Error('需要物种名称、学名和照片');
 const key=latin.toLowerCase().replace(/\s+/g,' ');const existing=items.find(x=>x.key===key);
 if(existing&&!replace)return {duplicate:existing};
 const item={...input,name,latin,key,id:existing?.id||randomUUID(),discovered:existing?.discovered||new Date().toISOString(),updated:new Date().toISOString()};
 return {item,items:existing?items.map(x=>x.id===existing.id?item:x):[item,...items]};
}

export function editSpecies(items,id,input){
 const existing=items.find(item=>item.id===id);
 if(!existing)return {error:'这条收藏已不存在',status:404};
 const name=String(input.name||'').trim(),latin=String(input.latin||'').trim();
 if(!name||!latin||name.length>100||latin.length>150)return {error:'请填写完整的物种名称和学名',status:400};
 const key=latin.toLowerCase().replace(/\s+/g,' ');
 if(items.some(item=>item.id!==id&&String(item.latin||'').trim().toLowerCase().replace(/\s+/g,' ')===key))return {error:'这个学名已在另一条收藏中，请核实后再保存',status:409};
 const item={...existing,...input,name,latin,key,id:existing.id,photo:existing.photo,discovered:existing.discovered,updated:new Date().toISOString()};
 return {item,items:items.map(row=>row.id===id?item:row)};
}
