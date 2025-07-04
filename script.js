const statusEl = document.getElementById('status');
const ctx = document.getElementById('tideChart').getContext('2d');
let chart;

// Draw vertical guide
Chart.register({
  id: 'guide',
  afterDraw(c) {
    if (c.tooltip?.getActiveElements()?.length) {
      const { ctx } = c;
      const x = c.tooltip.getActiveElements()[0].element.x;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, c.chartArea.top);
      ctx.lineTo(x, c.chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e0e1dd88';
      ctx.stroke();
      ctx.restore();
    }
  }
});

function draw(labels, heights) {
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: heights,
        borderWidth: 2,
        tension: 0.4   // smooth wave
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: { ticks: { color: '#e0e1dd' }, grid: { color: '#415a77' } },
        y: { ticks: { color: '#e0e1dd' }, grid: { color: '#415a77' } }
      },
      tooltip: {
        callbacks: { label: c => `${c.raw} m` }
      }
    }
  });
}

function fetchTide(lat, lon) {
  const key = 'YOUR_API_KEY';   // replace before pushing live
  const url = `https://www.worldtides.info/api/v3?heights&lat=${lat}&lon=${lon}&key=${key}`;
  fetch(url)
    .then(r => r.json())
    .then(j => {
      if (!j.heights) throw new Error('No tide data');
      const labels = j.heights.map(h => new Date(h.dt * 1000).toLocaleString());
      const heights = j.heights.map(h => +h.height.toFixed(2));
      statusEl.textContent = '';
      draw(labels, heights);
    })
    .catch(e => {
      statusEl.textContent = 'Tide API error';
      console.error(e);
    });
}

// Locate user, fallback to Valparaíso if blocked
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    p => {
      const { latitude, longitude } = p.coords;
      statusEl.textContent = `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`;
      fetchTide(latitude, longitude);
    },
    () => {
      statusEl.textContent = 'Using Valparaíso';
      fetchTide(-33.0463, -71.6127);
    }
  );
} else {
  statusEl.textContent = 'Geolocation unsupported';
  fetchTide(-33.0463, -71.6127);
}