import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function createSettings(directory, environment = process.env) {
  const filename = path.join(directory, 'recognition-settings.json');
  let saved = {};
  try { saved = JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  let queue = Promise.resolve();
  const current = () => ({apiKey:saved.apiKey || environment.DASHSCOPE_API_KEY || '',model:saved.model || environment.QWEN_MODEL || 'qwen-vl-plus'});
  const status = () => ({recognition:!!current().apiKey,provider:'千问',model:current().model});
  function update(input) {
    const task = queue.then(async () => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('无效设置');
      if (input.apiKey !== undefined && typeof input.apiKey !== 'string') throw new Error('密钥格式不正确');
      const apiKey = (input.apiKey || '').trim();
      if (apiKey && (apiKey.length > 512 || !/^[A-Za-z0-9_-]+$/.test(apiKey))) throw new Error('请粘贴完整密钥，不要包含空格');
      const model = String(input.model || current().model).trim();
      if (!/^[A-Za-z0-9_.-]{1,100}$/.test(model)) throw new Error('模型名称格式不正确');
      const next = {...saved,model};
      if (apiKey) next.apiKey = apiKey;
      if (!apiKey && !current().apiKey) throw new Error('请先填写千问 API Key');
      const temporary = filename + '.' + randomUUID() + '.tmp';
      try {
        await fs.writeFile(temporary, JSON.stringify(next), {mode:0o600,flag:'wx'});
        await fs.rename(temporary, filename);
        saved = next;
      } finally { await fs.rm(temporary, {force:true}); }
      return status();
    });
    queue = task.catch(() => {});
    return task;
  }
  return {current,status,update};
}
