export const rarityOptions=['未知','常见','稀有'];
export const protectionOptions=['未核实','国家一级','国家二级','三有动物','地方重点保护','其他保护','未列入保护名录'];
export function normalizeRarity(value){return value==='少见'?'稀有':rarityOptions.includes(value)?value:'未知';}
export function normalizeProtection(value){return protectionOptions.includes(value)?value:'未核实';}
export function normalizeClassification(item){return {...item,rarity:normalizeRarity(item.rarity),protection:normalizeProtection(item.protection)};}
