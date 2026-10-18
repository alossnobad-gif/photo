export const landscapeSortOptions=[['newest','最新拍摄'],['oldest','最早拍摄']];
export const validLandscapeSort=value=>value==='oldest'?'oldest':'newest';
const captureTime=item=>{const time=Date.parse(item.takenAt);return Number.isFinite(time)?time:null;};
export function sortLandscapes(items,order='newest'){
 const oldest=validLandscapeSort(order)==='oldest';
 return [...items].sort((a,b)=>{const x=captureTime(a),y=captureTime(b);if(x===null)return y===null?0:1;if(y===null)return -1;return oldest?x-y:y-x;});
}
