import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import {mountLandscapes,normalizeLandscape,normalizeLandscapeRecognition} from './landscapes.js';
import {photoMetadata} from './photo-metadata.js';
import {landscapeSummary} from '../src/landscape-data.js';
const input={title:'湖畔日落',city:'北京',location:'颐和园',tags:['湖泊','日出日落'],photo:'/photos/abc.jpeg',note:'秋日',takenAt:'2026-10-10'};
test('landscape fields validate dates, tags and paths; edits preserve photo and creation identity',()=>{
 const first=normalizeLandscape(input);const edited=normalizeLandscape({...input,title:'新的标题',photo:'/photos/def.jpeg'},first);
 assert.equal(edited.id,first.id);assert.equal(edited.created,first.created);assert.equal(edited.photo,first.photo);
 for(const patch of [{takenAt:'2026-02-30'},{photo:'/photos/../secret'},{tags:['伪造']},{title:''},{gps:{latitude:100,longitude:0}}])assert.throws(()=>normalizeLandscape({...input,...patch}));
 assert.deepEqual(normalizeLandscapeRecognition({title:'落日',tags:['湖泊','假标签','湖泊'],city:'猜测地点'}),{title:'落日',tags:['湖泊'],description:'',shareText:'',placeCandidate:null});
 assert.deepEqual(landscapeSummary([input,input,{...input,city:'',location:''}]),{photos:3,regions:1,places:1});
});
test('landscape API persists multiple photos per city, edits safely, serializes writes and rejects foreign origins',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'landscape-test-'));await fs.mkdir(path.join(dir,'photos'));await fs.writeFile(path.join(dir,'photos/abc.jpeg'),'original');const app=express();app.use(express.json());mountLandscapes(app,dir);app.use((err,req,res,next)=>res.status(500).json({error:err.message}));const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const send=(url,body,headers={},method='POST')=>fetch(base+url,{method,headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 try{
 assert.equal((await send('/api/landscapes',input,{Origin:'https://elsewhere.invalid'})).status,403);
 assert.equal((await send('/api/landscapes',{...input,photo:'/photos/def.jpeg'})).status,400);
 const responses=await Promise.all([send('/api/landscapes',{...input,cover:true}),send('/api/landscapes',{...input,title:'第二张',cover:true})]);assert.ok(responses.every(r=>r.ok));let list=await (await fetch(base+'/api/landscapes')).json();assert.equal(list.length,2);assert.equal(list.filter(x=>x.cover).length,1);
 const edited=await (await send('/api/landscapes/'+list[0].id,{...list[0],city:'阿坝',title:'山间湖泊'}, {},'PUT')).json();assert.equal(edited.item.city,'阿坝');assert.equal(edited.item.created,list[0].created);
 list=JSON.parse(await fs.readFile(path.join(dir,'landscapes.json'),'utf8'));assert.equal(list[0].title,'山间湖泊');assert.equal(await fs.readFile(path.join(dir,'photos/abc.jpeg'),'utf8'),'original');assert.equal((await send('/api/landscapes/missing',input,{},'PUT')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(dir,{recursive:true,force:true});}
});
test('optional EXIF capture date and GPS are read without making up city names',async()=>{
 const buffer=await sharp({create:{width:10,height:10,channels:3,background:'#ffffff'}}).jpeg().withExif({IFD2:{DateTimeOriginal:'2025:08:09 12:00:00'},IFD3:{GPSLatitudeRef:'N',GPSLatitude:'39/1 54/1 0/1',GPSLongitudeRef:'E',GPSLongitude:'116/1 24/1 0/1'}}).toBuffer();const data=await photoMetadata(buffer);assert.equal(data.takenAt,'2025-08-09');assert.equal(data.gps.latitude,39.9);assert.equal(data.gps.longitude,116.4);assert.equal(data.city,undefined);assert.deepEqual(await photoMetadata(Buffer.from('bad image')),{});
});

test('landscape recognition separates location candidates, never trusts model dates or GPS and sanitizes confidence',()=>{
 const result=normalizeLandscapeRecognition({title:'古城暮色',tags:['建筑地标','伪造'],description:'红墙与屋顶',shareText:'今日光影',confidence:.97,city:'自动猜测',takenAt:'2099-01-01',gps:{latitude:0,longitude:0},placeCandidate:{city:'北京',location:'故宫',confidence:.7,evidence:['可见宫殿建筑',42]}});
 assert.equal(result.city,undefined);assert.equal(result.takenAt,undefined);assert.equal(result.gps,undefined);assert.equal(result.placeCandidate.location,'故宫');assert.deepEqual(result.placeCandidate.evidence,['可见宫殿建筑']);assert.deepEqual(result.tags,['建筑地标']);
 assert.equal(normalizeLandscapeRecognition({title:'山景',tags:['山川'],confidence:95,placeCandidate:{city:'',location:'',confidence:1}}).confidence,undefined);
 const saved=normalizeLandscape({...input,...result});assert.equal(saved.description,'红墙与屋顶');assert.equal(saved.shareText,'今日光影');assert.equal(saved.placeCandidate.confidence,.7);assert.equal(saved.takenAt,input.takenAt);
});
test('classification repair removes only the matching landscape record and preserves photos with a backup',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'landscape-repair-'));await fs.mkdir(path.join(dir,'photos'));await fs.writeFile(path.join(dir,'photos/abc.jpeg'),'fixture');const rows=[{id:'a',photo:'/photos/abc.jpeg'},{id:'b',photo:'/photos/def.jpeg'}];await fs.writeFile(path.join(dir,'landscapes.json'),JSON.stringify(rows));
 const save=mountLandscapes(express(),dir);try{await assert.rejects(save.removeMisclassified('a','/photos/wrong.jpeg'));assert.equal(JSON.parse(await fs.readFile(path.join(dir,'landscapes.json'),'utf8')).length,2);await save.removeMisclassified('a','/photos/abc.jpeg');assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir,'landscapes.json'),'utf8')),[rows[1]]);await fs.access(path.join(dir,'photos/abc.jpeg'));assert.ok((await fs.readdir(dir)).some(x=>x.includes('repair-backup')));await save.removeMisclassified('a','/photos/abc.jpeg');}finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('batch delete removes only selected landscape records and preserves photo files',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'landscape-delete-'));const app=express();app.use(express.json());mountLandscapes(app,dir);const server=app.listen(0);await new Promise(r=>server.once('listening',r));const url=`http://127.0.0.1:${server.address().port}/api/landscapes/delete-batch`;
 try{await fs.mkdir(path.join(dir,'photos'));await fs.writeFile(path.join(dir,'photos/a.jpeg'),'photo');await fs.writeFile(path.join(dir,'landscapes.json'),JSON.stringify([{id:'a',photo:'/photos/a.jpeg'},{id:'b'}]));const send=(body,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});assert.equal((await send({ids:['a']},{Origin:'https://other.example'})).status,403);assert.equal((await send({ids:'a'})).status,400);const result=await send({ids:['a','a','missing']});assert.deepEqual(await result.json(),{removed:['a']});assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir,'landscapes.json'),'utf8')),[{id:'b'}]);await fs.access(path.join(dir,'photos/a.jpeg'));assert.deepEqual(await (await send({ids:['a']})).json(),{removed:[]});}finally{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});
