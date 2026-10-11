import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {cropPhoto} from './photo-crop.js';
import {photoMetadata} from './photo-metadata.js';
test('crop respects oriented bounds, preserves original bytes and capture date',async()=>{
 const bytes=await sharp({create:{width:400,height:300,channels:3,background:'#436452'}}).jpeg().withExif({IFD2:{DateTimeOriginal:'2020:03:04 12:00:00'}}).toBuffer();const original=Buffer.from(bytes);
 const output=await cropPhoto(bytes,{left:40,top:30,width:160,height:200});const meta=await sharp(output).metadata();assert.equal(meta.width,160);assert.equal(meta.height,200);assert.deepEqual(bytes,original);assert.equal((await photoMetadata(output)).takenAt,'2020-03-04');
 await assert.rejects(cropPhoto(bytes,{left:350,top:0,width:100,height:100}));await assert.rejects(cropPhoto(bytes,{left:0,top:0,width:1,height:100}));
});
