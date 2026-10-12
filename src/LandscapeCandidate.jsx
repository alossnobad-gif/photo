import React from 'react';
export default function LandscapeCandidate({candidate,onUse}){
 if(!candidate)return null;
 return <section className="landscape-candidate" aria-label="地点识别候选"><b>地点候选 · 待核实</b><p>{[candidate.city,candidate.location].filter(Boolean).join(' · ')}</p><small>{typeof candidate.confidence==='number'?'地点置信度 '+Math.round(candidate.confidence*100)+' 分':'地点置信度未提供'} · 模型自评</small>{candidate.evidence?.length?<ul>{candidate.evidence.map((text,i)=><li key={i}>{text}</li>)}</ul>:null}{onUse?<button type="button" className="crop-entry" onClick={()=>onUse(candidate)}>填入候选地点</button>:null}<p>候选不会自动写入地点相册，请核实后填写或采用；不确定可以留空。</p></section>;
}
