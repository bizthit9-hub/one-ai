export default async function handler(req,res){
  // Replace with database-backed usage once authentication/database is connected.
  return res.status(200).json({credits:24,videoGenerations:8,storageBytes:0,plan:"free"});
}
