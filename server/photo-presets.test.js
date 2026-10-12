import test from 'node:test';import assert from 'node:assert/strict';import {photoPresets,composePhotoAdjustments} from '../src/photo-presets.js';import {neutralAdjustments,adjustPixels} from '../src/photo-adjustments.js';
test('filter strength zero preserves original and manual edits remain independent of strength',()=>{
 for(const p of photoPresets)assert.deepEqual(composePhotoAdjustments(p.id,0),neutralAdjustments);
 assert.equal(composePhotoAdjustments('sunset',50,{temperature:5}).temperature,15);
 assert.equal(composePhotoAdjustments('sunset',100,{temperature:95}).temperature,100);
 assert.deepEqual(composePhotoAdjustments('missing',100),neutralAdjustments);
});
test('all filters change pixels, monochrome removes colour and alpha survives',()=>{
 for(const p of photoPresets.slice(1)){const image={width:2,height:1,data:new Uint8ClampedArray([60,95,130,128,200,100,30,255])};const original=image.data.slice();adjustPixels(image,composePhotoAdjustments(p.id,100));assert.notDeepEqual(image.data,original,p.id);assert.equal(image.data[3],128);assert.equal(image.data[7],255);if(p.id==='mono'){assert.equal(image.data[0],image.data[1]);assert.equal(image.data[1],image.data[2]);}}
});
