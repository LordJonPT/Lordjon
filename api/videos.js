// Endpoint Vercel para os últimos vídeos do YouTube
const json=(res,status,body,ttl=900)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',`public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);return res.status(status).json(body)};
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
 const key=process.env.YOUTUBE_API_KEY;
 if(!key)return json(res,200,{configured:false,videos:[],message:'YouTube API ainda não configurada'},60);
 try {
  const c=new URL('https://www.googleapis.com/youtube/v3/channels');
  c.searchParams.set('part','contentDetails'); c.searchParams.set('forHandle',(process.env.YOUTUBE_HANDLE||'lordjon_pt').replace(/^@/,''));
  c.searchParams.set('key',key);
  const r=await fetch(c,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('channels '+r.status);
  const channel=await r.json();const uploads=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if(!uploads)throw new Error('uploads not found');
  const p=new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  p.searchParams.set('part','snippet,contentDetails');p.searchParams.set('playlistId',uploads);p.searchParams.set('maxResults','12');p.searchParams.set('key',key);
  const response=await fetch(p,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('playlist '+response.status);
  const data=await response.json();
  const videos=(data.items||[]).filter(v=>!['Private video','Deleted video'].includes(v.snippet?.title))
   .map(v=>({id:v.contentDetails?.videoId||v.snippet?.resourceId?.videoId,title:v.snippet?.title||'Vídeo LORDJON',publishedAt:v.contentDetails?.videoPublishedAt||v.snippet?.publishedAt}))
   .filter(v=>/^[A-Za-z0-9_-]{11}$/.test(v.id)).slice(0,3);
  return json(res,200,{configured:true,videos},900);
 }catch(e){console.error('YouTube endpoint failure:',String(e?.message||e));return json(res,503,{configured:false,videos:[],message:'Não foi possível consultar o YouTube'},15)}
}
