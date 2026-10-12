// Recognition belongs to a particular rendered photo, not its original file.
export function libraryStatuses(items, species, landscapes, jobs) {
 const saved={species:new Set(species.map(x=>x.photo)),landscape:new Set(landscapes.map(x=>x.photo))};
 return items.map(item=>({...item,recognition:Object.fromEntries(['species','landscape'].map(kind=>{
  const job=[...jobs].reverse().find(x=>x.photo===item.photo&&(x.kind||'species')===kind);
  const status=saved[kind].has(item.photo)?'saved':!job?'unsubmitted':['queued','processing','saving','confirming'].includes(job.status)?'active':job.status==='completed'?'recognized':job.status;
  return [kind,{status,jobId:job?.id}];
 }))}));
}
