// ─── State ────────────────────────────────────────────────
let currentRumor = 0;
let chartSol = null;
let chartScen = null;
const RUMOR_PCTS = [0, 0.05, 0.20, 0.50];
const RUMOR_NAMES = ['Sin rumor (0%)', 'Rumor bajo (+5%)', 'Rumor medio (+20%)', 'Pánico (+50%)'];

// ─── Rumor selector ───────────────────────────────────────
function setRumor(idx, el) {
  currentRumor = idx;
  document.querySelectorAll('.rumor-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pertPct').value = Math.round(RUMOR_PCTS[idx] * 100);
  runAnalysis(); // Auto-actualizar al presionar
}

// ─── Presets ──────────────────────────────────────────────
const PRESETS = {
  wellcond: { A: [[10,1,1],[1,10,1],[1,1,10]], b: [12,12,12] },
  moderate: { A: [[4,3,2],[3,4,3],[2,3,4]], b: [90,80,70] },
  illcond:  { A: [[1,2,3],[4,5,6],[7,8,10]], b: [90,80,70] },
  hilbert:  { A: [[1,1/2,1/3],[1/2,1/3,1/4],[1/3,1/4,1/5]], b: [1, 0.5, 0.3] }
};

function setPreset(name) {
  const p = PRESETS[name];
  const ids = [['a11','a12','a13'],['a21','a22','a23'],['a31','a32','a33']];
  p.A.forEach((row, i) => row.forEach((v, j) => { document.getElementById(ids[i][j]).value = v; }));
  document.getElementById('b1').value = p.b[0];
  document.getElementById('b2').value = p.b[1];
  document.getElementById('b3').value = p.b[2];
  runAnalysis(); // Auto-actualizar al presionar
}

// ─── Math helpers ──────────────────────────────────────────
function readA() {
  return [
    [+document.getElementById('a11').value, +document.getElementById('a12').value, +document.getElementById('a13').value],
    [+document.getElementById('a21').value, +document.getElementById('a22').value, +document.getElementById('a23').value],
    [+document.getElementById('a31').value, +document.getElementById('a32').value, +document.getElementById('a33').value]
  ];
}

function readB() {
  return [+document.getElementById('b1').value, +document.getElementById('b2').value, +document.getElementById('b3').value];
}

