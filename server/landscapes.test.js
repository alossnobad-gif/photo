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
 assert.deepEqual(normalizeLandscapeRecognition({title:'落日',tags:['湖泊','假标签','湖泊'],city:'猜测地点'}),{title:'落日',tags:['湖泊']});
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
