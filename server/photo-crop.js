import sharp from 'sharp';
import {photoMetadata} from './photo-metadata.js';
export async function cropPhoto(bytes, crop) {
 const oriented=await sharp(bytes,{limitInputPixels:80_000_000}).rotate().toBuffer();
 const {width,height}=await sharp(oriented).metadata();
 const values=['left','top','width','height'];
 if(!crop||values.some(k=>!Number.isInteger(crop[k]))||crop.left<0||crop.top<0||crop.width<16||crop.height<16||crop.left+crop.width>width||crop.top+crop.height>height)throw new Error('裁切范围无效，请重新选择');
 const metadata=await photoMetadata(bytes);
 let result=sharp(oriented).extract({left:crop.left,top:crop.top,width:crop.width,height:crop.height}).jpeg({quality:95});
 if(metadata.takenAt)result=result.withExif({IFD2:{DateTimeOriginal:metadata.takenAt.replaceAll('-',':')+' 00:00:00'}});
 return result.toBuffer();
}
