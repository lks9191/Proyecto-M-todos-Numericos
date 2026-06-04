/* ═══════════════════════════════════════════════════════════════
   simulador.js — Controlador principal de la UI
   Lee parámetros del formulario, llama a los métodos numéricos,
   construye tablas, KPIs y alimenta graficos.js
   ═══════════════════════════════════════════════════════════════ */

/* Estado global de los resultados (usado por graficos.js) */
window.simState = {
  euler: null,
  heun:  null,
  rk4:   null,
  params: null
};

/* ─────────────────────────────────────────────────────────────
   LEER PARÁMETROS DEL FORMULARIO
───────────────────────────────────────────────────────────── */
function leerParametros() {
  return {
    reservaInicial: parseFloat(document.getElementById('reservaInicial').value),
    nivelCritico:   parseFloat(document.getElementById('nivelCritico').value),
    tasaEntrada:    parseFloat(document.getElementById('tasaEntrada').value),
    tasaConsumo:    parseFloat(document.getElementById('tasaConsumo').value),
    factorPanico:   parseFloat(document.getElementById('factorPanico').value),
    pasoH:          parseFloat(document.getElementById('pasoH').value),
    tiempoTotal:    parseFloat(document.getElementById('tiempoTotal').value)
  };
}

/* ─────────────────────────────────────────────────────────────
   VALIDAR PARÁMETROS
───────────────────────────────────────────────────────────── */
function validarParametros(p) {
  if (isNaN(p.reservaInicial) || p.reservaInicial <= 0)
    return 'La reserva inicial debe ser mayor que 0.';
  if (isNaN(p.nivelCritico) || p.nivelCritico < 0)
    return 'El nivel crítico no puede ser negativo.';
  if (p.nivelCritico >= p.reservaInicial)
    return 'El nivel crítico debe ser menor que la reserva inicial.';
  if (isNaN(p.tasaEntrada) || p.tasaEntrada < 0)
    return 'La tasa de entrada no puede ser negativa.';
  if (isNaN(p.tasaConsumo) || p.tasaConsumo <= 0)
    return 'La tasa de consumo debe ser mayor que 0.';
  if (isNaN(p.pasoH) || p.pasoH <= 0)
    return 'El paso de tiempo h debe ser mayor que 0.';
  if (isNaN(p.tiempoTotal) || p.tiempoTotal <= 0)
    return 'El tiempo total debe ser mayor que 0.';
  if (p.pasoH > p.tiempoTotal)
    return 'El paso h no puede ser mayor que el tiempo total.';
  return null;
}

/* ─────────────────────────────────────────────────────────────
   PUNTO DE ENTRADA — llamado desde el botón
───────────────────────────────────────────────────────────── */
function ejecutarSimulacion() {
  const params = leerParametros();
  const error  = validarParametros(params);

  if (error) {
    alert('Parámetro inválido: ' + error);
    return;
  }

  // Ejecutar los tres métodos
  const resEuler = metodoEuler(params);
  const resHeun  = metodoHeun(params);
  const resRK4   = metodoRK4(params);

  // Guardar en estado global para graficos.js
  window.simState = { euler: resEuler, heun: resHeun, rk4: resRK4, params };

  // Mostrar panel de resultados
  document.getElementById('emptyState').style.display    = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  // Construir cada sección
  construirAlertas(resEuler, resHeun, resRK4, params);
  construirKPIs('euler', resEuler, params);
  construirKPIs('heun',  resHeun,  params);
  construirKPIs('rk4',   resRK4,   params);
  construirTablaEuler(resEuler);
  construirTablaHeun(resHeun);
  construirTablaRK4(resRK4);
  construirTablaComparacion(resEuler, resHeun, resRK4, params);
  construirInterpretacion(resEuler, resHeun, resRK4, params);

  // Renderizar gráficas
  renderizarGraficas(resEuler, resHeun, resRK4, params);

  // Activar primera pestaña
  switchTab('euler', document.querySelector('.tab-btn'));
}

