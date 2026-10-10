import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const providerUrls = {dashscope:'https://dashscope.aliyuncs.com/compatible-mode/v1',qianwenai:'https://maas.qianwenaiapi.com/compatible-mode/v1'};
export async function createSettings(directory, environment = process.env) {
  const filename = path.join(directory, 'recognition-settings.json');
  let saved = {};
  try { saved = JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  let queue = Promise.resolve();
  const current = () => {const platform = Object.hasOwn(providerUrls,saved.platform) ? saved.platform : 'dashscope';return {apiKey:saved.apiKey || environment.DASHSCOPE_API_KEY || '',model:saved.model || environment.QWEN_MODEL || 'qwen-vl-plus',platform,baseUrl:providerUrls[platform]};};
  const status = () => ({recognition:!!current().apiKey,provider:current().platform==='qianwenai'?'千问 AI 平台':'阿里云百炼',model:current().model,platform:current().platform,baseUrl:current().baseUrl});
  function update(input) {
    const task = queue.then(async () => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('无效设置');
      if (input.apiKey !== undefined && typeof input.apiKey !== 'string') throw new Error('密钥格式不正确');
      let apiKey = (input.apiKey || '').replace(/[\s\u200B-\u200D\u2060\uFEFF]/gu, '');
      if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) apiKey = apiKey.slice(1, -1);
      if (apiKey.length > 512) throw new Error('内容超过密钥长度，请只复制 API Key，不要复制整段代码');
      if (apiKey && !/^[\x21-\x7E]+$/.test(apiKey)) throw new Error('内容含非英文字符，请只复制 API Key');
      const model = String(input.model || current().model).trim();
      if (!/^[A-Za-z0-9_.-]{1,100}$/.test(model)) throw new Error('模型名称格式不正确');
      const platform = input.platform ?? current().platform;
      if (!Object.hasOwn(providerUrls,platform)) throw new Error('请选择支持的服务平台');
      const next = {...saved,model,platform};
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
