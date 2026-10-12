// Run on the application server. Never print the API key or provider response body.
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {providerUrls} from '../server/settings.js';
const settings=JSON.parse(await fs.readFile('.data/recognition-settings.json','utf8'));
const base=providerUrls[settings.platform||'dashscope'];
console.log('平台:',settings.platform||'dashscope','模型:',settings.model);
const probe=spawnSync('curl',['-4','-sS','-o','/dev/null','--connect-timeout','10','--max-time','20','-w','DNS=%{time_namelookup}s TCP=%{time_connect}s TLS=%{time_appconnect}s 首响应=%{time_starttransfer}s HTTP=%{http_code}\n',base+'/models'],{encoding:'utf8'});
console.log(probe.stdout.trim());if(probe.status!==0)console.log('网络探测失败，curl 退出码:',probe.status);
console.log('以下为同一模型的最短文字调用（会消耗少量额度，不能代替图片速度测试）。');
const start=performance.now();let phase='等待模型响应';
try{const response=await fetch(base+'/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${settings.apiKey||process.env.DASHSCOPE_API_KEY||''}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),body:JSON.stringify({model:settings.model,messages:[{role:'user',content:'只回答：好'}],max_tokens:16})});console.log('HTTP:',response.status,'收到响应:',Math.round(performance.now()-start),'ms');phase='读取结果';await response.text();console.log('总耗时:',Math.round(performance.now()-start),'ms');}catch(e){console.log('失败阶段:',phase,'耗时:',Math.round(performance.now()-start),'ms','代码:',e.cause?.code||e.name);}
