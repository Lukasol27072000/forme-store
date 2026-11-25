import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const products=JSON.parse(await fs.readFile('catalog-seed.json','utf8'));
const manifest={};let total=0;
await fs.mkdir('public/catalog/photos',{recursive:true});
for(const product of products){for(const source of product.images){
 const url=new URL(source),params=new URLSearchParams(url.hash.slice(1)),view=params.get('view');if(!view)continue;
 const key=url.pathname+'#'+view,code=crypto.createHash('sha256').update(key).digest('hex').slice(0,12),file=`${code}.webp`;
 const sourcePath=path.join('public',url.pathname),[x,y,w,h,bw,bh]=view.split(',').map(Number),meta=await sharp(sourcePath).metadata();
 const left=Math.max(0,Math.floor(x*meta.width/bw)),top=Math.max(0,Math.floor(y*meta.height/bh));
 const width=Math.min(meta.width-left,Math.round(w*meta.width/bw)),height=Math.min(meta.height-top,Math.round(h*meta.height/bh));
 const output='public/catalog/photos/'+file;
 await sharp(sourcePath).extract({left,top,width,height}).resize({width:560,withoutEnlargement:true}).webp({quality:86,effort:5}).toFile(output);
 manifest[key]='/catalog/photos/'+file;total+=(await fs.stat(output)).size;
 if(product.legacy_id==='1'&&params.get('finish')==='silver')await fs.copyFile(output,'public/catalog/photos/azul-cobalt.webp');
}}
await fs.writeFile('src/photo-manifest.json',JSON.stringify(manifest));
console.log(`Prepared ${Object.keys(manifest).length} existing catalogue photos, ${Math.round(total/1024)} KB total. No imagery generated.`);
