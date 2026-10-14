import {photoPreview} from './photo-preview.js';
export function loadShareImage(item,{timeoutMs=30000,ImageClass=globalThis.Image}={}){
 return new Promise((resolve,reject)=>{
  const image=new ImageClass(),name=item.name||'封面图片';
  const finish=error=>{clearTimeout(timer);image.onload=image.onerror=null;if(error){image.src='';reject(error);}else resolve(image);};
  const timer=setTimeout(()=>finish(Error(`“${name}”加载超时，请稍后重试`)),timeoutMs);
  image.onload=()=>finish();image.onerror=()=>finish(Error(`无法加载“${name}”，请取消该照片或更换封面后重试`));
  image.src=photoPreview(item.photo);
 });
}
