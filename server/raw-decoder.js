import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const execute=promisify(execFile),script=fileURLToPath(new URL('../scripts/decode-raw.py',import.meta.url));
const decoderEnvironment=Object.fromEntries(['PATH','LD_LIBRARY_PATH','LANG','LC_ALL','TZ','LIBRAW_LIBRARY_PATH'].filter(key=>process.env[key]!==undefined).map(key=>[key,process.env[key]]));
const options={timeout:120000,maxBuffer:10000,env:{...decoderEnvironment,OMP_NUM_THREADS:'2'}};
export async function rawAvailable(){try{await execute('python3',[script,'--check'],{...options,timeout:5000});return true;}catch{return false;}}
let running=Promise.resolve();
export function decodeRaw(source,destination){const task=running.then(async()=>{try{const {stdout}=await execute('python3',[script,source,destination],options);return JSON.parse(stdout);}catch{throw Error('RAW 显影失败：文件可能损坏、相机格式尚未支持，或超过 8000 万像素。可先导出 JPG 再导入。');}});running=task.catch(()=>{});return task;}
