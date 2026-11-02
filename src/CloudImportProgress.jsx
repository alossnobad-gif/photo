import React,{useEffect,useRef,useState} from 'react';
import {libraryRequest as request} from './library-request';

export function useCloudImportJobs(active){
 const [jobs,setJobs]=useState([]),[error,setError]=useState('');
 const refreshRef=useRef(null),latest=useRef([]),revision=useRef(0);
 function accept(result){revision.current++;latest.current=result.jobs;setJobs(result.jobs);setError(result.error||'');refreshRef.current?.();}
 useEffect(()=>{
  if(!active)return;
  let disposed=false,timer,inFlight=false;const controller=new AbortController();
  function schedule(delay){clearTimeout(timer);timer=setTimeout(()=>document.hidden?schedule(15000):refresh(),delay);}
  async function refresh(){
   if(inFlight)return;inFlight=true;const version=revision.current;
   try{const result=await request('/api/baidu/import-jobs',{signal:controller.signal});if(!disposed&&version===revision.current){latest.current=result.jobs;setJobs(result.jobs);setError(result.error||'');}}
   catch(e){if(!disposed&&version===revision.current)setError(e.message);}
   finally{inFlight=false;if(!disposed)schedule(latest.current.some(job=>['queued','processing'].includes(job.status))?2000:15000);}
  }
  refreshRef.current=refresh;refresh();
  return()=>{disposed=true;refreshRef.current=null;controller.abort();clearTimeout(timer);};
 },[active]);
 async function refresh(){await refreshRef.current?.();}
 async function retry(id){try{accept(await request('/api/baidu/import-jobs/'+encodeURIComponent(id)+'/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',timeoutMs:20000}));}catch(e){setError(e.message);}}
 return {jobs,error,refresh,retry,accept};
}
export default function CloudImportProgress({state}){
 const {jobs,error,refresh,retry}=state;const [retrying,setRetrying]=useState(null);const pending=jobs.filter(job=>['queued','processing'].includes(job.status)).length,failed=jobs.filter(job=>job.status==='failed').length,completed=jobs.filter(job=>job.status==='completed').length;
 if(!jobs.length&&!error)return null;
 return <div className="cloud-import-progress"><details><summary>网盘后台导入 · {pending} 张处理中 · {completed} 张完成{failed?` · ${failed} 张失败`:''}</summary><p className="muted">可以继续选片、关闭窗口或切换页面，服务器会继续导入。成功后在图库查看；仅保留最近 200 条结束记录。</p><button type="button" onClick={refresh}>刷新导入进度</button><ul>{jobs.map(job=><li key={job.id}><span title={job.name}>{job.name}</span><b>{job.status==='queued'?'排队中':job.status==='processing'?'下载与处理…':job.status==='failed'?'导入失败':job.duplicate?'图库已存在':'已导入'}</b>{job.error?<small className="error">{job.error}</small>:null}{job.status==='failed'?<button type="button" disabled={retrying!==null} onClick={async()=>{setRetrying(job.id);try{await retry(job.id);}finally{setRetrying(null);}}}>{retrying===job.id?'正在提交…':'重试导入'}</button>:null}</li>)}</ul></details>{error?<p role="alert" className="error">网盘导入提示：{error}<button type="button" onClick={refresh}>重试读取</button></p>:null}</div>;
}
