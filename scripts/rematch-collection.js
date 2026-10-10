import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {rematchBirds} from '../server/rematch-collection.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'.data/collection.json');
let original,originalStat;
try{original=await fs.readFile(file);originalStat=await fs.stat(file);}catch(e){if(e.code==='ENOENT'){console.log('没有现有收藏，无需重新匹配。');process.exit(0);}throw e;}
const result=rematchBirds(JSON.parse(original));
console.log(JSON.stringify({birds:result.total,changed:result.changed,matched:result.matched,unverified:result.unverified,mode:process.argv.includes('--apply')?'apply':'dry-run'}));
if(process.argv.includes('--apply')&&result.changed){
 // Run offline with the app stopped, or use the UI API which serializes writes.
 if(!process.argv.includes('--service-stopped'))throw Error('请先停止 nature-photo 服务，并加 --service-stopped；运行中的服务请使用页面重新匹配按钮。');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');const backup=file+'.before-rematch-'+stamp;
 await fs.writeFile(backup,original,{flag:'wx',mode:0o600});
 const current=await fs.readFile(file);if(!current.equals(original))throw Error('收藏在匹配期间发生变化，已停止写入，请重试');
 const temp=file+'.rematch.tmp';await fs.writeFile(temp,JSON.stringify(result.items,null,2),{mode:0o600});const tempStat=await fs.stat(temp);if(tempStat.uid!==originalStat.uid||tempStat.gid!==originalStat.gid)await fs.chown(temp,originalStat.uid,originalStat.gid);await fs.chmod(temp,originalStat.mode&0o777);await fs.rename(temp,file);
 await fs.writeFile(path.join(root,'.data','rematch-report-'+stamp+'.json'),JSON.stringify(result.changes,null,2),{mode:0o600});
 console.log('匹配已保存，原收藏备份及变更报告保存在 .data。');
}
