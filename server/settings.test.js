import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createSettings} from './settings.js';
test('settings persist, remain private in status, preserve blank key and override environment', async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nature-settings-'));
 try{
 const store=await createSettings(dir,{});
 assert.equal(store.status().recognition,false);
 await assert.rejects(store.update({model:'qwen-vl-plus'}));
 await store.update({apiKey:' test-key ',model:'qwen-vl-plus'});
 assert.equal(store.current().apiKey,'test-key');
 assert.equal(JSON.stringify(store.status()).includes('test-key'),false);
 assert.equal((await fs.stat(path.join(dir,'recognition-settings.json'))).mode&0o777,0o600);
 await store.update({apiKey:'',model:'qwen-vl-max'});
 const restored=await createSettings(dir,{DASHSCOPE_API_KEY:'other-key'});
 assert.equal(restored.current().apiKey,'test-key');assert.equal(restored.current().model,'qwen-vl-max');
 await assert.rejects(store.update({apiKey:'bad key'}));
 assert.equal(store.current().apiKey,'test-key');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
