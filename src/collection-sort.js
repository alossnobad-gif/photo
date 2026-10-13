import {normalizeRarity} from './species-classification.js';
export const collectionSortOptions=[['uploaded-newest','最近上传（入库）'],['uploaded-oldest','最早上传（入库）'],['newest','最新拍摄'],['oldest','最早拍摄'],['rare','稀有优先'],['common','常见优先'],['protection','保护等级优先'],['name','物种名称']];
export const validCollectionSort=value=>collectionSortOptions.some(([key])=>key===value)?value:'newest';
const collator=new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
const discovered=item=>{const value=Date.parse(item.takenAt);return Number.isFinite(value)?value:null;};
function dates(a,b,oldest=false){const x=discovered(a),y=discovered(b);if(x===null)return y===null?0:1;if(y===null)return -1;return oldest?x-y:y-x;}
const names=(a,b)=>collator.compare(a.name||'',b.name||'')||collator.compare(a.latin||'',b.latin||'')||String(a.id||'').localeCompare(String(b.id||''));
const protectionRank=item=>({'国家一级':0,'国家二级':1,'三有动物':2,'地方重点保护':2,'其他保护':2,'未列入保护名录':3})[item.protection]??4;
export function sortCollection(items,order='newest'){
 const mode=validCollectionSort(order);
 return [...items].sort((a,b)=>{
  if(mode==='uploaded-newest'||mode==='uploaded-oldest'){const x=Date.parse(a.discovered),y=Date.parse(b.discovered);if(!Number.isFinite(x))return Number.isFinite(y)?1:names(a,b);if(!Number.isFinite(y))return -1;return (mode==='uploaded-oldest'?x-y:y-x)||names(a,b);}
  if(mode==='name')return names(a,b)||dates(a,b);
  if(mode==='oldest')return dates(a,b,true)||names(a,b);
  if(mode==='rare'||mode==='common'){
   const rank=value=>value===(mode==='rare'?'稀有':'常见')?0:value==='未知'?2:1;
   const difference=rank(normalizeRarity(a.rarity))-rank(normalizeRarity(b.rarity));if(difference)return difference;
  }
  if(mode==='protection'){const difference=protectionRank(a)-protectionRank(b);if(difference)return difference;}
  return dates(a,b)||names(a,b);
 });
}
