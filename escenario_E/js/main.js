// ─── State ────────────────────────────────────────────────
let currentModel = 0;
let currentMethod = 'biseccion';
let chartFunc, chartComp;

// ─── Model definitions ────────────────────────────────────
const MODELS = [
  {
    name: 'Quiebre Financiero',
    desc: `<span class="eq">f(t) = GastoAcumulado(t) − IngresoMensual</span>
      La función representa la diferencia entre el gasto acumulado de una familia (con precios crecientes) y su ingreso mensual fijo.<br>
      Si f(t*) = 0, entonces t* es el <strong>día crítico</strong> en que el gasto supera el ingreso.<br>
      <span class="eq">GastoAcumulado(t) = PrecioBase × t + (α/2) × t²</span>
      donde α es la tasa diaria de incremento de precio y PrecioBase es el costo diario base de la canasta.`,
    params: [
      { id: 'p_precio', label: 'Precio base diario (Bs)', val: 15 },
      { id: 'p_alpha', label: 'Tasa incremento diario (Bs/día)', val: 0.3 },
      { id: 'p_ingreso', label: 'Ingreso mensual familia (Bs)', val: 500 }
    ],
    f: (t, p) => p.p_precio * t + (p.p_alpha / 2) * t * t - p.p_ingreso,
    df: (t, p) => p.p_precio + p.p_alpha * t,
    xLabel: 'Día del mes (t)',
    yLabel: 'f(t) = Gasto acumulado − Ingreso',
    rootLabel: 'Día crítico',
    aDefault: 0, bDefault: 30
  },
  {
    name: 'Tasa Crítica de Reposición',
    desc: `<span class="eq">f(r) = Consumo − r × CapacidadEntrada</span>
      Modela el balance entre el consumo diario de carburante y la tasa de reabastecimiento.<br>
      Si f(r*) = 0, r* es la <strong>tasa mínima de reposición</strong> que evita el vaciado de reservas.<br>
      <span class="eq">Consumo(t) = ConsumoDiario × e^(β×t) </span>
      donde β refleja el crecimiento exponencial de la demanda por pánico o escasez.`,
    params: [
      { id: 'p_consumo', label: 'Consumo base diario (miles L)', val: 50 },
      { id: 'p_beta', label: 'Factor de crecimiento β', val: 0.02 },
      { id: 'p_cap', label: 'Capacidad máx. entrada (miles L/día)', val: 100 },
      { id: 'p_dias', label: 'Días de simulación t', val: 15 }
    ],
    f: (r, p) => p.p_consumo * Math.exp(p.p_beta * p.p_dias) - r * p.p_cap,
    df: (r, p) => -p.p_cap,
    xLabel: 'Tasa de reposición r (0-1)',
    yLabel: 'f(r) = Consumo − r × CapacidadEntrada',
    rootLabel: 'Tasa crítica r*',
    aDefault: 0, bDefault: 2
  },
  {
    name: 'Umbral de Opinión Social',
    desc: `<span class="eq">f(m) = γ × m × (1 − m) − δ × m</span>
      Modela la dinámica del descontento social. m ∈ [0,1] es la fracción de la población en estado de malestar activo.<br>
      γ es la tasa de "contagio" del descontento y δ la tasa de calma/mediación.<br>
      La raíz m* ≠ 0 indica el <strong>umbral de polarización</strong>: si m > m*, el descontento se masifica; si m < m*, tiende a cero.<br>
      <span class="eq">f(m) = m × (γ(1−m) − δ) = 0</span>`,
    params: [
      { id: 'p_gamma', label: 'Tasa contagio γ', val: 0.5 },
      { id: 'p_delta', label: 'Tasa mediación δ', val: 0.1 }
    ],
    f: (m, p) => m * (p.p_gamma * (1 - m) - p.p_delta),
    df: (m, p) => p.p_gamma * (1 - 2 * m) - p.p_delta,
    xLabel: 'Fracción de población m (0-1)',
    yLabel: 'f(m) = m(γ(1-m) - δ)',
    rootLabel: 'Umbral de masificación m*',
    aDefault: 0.01, bDefault: 0.99
  }
];

