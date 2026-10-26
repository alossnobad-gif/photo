import {useEffect,useRef,useState} from 'react';
import {createPreviewPool} from './preview-pool';
const requests=createPreviewPool(4),focusedRequests=createPreviewPool(1);
export function useCloudPreview(id,{lazy=false,priority='low'}={}){
 const ref=useRef(null),[visible,setVisible]=useState(!lazy),[attempt,setAttempt]=useState(0),[state,setState]=useState({id,src:'',failed:false});
 useEffect(()=>{if(!lazy||visible)return;if(!globalThis.IntersectionObserver){setVisible(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'160px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[id,lazy,visible]);
 useEffect(()=>{if(!visible)return;const controller=new AbortController();let active=true,url;setState({id,src:'',failed:false});
  const endpoint='/api/baidu/preview/'+encodeURIComponent(id)+(priority==='high'?'?focus=1':'');(priority==='high'?focusedRequests:requests).acquire(endpoint,async signal=>{const response=await fetch(endpoint,{signal:AbortSignal.any([signal,AbortSignal.timeout(70000)]),cache:'default',priority});if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('No preview');return response.blob();},{signal:controller.signal,priority}).then(blob=>{if(active){url=URL.createObjectURL(blob);setState({id,src:url,failed:false});}},()=>{if(active)setState({id,src:'',failed:true});});
  return()=>{active=false;controller.abort();if(url)URL.revokeObjectURL(url);};
 },[id,visible,attempt,priority]);
 return {ref,src:state.id===id?state.src:'',failed:state.id===id&&state.failed,retry:()=>{setState({id,src:'',failed:false});setAttempt(value=>value+1);}};
}
