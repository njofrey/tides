const statusEl = document.getElementById('status');
const ctx      = document.getElementById('tideChart').getContext('2d');
const form     = document.getElementById('spotForm');
const input    = document.getElementById('spotInput');

let chart;

// Línea vertical en el hover
Chart.register({
  id: 'crosshair',
  afterDraw(c) {
    const act = c.tooltip?.getActiveElements?.()[0];
    if (!act) return;
    const x = act.element.x;
    const { top, bottom } = c.chartArea;
    c.ctx.save();
    c.ctx.strokeStyle = '#e0e1dd88';
    c.ctx.beginPath();
    c.ctx.moveTo(x, top);
    c.ctx.lineTo(x, bottom);
    c.ctx.stroke();
    c.ctx.restore();
  }
});

function render(labels, heights) {
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: heights,
        borderWidth: 2,
        tension: 0.4,
        fill: { target: 'origin', below: '#1b263b55' }
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          intersect: false,
          mode: 'index',
          callbacks: { label: c => `${c.raw} m | ${c.label}` }
        }
      },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: { ticks: { color: '#e0e1dd' }, grid: { color: '#415a77' } },
        y: {
          beginAtZero: true,
          ticks: { color: '#e0e1dd' },
          grid: { color: '#415a77' }
        }
      }
    }
  });
}

function demoFallback() {
  const now = Date.now();
  const labels = [];
  const heights = [];
  for (let h = 0; h < 24; h++) {
    const t = new Date(now + h * 3600e3);
    labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    heights.push((Math.sin(h / 24 * Math.PI * 2) + 1.05).toFixed(2));
  }
  statusEl.textContent = 'Datos demo por falta de API';
  render(labels, heights);
}

async function fetchTide(lat, lon) {
  const key = 'TU_API_KEY'; // WorldTides
  const url = `https://www.worldtides.info/api/v3?heights&extend=hours&days=1&lat=${lat}&lon=${lon}&key=${key}`;
  try {
    const res = await fetch(url);
    const j   = await res.json();
    if (!j.heights) throw new Error('sin datos');
    const labels  = j.heights.map(h =>
      new Date(h.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const heights = j.heights.map(h => (+h.height).toFixed(2));
    statusEl.textContent = '';
    render(labels, heights);
  } catch (e) {
    console.error(e);
    demoFallback();
  }
}

async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?format=json&count=1&language=es&name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  const j   = await res.json();
  if (j.results?.length) return j.results[0];
  throw new Error('lugar no encontrado');
}

async function goSpot(name) {
  try {
    statusEl.textContent = 'Buscando…';
    const place = await geocode(name);
    statusEl.textContent = `${place.name}, ${place.country}`;
    fetchTide(place.latitude, place.longitude);
  } catch (e) {
    statusEl.textContent = 'No se encontró el lugar';
    console.error(e);
    demoFallback();
  }
}

// geolocalizar al arranque
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    p => {
      statusEl.textContent = `Lat ${p.coords.latitude.toFixed(2)}, Lon ${p.coords.longitude.toFixed(2)}`;
      fetchTide(p.coords.latitude, p.coords.longitude);
    },
    () => {
      statusEl.textContent = 'Valparaíso por defecto';
      fetchTide(-33.0463, -71.6127);
    }
  );
} else {
  statusEl.textContent = 'Valparaíso por defecto';
  fetchTide(-33.0463, -71.6127);
}

// formulario
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = input.value.trim();
  if (name) goSpot(name);
});