// ─── UI Helpers ───────────────────────────────────────────
function selectModel(idx, el) {
  currentModel = idx;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderModelDesc();
  renderParams();
  // set default range
  const m = MODELS[idx];
  document.getElementById('paramA').value = m.aDefault;
  document.getElementById('paramB').value = m.bDefault;
  document.getElementById('paramX0').value = ((m.aDefault + m.bDefault) / 2).toFixed(2);
  document.getElementById('resultPanel').classList.remove('visible');
}

function renderModelDesc() {
  document.getElementById('modelDescBox').innerHTML = MODELS[currentModel].desc;
}

function renderParams() {
  const m = MODELS[currentModel];
  document.getElementById('paramFields').innerHTML = `
    <div class="grid-3">
      ${m.params.map(p => `
        <div class="field">
          <label>${p.label}</label>
          <input type="number" id="${p.id}" value="${p.val}" step="0.01">
        </div>
      `).join('')}
    </div>
  `;
}

document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    currentMethod = p.dataset.method;
    const isNewton = currentMethod === 'newton';
    const isSecante = currentMethod === 'secante';
    document.getElementById('x0Field').style.display = (isNewton || isSecante) ? '' : 'none';
    document.getElementById('x1Field').style.display = isSecante ? '' : 'none';
    document.getElementById('paramA').parentElement.parentElement.style.display = (isNewton) ? 'none' : '';
  });
});

// ─── Read params ──────────────────────────────────────────
function readParams() {
  const m = MODELS[currentModel];
  const p = {};
  m.params.forEach(pp => { p[pp.id] = +document.getElementById(pp.id).value; });
  return p;
}

// ─── Root methods ─────────────────────────────────────────
function bisection(f, a, b, tol, maxIter) {
  const iters = [];
  if (f(a) * f(b) > 0) return { x: null, iters, converged: false, err: 'f(a) y f(b) tienen el mismo signo' };
  let x;
  for (let k = 0; k < maxIter; k++) {
    x = (a + b) / 2;
    const fx = f(x);
    const err = (b - a) / 2;
    iters.push({ k: k+1, a, b, x, fx, err });
    if (err < tol || Math.abs(fx) < tol) return { x, iters, converged: true };
    if (f(a) * fx < 0) b = x; else a = x;
  }
  return { x, iters, converged: false };
}

function newtonRaphson(f, df, x0, tol, maxIter) {
  const iters = [];
  let x = x0;
  for (let k = 0; k < maxIter; k++) {
    const fx = f(x);
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-14) return { x, iters, converged: false, err: 'Derivada ~ 0' };
    const xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);
    iters.push({ k: k+1, x, fx, dfx, xNew, err });
    x = xNew;
    if (err < tol && Math.abs(fx) < tol) return { x, iters, converged: true };
  }
  return { x, iters, converged: false };
}

function secante(f, x0, x1, tol, maxIter) {
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const f0 = f(x0), f1 = f(x1);
    if (Math.abs(f1 - f0) < 1e-14) return { x: x1, iters, converged: false, err: 'División por cero' };
    const xNew = x1 - f1 * (x1 - x0) / (f1 - f0);
    const err = Math.abs(xNew - x1);
    iters.push({ k: k+1, x0, x1, f0, f1, xNew, err });
    x0 = x1; x1 = xNew;
    if (err < tol) return { x: xNew, iters, converged: true };
  }
  return { x: x1, iters, converged: false };
}

