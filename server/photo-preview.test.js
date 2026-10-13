import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import {mountPhotoPreviews} from './photo-preview.js';
import {photoPreview} from '../src/photo-preview.js';

test('list preview is small, cached, refreshes after edits, and leaves original intact',async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'preview-test-'));await fs.mkdir(path.join(data,'photos'));const source=path.join(data,'photos/aaa.jpeg');await sharp({create:{width:3000,height:2000,channels:3,background:'#557788'}}).jpeg({quality:97}).toFile(source);const original=await fs.readFile(source);const app=express();mountPhotoPreviews(app,data);const server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));const url=`http://127.0.0.1:${server.address().port}`;
 try{const [a,b]=await Promise.all([fetch(url+photoPreview('/photos/aaa.jpeg')),fetch(url+photoPreview('/photos/aaa.jpeg'))]);assert.equal(a.status,200);assert.equal(b.status,200);const bytes=Buffer.from(await a.arrayBuffer()),meta=await sharp(bytes).metadata();assert.equal(meta.width,720);assert.ok(bytes.length<original.length);assert.deepEqual(await fs.readFile(source),original);assert.equal((await fs.readdir(path.join(data,'photo-previews'))).length,1);const cachedStatus=await new Promise((resolve,reject)=>{http.get(url+photoPreview('/photos/aaa.jpeg'),{headers:{'If-None-Match':a.headers.get('etag')}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});assert.equal(cachedStatus,304);await sharp({create:{width:3000,height:2000,channels:3,background:'#cc4422'}}).jpeg().toFile(source);const edited=await fetch(url+photoPreview('/photos/aaa.jpeg'));assert.notDeepEqual(Buffer.from(await edited.arrayBuffer()),bytes);assert.equal((await fetch(url+'/api/photo-preview/secret.txt')).status,400);assert.equal((await fetch(url+'/api/photo-preview/bbb.jpeg')).status,404);assert.equal(photoPreview('/external.jpg'),'/external.jpg');console.log(`Preview transfer: ${original.length} -> ${bytes.length} bytes`);
 }finally{await new Promise(r=>server.close(r));await fs.rm(data,{recursive:true,force:true});}
});

test('large API JSON is compressed without changing the decoded response',async()=>{
 const {compressJson}=await import('./json-compression.js');const app=express();app.use(compressJson);const value=Array.from({length:500},(_,i)=>({id:i,name:'风光照片',description:'湖泊与山川'}));app.get('/data',(req,res)=>res.json(value));const server=app.listen(0);await new Promise(r=>server.once('listening',r));try{const url=`http://127.0.0.1:${server.address().port}/data`;const response=await fetch(url,{headers:{'Accept-Encoding':'gzip'}});assert.equal(response.headers.get('content-encoding'),'gzip');assert.deepEqual(await response.json(),value);const plain=await fetch(url,{headers:{'Accept-Encoding':'identity'}});assert.equal(plain.headers.get('content-encoding'),null);assert.deepEqual(await plain.json(),value);}finally{await new Promise(r=>server.close(r));}
});
