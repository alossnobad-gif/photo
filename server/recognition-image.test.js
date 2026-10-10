import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {prepareRecognitionImage} from './recognition-image.js';

test('large photo is reduced to 1600 pixels with intact original bytes',async()=>{
 const photo=await readFile(new URL('../public/demo-0.jpg',import.meta.url));
 const original=await sharp(photo).resize(4000,3000,{fit:'fill'}).jpeg({quality:98}).toBuffer();
 const preserved=Buffer.from(original);
 const result=await prepareRecognitionImage(original,'image/jpeg');
 const dimensions=await sharp(result.buffer).metadata();
 assert.equal(dimensions.width,1600);assert.equal(dimensions.height,1200);
 assert.equal(result.mime,'image/jpeg');assert.ok(result.buffer.length<original.length);
 assert.deepEqual(original,preserved);
 console.log(`Photo fixture: ${original.length} -> ${result.buffer.length} bytes`);
});
test('tiny efficiently encoded image does not grow or upscale',async()=>{
 const original=await sharp({create:{width:16,height:8,channels:3,background:'#ffffff'}}).png().toBuffer();
 const result=await prepareRecognitionImage(original,'image/png');
 assert.deepEqual(result.buffer,original);assert.equal(result.mime,'image/png');
 const dimensions=await sharp(result.buffer).metadata();assert.equal(dimensions.width,16);
});
test('EXIF orientation is applied without cropping and metadata removed',async()=>{
 const original=await sharp({create:{width:2000,height:1000,channels:3,background:'#336633'}}).jpeg().withMetadata({orientation:6}).toBuffer();
 const result=await prepareRecognitionImage(original,'image/jpeg');
 const dimensions=await sharp(result.buffer).metadata();
 assert.equal(dimensions.width,800);assert.equal(dimensions.height,1600);
 assert.equal(dimensions.orientation,undefined);
});
test('invalid images are rejected rather than sent as compressed images',async()=>{
 await assert.rejects(prepareRecognitionImage(Buffer.from('invalid'),'image/jpeg'));
});
