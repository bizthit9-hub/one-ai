export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {type,prompt}=req.body||{};
    if(!prompt||typeof prompt!=="string"||!prompt.trim()) return res.status(400).json({error:"Prompt is required."});

    if(type==="image"){
      if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY is not configured."});
      const r=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
        },
        body:JSON.stringify({
          model:process.env.OPENAI_IMAGE_MODEL||"gpt-5.6",
          input:prompt.trim(),
          tools:[{
            type:"image_generation",
            quality:"auto",
            size:"auto",
            output_format:"png"
          }]
        })
      });
      const data=await r.json();
      if(!r.ok) return res.status(r.status).json({error:data?.error?.message||"Image generation failed."});
      const image=data.output?.find(x=>x.type==="image_generation_call" && x.result)?.result;
      if(!image) return res.status(502).json({error:"Image generation returned no image data."});
      return res.status(200).json({
        job:{id:"img_"+Date.now(),type:"image",status:"completed",createdAt:new Date().toISOString()},
        image:{mimeType:"image/png",base64:image}
      });
    }

    // Real provider hooks for video/voice/avatar/editor/dubbing should be connected here.
    return res.status(202).json({
      job:{
        id:"job_"+Date.now(),
        type:type||"creative",
        status:"queued",
        prompt:prompt.trim(),
        createdAt:new Date().toISOString()
      },
      message:"Queued. Configure the corresponding real provider credentials to execute this job."
    });
  }catch(e){
    console.error(e);
    return res.status(500).json({error:"Server error."});
  }
}
