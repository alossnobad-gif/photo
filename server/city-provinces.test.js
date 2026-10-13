import test from 'node:test';import assert from 'node:assert/strict';import {provinceForCity} from '../src/city-provinces.js';import {normalizeLandscape,normalizePlaceCandidate} from './landscapes.js';
test('known cities fill missing provinces without guessing unknown cities or overriding explicit selections',()=>{
 for(const [city,province] of [['枣庄','山东'],['兰州市','甘肃'],['重庆','重庆'],['西安','陕西'],['阿坝','四川']]){assert.equal(provinceForCity(city),province);assert.equal(normalizePlaceCandidate({city}).province,province);assert.equal(normalizeLandscape({title:'风光',city,tags:[],photo:'/photos/aaa.jpeg'}).province,province);}
 assert.equal(provinceForCity('未知城市'),'');assert.equal(provinceForCity('Paris'),'');
});