/* ─────────────────────────────────────────────────────────────
   ALERTAS GLOBALES
───────────────────────────────────────────────────────────── */
function construirAlertas(resEuler, resHeun, resRK4, params) {
  const container = document.getElementById('alertsRow');
  container.innerHTML = '';

  const criticoRK4 = encontrarDiaCritico(resRK4, params.nivelCritico);
  const vaciadoRK4 = encontrarDiaVaciado(resRK4);
  const consumoNet = params.tasaConsumo * (1 + params.factorPanico) - params.tasaEntrada;

  if (vaciadoRK4 !== null) {
    container.appendChild(chip('danger',
      `Vaciado total: día ${vaciadoRK4.toFixed(1)}`));
  }
  if (criticoRK4) {
    container.appendChild(chip('warning',
      `Nivel crítico alcanzado: día ${criticoRK4.dia.toFixed(1)}`));
  }
  if (consumoNet <= 0) {
    container.appendChild(chip('ok',
      'Entrada >= Consumo: reserva estable'));
  } else {
    container.appendChild(chip('warning',
      `Déficit neto: ${formatNum(consumoNet)} L/día`));
  }
}

function chip(tipo, texto) {
  const d = document.createElement('div');
  d.className = `alert-chip ${tipo}`;
  d.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    ${tipo === 'danger'  ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : ''}
    ${tipo === 'warning' ? '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>' : ''}
    ${tipo === 'ok'      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : ''}
  </svg>${texto}`;
  return d;
}

/* ─────────────────────────────────────────────────────────────
   KPIs POR MÉTODO
───────────────────────────────────────────────────────────── */
function construirKPIs(metodo, resultados, params) {
  const container = document.getElementById(`kpi-${metodo}`);
  container.innerHTML = '';

  const critico  = encontrarDiaCritico(resultados, params.nivelCritico);
  const vaciado  = encontrarDiaVaciado(resultados);
  const ultR     = resultados[resultados.length - 1].R;
  const pct      = porcentajeReserva(ultR, params.reservaInicial);

  container.appendChild(kpiCard(
    vaciado !== null ? `Día ${vaciado.toFixed(1)}` : '> ' + params.tiempoTotal,
    'Vaciado total',
    vaciado !== null ? 'danger' : 'ok'
  ));
  container.appendChild(kpiCard(
    critico ? `Día ${critico.dia.toFixed(1)}` : 'No alcanzado',
    'Nivel crítico',
    critico ? 'warn' : 'ok'
  ));
  container.appendChild(kpiCard(
    `${pct}%`,
    `Reserva final (${formatNum(ultR)} L)`,
    parseFloat(pct) < 10 ? 'danger' : parseFloat(pct) < 30 ? 'warn' : 'ok'
  ));
}

function kpiCard(valor, etiqueta, tipo = '') {
  const d = document.createElement('div');
  d.className = `kpi-card ${tipo}`;
  d.innerHTML = `<div class="kpi-val">${valor}</div><div class="kpi-label">${etiqueta}</div>`;
  return d;
}

/* ─────────────────────────────────────────────────────────────
   TABLA — EULER
───────────────────────────────────────────────────────────── */
function construirTablaEuler(resultados) {
  const tbody = document.querySelector('#table-euler tbody');
  tbody.innerHTML = '';

  // Mostrar máx 200 filas para no saturar el DOM
  const paso = Math.max(1, Math.floor(resultados.length / 200));

  resultados.forEach((row, idx) => {
    if (idx % paso !== 0 && idx !== resultados.length - 1) return;
    const tr = document.createElement('tr');
    if (row.estado === 'critical' || row.estado === 'empty') tr.classList.add('row-critical');
    tr.innerHTML = `
      <td>${row.i}</td>
      <td>${row.t.toFixed(2)}</td>
      <td>${formatNum(row.R)}</td>
      <td>${formatNum(row.fVal)}</td>
      <td>${badge(row.estado)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ─────────────────────────────────────────────────────────────
   TABLA — HEUN
───────────────────────────────────────────────────────────── */
function construirTablaHeun(resultados) {
  const tbody = document.querySelector('#table-heun tbody');
  tbody.innerHTML = '';
  const paso = Math.max(1, Math.floor(resultados.length / 200));

  resultados.forEach((row, idx) => {
    if (idx % paso !== 0 && idx !== resultados.length - 1) return;
    const tr = document.createElement('tr');
    if (row.estado === 'critical' || row.estado === 'empty') tr.classList.add('row-critical');
    tr.innerHTML = `
      <td>${row.i}</td>
      <td>${row.t.toFixed(2)}</td>
      <td>${formatNum(row.R)}</td>
      <td>${formatNum(row.predictor)}</td>
      <td>${badge(row.estado)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ─────────────────────────────────────────────────────────────
   TABLA — RK4
───────────────────────────────────────────────────────────── */
function construirTablaRK4(resultados) {
  const tbody = document.querySelector('#table-rk4 tbody');
  tbody.innerHTML = '';
  const paso = Math.max(1, Math.floor(resultados.length / 200));

  resultados.forEach((row, idx) => {
    if (idx % paso !== 0 && idx !== resultados.length - 1) return;
    const tr = document.createElement('tr');
    if (row.estado === 'critical' || row.estado === 'empty') tr.classList.add('row-critical');
    tr.innerHTML = `
      <td>${row.i}</td>
      <td>${row.t.toFixed(2)}</td>
      <td>${formatNum(row.R)}</td>
      <td>${formatNum(row.k1)}</td>
      <td>${formatNum(row.k2)}</td>
      <td>${formatNum(row.k3)}</td>
      <td>${formatNum(row.k4)}</td>
      <td>${badge(row.estado)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ─────────────────────────────────────────────────────────────
   TABLA — COMPARACIÓN
───────────────────────────────────────────────────────────── */
function construirTablaComparacion(resEuler, resHeun, resRK4, params) {
  const tbody = document.querySelector('#table-comparacion tbody');
  tbody.innerHTML = '';

  const minLen = Math.min(resEuler.length, resHeun.length, resRK4.length);
  const paso   = Math.max(1, Math.floor(minLen / 150));

  for (let i = 0; i < minLen; i++) {
    if (i % paso !== 0 && i !== minLen - 1) continue;
    const e  = resEuler[i];
    const h  = resHeun[i];
    const r  = resRK4[i];
    const dE = Math.abs(e.R - r.R);
    const dH = Math.abs(h.R - r.R);

    const tr = document.createElement('tr');
    const critico = r.R <= params.nivelCritico;
    if (critico) tr.classList.add('row-critical');
    tr.innerHTML = `
      <td>${e.t.toFixed(2)}</td>
      <td>${formatNum(e.R)}</td>
      <td>${formatNum(h.R)}</td>
      <td>${formatNum(r.R)}</td>
      <td style="color:var(--accent-amber)">${formatNum(dE, 1)}</td>
      <td style="color:var(--accent-blue)">${formatNum(dH, 1)}</td>`;
    tbody.appendChild(tr);
  }
}

/* ─────────────────────────────────────────────────────────────
   CAJA DE INTERPRETACIÓN
───────────────────────────────────────────────────────────── */
function construirInterpretacion(resEuler, resHeun, resRK4, params) {
  const box = document.getElementById('interpBox');
  box.innerHTML = '';

  const criticoE = encontrarDiaCritico(resEuler, params.nivelCritico);
  const criticoH = encontrarDiaCritico(resHeun,  params.nivelCritico);
  const criticoR = encontrarDiaCritico(resRK4,   params.nivelCritico);
  const vaciadoE = encontrarDiaVaciado(resEuler);
  const vaciadoH = encontrarDiaVaciado(resHeun);
  const vaciadoR = encontrarDiaVaciado(resRK4);

  const minLen = Math.min(resEuler.length, resHeun.length, resRK4.length);
  const diffs_EvsR = calcularDiferencias(resEuler, resRK4);
  const diffs_HvsR = calcularDiferencias(resHeun,  resRK4);
  const maxDiffE = Math.max(...diffs_EvsR.map(d => d.diffAbsoluta));
  const maxDiffH = Math.max(...diffs_HvsR.map(d => d.diffAbsoluta));

  const consumoNet = params.tasaConsumo * (1 + params.factorPanico) - params.tasaEntrada;
  const sistemaEstable = consumoNet <= 0;

  const h4 = document.createElement('h4');
  h4.textContent = 'Interpretación de resultados';
  box.appendChild(h4);

  const filas = [
    ['Sistema', sistemaEstable
      ? 'Estable — la entrada supera el consumo. Las reservas se mantienen o crecen.'
      : `Déficit de ${formatNum(consumoNet)} L/día — el sistema está en vaciado progresivo.`],
    ['Nivel crítico (RK4)', criticoR
      ? `Se alcanza el día ${criticoR.dia.toFixed(1)} con ${formatNum(criticoR.valor)} litros.`
      : 'No se alcanza durante el periodo simulado.'],
    ['Vaciado total', vaciadoR !== null
      ? `La planta se vacía el día ${vaciadoR.toFixed(1)} según RK4.`
      : 'La planta no llega a vaciarse en el periodo simulado.'],
    ['Error máx Euler vs RK4', `${formatNum(maxDiffE)} litros — ${maxDiffE > params.reservaInicial * 0.05 ? 'error significativo, reducir h.' : 'error aceptable para este h.'}`],
    ['Error máx Heun vs RK4',  `${formatNum(maxDiffH)} litros — ${maxDiffH > params.reservaInicial * 0.02 ? 'considerar h más pequeño.' : 'muy buena aproximación.'}`],
    ['Método más preciso', 'RK4 — cuarto orden. Para este modelo, con h ≤ 0.5 los tres métodos convergen satisfactoriamente.'],
    ['Diferencia Euler-Heun', `Heun corrige el error de Euler con un paso predictor-corrector adicional. La mejora es de hasta ${((maxDiffE - maxDiffH) / (maxDiffE || 1) * 100).toFixed(0)}%.`]
  ];

  filas.forEach(([label, texto]) => {
    const div = document.createElement('div');
    div.className = 'interp-row';
    div.innerHTML = `<span><strong>${label}</strong></span><span>${texto}</span>`;
    box.appendChild(div);
  });
}

/* ─────────────────────────────────────────────────────────────
   BADGE DE ESTADO
───────────────────────────────────────────────────────────── */
function badge(estado) {
  const labels = {
    normal:   'Normal',
    warning:  'Alerta',
    critical: 'Crítico',
    empty:    'Vacío'
  };
  return `<span class="status-badge ${estado}">${labels[estado] || estado}</span>`;
}

/* ─────────────────────────────────────────────────────────────
   CAMBIAR PESTAÑA
───────────────────────────────────────────────────────────── */
function switchTab(nombre, btn) {
  // Desactivar todos
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  // Activar el elegido
  document.getElementById(`tab-${nombre}`).classList.add('active');
  if (btn) btn.classList.add('active');

  // Si hay datos, re-renderizar la gráfica activa para evitar problemas de tamaño
  if (window.simState.euler && nombre !== 'comparacion') {
    setTimeout(() => reRenderChart(nombre), 50);
  }
}

/* ─────────────────────────────────────────────────────────────
   RESETEAR PARÁMETROS A VALORES POR DEFECTO
───────────────────────────────────────────────────────────── */
function resetearParametros() {
  document.getElementById('reservaInicial').value = 500000;
  document.getElementById('nivelCritico').value   = 50000;
  document.getElementById('tasaEntrada').value    = 30000;
  document.getElementById('tasaConsumo').value    = 50000;
  document.getElementById('factorPanico').value   = 0.2;
  document.getElementById('pasoH').value          = 0.5;
  document.getElementById('tiempoTotal').value    = 30;

  // Ocultar resultados
  document.getElementById('emptyState').style.display    = 'block';
  document.getElementById('resultsContent').style.display = 'none';
  window.simState = { euler: null, heun: null, rk4: null, params: null };
}