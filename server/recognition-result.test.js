import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecognitionResult} from './recognition-result.js';
const species={name:'卷羽鹈鹕',latin:'Pelecanus crispus',uncertain:false,rarity:'稀有',protection:'国家一级'};
test('recognized protection candidate reaches the form without being discarded',()=>assert.equal(normalizeRecognitionResult(species).protection,'国家一级'));
test('uncertain species, missing species and invalid protection remain unverified',()=>{
 for(const changed of [{uncertain:true},{uncertain:undefined},{latin:''},{protection:'IUCN易危'},{protection:undefined}])assert.equal(normalizeRecognitionResult({...species,...changed}).protection,'未核实');
 assert.throws(()=>normalizeRecognitionResult(null));
});
