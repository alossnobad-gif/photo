import {sortCollection} from './collection-sort.js';
export function selectShareItems(items,{category='全部',rarity='全部',protection='全部',query='',sort='uploaded-newest',ids=null}={}){
 const selected=ids===null?null:new Set(ids),needle=query.trim().toLowerCase();
 return sortCollection(items.filter(item=>(category==='全部'||item.category===category)&&(rarity==='全部'||item.rarity===rarity)&&(protection==='全部'||item.protection===protection)&&(!needle||`${item.name} ${item.latin}`.toLowerCase().includes(needle))&&(!selected||selected.has(item.id))),sort);
}
