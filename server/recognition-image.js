import sharp from 'sharp';

// Keep native image processing modest on the 2 GB personal server.
sharp.concurrency(1);
sharp.cache({memory:32,files:0,items:20});

export async function prepareRecognitionImage(original, originalMime) {
  const image = sharp(original, {limitInputPixels:80_000_000,failOn:'error'});
  const metadata = await image.metadata();
  const compressed = await image
    .rotate()
    .resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true})
    .flatten({background:'#ffffff'})
    .jpeg({quality:80})
    .toBuffer();

  // A small, efficiently encoded input should not grow just for recognition.
  const needsResize = Math.max(metadata.width || 0, metadata.height || 0) > 1600;
  const needsRotation = metadata.orientation && metadata.orientation !== 1;
  if (!needsResize && !needsRotation && compressed.length >= original.length) {
    return {buffer:original,mime:originalMime,originalBytes:original.length};
  }
  return {buffer:compressed,mime:'image/jpeg',originalBytes:original.length};
}
