export default async function handler(req,res){
  if(req.method==="GET") return res.status(200).json({projects:[]});
  if(req.method==="POST"){
    const {name,type="creative"}=req.body||{};
    if(!name) return res.status(400).json({error:"Project name is required."});
    return res.status(201).json({project:{id:"project_"+Date.now(),name,type,createdAt:new Date().toISOString()}});
  }
  return res.status(405).json({error:"Method not allowed"});
}
