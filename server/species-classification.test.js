import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeClassification} from '../src/species-classification.js';
import {summarizeCollection} from '../src/collection-stats.js';
test('legacy rarity migrates without inventing protection status',()=>{
 const item=normalizeClassification({name:'旧记录',rarity:'少见'});
 assert.equal(item.rarity,'稀有');assert.equal(item.protection,'未核实');
 assert.equal(normalizeClassification({protection:'非法等级'}).protection,'未核实');
});
test('protection levels and observation rarity are counted independently',()=>{
 const stats=summarizeCollection([{rarity:'常见',protection:'国家一级'},{rarity:'稀有',protection:'国家二级'},{rarity:'少见',protection:'未核实'}]);
 assert.equal(stats.common,1);assert.equal(stats.rare,2);assert.equal(stats.firstClass,1);assert.equal(stats.secondClass,1);
});
