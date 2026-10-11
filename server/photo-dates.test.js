import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {backfillPhotoDates} from './backfill-photo-dates.js';
import {validPhotoDate,formatPhotoDate} from '../src/photo-date.js';
import {saveSpecies,editSpecies} from './store.js';
test('photo dates validate leap days and display literal camera date without timezone shifts',()=>{
 assert.equal(validPhotoDate('2024-02-29'),true);assert.equal(validPhotoDate('2025-02-29'),false);assert.equal(validPhotoDate('2026-01-01T00:00:00Z'),false);assert.equal(formatPhotoDate('2024-02-29'),'2024/02/29');assert.equal(formatPhotoDate(''),'拍摄日期未记录');
});
test('backfill reads original EXIF once, backs up bytes, preserves manual dates and collection identity',async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'photo-date-'));await fs.mkdir(path.join(data,'photos'));
 try{const photo=await sharp({create:{width:12,height:12,channels:3,background:'#ffffff'}}).jpeg().withExif({IFD2:{DateTimeOriginal:'2021:07:08 23:30:00'}}).toBuffer();await fs.writeFile(path.join(data,'photos/abc.jpeg'),photo);
 const items=[{id:'1',name:'旧收藏',photo:'/photos/abc.jpeg',discovered:'2026-10-11',updated:'2026-10-11',protection:'国家一级'},{id:'2',photo:'/photos/abc.jpeg',takenAt:'2020-01-02'},{id:'3',photo:'/photos/abc.jpeg',takenAt:''},{id:'4',photo:'/photos/def.jpeg'}];const original=JSON.stringify(items);await fs.writeFile(path.join(data,'collection.json'),original);
 assert.deepEqual(await backfillPhotoDates(data),{checked:2,dated:1,unknown:1});const saved=JSON.parse(await fs.readFile(path.join(data,'collection.json'),'utf8'));assert.deepEqual(saved[0],{...items[0],takenAt:'2021-07-08'});assert.equal(saved[1].takenAt,'2020-01-02');assert.equal(saved[2].takenAt,'');assert.equal(saved[3].takenAt,'');assert.deepEqual(await fs.readFile(path.join(data,'photos/abc.jpeg')),photo);
 const backup=(await fs.readdir(data)).find(x=>x.includes('before-photo-dates'));assert.equal(await fs.readFile(path.join(data,backup),'utf8'),original);assert.deepEqual(await backfillPhotoDates(data),{checked:0,dated:0,unknown:0});assert.equal((await fs.readdir(data)).filter(x=>x.includes('before-photo-dates')).length,1);
 }finally{await fs.rm(data,{recursive:true,force:true});}
});
test('replacement uses new photos capture date while edits retain original discovery identity',()=>{
 const first=saveSpecies([],{name:'白鹭',latin:'Egretta garzetta',photo:'/photos/abc.jpeg',takenAt:'2020-01-01'}).item;const result=saveSpecies([first],{name:first.name,latin:first.latin,photo:'/photos/def.jpeg',takenAt:'2022-02-02'},true).item;assert.equal(result.takenAt,'2022-02-02');assert.equal(result.discovered,first.discovered);assert.equal(result.id,first.id);assert.equal(editSpecies([result],result.id,{name:result.name,latin:result.latin,takenAt:''}).item.takenAt,'');
});
