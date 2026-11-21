// LORDJON /api/videos — YouTube Data API server-side (sem expor a chave)
const json = (value,status=200)=>new Response(JSON.stringify(value),{
  status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800","Access-Control-Allow-Origin":"*"}
});
export async function GET(){
  const apiKey=process.env.YOUTUBE_API_KEY;
  const handle=process.env.YOUTUBE_HANDLE||"lordjon_pt";
  if(!apiKey) return json({videos:[],configured:false,message:"Configura YOUTUBE_API_KEY na Vercel para ativar os vídeos."},200);
  try{
    const channelURL=new URL("https://www.googleapis.com/youtube/v3/channels");
    channelURL.searchParams.set("part","contentDetails"); channelURL.searchParams.set("forHandle",handle); channelURL.searchParams.set("key",apiKey);
    const ch=await fetch(channelURL,{signal:AbortSignal.timeout(8000)});
    if(!ch.ok) throw new Error("YouTube channels API "+ch.status);
    const channel=await ch.json();const playlist=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if(!playlist) throw new Error("Canal ou playlist de uploads não encontrados");
    const plURL=new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    plURL.searchParams.set("part","snippet,contentDetails");plURL.searchParams.set("playlistId",playlist);
    plURL.searchParams.set("maxResults","8");plURL.searchParams.set("key",apiKey);
    const res=await fetch(plURL,{signal:AbortSignal.timeout(8000)});
    if(!res.ok) throw new Error("YouTube playlist API "+res.status);
    const data=await res.json();
    const videos=(data.items||[]).filter(it=>it.snippet?.title!=="Private video"&&it.snippet?.title!=="Deleted video")
      .map(it=>({id:it.contentDetails?.videoId||it.snippet?.resourceId?.videoId,title:it.snippet?.title||"Vídeo LORDJON",publishedAt:it.contentDetails?.videoPublishedAt||it.snippet?.publishedAt}))
      .filter(v=>/^[a-zA-Z0-9_-]{11}$/.test(v.id)).slice(0,3);
    return json({videos,configured:true});
  }catch(e){return json({videos:[],configured:false,message:"Não foi possível consultar os vídeos. Verifica a chave e o canal."},503)}
}
