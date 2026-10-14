export function normalizeEquipment(input){
 const result={};if(!input||typeof input!=='object')return result;
 for(const key of ['make','model','lens'])if(typeof input[key]==='string'){const value=input[key].replace(/[\x00-\x1f]/g,'').trim().slice(0,100);if(value)result[key]=value;}
 for(const [key,max] of [['aperture',128],['exposure',3600],['iso',10_000_000],['focalLength',10000]])if(Number.isFinite(input[key])&&input[key]>0&&input[key]<=max)result[key]=input[key];
 return result;
}
export function equipmentFromExif(first,details){return normalizeEquipment({make:first[0x010f],model:first[0x0110],lens:details[0xa434],aperture:details[0x829d],exposure:details[0x829a],iso:details[0x8827],focalLength:details[0x920a]});}
export function equipmentLines(input){const e=normalizeEquipment(input),camera=[e.make,e.model].filter(Boolean).join(' ').replace(/^(SONY) SONY /i,'$1 '),numbers=[e.focalLength?`${Number(e.focalLength.toFixed(1))}mm`:'',e.aperture?`f/${Number(e.aperture.toFixed(1))}`:'',e.exposure?(e.exposure<1?`1/${Math.round(1/e.exposure)}s`:`${Number(e.exposure.toFixed(1))}s`):'',e.iso?`ISO ${Math.round(e.iso)}`:''].filter(Boolean).join(' · ');return {camera,lens:e.lens||'',numbers};}
