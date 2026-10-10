import {applyCatalogue} from './protection-catalogue.js';
export function rematchBirds(items){
 if(!Array.isArray(items))throw Error('收藏数据必须是数组');
 const changes=[];
 const result=items.map(item=>{
  if(item.category!=='鸟类')return item;
  const matched=applyCatalogue({...item,protection:'未核实'});
  const fields=['protection','protectionMethod','protectionSource','protectionSourceUrl','protectionVersion','protectionNote'];
  const changed=fields.some(field=>(item[field]??null)!==(matched[field]??null));
  if(!changed)return item;
  changes.push({id:item.id,name:item.name,previous:item.protection||'未核实',current:matched.protection,method:matched.protectionMethod,note:matched.protectionNote});
  // Preserve every unrelated field: original photo, identity, discovery date, user notes.
  const updated={...item};for(const field of fields)updated[field]=matched[field]??null;
  return updated;
 });
 return {items:result,changes,total:items.filter(item=>item.category==='鸟类').length,changed:changes.length,matched:result.filter(item=>item.category==='鸟类'&&item.protectionMethod==='catalogue-candidate').length,unverified:result.filter(item=>item.category==='鸟类'&&item.protectionMethod==='unverified').length};
}
