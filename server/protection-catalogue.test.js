import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCatalogue,lookupProtection} from './protection-catalogue.js';
import {normalizeRecognitionResult} from './recognition-result.js';
test('national list overrides incorrect model and historical classifications',()=>{
 const duck={name:'长尾鸭',latin:' CLANGULA   HYEMALIS ',protection:'三有动物',uncertain:false};
 assert.equal(normalizeRecognitionResult(duck).protection,'三有动物');
 assert.equal(applyCatalogue(duck).protection,'三有动物');
 assert.equal(applyCatalogue({...duck,name:'卷羽鹈鹕',latin:'Pelecanus crispus'}).protection,'国家一级');
 assert.equal(applyCatalogue(duck).protectionMethod,'catalogue-candidate');
});
test('uncertain identification and unmatched or contradictory taxa are not guesses',()=>{
 assert.equal(normalizeRecognitionResult({name:'长尾鸭',latin:'Clangula hyemalis',uncertain:true,protection:'国家一级'}).protection,'未核实');
 assert.equal(normalizeRecognitionResult({name:'未知鸟',latin:'Unknown bird',uncertain:false,protection:'三有动物'}).protection,'未核实');
 assert.equal(lookupProtection({name:'绿头鸭',latin:'Clangula hyemalis'}),null);
 assert.equal(lookupProtection({name:'长尾鸭',latin:'Clangula hyemalis unknown'}),null);
});
test('manual unmatched entries remain editable without accepting forged provenance',()=>{
 const result=applyCatalogue({name:'其他物种',latin:'Other species',protection:'三有动物',protectionSource:'官方实时核验',protectionMethod:'catalogue'});
 assert.equal(result.protection,'三有动物');assert.equal(result.protectionMethod,'manual');assert.match(result.protectionSource,/需对照/);
});
