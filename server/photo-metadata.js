import fs from 'node:fs/promises';
import {localPhotoMetadata} from '../src/local-photo.js';
// Use bounded TIFF/EXIF parsing for JPEG, PNG, WebP, TIFF and compatible RAW headers.
export async function photoMetadata(buffer){return localPhotoMetadata(new Blob([buffer]));}
export async function photoFileMetadata(file){const handle=await fs.open(file,'r');try{const buffer=Buffer.alloc(1024*1024);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);return photoMetadata(buffer.subarray(0,bytesRead));}finally{await handle.close();}}
