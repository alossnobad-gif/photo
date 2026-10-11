import sharp from 'sharp';
// Read bounded EXIF IFD values only; corrupt or absent metadata is optional.
export async function photoMetadata(buffer){
 try{
  const exif=(await sharp(buffer).metadata()).exif;if(!exif)return {};
  const b=exif.subarray(exif.subarray(0,6).toString()==='Exif\0\0'?6:0);
  const little=b.toString('ascii',0,2)==='II';if(!little&&b.toString('ascii',0,2)!=='MM')return {};
  const u16=p=>little?b.readUInt16LE(p):b.readUInt16BE(p),u32=p=>little?b.readUInt32LE(p):b.readUInt32BE(p);
  if(u16(2)!==42)return {};
  function directory(offset){const count=u16(offset);if(count>200||offset+2+count*12>b.length)throw Error();const result={};for(let i=0;i<count;i++){const p=offset+2+i*12,tag=u16(p),type=u16(p+2),n=u32(p+4),size=({1:1,2:1,3:2,4:4,5:8})[type];if(!size||n>1024)continue;const start=n*size<=4?p+8:u32(p+8);if(start+n*size>b.length)continue;if(type===2)result[tag]=b.toString('ascii',start,start+n).replace(/\0.*$/,'');if(type===4&&n===1)result[tag]=u32(start);if(type===5&&n===3)result[tag]=Array.from({length:3},(_,j)=>u32(start+j*8)/u32(start+j*8+4));}return result;}
  const first=directory(u32(4)),details=first[0x8769]?directory(first[0x8769]):{},gps=first[0x8825]?directory(first[0x8825]):{},result={};
  const date=details[0x9003];if(typeof date==='string'&&/^\d{4}:\d{2}:\d{2}/.test(date)){const value=date.slice(0,10).replaceAll(':','-');if(Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value)result.takenAt=value;}
  if(Array.isArray(gps[2])&&Array.isArray(gps[4])&&['N','S'].includes(gps[1])&&['E','W'].includes(gps[3])){const decimal=a=>a[0]+a[1]/60+a[2]/3600,latitude=decimal(gps[2])*(gps[1]==='S'?-1:1),longitude=decimal(gps[4])*(gps[3]==='W'?-1:1);if(Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180)result.gps={latitude,longitude};}
  return result;
 }catch{return {};}
}
