export function summarizeCollection(items,goal=100){
 const byCategory=Object.fromEntries(['鸟类','动物','植物','昆虫','菌类'].map(c=>[c,0]));
 let common=0,rare=0,unknown=0,firstClass=0,secondClass=0;
 for(const item of items){if(item.category in byCategory)byCategory[item.category]++;if(item.rarity==='常见')common++;else if(['稀有','少见'].includes(item.rarity))rare++;else unknown++;if(item.protection==='国家一级')firstClass++;if(item.protection==='国家二级')secondClass++;}
 return {total:items.length,common,rare,unknown,firstClass,secondClass,byCategory,goal,progress:Math.min(100,Math.round(items.length/goal*100))};
}
