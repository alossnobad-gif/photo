import {loadShareImage} from './share-image.js';
export async function createSharePoster(items,stats,{title='我的自然图鉴',cover=null}={}){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#f7f3e9';ctx.fillRect(0,0,1080,1440);ctx.strokeStyle='#aa8b51';ctx.lineWidth=2;ctx.strokeRect(28,28,1024,1384);
 const text=(value,x,y,size,color='#203e30',font='serif')=>{ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.fillText(value,x,y);};
 text(title,65,125,title.length>12?44:60);text('每一次发现，都值得被珍藏。',68,183,25,'#927a4d');
 ctx.fillStyle='#203e30';ctx.fillRect(64,225,952,174);text(String(stats.total),91,326,76,'#f7f3e9');text('本次分享物种',91,370,24,'#ddd3b7');
 text(`常见  ${stats.common}`,440,291,30,'#f7f3e9');text(`稀有  ${stats.rare}`,440,343,30,'#f7f3e9');text(`未知  ${stats.unknown}`,750,291,30,'#f7f3e9');
 const selected=items.slice(0,cover?3:6);
 // Load small, cached previews sequentially to avoid competing with gallery traffic.
 const images=[];for(const item of selected)images.push(await loadShareImage(item));
 const draw=(img,x,y,width,height)=>{const scale=Math.max(width/img.width,height/img.height);ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.drawImage(img,x+(width-img.width*scale)/2,y+(height-img.height*scale)/2,img.width*scale,img.height*scale);ctx.restore();};
 if(cover){const image=await loadShareImage(cover);draw(image,64,430,952,310);}
 for(let i=0;i<(cover?3:6);i++){const x=64+(i%3)*324,y=cover?785:442+Math.floor(i/3)*326;ctx.fillStyle='#e7e6d8';ctx.fillRect(x,y,304,230);const img=images[i];if(img)draw(img,x,y,304,230);else text('下一次发现',x+65,y+126,23,'#979b84');if(selected[i]){let name=selected[i].name;ctx.font='28px serif';while(name.length&&ctx.measureText(name).width>290)name=name.slice(0,-1);text(name+(name!==selected[i].name?'…':''),x,y+270,28);text(selected[i].category,x,y+300,20,'#8c917f');}}
 text('本次分享 / 个人目标',64,1150,28);text(`${stats.total} / ${stats.goal} 种 · ${stats.progress}%`,680,1150,28);
 ctx.fillStyle='#dedbca';ctx.fillRect(64,1175,952,12);ctx.fillStyle='#aa8b51';ctx.fillRect(64,1175,952*stats.progress/100,12);
 text(`已记录国家一级 ${stats.firstClass} 种 · 国家二级 ${stats.secondClass} 种`,64,1255,28);text('稀有度为个人观测参考，不代表保护等级。',64,1300,21,'#909480');
 text(new Date().toLocaleDateString('zh-CN'),64,1370,22,'#909480');text('自然图鉴 · 我的探索记录',685,1370,22,'#909480');
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片生成失败')),'image/png'));
}