// ─── Main runner ──────────────────────────────────────────
function runRoots() {
  const m = MODELS[currentModel];
  const p = readParams();
  const f = (t) => m.f(t, p);
  const df = (t) => m.df(t, p);
  const a = +document.getElementById('paramA').value;
  const b = +document.getElementById('paramB').value;
  const tol = +document.getElementById('paramTol').value;
  const maxIter = +document.getElementById('paramMaxIter').value;
  const x0 = +document.getElementById('paramX0').value;
  const x1 = +document.getElementById('paramX1').value;

  let res;
  const mNames = { biseccion: 'Bisección', newton: 'Newton-Raphson', secante: 'Secante' };

  if (currentMethod === 'biseccion') res = bisection(f, a, b, tol, maxIter);
  else if (currentMethod === 'newton') res = newtonRaphson(f, df, x0, tol, maxIter);
  else res = secante(f, x0, x1, tol, maxIter);

  const panel = document.getElementById('resultPanel');
  panel.classList.add('visible');

  // KPIs
  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi">
      <div class="kpi-val">${res.x !== null ? res.x.toFixed(6) : 'N/A'}</div>
      <div class="kpi-lbl">${m.rootLabel}</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:${res.converged ? 'var(--green)' : 'var(--red)'}">${res.converged ? '✔' : '✘'}</div>
      <div class="kpi-lbl">Convergencia</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:#94a3b8">${res.iters.length}</div>
      <div class="kpi-lbl">Iteraciones (${mNames[currentMethod]})</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="font-size:0.95rem;color:var(--accent2)">${res.x !== null ? f(res.x).toExponential(3) : '—'}</div>
      <div class="kpi-lbl">f(raíz)</div>
    </div>
  `;

  const ca = document.getElementById('convAlert');
  if (res.err) { ca.className = 'alert show alert-err'; ca.textContent = '✖ Error: ' + res.err; }
  else if (res.converged) { ca.className = 'alert show alert-ok'; ca.textContent = `✔ Convergió en ${res.iters.length} iteraciones. Raíz encontrada: x* ≈ ${res.x.toFixed(6)}`; }
  else { ca.className = 'alert show alert-warn'; ca.textContent = `⚠ No convergió en ${res.iters.length} iteraciones — resultado aproximado: x ≈ ${res.x.toFixed(6)}`; }

  // Function graph
  const xs = [], ys = [];
  const lo = currentMethod === 'biseccion' ? a : (m.aDefault);
  const hi = currentMethod === 'biseccion' ? b : (m.bDefault);
  for (let i = 0; i <= 200; i++) {
    const t = lo + (hi - lo) * i / 200;
    xs.push(t);
    ys.push(f(t));
  }
  if (chartFunc) chartFunc.destroy();
  const ctx = document.getElementById('chartFunc').getContext('2d');
  const rootX = res.x !== null ? res.x : null;
  chartFunc = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => x.toFixed(2)),
      datasets: [
        {
          label: `f(x) — ${m.name}`,
          data: ys,
          borderColor: '#ff6b35',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false
        },
        {
          label: 'y = 0',
          data: xs.map(() => 0),
          borderColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [4, 4]
        },
        ...(rootX !== null ? [{
          label: `Raíz x* = ${rootX.toFixed(4)}`,
          data: xs.map((x, i) => Math.abs(x - rootX) < (hi - lo) / 200 * 3 ? 0 : null),
          borderColor: '#ffd700',
          borderWidth: 3,
          pointRadius: xs.map(x => Math.abs(x - rootX) < (hi - lo) / 20 ? 0 : 0),
          showLine: false,
          pointBackgroundColor: '#ffd700'
        }] : [])
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Space Mono', size: 11 } } },
        annotation: {}
      },
      scales: {
        x: {
          ticks: { color: '#4b5563', font: { family: 'Space Mono', size: 10 }, maxTicksLimit: 12 },
          grid: { color: 'rgba(255,255,255,0.03)' },
          title: { display: true, text: m.xLabel, color: '#64748b', font: { family: 'Space Mono', size: 10 } }
        },
        y: {
          ticks: { color: '#4b5563', font: { family: 'Space Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          title: { display: true, text: m.yLabel, color: '#64748b', font: { family: 'Space Mono', size: 10 } }
        }
      }
    }
  });

  // Iteration table
  const head = document.getElementById('iterHead');
  const tbody = document.getElementById('iterBody');
  if (currentMethod === 'biseccion') {
    head.innerHTML = `<th>Iter</th><th>a</th><th>b</th><th>x = (a+b)/2</th><th>f(x)</th><th>Error</th>`;
    tbody.innerHTML = res.iters.map((it, idx) => `
      <tr class="${idx === res.iters.length-1 && res.converged ? 'converge-row' : ''}">
        <td>${it.k}</td><td>${it.a.toFixed(6)}</td><td>${it.b.toFixed(6)}</td>
        <td>${it.x.toFixed(6)}</td><td>${it.fx.toExponential(4)}</td><td>${it.err.toExponential(4)}</td>
      </tr>`).join('');
  } else if (currentMethod === 'newton') {
    head.innerHTML = `<th>Iter</th><th>xₙ</th><th>f(xₙ)</th><th>f'(xₙ)</th><th>xₙ₊₁</th><th>Error</th>`;
    tbody.innerHTML = res.iters.map((it, idx) => `
      <tr class="${idx === res.iters.length-1 && res.converged ? 'converge-row' : ''}">
        <td>${it.k}</td><td>${it.x.toFixed(6)}</td><td>${it.fx.toExponential(4)}</td>
        <td>${it.dfx.toExponential(4)}</td><td>${it.xNew.toFixed(6)}</td><td>${it.err.toExponential(4)}</td>
      </tr>`).join('');
  } else {
    head.innerHTML = `<th>Iter</th><th>x₀</th><th>x₁</th><th>f(x₁)</th><th>xₙₑᵥ</th><th>Error</th>`;
    tbody.innerHTML = res.iters.map((it, idx) => `
      <tr class="${idx === res.iters.length-1 && res.converged ? 'converge-row' : ''}">
        <td>${it.k}</td><td>${it.x0.toFixed(6)}</td><td>${it.x1.toFixed(6)}</td>
        <td>${it.f1.toExponential(4)}</td><td>${it.xNew.toFixed(6)}</td><td>${it.err.toExponential(4)}</td>
      </tr>`).join('');
  }

  document.getElementById('compChartWrap').style.display = 'none';

  // Interpretation
  buildInterpretation(res, m, p);
}

