import test from 'node:test';
import assert from 'node:assert/strict';
import {parseManualRecognition,manualRecognitionPrompt} from '../src/manual-recognition.js';
test('manual JSON accepts code fences and Chinese aliases but cannot overwrite photo, date, identity or replacement flag',()=>{
 const parsed=parseManualRecognition('```json\n'+JSON.stringify({中文名:' 苍鹭 ',学名:'Ardea cinerea',分类:'鸟类',物种介绍:'水边的大型涉禽',photo:'/photos/hacked.jpeg',takenAt:'2099-01-01',id:'hacked',replace:true,confidence:1})+'\n```','species');
 assert.deepEqual(parsed,{name:'苍鹭',latin:'Ardea cinerea',category:'鸟类',description:'水边的大型涉禽'});
 assert.deepEqual(parseManualRecognition({kind:'landscape',result:{标题:'古城',城市:'大同市',题材:['建筑地标','建筑地标']}},'landscape'),{title:'古城',city:'大同市',tags:['建筑地标'],province:'山西'});
});
test('manual parser rejects malformed, ambiguous, wrong-kind, invalid enum and oversized values without partial output',()=>{
 for(const value of ['bad JSON','[]','null','{"name":4}',{kind:'landscape',result:{title:'风景'}},{title:'风景',tags:['山川']},{category:'风景'},{name:'a',中文名:'b'},{name:'x'.repeat(101)},' '.repeat(32001)])assert.throws(()=>parseManualRecognition(value,'species'));
 for(const value of [{tags:'山川'},{tags:['假标签']},{province:'不存在'},{latin:'Ardea cinerea'}])assert.throws(()=>parseManualRecognition(value,'landscape'));
});
test('both help prompts contain parseable matching schemas without AI capture dates or photo paths',()=>{
 for(const kind of ['species','landscape']){const prompt=manualRecognitionPrompt(kind);const sample=JSON.parse(prompt.slice(prompt.indexOf('{')));assert.equal(sample.kind,kind);assert.ok(Object.keys(parseManualRecognition(sample,kind)).length);assert.equal(sample.result.takenAt,undefined);assert.equal(sample.result.photo,undefined);}
});
