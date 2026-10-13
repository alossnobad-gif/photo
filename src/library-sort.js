export function sortLibrary(items,order='uploaded-newest'){
 return [...items].sort((a,b)=>{const x=Date.parse(a.created),y=Date.parse(b.created);if(!Number.isFinite(x))return Number.isFinite(y)?1:0;if(!Number.isFinite(y))return -1;return order==='uploaded-oldest'?x-y:y-x;});
}
export function uploadTime(item){const time=Date.parse(item.created);return Number.isFinite(time)?new Date(time).toLocaleString('zh-CN',{hour12:false}):'未记录';}
