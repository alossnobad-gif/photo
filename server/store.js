import {randomUUID} from 'node:crypto';
export function saveSpecies(items, input, replace=false){
 const latin=String(input.latin||'').trim();const name=String(input.name||'').trim();
 if(!name||!latin||!input.photo) throw new Error('需要物种名称、学名和照片');
 const key=latin.toLowerCase().replace(/\s+/g,' ');const existing=items.find(x=>x.key===key);
 if(existing&&!replace)return {duplicate:existing};
 const item={...input,name,latin,key,id:existing?.id||randomUUID(),discovered:existing?.discovered||new Date().toISOString(),updated:new Date().toISOString()};
 return {item,items:existing?items.map(x=>x.id===existing.id?item:x):[item,...items]};
}
