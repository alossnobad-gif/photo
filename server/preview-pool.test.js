import test from 'node:test';import assert from 'node:assert/strict';import {createPreviewPool} from '../src/preview-pool.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('preview pool cancels old active and queued jobs, prioritizes new work and bounds concurrency',async()=>{
 const pool=createPreviewPool(1),a=new AbortController(),b=new AbortController();let started=[],release;
 const first=pool.acquire('a',signal=>{started.push('a');return new Promise(resolve=>{release=resolve;});},{signal:a.signal});first.catch(()=>{});await tick();
 const obsolete=pool.acquire('b',()=>{started.push('b');},{signal:b.signal});obsolete.catch(()=>{});b.abort();await assert.rejects(obsolete,{name:'AbortError'});a.abort();await assert.rejects(first,{name:'AbortError'});
 assert.equal(await pool.acquire('c',()=>{started.push('c');return 'new';}),'new');assert.deepEqual(started,['a','c']);release('late');await tick();assert.equal(await pool.acquire('c',()=>42),42);
});
test('shared preview keeps upstream work while one viewer remains and cancels only the last subscriber',async()=>{
 const pool=createPreviewPool(1),a=new AbortController(),b=new AbortController();let calls=0,signal,release;
 const work=s=>{calls++;signal=s;return new Promise(resolve=>{release=resolve;});};
 const first=pool.acquire('same',work,{signal:a.signal});first.catch(()=>{});const second=pool.acquire('same',work,{signal:b.signal});await tick();a.abort();await assert.rejects(first,{name:'AbortError'});assert.equal(signal.aborted,false);release('image');assert.equal(await second,'image');assert.equal(calls,1);
 const last=new AbortController();const pending=pool.acquire('other',s=>{signal=s;return new Promise(()=>{});},{signal:last.signal});pending.catch(()=>{});await tick();last.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(signal.aborted,true);
});
test('pool clear releases slots and rejects waiting work; high priority overtakes queued thumbnails',async()=>{
 const pool=createPreviewPool(1);let release;const first=pool.acquire('a',()=>new Promise(resolve=>{release=resolve;}));const order=[];await tick();const low=pool.acquire('low',()=>order.push('low'));const high=pool.acquire('high',()=>order.push('high'),{priority:'high'});release();await Promise.all([first,low,high]);assert.deepEqual(order,['high','low']);
 const stuck=pool.acquire('stuck',()=>new Promise(()=>{}));stuck.catch(()=>{});const queued=pool.acquire('queued',()=>assert.fail('old queued work ran'));queued.catch(()=>{});await tick();pool.cancelAll();await Promise.all([assert.rejects(stuck,{name:'AbortError'}),assert.rejects(queued,{name:'AbortError'})]);assert.equal(await pool.acquire('fresh',()=>true),true);
});