// Eliminación de Gauss con pivoteo parcial
function gauss(A, b) {
  const n = A.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    // Buscar pivote
    let maxRow = k;
    for (let i = k+1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[maxRow][k])) maxRow = i;
    [M[k], M[maxRow]] = [M[maxRow], M[k]];
    if (Math.abs(M[k][k]) < 1e-12) return null; // Matriz singular
    for (let i = k+1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i+1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

function norm2(v) { return Math.sqrt(v.reduce((s, vi) => s + vi*vi, 0)); }

function inverse3(A) {
  const [[a,b,c],[d,e,f],[g,h,k]] = A;
  const det = a*(e*k-f*h) - b*(d*k-f*g) + c*(d*h-e*g);
  if (Math.abs(det) < 1e-14) return null;
  return [
    [(e*k-f*h)/det, (c*h-b*k)/det, (b*f-c*e)/det],
    [(f*g-d*k)/det, (a*k-c*g)/det, (c*d-a*f)/det],
    [(d*h-e*g)/det, (b*g-a*h)/det, (a*e-b*d)/det]
  ];
}

function matNormInf(M) {
  return Math.max(...M.map(row => row.reduce((s, v) => s + Math.abs(v), 0)));
}

function conditionNumber(A) {
  const Ainv = inverse3(A);
  if (!Ainv) return Infinity;
  return matNormInf(A) * matNormInf(Ainv);
}

// ─── Main analysis ────────────────────────────────────────
function runAnalysis() {
  const A = readA();
  const b = readB();
  const pertPct = +document.getElementById('pertPct').value / 100;
  const rumorZone = document.getElementById('rumorZone').value;

  const db = b.map((bi, i) => {
    if (rumorZone === 'all') return bi * pertPct;
    if (+rumorZone === i) return bi * pertPct;
    return 0;
  });
  const bPerturbed = b.map((bi, i) => bi + db[i]);

  const x = gauss(A, b);
  const xPerturbed = gauss(A, bPerturbed);

  const panel = document.getElementById('resultPanel');
  panel.classList.add('visible');

  // Validación de seguridad para matrices singulares
  if (!x || !xPerturbed) {
    document.getElementById('condAlert').className = 'alert show alert-err';
    document.getElementById('condAlert').textContent = '✖ El sistema es singular (det A ≈ 0). No tiene solución única.';
    document.getElementById('kpiRow').innerHTML = '<div class="kpi"><div class="kpi-val" style="color:var(--red)">SINGULAR</div><div class="kpi-lbl">Estado del sistema</div></div>';
    
    // Ocultar gráficas y tablas si hay error
    if(chartSol) chartSol.destroy();
    if(chartScen) chartScen.destroy();
    document.getElementById('solBody').innerHTML = '';
    document.getElementById('scenChartWrap').style.display = 'none';
    document.getElementById('scenTableWrap').style.display = 'none';
    return;
  }

  const kappa = conditionNumber(A);
  const kappaLog = Math.log10(Math.max(kappa, 1));
  const dx = x.map((xi, i) => xPerturbed[i] - xi);
  const normX = norm2(x);
  const relErr = normX === 0 ? 0 : norm2(dx) / normX;
  const zones = ['Zona Norte', 'Zona Centro', 'Zona Sur'];

  const kappaColor = kappa < 100 ? 'var(--green)' : kappa < 1e4 ? 'var(--yellow)' : 'var(--red)';
  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi">
      <div class="kpi-val" style="color:${kappaColor}">${kappa < 1e6 ? kappa.toFixed(1) : kappa.toExponential(2)}</div>
      <div class="kpi-lbl">Número condición κ(A)</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:var(--accent2)">${(relErr * 100).toFixed(2)}%</div>
      <div class="kpi-lbl">Error relativo ‖Δx‖/‖x‖</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:var(--accent)">${(pertPct * 100).toFixed(1)}%</div>
      <div class="kpi-lbl">Perturbación aplicada</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:${kappa < 100 ? 'var(--green)' : kappa < 1e4 ? 'var(--yellow)' : 'var(--red)'}">
        ${kappa < 100 ? 'ESTABLE' : kappa < 1e4 ? 'SENSIBLE' : 'MAL COND.'}
      </div>
      <div class="kpi-lbl">Estado del sistema</div>
    </div>
  `;

  document.getElementById('condVal').textContent = kappa < 1e6 ? kappa.toFixed(2) : kappa.toExponential(2);
  const barPct = Math.min(100, (kappaLog / 8) * 100);
  const fill = document.getElementById('condFill');
  fill.style.width = barPct + '%';
  fill.style.background = kappa < 100
    ? 'linear-gradient(90deg, var(--green), #065f46)'
    : kappa < 1e4
    ? 'linear-gradient(90deg, var(--yellow), #92400e)'
    : 'linear-gradient(90deg, var(--red), var(--accent2))';

  const ca = document.getElementById('condAlert');
  if (kappa < 100) {
    ca.className = 'alert show alert-ok';
    ca.textContent = `✅ Sistema bien condicionado (κ ≈ ${kappa.toFixed(1)}). Un rumor del ${(pertPct*100).toFixed(0)}% produce un cambio de solo ${(relErr*100).toFixed(2)}% en la distribución. El sistema es ROBUSTO.`;
  } else if (kappa < 1e4) {
    ca.className = 'alert show alert-warn';
    ca.textContent = `⚠️ Sistema moderadamente condicionado (κ ≈ ${kappa.toFixed(0)}). Un rumor del ${(pertPct*100).toFixed(0)}% produce un cambio de ${(relErr*100).toFixed(1)}% en la distribución. ATENCIÓN requerida.`;
  } else {
    ca.className = 'alert show alert-danger';
    ca.textContent = `🚨 Sistema MAL CONDICIONADO (κ ≈ ${kappa.toExponential(2)}). Un rumor del ${(pertPct*100).toFixed(0)}% produce un cambio del ${(relErr*100).toFixed(0)}% en la distribución. CAOS en la red.`;
  }

  document.getElementById('solBody').innerHTML = zones.map((z, i) => {
    // Evitar divisiones entre cero 
    const chgPct = Math.abs(x[i]) > 1e-10 ? (dx[i] / Math.abs(x[i]) * 100) : 0;
    const color = Math.abs(chgPct) < 5 ? 'var(--green)' : Math.abs(chgPct) < 20 ? 'var(--yellow)' : 'var(--red)';
    return `<tr>
      <td style="color:var(--accent)">${z}</td>
      <td>${x[i].toFixed(4)}</td>
      <td>${xPerturbed[i].toFixed(4)}</td>
      <td style="color:${color}">${dx[i] > 0 ? '+' : ''}${dx[i].toFixed(4)}</td>
      <td style="color:${color};font-weight:${Math.abs(chgPct) > 20 ? '700' : '400'}">${chgPct > 0 ? '+' : ''}${chgPct.toFixed(2)}%</td>
    </tr>`;
  }).join('');

  if (chartSol) chartSol.destroy();
  const ctx = document.getElementById('chartSol').getContext('2d');
  chartSol = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: zones,
      datasets: [
        { label: 'Sin rumor', data: x, backgroundColor: 'rgba(192,132,252,0.6)', borderColor: '#c084fc', borderWidth: 1 },
        { label: `Con rumor (+${(pertPct*100).toFixed(0)}%)`, data: xPerturbed, backgroundColor: 'rgba(248,113,113,0.6)', borderColor: '#f87171', borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'IBM Plex Mono', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#4b5563', font: { family: 'IBM Plex Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#4b5563', font: { family: 'IBM Plex Mono' } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });

  document.getElementById('scenChartWrap').style.display = 'none';
  document.getElementById('scenTableWrap').style.display = 'none';

  const worstIdx = dx.map(d => Math.abs(d)).indexOf(Math.max(...dx.map(d => Math.abs(d))));
  const worstZonePct = Math.abs(x[worstIdx]) > 1e-10 ? (dx[worstIdx]/Math.abs(x[worstIdx])*100).toFixed(1) : '∞';
  
  const normB = norm2(b);
  const relPerturbB = normB > 0 ? (norm2(db)/normB*100) : 0;
  const theoricMax = Math.min(kappa * relPerturbB, 99999);

  document.getElementById('interpContent').innerHTML = `
    <ul>
      <li>El <strong>número de condición κ(A) = ${kappa < 1e6 ? kappa.toFixed(2) : kappa.toExponential(2)}</strong> mide cuánto amplifica el sistema los errores de entrada (rumores, perturbaciones en demanda).</li>
      <li>Un rumor que incremente la demanda solo un <strong>${(pertPct*100).toFixed(0)}%</strong> provoca un cambio de <strong>${(relErr*100).toFixed(2)}%</strong> en la distribución calculada.</li>
      <li>La zona más vulnerable es <strong>${zones[worstIdx]}</strong> con un cambio de ${dx[worstIdx].toFixed(2)} unidades (${worstZonePct}%).</li>
      <li>${kappa < 100 ? 'El sistema es <strong>robusto</strong>: los rumores generan poco impacto en la distribución real.' : kappa < 1e4 ? 'El sistema es <strong>sensible</strong>: rumores moderados pueden desestabilizar zonas individuales.' : 'El sistema es <strong>críticamente inestable</strong>: cualquier rumor puede colapsar toda la red de distribución.'}</li>
      <li>La perturbación relativa en b es: ‖Δb‖/‖b‖ = ${relPerturbB.toFixed(2)}%, amplificada por κ(A) a ≈ ${theoricMax.toFixed(1)}% en x (cota teórica).</li>
    </ul>
  `;
}

// ─── All scenarios ─────────────────────────────────────────
function runScenarios() {
  const A = readA();
  const b = readB();
  const levels = [0, 0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50, 1.0];
  const zones = ['Zona Norte', 'Zona Centro', 'Zona Sur'];

  const kappa = conditionNumber(A);
  const x0 = gauss(A, b);
  
  if (!x0) { 
    document.getElementById('condAlert').className = 'alert show alert-err'; 
    document.getElementById('condAlert').textContent = '✖ Sistema singular.'; 
    return; 
  }

  const panel = document.getElementById('resultPanel');
  panel.classList.add('visible');

  const normX0 = norm2(x0);
  const results = levels.map(pct => {
    const bPert = b.map(bi => bi * (1 + pct));
    const xPert = gauss(A, bPert);
    if (!xPert) return null;
    const dx = x0.map((v, i) => xPert[i] - v);
    const relErr = normX0 > 0 ? norm2(dx) / normX0 : 0;
    return { pct, xPert, dx, relErr };
  }).filter(Boolean);

  const wrap = document.getElementById('scenChartWrap');
  wrap.style.display = 'block';
  
  if (chartScen) chartScen.destroy();
  const ctx = document.getElementById('chartScen').getContext('2d');
  
  chartScen = new Chart(ctx, {
    type: 'line',
    data: {
      labels: results.map(r => `+${(r.pct*100).toFixed(0)}%`),
      datasets: [
        ...zones.map((z, zi) => ({
          label: z,
          data: results.map(r => r.xPert[zi]),
          borderColor: ['#c084fc','#f472b6','#fb923c'][zi],
          borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false
        })),
        {
          label: 'Error relativo (×100)',
          data: results.map(r => r.relErr * 100),
          borderColor: '#f87171', borderWidth: 2, borderDash: [5,3],
          pointRadius: 3, tension: 0.3, fill: false, yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Impacto del rumor en la distribución por zona (κ ≈ ${kappa < 1e6 ? kappa.toFixed(1) : kappa.toExponential(2)})`, color: '#94a3b8', font: { family: 'IBM Plex Mono', size: 11 } },
        legend: { labels: { color: '#94a3b8', font: { family: 'IBM Plex Mono', size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#4b5563', font: { family: 'IBM Plex Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#4b5563', font: { family: 'IBM Plex Mono' } }, grid: { color: 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'Distribución (unidades)', color: '#64748b', font: { family: 'IBM Plex Mono', size: 10 } } },
        y2: { position: 'right', ticks: { color: '#f87171', font: { family: 'IBM Plex Mono' } }, grid: { display: false }, title: { display: true, text: 'Error relativo (%)', color: '#f87171', font: { family: 'IBM Plex Mono', size: 10 } } }
      }
    }
  });

  const scenWrap = document.getElementById('scenTableWrap');
  scenWrap.style.display = 'block';

  const getVulnLevel = (re) => re < 0.05 ? '🟢 Baja' : re < 0.20 ? '🟡 Media' : re < 0.50 ? '🟠 Alta' : '🔴 Crítica';
  document.getElementById('scenBody').innerHTML = results.map(r => `
    <tr>
      <td>${['Sin rumor','Mínimo','Bajo','Moderado-bajo','Moderado','Moderado-alto','Alto','Pánico','Extremo'][levels.indexOf(r.pct)] || `+${(r.pct*100).toFixed(0)}%`}</td>
      <td style="color:var(--accent)">${(r.pct*100).toFixed(0)}%</td>
      <td>${r.xPert[0].toFixed(4)}</td>
      <td>${r.xPert[1].toFixed(4)}</td>
      <td>${r.xPert[2].toFixed(4)}</td>
      <td style="color:${r.relErr < 0.05 ? 'var(--green)' : r.relErr < 0.2 ? 'var(--yellow)' : 'var(--red)'}">${(r.relErr*100).toFixed(2)}%</td>
      <td>${getVulnLevel(r.relErr)}</td>
    </tr>
  `).join('');
}

// ─── Init ─────────────────────────────────────────────────
window.addEventListener('load', () => setTimeout(runAnalysis, 200));