function buildInterpretation(res, m, p) {
  const box = document.getElementById('interpBox');
  box.classList.add('visible');
  const models = ['financiero', 'reposición de carburante', 'descontento social'];
  const mIdx = currentModel;
  let specific = '';
  if (mIdx === 0 && res.x !== null) {
    specific = `<li>El <strong>día crítico</strong> es el día <strong>${res.x.toFixed(1)}</strong>. Antes de ese día, la familia aún puede cubrir sus gastos. Después, el gasto acumulado supera su ingreso mensual.</li>
    <li>Si el ingreso no aumenta o los precios siguen subiendo, la familia entra en déficit financiero.</li>`;
  } else if (mIdx === 1 && res.x !== null) {
    specific = `<li>La tasa de reposición mínima para equilibrar el consumo en el día ${p.p_dias} es <strong>r* ≈ ${res.x.toFixed(4)}</strong> (porcentaje de la capacidad máxima de entrada).</li>
    <li>Si r < r*, las reservas disminuyen progresivamente hasta agotarse. Si r > r*, el sistema se mantiene estable.</li>`;
  } else if (mIdx === 2 && res.x !== null) {
    specific = `<li>El umbral de polarización social es <strong>m* ≈ ${res.x.toFixed(4)}</strong> (${(res.x*100).toFixed(1)}% de la población).</li>
    <li>Si el malestar activo supera ese umbral, el sistema tiende a masificarse (conflicto creciente). Por debajo, tiende a la calma.</li>
    <li>Aumentar la mediación (δ) desplaza m* hacia arriba, haciendo el sistema más estable.</li>`;
  }
  document.getElementById('interpContent').innerHTML = `
    <ul>
      <li>Se aplicó el método de <strong>${['Bisección', 'Newton-Raphson', 'Secante'][['biseccion','newton','secante'].indexOf(currentMethod)]}</strong> para encontrar el umbral crítico del modelo <strong>${models[mIdx]}</strong>.</li>
      ${specific}
      <li>El método de Newton-Raphson converge cuadráticamente (más rápido) pero requiere calcular la derivada f'(x). Bisección es más robusto pero converge linealmente. Secante no requiere derivada y converge superlinealmente.</li>
    </ul>
  `;
}

