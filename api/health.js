export default async function handler(req,res){
  return res.status(200).json({ ok:true, service:"ONE AI", timestamp:new Date().toISOString() });
}
