const municipalities=['北京','天津','上海','重庆'];
export const provinceOptions=['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','台湾','香港','澳门'];
export function normalizeProvince(value=''){const text=String(value).trim().replace(/(?:维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|省|市)$/,'');return provinceOptions.includes(text)?text:'';}
const cityKey=value=>String(value||'').trim().replace(/市$/,'');
export function landscapeProgress(items){const provinces=new Set(),cities=new Set(),landmarks=new Set();let missingProvince=0,missingLocation=0;
 for(const item of items){const city=cityKey(item.city);const province=normalizeProvince(item.province)||(municipalities.includes(city)?city:'');if(province)provinces.add(province);else missingProvince++;if(city)cities.add(city);const location=String(item.location||'').trim();if(location&&(city||province))landmarks.add((city||province)+'|'+location);else missingLocation++;}
 return {photos:items.length,provinces:provinces.size,cities:cities.size,landmarks:landmarks.size,missingProvince,missingLocation};
}
export const defaultTravelGoals={provinces:34,cities:50,landmarks:100};
export function validTravelGoals(value={}){return Object.fromEntries(Object.entries(defaultTravelGoals).map(([key,fallback])=>[key,Number.isInteger(Number(value?.[key]))&&Number(value[key])>=1&&Number(value[key])<=10000?Number(value[key]):fallback]));}
