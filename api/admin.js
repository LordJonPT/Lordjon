// Painel de editor. API privada: segredo apenas nas variáveis da Vercel.
import { timingSafeEqual } from 'node:crypto';
const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length>0&&x.length===y.length&&timingSafeEqual(x,y)};
const validURL=(s)=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&u.hostname!=='localhost'}catch{return false}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method_not_allowed'});
 const secret=process.env.LORDJON_ADMIN_TOKEN;
 if(!secret||secret.length<32)return res.status(503).json({error:'admin_not_configured'});
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!equal(token,secret))return res.status(401).json({error:'unauthorized'});
 const url=process.env.SUPABASE_URL,apiKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!apiKey)return res.status(503).json({error:'database_not_configured'});
 const headers={'apikey':apiKey,'Content-Type':'application/json'};
 if(!apiKey.startsWith('sb_secret_'))headers.Authorization='Bearer '+apiKey;
 const base=url.replace(/\/$/,'')+'/rest/v1/';
 try{
  if(req.method==='GET'){
   const [p,o]=await Promise.all([fetch(base+'lordjon_products?select=*&order=created_at.desc&limit=100',{headers,signal:AbortSignal.timeout(9000)}),fetch(base+'lordjon_promotions?select=*&order=created_at.desc&limit=100',{headers,signal:AbortSignal.timeout(9000)})]);
   if(!p.ok||!o.ok)throw Error('database_read_failed');
   return res.status(200).json({products:await p.json(),promotions:await o.json()});
  }
  const {kind,data}=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(!['product','promotion'].includes(kind)||!data||typeof data!=='object'||Array.isArray(data))return res.status(400).json({error:'invalid_data'});
  const trimmed=(v,max=200)=>String(v||'').trim().slice(0,max);
  let table,object;
  if(kind==='product'){
   table='lordjon_products';
   const name=trimmed(data.name,90),desc=trimmed(data.description,500),category=data.category, status=data.status;
   if(!name||!['merch','rewards'].includes(category)||!['draft','published'].includes(status))return res.status(400).json({error:'invalid_product'});
   const image=trimmed(data.image_url,1000);
   if(image&&!validURL(image))return res.status(400).json({error:'invalid_image_url'});
   const stock=Number(data.stock),points=Number(data.points_cost),price=Number(data.price_eur_cents);
   if(!Number.isSafeInteger(stock)||stock<0||!Number.isSafeInteger(points)||points<0||!Number.isSafeInteger(price)||price<0)return res.status(400).json({error:'invalid_amount'});
   if(status==='published'&&((category==='rewards'&&points===0)||(category==='merch'&&price===0)))return res.status(400).json({error:'price_required'});
   object={name,description:desc,category,status,stock,points_cost:category==='rewards'?points:null,price_eur_cents:category==='merch'?price:null,image_url:image||null};
  }else{
   table='lordjon_promotions';const brand=trimmed(data.brand,60),headline=trimmed(data.headline,120),target=trimmed(data.target_url,1000),banner=trimmed(data.banner_url,1000);
   if(!brand||!headline||!validURL(target)||(banner&&!validURL(banner)))return res.status(400).json({error:'invalid_promotion'});
   object={brand,headline,details:trimmed(data.details,500),target_url:target,banner_url:banner||null,active:data.active===true,starts_at:data.starts_at||null,ends_at:data.ends_at||null};
  }
  if(data.id){if(!/^[0-9a-f-]{36}$/i.test(data.id))return res.status(400).json({error:'invalid_id'});object.id=data.id}
  const response=await fetch(base+table+'?on_conflict=id',{method:'POST',headers:{...headers,'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(object),signal:AbortSignal.timeout(9000)});
  if(!response.ok){console.error('Admin database write HTTP',response.status);return res.status(502).json({error:'write_failed'})}
  return res.status(200).json({saved:(await response.json())?.[0]||null});
 }catch(e){console.error('Admin failure:',String(e?.message||e));return res.status(502).json({error:'service_unavailable'})}
}
