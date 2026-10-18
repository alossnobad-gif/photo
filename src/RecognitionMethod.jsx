import RecognitionHelp from './RecognitionHelp';
import React,{useState} from 'react';
import {parseManualRecognition,manualRecognitionPrompt} from './manual-recognition';
import './recognition-method.css';
export function useRecognitionMethod(){
 const [method,setMethod]=useState(()=>{try{return localStorage.getItem('nature-photo:recognition-method:v1')==='manual'?'manual':'automatic';}catch{return 'automatic';}});
 return [method,value=>{const next=value==='manual'?'manual':'automatic';setMethod(next);try{localStorage.setItem('nature-photo:recognition-method:v1',next);}catch{}}];
}
export default function RecognitionMethod({value,onChange,ready,disabled,batch=false}){const [help,setHelp]=useState(false);return <div className="recognition-method"><label>识别方式<select aria-label="识别方式" disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}><option value="automatic">自动 · 千问识别</option><option value="manual">手动 · 粘贴 JSON</option></select></label><small>{value==='manual'?'不调用千问。照片进入待填写，粘贴外部识别结果后核对入库。':ready?'调用千问，按现有置信度规则处理。':'请先配置千问，或选择手动粘贴。'}{batch?' 本次批量共用此选择，不会逐张询问。':''}</small><button type="button" className="recognition-help-link" onClick={()=>setHelp(value=>!value)}>{help?'收起帮助':'提示词与使用帮助'}</button>{help?<div className="recognition-method-help"><RecognitionHelp/></div>:null}</div>;}
export function ManualRecognitionInput({kind,onApply,disabled=false,initialOpen=false}){
 const [text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[template,setTemplate]=useState(false);
 async function apply(){setError('');setMessage('');setBusy(true);try{const result=parseManualRecognition(text,kind);await onApply(result);setMessage('已填入资料，请核对下方表单后保存。');}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function copy(){const prompt=manualRecognitionPrompt(kind);setTemplate(true);try{await navigator.clipboard.writeText(prompt);setMessage('提示词和 JSON 模板已复制，可发给对话助手。');}catch{setMessage('请在展开的模板中选择文字复制。');}}
 return <details className="manual-recognition" open={initialOpen||undefined}><summary>粘贴外部识别结果（JSON）</summary><p>把照片发给对话助手，复制回复的 JSON 到这里。解析只填充资料，不调用千问；拍摄日期、照片和记录 ID 保持不变。</p><button type="button" disabled={disabled||busy} onClick={copy}>复制识别提示词与模板</button><button type="button" onClick={()=>setTemplate(v=>!v)}>{template?'收起模板':'查看模板'}</button>{template?<textarea aria-label="识别 JSON 模板" onFocus={e=>e.target.select()} readOnly value={manualRecognitionPrompt(kind)}/>:null}<label>识别结果 JSON<textarea aria-label="识别结果 JSON" value={text} maxLength={32000} disabled={disabled||busy} onChange={e=>{setText(e.target.value);setError('');}} placeholder={'粘贴 '+(kind==='landscape'?'风光':'物种')+' JSON，支持 ```json 代码块和中文字段名'}/></label><button type="button" className="primary" disabled={disabled||busy||!text.trim()} onClick={apply}>{busy?'正在解析…':'解析并填入表单'}</button>{error?<p role="alert" className="error">{error}</p>:null}{message?<p role="status">{message}</p>:null}</details>;
}
