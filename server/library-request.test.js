import test from 'node:test';import assert from 'node:assert/strict';import {libraryRequest} from '../src/library-request.js';
test('hung library requests terminate, including stalled JSON bodies, and a subsequent retry succeeds',async()=>{
 const original=globalThis.fetch;try{globalThis.fetch=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));await assert.rejects(libraryRequest('/api/library',{timeoutMs:10}),/图库加载超时/);
 globalThis.fetch=async(url,{signal})=>({ok:true,json:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))});await assert.rejects(libraryRequest('/api/library',{timeoutMs:10}),/图库加载超时/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{id:'a'}]})});assert.equal((await libraryRequest('/api/library')).items[0].id,'a');
 }finally{globalThis.fetch=original;}
});
test('shared requests preserve conflict status and use the correct album timeout message',async()=>{
 const original=globalThis.fetch;try{globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:'重复记录',duplicate:true})});await assert.rejects(libraryRequest('/api/collection',{method:'POST'}),error=>error.status===409&&error.data.duplicate===true);
 globalThis.fetch=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));await assert.rejects(libraryRequest('/api/landscapes',{timeoutMs:10}),/风光相册加载超时/);
 }finally{globalThis.fetch=original;}
});
