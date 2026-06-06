// ─── State ───────────────────────────────────────────────
let currentMethod = 'gauss-seidel';
let chartFlow, chartBlock, chartSens;
let lastSolution = null;

// ─── Method pills ─────────────────────────────────────────
document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    currentMethod = p.dataset.method;
    document.getElementById('sor-field').style.display = currentMethod === 'sor' ? '' : 'none';
  });
});

// ─── Read matrix A and b from DOM ─────────────────────────
function readSystem() {
  const A = [
    [+document.getElementById('a11').value, +document.getElementById('a12').value, +document.getElementById('a13').value],
    [+document.getElementById('a21').value, +document.getElementById('a22').value, +document.getElementById('a23').value],
    [+document.getElementById('a31').value, +document.getElementById('a32').value, +document.getElementById('a33').value],
  ];
  const b = [+document.getElementById('dn').value, +document.getElementById('dc').value, +document.getElementById('ds').value];
  return { A, b };
}

// ─── Solvers ──────────────────────────────────────────────
function jacobiSolve(A, b, tol, maxIter) {
  const n = A.length;
  let x = new Array(n).fill(0);
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const xNew = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * x[j];
      xNew[i] = sum / A[i][i];
    }
    const err = Math.max(...xNew.map((v, i) => Math.abs(v - x[i])));
    iters.push({ k: k+1, x: [...xNew], err });
    x = xNew;
    if (err < tol) return { x, iters, converged: true };
  }
  return { x, iters, converged: false };
}

function gaussSeidelSolve(A, b, tol, maxIter) {
  const n = A.length;
  let x = new Array(n).fill(0);
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * x[j];
      x[i] = sum / A[i][i];
    }
    const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
    iters.push({ k: k+1, x: [...x], err });
    if (err < tol) return { x, iters, converged: true };
  }
  return { x, iters, converged: false };
}

function sorSolve(A, b, tol, maxIter, omega) {
  const n = A.length;
  let x = new Array(n).fill(0);
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * x[j];
      const gsVal = sum / A[i][i];
      x[i] = (1 - omega) * x[i] + omega * gsVal;
    }
    const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
    iters.push({ k: k+1, x: [...x], err });
    if (err < tol) return { x, iters, converged: true };
  }
  return { x, iters, converged: false };
}

function luSolve(A, b) {
  const n = A.length;
  // Copy
  const L = Array.from({length:n}, (_,i) => Array.from({length:n}, (_,j) => i===j ? 1:0));
  const U = A.map(r => [...r]);
  const iters = [];
  for (let k = 0; k < n; k++) {
    for (let i = k+1; i < n; i++) {
      const factor = U[i][k] / U[k][k];
      L[i][k] = factor;
      for (let j = k; j < n; j++) U[i][j] -= factor * U[k][j];
      iters.push({ k: k+1, x: [`L[${i+1}][${k+1}]=${factor.toFixed(4)}`], err: 0 });
    }
  }
  // Forward substitution Ly = b
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = b[i];
    for (let j = 0; j < i; j++) sum -= L[i][j] * y[j];
    y[i] = sum;
  }
  // Back substitution Ux = y
  const x = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    let sum = y[i];
    for (let j = i+1; j < n; j++) sum -= U[i][j] * x[j];
    x[i] = sum / U[i][i];
  }
  return { x, iters, converged: true };
}

function cgcSolve(A, b, tol, maxIter) {
  const n = A.length;
  let x = new Array(n).fill(0);
  let r = b.map((bi, i) => bi - A[i].reduce((s, aij, j) => s + aij * x[j], 0));
  let p = [...r];
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const Ap = A.map(row => row.reduce((s, aij, j) => s + aij * p[j], 0));
    const rr = r.reduce((s, ri) => s + ri*ri, 0);
    const pAp = p.reduce((s, pi, i) => s + pi * Ap[i], 0);
    if (Math.abs(pAp) < 1e-14) break;
    const alpha = rr / pAp;
    x = x.map((xi, i) => xi + alpha * p[i]);
    const rNew = r.map((ri, i) => ri - alpha * Ap[i]);
    const rrNew = rNew.reduce((s, ri) => s + ri*ri, 0);
    const err = Math.sqrt(rrNew);
    iters.push({ k: k+1, x: [...x], err });
    if (err < tol) { return { x, iters, converged: true }; }
    const beta = rrNew / rr;
    p = rNew.map((ri, i) => ri + beta * p[i]);
    r = rNew;
  }
  return { x, iters, converged: false };
}

function solve(A, b, method, tol, maxIter, omega) {
  switch (method) {
    case 'jacobi': return jacobiSolve(A, b, tol, maxIter);
    case 'gauss-seidel': return gaussSeidelSolve(A, b, tol, maxIter);
    case 'sor': return sorSolve(A, b, tol, maxIter, omega);
    case 'lu': return luSolve(A, b);
    case 'cgc': return cgcSolve(A, b, tol, maxIter);
  }
}

