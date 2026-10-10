import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {buildCatalogue} from '../scripts/build-protection-catalogue.js';
import {lookupProtection,applyCatalogue,catalogueStatus} from './protection-catalogue.js';
import {rematchBirds} from './rematch-collection.js';
test('offline catalogue rebuilds reproducibly, retains all source rows and reports conflicts',async()=>{
 const sources=await Promise.all(['national-animals','beijing-birds'].map(name=>fs.readFile(new URL(`../data/catalogue/${name}.json`,import.meta.url),'utf8').then(JSON.parse)));
 const result=buildCatalogue(sources);const stored=JSON.parse(await fs.readFile(new URL('../data/catalogue/protection-catalogue.json',import.meta.url),'utf8'));assert.deepEqual(result,stored);assert.equal(result.entries.length,1322);assert.equal(result.conflicts.length,21);assert.equal(catalogueStatus().complete,false);
 assert.throws(()=>buildCatalogue([{...sources[0],records:[sources[0].records[0],sources[0].records[0]]}]),/重复/);
});
test('long-tailed duck is a sourced three-you candidate, not the former unsupported national II',()=>{
 const result=lookupProtection({name:'长尾鸭',latin:'Clangula hyemalis',category:'鸟类'});assert.equal(result.protection,'三有动物');assert.equal(result.protectionMethod,'catalogue-candidate');assert.match(result.protectionSourceUrl,/github.com/);
});
test('contradictions, restricted populations and non-species rows never automatically classify',()=>{
 assert.equal(lookupProtection({name:'白枕鹤',latin:'Grus vipio',category:'鸟类'}).protection,'未核实');
 assert.equal(lookupProtection({name:'梅花鹿',latin:'Cervus nippon',category:'动物'}).protection,'未核实');
 assert.equal(lookupProtection({name:'海马属所有种',latin:'Hippocampus spp.'}),null);
 assert.equal(lookupProtection({name:'长尾鸭',latin:'Anas platyrhynchos'}),null);
 assert.equal(lookupProtection({name:'长尾鸭',latin:'Clangula hyemalis',category:'植物'}),null);
});
test('rematching preserves identity, originals, dates, notes and non-birds, and is idempotent',()=>{
 const bird={id:'b',category:'鸟类',name:'长尾鸭',latin:'Clangula hyemalis',protection:'国家二级',photo:'/photos/original.jpeg',discovered:'2020-01-01',updated:'2022-01-01',note:'原备注'};
 const nonBird={id:'p',category:'植物',protection:'国家一级'};
 const result=rematchBirds([bird,nonBird]);assert.equal(result.changed,1);assert.equal(result.items[0].protection,'三有动物');for(const f of ['id','photo','discovered','updated','note'])assert.equal(result.items[0][f],bird[f]);assert.deepEqual(result.items[1],nonBird);assert.equal(rematchBirds(result.items).changed,0);
 const uncertain=rematchBirds([{...bird,name:'未知鸟',latin:'Unknown bird'}]);assert.equal(uncertain.items[0].protection,'未核实');
});
