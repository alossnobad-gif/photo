import test from 'node:test';import assert from 'node:assert/strict';import express from 'express';import {mountRecognitionQueue} from './recognition-queue.js';
test('loopback HTTPS proxy permits same-origin queue writes and rejects foreign origins',async()=>{
 const app=express();app.set('trust proxy','loopback');app.use(express.json());mountRecognitionQueue(app,{list:()=>[],stop:async()=>({stopped:[]})});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port+'/api/recognition-queue/stop-all';
 try{for(const [origin,status] of [['https://127.0.0.1:'+server.address().port,200],['https://evil.example',403]]){const response=await fetch(url,{method:'POST',headers:{'X-Forwarded-Proto':'https',Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,status);}}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
