/* ═══════════════════════════════════════════════════════════════
   graficos.js — Renderizado de gráficas con Chart.js
   Escenario B: Reservas de carburantes
   ═══════════════════════════════════════════════════════════════ */

/* Registro de instancias para poder destruirlas antes de recrear */
const _charts = {};

/* Paleta de colores coherente con CSS */
const COLOR = {
  euler:   '#e8613a',
  heun:    '#4a8fc4',
  rk4:     '#3db882',
  critico: '#e84848',
  grid:    'rgba(255,255,255,0.05)',
  tick:    '#636b82',
  bg:      '#1e2230'
};

/* ─────────────────────────────────────────────────────────────
   CONFIG BASE DE CHART.JS
───────────────────────────────────────────────────────────── */
function baseOptions(nivelCritico, reservaInicial, titulo) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#9ba3b8',
          font: { family: "'DM Sans', sans-serif", size: 12 },
          usePointStyle: true, pointStyleWidth: 10, padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#13161e',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f0f2f7',
        bodyColor: '#9ba3b8',
        titleFont: { family: "'Syne', sans-serif", size: 13, weight: '700' },
        bodyFont: { family: "'DM Mono', monospace", size: 12 },
        padding: 12,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${Math.round(ctx.raw).toLocaleString('es-BO')} L`
        }
      },
      annotation: nivelCritico ? {
        annotations: {
          lineaCritica: {
            type: 'line', yMin: nivelCritico, yMax: nivelCritico,
            borderColor: COLOR.critico,
            borderWidth: 1.5, borderDash: [6, 4],
            label: {
              display: true, content: `Nivel crítico: ${Math.round(nivelCritico).toLocaleString('es-BO')} L`,
              color: COLOR.critico,
              font: { family: "'DM Mono', sans-serif", size: 11 },
              position: 'start', yAdjust: -12, backgroundColor: 'transparent'
            }
          }
        }
      } : {}
    },
    scales: {
      x: {
        grid: { color: COLOR.grid },
        ticks: {
          color: COLOR.tick,
          font: { family: "'DM Mono', monospace", size: 11 },
          maxTicksLimit: 15
        },
        title: {
          display: true, text: 'Tiempo (días)',
          color: '#636b82', font: { size: 12 }
        }
      },
      y: {
        grid: { color: COLOR.grid },
        ticks: {
          color: COLOR.tick,
          font: { family: "'DM Mono', monospace", size: 11 },
          callback: val => val.toLocaleString('es-BO')
        },
        title: {
          display: true, text: 'Reserva R(t) — litros',
          color: '#636b82', font: { size: 12 }
        },
        min: 0,
        suggestedMax: reservaInicial * 1.05
      }
    }
  };
}

/* ─────────────────────────────────────────────────────────────
   HELPER: extraer arrays de t y R de resultados
───────────────────────────────────────────────────────────── */
function extraerSeries(resultados, maxPuntos = 300) {
  const paso = Math.max(1, Math.floor(resultados.length / maxPuntos));
  const labels = [], data = [];
  resultados.forEach((r, i) => {
    if (i % paso === 0 || i === resultados.length - 1) {
      labels.push(r.t.toFixed(2));
      data.push(r.R);
    }
  });
  return { labels, data };
}

/* ─────────────────────────────────────────────────────────────
   CREAR O RE-CREAR UN CHART
───────────────────────────────────────────────────────────── */
function crearChart(canvasId, config) {
  if (_charts[canvasId]) {
    _charts[canvasId].destroy();
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  _charts[canvasId] = new Chart(ctx, config);
  return _charts[canvasId];
}

/* ─────────────────────────────────────────────────────────────
   GRÁFICO — EULER
───────────────────────────────────────────────────────────── */
function renderizarEuler(resEuler, params) {
  const { labels, data } = extraerSeries(resEuler);
  crearChart('chart-euler', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Euler — R(t)',
        data,
        borderColor: COLOR.euler,
        backgroundColor: `${COLOR.euler}18`,
        borderWidth: 2.5,
        pointRadius: 0, pointHoverRadius: 5,
        fill: true, tension: 0.2
      }]
    },
    options: baseOptions(params.nivelCritico, params.reservaInicial, 'Euler')
  });
}

/* ─────────────────────────────────────────────────────────────
   GRÁFICO — HEUN
───────────────────────────────────────────────────────────── */
function renderizarHeun(resHeun, params) {
  const { labels, data } = extraerSeries(resHeun);
  crearChart('chart-heun', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Heun — R(t)',
        data,
        borderColor: COLOR.heun,
        backgroundColor: `${COLOR.heun}18`,
        borderWidth: 2.5,
        pointRadius: 0, pointHoverRadius: 5,
        fill: true, tension: 0.2
      }]
    },
    options: baseOptions(params.nivelCritico, params.reservaInicial, 'Heun')
  });
}

/* ─────────────────────────────────────────────────────────────
   GRÁFICO — RK4
───────────────────────────────────────────────────────────── */
function renderizarRK4(resRK4, params) {
  const { labels, data } = extraerSeries(resRK4);
  crearChart('chart-rk4', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'RK4 — R(t)',
        data,
        borderColor: COLOR.rk4,
        backgroundColor: `${COLOR.rk4}18`,
        borderWidth: 2.5,
        pointRadius: 0, pointHoverRadius: 5,
        fill: true, tension: 0.2
      }]
    },
    options: baseOptions(params.nivelCritico, params.reservaInicial, 'RK4')
  });
}

/* ─────────────────────────────────────────────────────────────
   GRÁFICO — COMPARACIÓN (los 3 juntos)
───────────────────────────────────────────────────────────── */
function renderizarComparacion(resEuler, resHeun, resRK4, params) {
  const e = extraerSeries(resEuler);
  const h = extraerSeries(resHeun);
  const r = extraerSeries(resRK4);

  // Usar los labels del método con más puntos como eje x
  const labelsRef = r.labels.length >= e.labels.length ? r.labels : e.labels;

  const opts = baseOptions(params.nivelCritico, params.reservaInicial, 'Comparación');

  // Ajustar leyenda para comparación
  opts.plugins.legend.labels.padding = 24;

  crearChart('chart-comparacion', {
    type: 'line',
    data: {
      labels: labelsRef,
      datasets: [
        {
          label: 'Euler',
          data: e.data,
          borderColor: COLOR.euler,
          backgroundColor: 'transparent',
          borderWidth: 2, borderDash: [6, 3],
          pointRadius: 0, pointHoverRadius: 5,
          tension: 0.2
        },
        {
          label: 'Heun',
          data: h.data,
          borderColor: COLOR.heun,
          backgroundColor: 'transparent',
          borderWidth: 2, borderDash: [3, 3],
          pointRadius: 0, pointHoverRadius: 5,
          tension: 0.2
        },
        {
          label: 'RK4 (referencia)',
          data: r.data,
          borderColor: COLOR.rk4,
          backgroundColor: `${COLOR.rk4}12`,
          borderWidth: 3,
          pointRadius: 0, pointHoverRadius: 6,
          fill: true, tension: 0.2
        }
      ]
    },
    options: opts
  });
}

/* ─────────────────────────────────────────────────────────────
   PUNTO DE ENTRADA — llamado desde simulador.js
───────────────────────────────────────────────────────────── */
function renderizarGraficas(resEuler, resHeun, resRK4, params) {
  // Pequeño delay para que el DOM esté visible antes de dibujar
  setTimeout(() => {
    renderizarEuler(resEuler, params);
    renderizarHeun(resHeun, params);
    renderizarRK4(resRK4, params);
    renderizarComparacion(resEuler, resHeun, resRK4, params);
  }, 80);
}

/* ─────────────────────────────────────────────────────────────
   RE-RENDER de un chart individual (al cambiar de pestaña)
───────────────────────────────────────────────────────────── */
function reRenderChart(nombre) {
  const s = window.simState;
  if (!s || !s.params) return;
  if (nombre === 'euler')       renderizarEuler(s.euler, s.params);
  else if (nombre === 'heun')   renderizarHeun(s.heun, s.params);
  else if (nombre === 'rk4')    renderizarRK4(s.rk4, s.params);
  else if (nombre === 'comparacion') renderizarComparacion(s.euler, s.heun, s.rk4, s.params);
}