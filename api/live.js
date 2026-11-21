// Endpoint Vercel para Twitch (credenciais apenas no servidor)
const json=(res,status,body,ttl=60)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',`public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);return res.status(status).json(body)};
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
 const clientId=process.env.TWITCH_CLIENT_ID,secret=process.env.TWITCH_CLIENT_SECRET;
 if(!clientId||!secret)return json(res,200,{configured:false,live:null,message:'Twitch ainda não configurada'},30);
 try{
  const oauth=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:secret,grant_type:'client_credentials'}),signal:AbortSignal.timeout(8000)});
  if(!oauth.ok)throw new Error('oauth '+oauth.status);
  const t=await oauth.json();
  if(!t.access_token)throw new Error('missing token');
  const u=new URL('https://api.twitch.tv/helix/streams');u.searchParams.set('user_login',process.env.TWITCH_LOGIN||'lordjon_pt');
  const streams=await fetch(u,{headers:{'Client-ID':clientId,'Authorization':'Bearer '+t.access_token},signal:AbortSignal.timeout(8000)});
  if(!streams.ok)throw new Error('helix '+streams.status);
  const body=await streams.json(),x=body.data?.[0];
  return json(res,200,{configured:true,live:!!x,title:x?.title||'',game:x?.game_name||'',viewerCount:typeof x?.viewer_count==='number'?x.viewer_count:null,startedAt:x?.started_at||null,thumbnail:x?.thumbnail_url?.replace('{width}','640').replace('{height}','360')||null,url:'https://www.twitch.tv/lordjon_pt'},60);
 }catch(e){console.error('Twitch endpoint failure:',String(e?.message||e));return json(res,503,{configured:false,live:null,message:'Estado da Twitch indisponível'},10)}
}
