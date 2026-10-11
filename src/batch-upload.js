export function validateBatchFile(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))return '仅支持 JPG、PNG、WebP';if(file.size>50*1024*1024)return '单张照片不能超过 50 MB';if(!file.size)return '照片文件为空';return '';}
export async function submitBatchPhoto(entry,kind,request,onUploaded){
 let uploaded=entry.uploaded;
 if(!uploaded){const body=new FormData();body.append('photo',entry.file);uploaded=await request('/api/upload',{method:'POST',body});onUploaded(uploaded);}
 return request('/api/recognition-queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...uploaded,kind})});
}
