// Multipart header parameters may arrive as Latin-1 even when browsers send UTF-8.
// Only reverse a lossless, valid UTF-8 byte sequence; preserve already-correct names.
export function repairFilename(value) {
 if(typeof value!=='string'||!/[\u0080-\u00ff]/.test(value)||[...value].some(c=>c.codePointAt(0)>255))return value;
 try {
  const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(value,'latin1'));
  return decoded!==value?decoded:value;
 }catch{return value;}
}
