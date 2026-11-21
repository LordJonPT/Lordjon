// Endpoint sem segredos: ajuda a diagnosticar configuração de produção
export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 res.setHeader('Cache-Control','no-store');
 return res.status(200).json({
  service:'LORDJON',
  integrations:{
   twitch:Boolean(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET),
   youtube:Boolean(process.env.YOUTUBE_API_KEY),
   database:Boolean(process.env.SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)),
   admin:Boolean(process.env.LORDJON_ADMIN_TOKEN&&process.env.LORDJON_ADMIN_TOKEN.length>=32)
  },
  checkoutEnabled:false,pointsRedemptionEnabled:false
 });
}
