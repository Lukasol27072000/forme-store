import products from '../products.json' with { type: 'json' };
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({ok:false});}catch{return res.status(403).json({ok:false});}}
 let d;
 try{d=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({ok:false});}
 const limits={orderId:80,productId:30,phoneModel:60,customerName:80,contact:120,city:100,address:250};
 if(!d||Object.entries(limits).some(([k,n])=>typeof d[k]!=='string'||!d[k].trim()||d[k].length>n)||d.consent!==true||!['Telegram','Телефон','Email'].includes(d.contactChannel)||typeof(d.comment??'')!=='string'||(d.comment??'').length>500)return res.status(400).json({ok:false});
 const product=products.find(p=>p.id===d.productId);
 if(!product)return res.status(400).json({ok:false});
 const endpoint=process.env.GOOGLE_ORDERS_ENDPOINT;
 if(!endpoint)return res.status(503).json({ok:false,error:'Приём заявок временно недоступен'});
 const payload={...Object.fromEntries(Object.keys(limits).map(k=>[k,d[k].trim()])),product:product.name,collection:product.category,contactChannel:d.contactChannel,comment:d.comment||'',consent:true,price:1290};
 try{
  const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(25000)});
  const result=await upstream.json();
  if(!upstream.ok||result.ok!==true||result.orderId!==payload.orderId)throw Error('Upstream rejected order');
  return res.status(200).json({ok:true,orderId:result.orderId});
 }catch{console.error('Order delivery failed');return res.status(502).json({ok:false,error:'Не удалось подтвердить получение заявки'});}
}
