const statusEl=document.getElementById('status');
const ctx=document.getElementById('tideChart').getContext('2d');
const form=document.getElementById('spotForm');
const input=document.getElementById('spotInput');
let chart;

/* línea vertical */
Chart.register({
  id:'crosshair',
  afterDraw(c){
    const act=c.tooltip?.getActiveElements?.()[0];
    if(!act)return;
    const x=act.element.x,{top,bottom}=c.chartArea;
    c.ctx.save();
    c.ctx.strokeStyle='#e0e1dd88';
    c.ctx.beginPath();c.ctx.moveTo(x,top);c.ctx.lineTo(x,bottom);c.ctx.stroke();
    c.ctx.restore();
  }
});

function render(labels,heights){
  if(chart)chart.destroy();
  chart=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{data:heights,borderWidth:2,tension:.4,fill:{target:'origin',below:'#1b263b55'}}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{intersect:false,mode:'index',callbacks:{label:c=>`${(+c.raw).toFixed(1)} m | ${c.label}`}}
      },
      interaction:{intersect:false,mode:'index'},
      scales:{
        x:{ticks:{callback:v=>v.toString().padStart(2,'0')+' h',color:'#e0e1dd'},grid:{color:'#415a77'}},
        y:{position:'right',beginAtZero:true,ticks:{callback:v=>(+v).toFixed(1),color:'#e0e1dd'},grid:{color:'#415a77'}}
      }
    }
  });
}

function demo(){
  const now=Date.now(),labels=[],heights=[];
  for(let h=0;h<24;h++){
    const t=new Date(now+h*3600e3);
    labels.push(t.getHours().toString().padStart(2,'0'));
    heights.push((Math.sin(h/24*Math.PI*2)+1.05).toFixed(2));
  }
  statusEl.textContent='Datos demo por falta de API';
  render(labels,heights);
}


async function geocode(name){
  const url=`https://geocoding-api.open-meteo.com/v1/search?format=json&count=1&language=es&name=${encodeURIComponent(name)}`;
  const r=await fetch(url);
  const j=await r.json();
  if(j.results?.length)return j.results[0];
  throw new Error('lugar no encontrado');
}

async function goSpot(name){
  try{
    statusEl.textContent='Buscando…';
    const p=await geocode(name);
    statusEl.textContent=`${p.name}, ${p.country}`;
    fetchTide(p.latitude,p.longitude);
  }catch(e){statusEl.textContent='No se encontró el lugar';console.error(e);demo();}
}

/* geolocaliza al cargar */
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(
    p=>{statusEl.textContent=`Lat ${p.coords.latitude.toFixed(2)}, Lon ${p.coords.longitude.toFixed(2)}`;fetchTide(p.coords.latitude,p.coords.longitude);},
    ()=>{statusEl.textContent='Valparaíso por defecto';fetchTide(-33.0463,-71.6127);}
  );
}else{
  statusEl.textContent='Valparaíso por defecto';
  fetchTide(-33.0463,-71.6127);
}

/* eventos */
form.addEventListener('submit',e=>{e.preventDefault();const n=input.value.trim();if(n)goSpot(n);});
input.addEventListener('change',()=>{const n=input.value.trim();if(n)goSpot(n);});
