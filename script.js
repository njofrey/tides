const statusEl = document.getElementById('status');
const ctx = document.getElementById('tideChart').getContext('2d');
let chart;

// Cross-hair plugin
Chart.register({
  id: 'crosshair',
  afterDraw(c) {
    const act = c.tooltip?.getActiveElements?.()[0];
    if (act) {
      const x = act.element.x;
      const { top, bottom } = c.chartArea;
      const { ctx } = c;
      ctx.save();
      ctx.strokeStyle = '#e0e1dd88';
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.restore();
    }
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
          callbacks: {
            label: c => `${c.raw} m  –  ${c.label}`
          }
        }
      },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: {
          ticks: { maxRotation: 0, color: '#e0e1dd' },
          grid: { color: '#415a77' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#e0e1dd' },
          grid: { color: '#415a77' }
        }
      }
    }
  });
}

function useMock() {
  const now = Date.now();
  const labels = [];
  const heights = [];
  for (let h = 0; h < 24; h++) {
    const t = new Date(now + h * 3600 * 1000);
    labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    // seno con algo de ruido: solo demo
    const ht = (Math.sin((h / 24) * Math.PI * 2) + 1) + (Math.random() * 0.2 - 0.1);
    heights.push(ht.toFixed(2));
  }
  statusEl.textContent = 'Demo local por falta de datos';
  render(labels, heights);
}

async function fetchTide(lat, lon) {
  const key = '31c253d9-3ea0-4bd0-a2d9-004e8ea98221';
  const url = `https://www.worldtides.info/api/v3?heights&extend=hours&days=1&lat=${lat}&lon=${lon}&key=${key}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.heights) throw new Error('sin heights');
    const labels = json.heights.map(h =>
      new Date(h.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const heights = json.heights.map(h => (+h.height).toFixed(2));
    statusEl.textContent = '';
    render(labels, heights);
  } catch (e) {
    console.error(e);
    useMock();
  }
}

function start(lat, lon, label) {
  statusEl.textContent = label;
  fetchTide(lat, lon);
}

// Geolocalizar
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    p => start(p.coords.latitude, p.coords.longitude,
               `Lat ${p.coords.latitude.toFixed(2)}, Lon ${p.coords.longitude.toFixed(2)}`),
    () => start(-33.0463, -71.6127, 'Valparaíso por defecto')
  );
} else {
  start(-33.0463, -71.6127, 'Valparaíso por defecto');
}
