window.ONEAI={
 async chat(message,history=[]){
  const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,history})});
  const d=await r.json(); if(!r.ok) throw Error(d.error||"Chat failed"); return d.reply;
 },
 async generate(type,prompt){
  const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,prompt})});
  const d=await r.json(); if(!r.ok) throw Error(d.error||"Generation failed"); return d.job;
 },
 async usage(){const r=await fetch("/api/usage");return r.json()},
 async projects(){const r=await fetch("/api/projects");return r.json()}
};