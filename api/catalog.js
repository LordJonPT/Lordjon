// Catálogo público LORDJON. Só expõe artigos publicados.
const send=(res,status,data,ttl=120)=>{res.setHeader('Cache-Control',`public, s-maxage=${ttl}`);return res.status(status).json(data)};
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'method_not_allowed'});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return send(res,200,{configured:false,products:[],promotions:[],message:'Loja em preparação'},30);
 try{
  const hdr={'apikey':key};
  if(!key.startsWith('sb_secret_'))hdr.Authorization='Bearer '+key;
  const base=url.replace(/\/$/,'')+'/rest/v1/';
  const [ps,os]=await Promise.all([
   fetch(base+'lordjon_products?select=id,name,description,category,points_cost,price_eur_cents,image_url,stock&status=eq.published&order=created_at.desc&limit=24',{headers:hdr,signal:AbortSignal.timeout(8000)}),
   fetch(base+'lordjon_promotions?select=id,brand,headline,details,banner_url,target_url,starts_at,ends_at&active=eq.true&order=created_at.desc&limit=12',{headers:hdr,signal:AbortSignal.timeout(8000)})
  ]);
  if(!ps.ok||!os.ok)throw new Error('supabase '+ps.status+' / '+os.status);
  const now=new Date(),offers=(await os.json()).filter(x=>(!x.starts_at||new Date(x.starts_at)<=now)&&(!x.ends_at||new Date(x.ends_at)>=now));
  return send(res,200,{configured:true,products:await ps.json(),promotions:offers},120);
 }catch(e){console.error('Catalog failure:',String(e?.message||e));return send(res,503,{configured:false,products:[],promotions:[],message:'Catálogo indisponível'},15)}
}