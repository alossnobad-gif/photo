import test from 'node:test';import assert from 'node:assert/strict';import {recognitionOptions} from './recognition-options.js';
test('visual identification disables expensive default thinking for documented Qianwen models only',()=>{
 for(const model of ['qwen3.8-max','qwen3.8-max-0902','qwen3.8-flash','qwen3.8-27b'])assert.deepEqual(recognitionOptions({platform:'qianwenai',model}),{enable_thinking:false});
 for(const model of ['qwen-vl-plus','qwen3.8-2.4t-a95b','unknown'])assert.deepEqual(recognitionOptions({platform:'qianwenai',model}),{});
 assert.deepEqual(recognitionOptions({platform:'dashscope',model:'qwen3.8-max'}),{});
});