// ─── Compare all 3 methods ────────────────────────────────
function compareAll() {
  const m = MODELS[currentModel];
  const p = readParams();
  const f = (t) => m.f(t, p);
  const df = (t) => m.df(t, p);
  const a = +document.getElementById('paramA').value;
  const b = +document.getElementById('paramB').value;
  const tol = +document.getElementById('paramTol').value;
  const maxIter = +document.getElementById('paramMaxIter').value;
  const x0 = +document.getElementById('paramX0').value;
  const x1 = +document.getElementById('paramX1').value;

  const resBis = bisection(f, a, b, tol, maxIter);
  const resNR = newtonRaphson(f, df, x0, tol, maxIter);
  const resSec = secante(f, x0, x1, tol, maxIter);

  const panel = document.getElementById('resultPanel');
  panel.classList.add('visible');

  const wrap = document.getElementById('compChartWrap');
  wrap.style.display = '';
  if (chartComp) chartComp.destroy();
  const ctx = document.getElementById('chartComp').getContext('2d');

  const maxLen = Math.max(resBis.iters.length, resNR.iters.length, resSec.iters.length);
  const labels = Array.from({ length: maxLen }, (_, i) => i + 1);

  const getErrors = (res) => labels.map(k => {
    const it = res.iters[k - 1];
    return it ? Math.log10(Math.max(it.err, 1e-15)) : null;
  });

  chartComp = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: `Bisección (${resBis.iters.length} iter)`, data: getErrors(resBis), borderColor: '#ff6b35', borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false },
        { label: `Newton-Raphson (${resNR.iters.length} iter)`, data: getErrors(resNR), borderColor: '#ffd700', borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false },
        { label: `Secante (${resSec.iters.length} iter)`, data: getErrors(resSec), borderColor: '#a78bfa', borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Comparación de convergencia (log₁₀ del error por iteración)', color: '#94a3b8', font: { family: 'Space Mono', size: 11 } },
        legend: { labels: { color: '#94a3b8', font: { family: 'Space Mono', size: 11 } } }
      },
      scales: {
        x: { title: { display: true, text: 'Iteración', color: '#64748b', font: { family: 'Space Mono', size: 10 } }, ticks: { color: '#4b5563', font: { family: 'Space Mono' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { title: { display: true, text: 'log₁₀(error)', color: '#64748b', font: { family: 'Space Mono', size: 10 } }, ticks: { color: '#4b5563', font: { family: 'Space Mono' } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });

  // Summary
  const ca = document.getElementById('convAlert');
  ca.className = 'alert show alert-ok';
  ca.innerHTML = `
    <strong>Comparación de métodos:</strong><br>
    Bisección: ${resBis.converged ? resBis.iters.length + ' iter ✔' : 'No convergió ✘'} | 
    Newton-Raphson: ${resNR.converged ? resNR.iters.length + ' iter ✔' : 'No convergió ✘'} | 
    Secante: ${resSec.converged ? resSec.iters.length + ' iter ✔' : 'No convergió ✘'}<br>
    Raíces: Bis=${resBis.x?.toFixed(6) ?? 'N/A'} | NR=${resNR.x?.toFixed(6) ?? 'N/A'} | Sec=${resSec.x?.toFixed(6) ?? 'N/A'}
  `;
}

// ─── Init ─────────────────────────────────────────────────
renderModelDesc();
renderParams();