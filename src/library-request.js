export async function libraryRequest(url,options={}){
 const {timeoutMs=(options.method&&options.method!=='GET'?180000:15000),signal,...requestOptions}=options;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(url,{...requestOptions,signal:signal?AbortSignal.any([signal,controller.signal]):controller.signal,cache:'no-store'});
  let result;try{result=await response.json();}catch(e){if(controller.signal.aborted||signal?.aborted)throw e;throw Error('服务器未返回完整结果，请重试');}
  if(!response.ok)throw Error(result.error||'操作失败');return result;
 }catch(e){if(controller.signal.aborted)throw Error(requestOptions.method&&requestOptions.method!=='GET'?'操作响应超时，请重新加载图库确认结果后再操作':'图库加载超时，请重试；已加载的照片仍保留显示');throw e;}finally{clearTimeout(timer);}
}
