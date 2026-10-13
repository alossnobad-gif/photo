export function photoPreview(photo){
 return typeof photo==='string'&&/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(photo)
  ?'/api/photo-preview/'+photo.slice('/photos/'.length):photo;
}
