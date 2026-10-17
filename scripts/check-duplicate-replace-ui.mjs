// Build first. Real API and isolated .data; no user photos or model calls.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import sharp from 'sharp';
for(const width of [1440,390]){
 const dir=await fs.mkdtemp('/tmp/duplicate-review-'),project=process.cwd();
 await fs.symlink(path.join(project,'dist'),dir+'/dist');await fs.mkdir(dir+'/.data/photos',{recursive:true});
 for(const [name,color] of [['aaa','#668855'],['bbb','#557788'],['ccc','#aa8866']])await sharp({create:{width:400,height:600,channels:3,background:color}}).jpeg().toFile(dir+'/.data/photos/'+name+'.jpeg');
 const original={id:'original',key:'ardea cinerea',name:'苍鹭',latin:'Ardea cinerea',category:'鸟类',photo:'/photos/aaa.jpeg',discovered:'2020-01-02T00:00:00.000Z',takenAt:'2020-01-01'};
 await fs.writeFile(dir+'/.data/collection.json',JSON.stringify([original]));
 await fs.writeFile(dir+'/.data/recognition-queue.json',JSON.stringify([{id:'review',kind:'species',status:'review',photo:'/photos/bbb.jpeg',fields:{takenAt:'2023-02-06'},result:{...original,confidence:.95,uncertain:false},error:'该物种已在图鉴中，请确认是否替换照片'}]));
 const child=spawn(process.execPath,[path.join(project,'server/index.js')],{cwd:dir,env:{...process.env,PORT:'3370',NODE_ENV:'production',DASHSCOPE_API_KEY:''},stdio:'ignore'});let browser;
 try{
  for(let i=0;i<60;i++){try{await fetch('http://localhost:3370/api/status');break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width,height:1000}});await page.goto('http://localhost:3370');await page.getByRole('button',{name:/^识别队列/}).click();await page.getByRole('button',{name:'查看并确认',exact:true}).click();
  let dialog=page.getByRole('dialog',{name:'选择图鉴照片'});await dialog.getByAltText('原有物种照片').waitFor();await dialog.getByAltText('本次物种照片').waitFor();assert.equal(await dialog.getByRole('checkbox').count(),0);
  await dialog.getByRole('button',{name:'暂不替换',exact:true}).click();assert.equal((await (await fetch('http://localhost:3370/api/collection')).json())[0].photo,original.photo);
  await page.getByRole('button',{name:'查看并确认',exact:true}).click();dialog=page.getByRole('dialog',{name:'选择图鉴照片'});await dialog.getByAltText('原有物种照片').waitFor();
  const changed=await page.request.post('http://localhost:3370/api/collection',{data:{...original,photo:'/photos/ccc.jpeg',replace:true}});assert.equal(changed.status(),200);
  await dialog.getByRole('button',{name:'替换为本次照片',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'原有照片已更新'}).waitFor();assert.match(await dialog.getByAltText('原有物种照片').getAttribute('src'),/ccc/);
  await dialog.getByRole('button',{name:'替换为本次照片',exact:true}).click();await dialog.waitFor({state:'hidden'});
  const collection=await (await fetch('http://localhost:3370/api/collection')).json();assert.equal(collection.length,1);assert.equal(collection[0].photo,'/photos/bbb.jpeg');assert.equal(collection[0].id,original.id);assert.equal(collection[0].discovered,original.discovered);assert.equal(collection[0].takenAt,'2023-02-06');
  const jobs=JSON.parse(await fs.readFile(dir+'/.data/recognition-queue.json'));assert.equal(jobs[0].status,'completed');assert.equal(jobs[0].duplicate,null);await fs.access(dir+'/.data/photos/aaa.jpeg');
  console.log('Legacy duplicate comparison, cancel, stale conflict and replacement preserved identity/date at '+width);
 }finally{await browser?.close();child.kill();await new Promise(r=>child.once('exit',r));await fs.rm(dir,{recursive:true,force:true});}
}
