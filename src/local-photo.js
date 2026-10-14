import {equipmentFromExif} from './camera-equipment.js';
import {validPhotoDate} from './photo-date.js';
// EXIF is read locally before canvas export removes camera metadata.
export async function localPhotoMetadata(file){
 try{const bytes=new Uint8Array(await file.slice(0,1024*1024).arrayBuffer());let base=-1;
 for(let i=0;i<bytes.length-8;i++){if((bytes[i]===73&&bytes[i+1]===73&&bytes[i+2]===42&&bytes[i+3]===0)||(bytes[i]===77&&bytes[i+1]===77&&bytes[i+2]===0&&bytes[i+3]===42)){base=i;break;}}
 if(base<0)return {};const view=new DataView(bytes.buffer,base),little=bytes[base]===73,u16=p=>view.getUint16(p,little),u32=p=>view.getUint32(p,little);
 function directory(offset){const count=u16(offset);if(count>200||offset+2+count*12>view.byteLength)throw Error();const result={};for(let i=0;i<count;i++){const p=offset+2+i*12,tag=u16(p),type=u16(p+2),n=u32(p+4),size=({1:1,2:1,3:2,4:4,5:8})[type];if(!size||n>1024)continue;const start=n*size<=4?p+8:u32(p+8);if(start+n*size>view.byteLength)continue;if(type===2)result[tag]=new TextDecoder().decode(bytes.subarray(base+start,base+start+n)).split('\0')[0];if(type===3&&n===1)result[tag]=u16(start);if(type===4&&n===1)result[tag]=u32(start);if(type===5&&n===1&&u32(start+4))result[tag]=u32(start)/u32(start+4);if(type===5&&n===3)result[tag]=Array.from({length:3},(_,j)=>u32(start+j*8)/u32(start+j*8+4));}return result;}
 const first=directory(u32(4)),details=first[0x8769]?directory(first[0x8769]):{},gps=first[0x8825]?directory(first[0x8825]):{},result={};const equipment=equipmentFromExif(first,details);if(Object.keys(equipment).length)result.equipment=equipment;const date=details[0x9003]?.slice(0,10).replaceAll(':','-');if(validPhotoDate(date))result.takenAt=date;
 if(Array.isArray(gps[2])&&Array.isArray(gps[4])&&['N','S'].includes(gps[1])&&['E','W'].includes(gps[3])){const decimal=a=>a[0]+a[1]/60+a[2]/3600;const latitude=decimal(gps[2])*(gps[1]==='S'?-1:1),longitude=decimal(gps[4])*(gps[3]==='W'?-1:1);if(Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180)result.gps={latitude,longitude};}return result;
 }catch{return {};}
}
