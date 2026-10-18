import React,{useRef,useState} from 'react';
import {manualRecognitionPrompt} from './manual-recognition';
import './recognition-method.css';
export default function RecognitionHelp(){
 const [kind,setKind]=useState('species'),[message,setMessage]=useState('');const prompt=useRef(null);
 async function copy(){try{await navigator.clipboard.writeText(manualRecognitionPrompt(kind));setMessage('已复制，把提示词和照片一起发给 AI 即可。');}catch{prompt.current?.focus();prompt.current?.select();setMessage('浏览器未允许自动复制，已选中提示词，请按 Ctrl+C 或长按复制。');}}
 return <div className="upload-body recognition-help"><h2>识别帮助</h2><p>自动识别调用千问；手动识别使用你与其他 AI 对话得到的结果，平台不额外调用千问。</p><ol><li>选择物种或风光，复制下方提示词。</li><li>把提示词和照片一起发给 AI，让它返回 JSON。</li><li>平台中选择“手动 · 粘贴 JSON”，提交照片后打开队列中的“粘贴并填写”。</li><li>粘贴回复，点击“解析并填入表单”，核对后入库。</li></ol><label>提示词类型<select aria-label="提示词类型" value={kind} onChange={e=>{setKind(e.target.value);setMessage('');}}><option value="species">物种识别</option><option value="landscape">风光识别</option></select></label><textarea ref={prompt} aria-label="可复制识别提示词" readOnly value={manualRecognitionPrompt(kind)} onFocus={e=>e.target.select()}/><button className="primary" onClick={copy}>复制识别提示词</button>{message?<p role="status">{message}</p>:null}<details><summary>JSON 粘贴说明与批量操作</summary><p>支持纯 JSON、JSON 代码块及常用中文字段名。每次填入当前这一张照片，不会把一份结果套用到所有照片。批量上传或图库批量选择时只选一次识别方式；手动批量提交后在队列逐张粘贴对应结果。</p><p>拍摄日期来自照片信息或你的手工填写，不采用 AI 猜测的日期。保护等级仍按平台名录核对；物种重复时比较新旧照片，风光重复时保留已有记录。</p><p>JSON 只填充名称、介绍、地点等资料，不修改照片地址、ID、首次发现日期或自动覆盖记录。缺少信息可在表单补充，识别结论仍需人工核实。</p></details></div>;
}
