export default async function handler(req, res){
  const { lat, lon } = req.query;
  const key = process.env.WORLD_TIDES_KEY;          // define en Vercel
  const url = `https://www.worldtides.info/api/v3?heights&extend=hours&days=1&lat=${lat}&lon=${lon}&key=${key}`;
  try{
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control','s-maxage=300');  // cache cinco minutos
    res.status(200).json(data);
  }catch(err){
    res.status(500).json({ error:'tide proxy error' });
  }
}
