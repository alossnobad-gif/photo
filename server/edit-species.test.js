import test from 'node:test';
import assert from 'node:assert/strict';
import {editSpecies} from './store.js';
import {applyCatalogue} from './protection-catalogue.js';
test('editing corrects identity without changing original photo, id or discovery date',()=>{
 const original={id:'a',name:'误识别',latin:'Wrong species',photo:'/photos/original.jpeg',discovered:'2025-01-01',note:'保留备注'};
 const result=editSpecies([original],'a',{name:'卷羽鹈鹕',latin:'Pelecanus crispus',photo:'forged',id:'forged',discovered:'forged'});
 assert.equal(result.item.id,'a');assert.equal(result.item.photo,original.photo);assert.equal(result.item.discovered,original.discovered);assert.equal(result.item.note,original.note);
 assert.equal(editSpecies([original,result.item],'missing',{}).status,404);
 assert.equal(editSpecies([original,{id:'b',latin:'Pelecanus crispus'}],'a',{name:'卷羽鹈鹕',latin:' Pelecanus  crispus '}).status,409);
 assert.equal(editSpecies([original],'a',{name:'',latin:'x'}).status,400);
});
test('explicit manual protection survives reading and catalogue lookup',()=>{
 const manual={name:'卷羽鹈鹕',latin:'Pelecanus crispus',category:'鸟类',protection:'国家二级',protectionMethod:'manual-verified'};
 const result=applyCatalogue(manual);assert.equal(result.protection,'国家二级');assert.equal(result.protectionSource,'用户手动核实');assert.deepEqual(applyCatalogue(result),result);
 assert.equal(applyCatalogue({...manual,protectionMethod:'unverified'}).protection,'国家一级');
});
