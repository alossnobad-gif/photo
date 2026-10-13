export const landscapeTags=['山川','河流','湖泊','海岸','森林','草原','沙漠','戈壁','日出日落','云雾星空','城市风光','建筑地标','其他'];
export const landscapePlace=item=>item.city||'待整理';
export function landscapeSummary(items){return {photos:items.length,regions:new Set(items.filter(x=>x.city).map(x=>x.city)).size,places:new Set(items.filter(x=>x.location).map(x=>`${x.city}/${x.location}`)).size};}
