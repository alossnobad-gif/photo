// Shared by browser and server: bounded in-flight work, subscriber-aware cancellation.
export function createPreviewPool(limit=2){
 const entries=new Map(),waiting=[];let active=0;
 const cancelled=()=>new DOMException('Preview cancelled','AbortError');
 function pump(){while(active<limit&&waiting.length){const entry=waiting.shift();if(entry.controller.signal.aborted)continue;entry.state='running';active++;const signal=entry.controller.signal;
  let stop;const work=Promise.resolve().then(()=>{signal.throwIfAborted();return entry.work(signal);});
  const aborted=new Promise((resolve,reject)=>{stop=()=>reject(signal.reason||cancelled());signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();});
  Promise.race([work,aborted]).then(value=>{entry.state='done';entry.resolve(value);},error=>{entry.state='done';entry.reject(error);}).finally(()=>{signal.removeEventListener('abort',stop);active--;if(entries.get(entry.key)===entry)entries.delete(entry.key);pump();});
 }}
 function acquire(key,work,{signal,priority='low'}={}){
  if(signal?.aborted)return Promise.reject(signal.reason||cancelled());
  let entry=entries.get(key);if(!entry||entry.controller.signal.aborted){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});entry={key,work,promise,resolve,reject,controller:new AbortController(),users:0,state:'waiting'};entries.set(key,entry);priority==='high'?waiting.unshift(entry):waiting.push(entry);}
  else if(priority==='high'&&entry.state==='waiting'){const index=waiting.indexOf(entry);if(index>=0){waiting.splice(index,1);waiting.unshift(entry);}}
  entry.users++;
  const result=new Promise((resolve,reject)=>{
   let done=false;
   function finish(fn,value){if(done)return;done=true;signal?.removeEventListener('abort',abort);entry.users--;fn(value);if(entry.users===0&&entry.state!=='done'){entry.controller.abort(cancelled());if(entry.state==='waiting'){const index=waiting.indexOf(entry);if(index>=0)waiting.splice(index,1);entry.state='done';entry.reject(cancelled());if(entries.get(key)===entry)entries.delete(key);}}}
   function abort(){finish(reject,signal.reason||cancelled());}
   signal?.addEventListener('abort',abort,{once:true});entry.promise.then(value=>finish(resolve,value),error=>finish(reject,error));if(signal?.aborted)abort();
  });pump();return result;
 }
 function cancelAll(){for(const entry of entries.values()){entry.controller.abort(cancelled());if(entry.state==='waiting'){entry.state='done';entry.reject(cancelled());}}waiting.length=0;entries.clear();}
 return {acquire,cancelAll};
}
