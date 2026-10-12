import test from 'node:test';import assert from 'node:assert/strict';
import {repairFilename} from './photo-filename.js';
test('repairs UTF-8 multipart names losslessly and preserves valid multilingual filenames',()=>{
 for(const name of ['2月13日·黄河水库.jpg','西安 夜景.ARW','鸟类🐦.jpg','café.jpg']){
  const broken=Buffer.from(name,'utf8').toString('latin1');
  assert.equal(repairFilename(broken),name);
  assert.equal(repairFilename(name),name);
  assert.equal(repairFilename(repairFilename(broken)),name);
 }
 assert.equal(repairFilename(undefined),undefined);
 assert.equal(repairFilename('camera.jpg'),'camera.jpg');
});
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import express from 'express';import {mountPhotoLibrary} from './photo-library.js';
test('repairs existing library names with backup and leaves photo references intact',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'filename-repair-'));
 try{
  const name='黄河水库.jpg',broken=Buffer.from(name).toString('latin1');
  const rows=[{id:'a',name:broken,sourceName:broken,photo:'/photos/aaa.jpeg'},{id:'b',name:'正常中文.jpg',photo:'/photos/bbb.jpeg'}];
  const original=JSON.stringify(rows);await fs.writeFile(path.join(dir,'library.json'),original);
  await mountPhotoLibrary(express(),dir);
  const repaired=JSON.parse(await fs.readFile(path.join(dir,'library.json'),'utf8'));
  assert.equal(repaired[0].name,name);assert.equal(repaired[0].sourceName,name);assert.equal(repaired[0].photo,rows[0].photo);assert.deepEqual(repaired[1],rows[1]);
  const backups=(await fs.readdir(dir)).filter(x=>x.includes('.names-backup-'));
  assert.equal(backups.length,1);assert.equal(await fs.readFile(path.join(dir,backups[0]),'utf8'),original);
  await mountPhotoLibrary(express(),dir);
  assert.equal((await fs.readdir(dir)).filter(x=>x.includes('.names-backup-')).length,1);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
