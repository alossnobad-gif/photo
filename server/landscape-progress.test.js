import test from 'node:test';import assert from 'node:assert/strict';import {landscapeProgress,normalizeProvince,validTravelGoals} from '../src/landscape-progress.js';
test('travel progress deduplicates edited place spelling, ignores candidates and treats municipalities as provinces',()=>{
 const counts=landscapeProgress([{province:'山东省',city:'枣庄市',location:'台儿庄古城'},{province:'山东',city:'枣庄',location:'台儿庄古城'},{city:'重庆市',location:'洪崖洞'},{city:'',location:'',placeCandidate:{city:'北京',location:'故宫'}},{location:'同名景点'}]);
 assert.deepEqual(counts,{photos:5,provinces:2,cities:2,landmarks:2,missingProvince:2,missingLocation:2});assert.equal(normalizeProvince('广西壮族自治区'),'广西');assert.equal(normalizeProvince('海外'), '');assert.deepEqual(validTravelGoals({cities:0,landmarks:'30'}),{provinces:34,cities:50,landmarks:30});
});
