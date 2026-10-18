import test from 'node:test';
import assert from 'node:assert/strict';
import {sortLandscapes,validLandscapeSort} from '../src/landscape-sort.js';
test('landscapes sort by capture date rather than upload, keep unknown last in both directions and do not mutate input',()=>{
 const items=[{id:'missing',takenAt:'',created:'2099-01-01'},{id:'old',takenAt:'2023-02-06',created:'2026-10-18'},{id:'new',takenAt:'2025-06-15',created:'2025-06-15'},{id:'same',takenAt:'2023-02-06'},{id:'invalid',takenAt:'bad'}];
 assert.deepEqual(sortLandscapes(items,'newest').map(x=>x.id),['new','old','same','missing','invalid']);
 assert.deepEqual(sortLandscapes(items,'oldest').map(x=>x.id),['old','same','new','missing','invalid']);
 assert.equal(items[0].id,'missing');assert.equal(validLandscapeSort('unknown'),'newest');
 assert.deepEqual(sortLandscapes(items.filter(x=>x.takenAt>='2024-01-01'&&x.takenAt<='2025-12-31'),'oldest').map(x=>x.id),['new']);
});
