export function matchesRecognitionStatus(item, filter, kind='all') {
 if(filter==='all')return true;
 const statuses=(kind==='all'?['species','landscape']:[kind]).map(key=>item.recognition?.[key]?.status||'unsubmitted');
 // Never call a photograph unsubmitted if either workflow has a submission.
 return filter==='unsubmitted'?statuses.every(status=>status==='unsubmitted'):statuses.includes(filter);
}