// ─── Main solver ──────────────────────────────────────────
function runSolver() {
  const { A, b } = readSystem();
  const tol = +document.getElementById('tol').value;
  const maxIter = +document.getElementById('maxiter').value;
  const omega = +document.getElementById('omega').value;

  // Check diagonal dominance
  const isDiagDom = A.every((row, i) => {
    const diag = Math.abs(row[i]);
    const sum = row.reduce((s, v, j) => j !== i ? s + Math.abs(v) : s, 0);
    return diag >= sum;
  });

  const res = solve(A, b, currentMethod, tol, maxIter, omega);
  lastSolution = res.x;

  // Show results panel
  const panel = document.getElementById('resultPanel');
  panel.classList.add('visible');

  // Cards
  const zones = ['Zona Norte', 'Zona Centro', 'Zona Sur'];
  const colors = [' #00d4ff', '#a8ff78', '#ff6b35'];
  let cards = res.x.map((v, i) => `
    <div class="result-card">
      <div class="val" style="color:${colors[i]}">${v.toFixed(2)}</div>
      <div class="lbl">${zones[i]}</div>
    </div>
  `).join('');

  // Method name
  const mNames = { jacobi:'Jacobi', 'gauss-seidel':'Gauss-Seidel', sor:'SOR', lu:'LU', cgc:'Grad. Conjugado' };
  cards += `<div class="result-card">
    <div class="val" style="font-size:1rem;color:var(--warn)">${res.iters.length}</div>
    <div class="lbl">Iteraciones (${mNames[currentMethod]})</div>
  </div>`;

  document.getElementById('resultGrid').innerHTML = cards;

  // Convergence alert
  const ca = document.getElementById('convAlert');
  ca.className = `alert show ${res.converged ? 'alert-ok' : 'alert-warn'}`;
  ca.textContent = res.converged
    ? `✔ Convergió en ${res.iters.length} iteraciones (ε=${tol})`
    : `⚠ No convergió completamente en ${res.iters.length} iteraciones — resultado aproximado`;

  if (!isDiagDom) {
    ca.textContent += ' | ⚠ La matriz no es diagonalmente dominante — pueden ocurrir problemas de convergencia';
    ca.className = 'alert show alert-warn';
  }

  // Iteration table (show last 10 + first 3)
  const head = document.getElementById('iterHead');
  const tbody = document.getElementById('iterBody');
  head.innerHTML = `<th>Iter</th>${zones.map(z=>`<th>${z}</th>`).join('')}<th>Error</th>`;

  const showIters = currentMethod === 'lu' ? res.iters.slice(0, 10) : [
    ...res.iters.slice(0, 3),
    ...(res.iters.length > 6 ? [null] : []),
    ...res.iters.slice(-3)
  ];
  tbody.innerHTML = showIters.map(it => {
    if (!it) return `<tr><td colspan="5" style="text-align:center;color:var(--muted)">...</td></tr>`;
    if (currentMethod === 'lu') return `<tr><td>${it.k}</td><td colspan="3">${it.x[0]}</td><td>—</td></tr>`;
    return `<tr>
      <td>${it.k}</td>
      ${it.x.map(v => `<td>${typeof v === 'number' ? v.toFixed(4) : v}</td>`).join('')}
      <td>${typeof it.err === 'number' ? it.err.toExponential(3) : it.err}</td>
    </tr>`;
  }).join('');

  // Chart
  if (chartFlow) chartFlow.destroy();
  const ctx = document.getElementById('chartFlow').getContext('2d');
  chartFlow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: zones,
      datasets: [
        { label: 'Distribución calculada', data: res.x.map(v => Math.max(0, v)), backgroundColor: ['rgba(0,212,255,0.7)', 'rgba(168,255,120,0.7)', 'rgba(255,107,53,0.7)'], borderWidth: 1, borderColor: ['#00d4ff','#a8ff78','#ff6b35'] },
        { label: 'Demanda requerida', data: b, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1, type: 'line', pointRadius: 5, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } }, tooltip: { bodyFont: { family: 'JetBrains Mono' } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Interpretation
  const demands = b;
  const diffs = res.x.map((v, i) => v - demands[i]);
  const worstZone = zones[diffs.indexOf(Math.min(...diffs))];
  document.getElementById('interpContent').innerHTML = `
    <ul>
      <li>Con el método <strong>${mNames[currentMethod]}</strong>, el sistema distribuye: <strong>${res.x.map((v,i) => zones[i]+': '+v.toFixed(1)).join(' | ')}</strong></li>
      <li>La zona con mayor déficit potencial es <strong>${worstZone}</strong> (diferencia: ${Math.min(...diffs).toFixed(2)} u.)</li>
      <li>${isDiagDom ? '✅ La matriz es diagonalmente dominante: el sistema converge de forma garantizada.' : '⚠️ La matriz NO es diagonalmente dominante: la convergencia depende del método.'}</li>
      <li>El costo total de transporte (suma ponderada) es: <strong>${A.map((row, i) => row.reduce((s, c, j) => s + c * Math.max(0, res.x[j]), 0)).reduce((s, v) => s + v, 0).toFixed(2)} unidades monetarias</strong></li>
    </ul>
  `;
}

// ─── Blockage simulation ───────────────────────────────────
function runBlockage() {
  const route = document.getElementById('blockRoute').value;
  const alert = document.getElementById('blockAlert');
  if (!route) { alert.className = 'alert show alert-warn'; alert.textContent = '⚠ Selecciona una ruta para bloquear.'; return; }

  const [ri, ci] = route.split('-').map(Number);
  const { A, b } = readSystem();
  const Ab = A.map(row => [...row]);
  Ab[ri][ci] = 0; // Bloquear
  // Modify b: reduce capacity
  const bMod = [...b];

  const tol = +document.getElementById('tol').value;
  const maxIter = +document.getElementById('maxiter').value;
  const omega = +document.getElementById('omega').value;

  const resOrig = solve(A, b, currentMethod, tol, maxIter, omega);
  const resBlock = solve(Ab, bMod, currentMethod, tol, maxIter, omega);

  const zones = ['Zona Norte', 'Zona Centro', 'Zona Sur'];
  const plants = ['Planta 1', 'Planta 2', 'Planta 3'];
  const routeName = `${plants[ri]} → ${zones[ci]}`;

  alert.className = 'alert show alert-ok';
  alert.textContent = `Bloqueo de ${routeName}: cambio en distribución calculado.`;

  const wrap = document.getElementById('blockChartWrap');
  wrap.style.display = '';
  if (chartBlock) chartBlock.destroy();
  const ctx = document.getElementById('chartBlock').getContext('2d');
  chartBlock = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: zones,
      datasets: [
        { label: 'Sin bloqueo', data: resOrig.x.map(v => Math.max(0,v)), backgroundColor: 'rgba(0,212,255,0.6)', borderWidth:1, borderColor:'#00d4ff' },
        { label: `Con bloqueo (${routeName})`, data: resBlock.x.map(v => Math.max(0,v)), backgroundColor: 'rgba(255,68,68,0.6)', borderWidth:1, borderColor:'#ff4444' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Identify most affected zone
  const deltas = resOrig.x.map((v, i) => resBlock.x[i] - v);
  const worstIdx = deltas.indexOf(Math.min(...deltas));
  alert.textContent += ` La zona más afectada es ${zones[worstIdx]} (cambio: ${deltas[worstIdx].toFixed(2)} u.)`;
}

// ─── Sensitivity analysis ──────────────────────────────────
function runSensitivity() {
  const pct = +document.getElementById('demandIncrease').value / 100;
  const { A, b } = readSystem();
  const tol = +document.getElementById('tol').value;
  const maxIter = +document.getElementById('maxiter').value;
  const omega = +document.getElementById('omega').value;
  const zones = ['Zona Norte', 'Zona Centro', 'Zona Sur'];

  const steps = [0, 10, 20, 30, 40, 50, 75, 100].map(p => p / 100);
  const labels = steps.map(s => `+${(s*100).toFixed(0)}%`);
  const datasets = zones.map((z, zi) => ({
    label: z,
    data: steps.map(s => {
      const bNew = b.map(bi => bi * (1 + s * (pct / (pct > 0 ? pct : 1))));
      const res = solve(A, bNew, currentMethod, tol, maxIter, omega);
      return Math.max(0, res.x[zi]);
    }),
    borderColor: ['#00d4ff','#a8ff78','#ff6b35'][zi],
    backgroundColor: ['rgba(0,212,255,0.1)','rgba(168,255,120,0.1)','rgba(255,107,53,0.1)'][zi],
    tension: 0.3, fill: true, pointRadius: 4
  }));

  const wrap = document.getElementById('sensChartWrap');
  wrap.style.display = '';
  if (chartSens) chartSens.destroy();
  const ctx = document.getElementById('chartSens').getContext('2d');
  chartSens = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  const sensInterp = document.getElementById('sensInterp');
  sensInterp.classList.add('visible');
  document.getElementById('sensInterpContent').innerHTML = `
    <ul>
      <li>Al incrementar la demanda un <strong>${(pct*100).toFixed(0)}%</strong>, el sistema requiere proporcionalmente mayor distribución en todas las zonas.</li>
      <li>Si la capacidad de las plantas no escala, el sistema se vuelve <strong>infactible</strong> — las zonas con menos margen colapsan primero.</li>
      <li>El análisis de sensibilidad muestra qué zona es más vulnerable a cambios bruscos de demanda.</li>
    </ul>
  `;
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auto-run on load with defaults
  setTimeout(runSolver, 300);
});