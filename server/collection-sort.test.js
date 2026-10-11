import test from 'node:test';
import assert from 'node:assert/strict';
import {sortCollection,validCollectionSort} from '../src/collection-sort.js';
const items=[
 {id:'a',name:'白鹭',rarity:'常见',protection:'国家二级',discovered:'2026-01-02'},
 {id:'b',name:'长尾鸭',rarity:'稀有',protection:'三有动物',discovered:'2026-01-01'},
 {id:'c',name:'卷羽鹈鹕',rarity:'稀有',protection:'国家一级',discovered:'2026-01-03'},
 {id:'d',name:'未确认',rarity:'未知',protection:'未核实',discovered:'2026-01-04'},
 {id:'e',name:'历史记录',rarity:'少见',protection:'未列入保护名录',discovered:'bad-date'},
];
const ids=(mode,data=items)=>sortCollection(data,mode).map(x=>x.id);
test('sorts rarity and protection independently, keeps unknowns last and does not mutate data',()=>{
 assert.deepEqual(ids('rare'),['c','b','e','a','d']);assert.deepEqual(ids('common'),['a','c','b','e','d']);assert.deepEqual(ids('protection'),['c','a','b','e','d']);assert.deepEqual(items.map(x=>x.id),['a','b','c','d','e']);
});
test('sorts discovery dates, puts invalid dates last, handles ties, filtering and stored invalid settings',()=>{
 assert.deepEqual(ids('newest'),['d','c','a','b','e']);assert.deepEqual(ids('oldest'),['b','a','c','d','e']);assert.equal(validCollectionSort('bad'),'newest');assert.deepEqual(ids('bad'),ids('newest'));
 assert.deepEqual(ids('rare',items.filter(x=>x.protection==='国家二级')),['a']);assert.deepEqual(sortCollection([],'name'),[]);
 assert.deepEqual(ids('name',[{...items[2],name:'C'},{...items[0],name:'A'},{...items[1],name:'B'}]),['a','b','c']);
 assert.deepEqual(ids('rare',[{...items[0],discovered:'2026-01-01',rarity:'稀有'},items[1]]),['a','b']);
});
