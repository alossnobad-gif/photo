import test from 'node:test';import assert from 'node:assert/strict';import {libraryRequest} from '../src/library-request.js';
test('hung library requests terminate, including stalled JSON bodies, and a subsequent retry succeeds',async()=>{
 const original=globalThis.fetch;try{globalThis.fetch=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));await assert.rejects(libraryRequest('/api/library',{timeoutMs:10}),/图库加载超时/);
 globalThis.fetch=async(url,{signal})=>({ok:true,json:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))});await assert.rejects(libraryRequest('/api/library',{timeoutMs:10}),/图库加载超时/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{id:'a'}]})});assert.equal((await libraryRequest('/api/library')).items[0].id,'a');
 }finally{globalThis.fetch=original;}
});
