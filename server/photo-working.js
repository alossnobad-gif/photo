import sharp from 'sharp';
export const workingPhotoPolicy='jpg-4096-q90-v1';
export const workingPhotoEdge=4096;
export function workingJpeg(input,{failOn='error'}={}){return sharp(input,{limitInputPixels:80_000_000,failOn}).rotate().resize({width:workingPhotoEdge,height:workingPhotoEdge,fit:'inside',withoutEnlargement:true}).jpeg({quality:90});}
