const apiBase = 'https://flight-schedule-optimizer.onrender.com';

// Utility functions
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  element.classList.add('loading');
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  element.classList.remove('loading');
}

function showOutput(elementId, content) {
  const element = document.getElementById(elementId);
  element.style.display = 'block';
  element.textContent = content;
  element.classList.add('fade-in');
}

function showSuccess(message) {
  // You could add a toast notification here
  console.log('Success:', message);
}

function showError(message) {
  console.error('Error:', message);
}

// ---------------- Busiest Slots ----------------
document.getElementById('btnSlots').addEventListener('click', async ()=> {
  const btn = document.getElementById('btnSlots');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading...';
    btn.disabled = true;
    
    const res = await fetch(apiBase + '/busiest_slots?hour_bucket=1&top=12');
    const result = await res.json();
    const labels = result.labels;
    const vals = result.data;
    
    if (!labels || labels.length === 0) { 
      showError("⚠️ No data received from backend!");
      return; 
    }
    
    const canvas = document.getElementById('slotsChart');
    const ctx = canvas.getContext('2d');
    if (window.slotsChart instanceof Chart) { 
      window.slotsChart.destroy(); 
    }
    
    window.slotsChart = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels: labels, 
        datasets: [{ 
          label: 'Number of Flights', 
          data: vals, 
          backgroundColor: 'rgba(34,197,94,0.8)', // green
          borderColor: 'rgba(34,197,94,1)', // green
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }
        }, 
        scales: { 
          x: { 
            ticks: { autoSkip: false },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          }
        } 
      }
    });
    
    showSuccess('Traffic analysis loaded successfully!');
  } catch (err) { 
    showError("Error loading busiest slots");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ---------------- Delay Stats ----------------
document.getElementById('btnStats').addEventListener('click', async ()=>{
  const btn = document.getElementById('btnStats');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';
    btn.disabled = true;
    
    const res = await fetch(apiBase + '/delay_stats');
    const d = await res.json();
    
    const formattedData = JSON.stringify(d, null, 2);
    showOutput('statsPre', formattedData);
    showSuccess('Delay analytics generated!');
  } catch (err) {
    showError('Error generating delay statistics');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ---------------- Optimize Schedule ----------------
document.getElementById('btnOptimize').addEventListener('click', async ()=>{
  const btn = document.getElementById('btnOptimize');
  const output = document.getElementById('optPre');
  const flightId = document.getElementById('optFlight').value.trim();
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="bi bi-gear-fill"></i> Optimizing...';
    btn.disabled = true;
    output.style.display = 'block';
    output.textContent = '🔄 Running optimization algorithm...';
    
    const res = await fetch(apiBase + '/optimize_schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flight_id: flightId || null })
    });
    
    const d = await res.json();
    
    if (!res.ok) { 
      output.textContent = `❌ ${d.error || d.detail || 'Unknown error'}`;
      showError('Optimization failed');
      return; 
    }
    
    const resultText = 
      `✈️ Flight: ${d.flight}\n` +
      `📅 Original Time: ${d.orig_time}\n` +
      `📊 Cascade Score: ${d.orig_score}\n` +
      (d.suggested_shift !== 0
        ? `\n🎯 OPTIMIZATION FOUND:\n` +
          `⏰ Suggested Shift: ${d.suggested_shift > 0 ? '+' : ''}${d.suggested_shift} minutes\n` +
          `🕐 New Time: ${d.suggested_time}\n` +
          `📉 Improved Score: ${d.new_score} (${d.orig_score - d.new_score} reduction)`
        : "\n✅ Current schedule is optimal - no better timing found");
    
    output.textContent = resultText;
    showSuccess('Optimization completed!');
  } catch (err) {
    output.textContent = "⚠️ Error calling optimizer API";
    showError('Optimization request failed');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ---------------- Search Flights ----------------
document.getElementById('btnSearch').addEventListener('click', searchFlights);
document.getElementById('q').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchFlights();
});

async function searchFlights() {
  const btn = document.getElementById('btnSearch');
  const q = document.getElementById('q').value;
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="bi bi-search"></i> Searching...';
    btn.disabled = true;
    
    const res = await fetch(apiBase + '/search_flights?q=' + encodeURIComponent(q) + '&limit=100');
    const data = await res.json();
    const container = document.getElementById('searchRes');
    
    if (data.length === 0) {
      container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No flights found matching your search.</div>';
      return;
    }
    
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th><i class="bi bi-airplane"></i> Flight</th>
              <th><i class="bi bi-building"></i> Airline</th>
              <th><i class="bi bi-geo-alt"></i> Destination</th>
              <th><i class="bi bi-calendar3"></i> Scheduled Departure</th>
              <th><i class="bi bi-clock"></i> Delay (min)</th>
              <th><i class="bi bi-circle-fill"></i> Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r=>`
              <tr class="clickable" data-flight="${r.Flight_ID}">
                <td><strong>${r.Flight_ID}</strong></td>
                <td>${r.Airline}</td>
                <td>${r.Destination}</td>
                <td>${new Date(r.Scheduled_Departure).toLocaleString()}</td>
                <td><span class="badge ${r.Delay_Minutes > 15 ? 'bg-danger' : r.Delay_Minutes > 5 ? 'bg-warning' : 'bg-success'}">${r.Delay_Minutes}</span></td>
                <td><span class="badge ${r.Status === 'On-time' ? 'bg-success' : r.Status === 'Delayed' ? 'bg-warning' : 'bg-danger'}">${r.Status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Make rows clickable
    document.querySelectorAll('#searchRes tr.clickable').forEach(row=>{
      row.addEventListener('click', ()=>{
        const fid = row.getAttribute('data-flight');
        document.getElementById('optFlight').value = fid;
        document.getElementById('optPre').style.display = 'block';
        document.getElementById('optPre').textContent = `✈️ Selected ${fid} — ready to optimize!`;
        
        // Scroll to optimizer
        document.getElementById('optFlight').scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('optFlight').focus();
      });
    });
    
    showSuccess(`Found ${data.length} flights`);
  } catch (err) {
    showError('Search request failed');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ---------------- Cascade Flights ----------------
document.getElementById('btnCascade').addEventListener('click', async ()=>{
  const btn = document.getElementById('btnCascade');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Analyzing...';
    btn.disabled = true;
    
    const res = await fetch(apiBase + '/top_cascade_flights?window_min=120&top=10');
    const data = await res.json();
    const container = document.getElementById('cascadeRes');
    
    container.innerHTML = `
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle"></i> 
        <strong>High-Impact Flights:</strong> These flights have the highest potential for cascade delays
      </div>
      <div class="list-group">
        ${data.map((r, index) => `
          <div class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <h6 class="mb-1">
                <span class="badge bg-danger me-2">#${index + 1}</span>
                <strong>${r.Flight_ID}</strong> (${r.Airline})
              </h6>
              <small class="text-muted">${new Date(r.Scheduled_Departure).toLocaleString()}</small>
            </div>
            <p class="mb-1">
              <span class="badge bg-warning me-2">Score: ${r.cascade_score}</span>
              <span class="badge bg-info me-2">Delay: ${r.Delay_Minutes} min</span>
            </p>
          </div>
        `).join('')}
      </div>
    `;
    
    showSuccess('Critical flights analysis completed!');
  } catch (err) {
    showError('Error loading cascade analysis');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Initialize with a welcome message
document.addEventListener('DOMContentLoaded', () => {
  const optPre = document.getElementById('optPre');
  optPre.style.display = 'block';
  optPre.textContent = '🚀 Welcome to Flight Schedule Optimizer!\n\n' +
                      '💡 Pro Tips:\n' +
                      '• Search for flights and click to select\n' +
                      '• Leave Flight ID empty for AI auto-selection\n' +
                      '• Try flight IDs: AI356, I5717, 6E561, UK676';
});
