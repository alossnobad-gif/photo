import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {filenameHint,recognitionFilename,saveUploadFilename} from './recognition-filename.js';
test('meaningful filenames survive while camera counters, paths, extensions and controls are excluded',()=>{
 for(const name of ['DSC01234.JPG','_DSC1234.ARW','IMG_20261012_123456.jpg','12345.jpeg','composition.jpeg','aaabbbcc-1234-1234-abcd-123456789abc.jpeg'])assert.equal(filenameHint(name),'');
 assert.equal(filenameHint('C:\\照片\\长尾鸭.jpg'),'长尾鸭');
 assert.equal(filenameHint('重庆洪崖洞-夜景.JPG'),'重庆洪崖洞-夜景');
 assert.equal(filenameHint(Buffer.from('黄河水库.jpg').toString('latin1')),'黄河水库');
 assert.equal(filenameHint('a'.repeat(300)+'.jpg').length,120);
});
test('direct upload names persist across retries and library names resolve without client metadata',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'recognition-name-'));
 try{
  const photo='/photos/abc.jpeg';
  assert.equal(await recognitionFilename(dir,photo),'');
  await saveUploadFilename(dir,photo,Buffer.from('西安大雁塔.jpg').toString('latin1'));
  assert.equal(await recognitionFilename(dir,photo),'西安大雁塔');
  assert.equal(await recognitionFilename(dir,photo),'西安大雁塔');
  await fs.writeFile(path.join(dir,'library.json'),JSON.stringify([{photo,name:'用户修正的地标.jpg'}]));
  assert.equal(await recognitionFilename(dir,photo),'用户修正的地标');
  assert.equal(await recognitionFilename(dir,'../../secret'),'');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
