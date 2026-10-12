export const adjustmentControls=[['exposure','曝光',-3,3,.1],['temperature','色温',-100,100,1],['tint','色调',-100,100,1],['contrast','对比度',-100,100,1],['highlights','高光',-100,100,1],['shadows','阴影',-100,100,1],['whites','白色色阶',-100,100,1],['blacks','黑色色阶',-100,100,1],['vibrance','自然饱和度',-100,100,1],['saturation','饱和度',-100,100,1],['clarity','清晰度',-100,100,1]];
export const neutralAdjustments=Object.fromEntries(adjustmentControls.map(([key])=>[key,0]));
const clamp=x=>Math.max(0,Math.min(1,x));
export function adjustPixels(image,settings,radius=5){
 const {data,width,height}=image;if(!Object.values(settings).some(Boolean))return image;
 const exposure=2**(settings.exposure||0),contrast=1+(settings.contrast||0)/125;
 for(let i=0;i<data.length;i+=4){let r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;r=clamp(r+(settings.temperature||0)/100*.12);b=clamp(b-(settings.temperature||0)/100*.12);g=clamp(g+(settings.tint||0)/100*.1);const l=.2126*r+.7152*g+.0722*b;
 const delta=(settings.highlights||0)/100*.3*l*l+(settings.shadows||0)/100*.3*(1-l)**2+(settings.whites||0)/100*.22*l**5+(settings.blacks||0)/100*.22*(1-l)**5;
 r=clamp(((r*exposure+delta)-.5)*contrast+.5);g=clamp(((g*exposure+delta)-.5)*contrast+.5);b=clamp(((b*exposure+delta)-.5)*contrast+.5);
 const gray=.2126*r+.7152*g+.0722*b,chroma=Math.max(r,g,b)-Math.min(r,g,b),sat=Math.max(0,1+(settings.saturation||0)/100+(settings.vibrance||0)/100*(1-chroma)*.8);
 data[i]=255*clamp(gray+(r-gray)*sat);data[i+1]=255*clamp(gray+(g-gray)*sat);data[i+2]=255*clamp(gray+(b-gray)*sat);
 }
 if(settings.clarity){const horizontal=new Float32Array(width*height),blur=new Float32Array(width*height);const lum=(x,y)=>{const i=(y*width+x)*4;return .2126*data[i]+.7152*data[i+1]+.0722*data[i+2];};
 for(let y=0;y<height;y++){let sum=0;for(let x=-radius;x<=radius;x++)sum+=lum(Math.max(0,Math.min(width-1,x)),y);for(let x=0;x<width;x++){horizontal[y*width+x]=sum/(2*radius+1);sum+=lum(Math.min(width-1,x+radius+1),y)-lum(Math.max(0,x-radius),y);}}
 for(let x=0;x<width;x++){let sum=0;for(let y=-radius;y<=radius;y++)sum+=horizontal[Math.max(0,Math.min(height-1,y))*width+x];for(let y=0;y<height;y++){blur[y*width+x]=sum/(2*radius+1);sum+=horizontal[Math.min(height-1,y+radius+1)*width+x]-horizontal[Math.max(0,y-radius)*width+x];}}
 for(let i=0;i<width*height;i++){const delta=(lum(i%width,Math.floor(i/width))-blur[i])*(settings.clarity/100)*1.3;for(let c=0;c<3;c++)data[i*4+c]=Math.max(0,Math.min(255,data[i*4+c]+delta));}
 }return image;
}
export function adjustCanvas(canvas,settings){
 if(!Object.values(settings).some(Boolean))return;const ctx=canvas.getContext('2d',{willReadFrequently:true}),radius=Math.max(2,Math.min(30,Math.round(Math.max(canvas.width,canvas.height)/160)));
 // Halo rows keep local contrast continuous while bounding memory on large photos.
 const source=document.createElement('canvas');source.width=canvas.width;source.height=canvas.height;source.getContext('2d').drawImage(canvas,0,0);
 for(let y=0;y<canvas.height;y+=192){const top=Math.max(0,y-radius),bottom=Math.min(canvas.height,y+192+radius),pixels=source.getContext('2d').getImageData(0,top,canvas.width,bottom-top);adjustPixels(pixels,settings,radius);ctx.putImageData(pixels,0,top,0,y-top,canvas.width,Math.min(192,canvas.height-y));}source.width=source.height=0;
}
