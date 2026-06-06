/* ═══════════════════════════════════════════════════════════════
   metodos.js — Implementación de Euler, Heun y RK4
   Escenario B: R'(t) = E − C·(1 + α)  cuando R > 0
   ═══════════════════════════════════════════════════════════════ */

/**
 * f(t, R, params) — función del lado derecho de la EDO
 * R'(t) = entrada − consumo_total
 * El consumo total = tasaConsumo * (1 + factorPanico)
 * Si R <= 0 la planta ya está vacía, f = 0.
 */
function f(t, R, params) {
  if (R <= 0) return 0;
  const consumoTotal = params.tasaConsumo * (1 + params.factorPanico);
  return params.tasaEntrada - consumoTotal;
}

/* ──────────────────────────────────────────────────────────────
   MÉTODO DE EULER
   R_{i+1} = R_i + h * f(t_i, R_i)
   Retorna array de { i, t, R, fVal, estado }
────────────────────────────────────────────────────────────── */
function metodoEuler(params) {
  const { reservaInicial, nivelCritico, pasoH, tiempoTotal } = params;
  const n = Math.round(tiempoTotal / pasoH);
  const resultados = [];

  let R = reservaInicial;
  let t = 0;

  for (let i = 0; i <= n; i++) {
    const Rval = Math.max(0, R);
    const fVal = f(t, Rval, params);
    const estado = obtenerEstado(Rval, reservaInicial, nivelCritico);

    resultados.push({
      i,
      t: parseFloat(t.toFixed(6)),
      R: parseFloat(Rval.toFixed(2)),
      fVal: parseFloat(fVal.toFixed(2)),
      estado
    });

    if (Rval <= 0) break;

    // Avance Euler
    R = Rval + pasoH * fVal;
    t = parseFloat((t + pasoH).toFixed(8));
  }

  return resultados;
}

/* ──────────────────────────────────────────────────────────────
   MÉTODO DE HEUN (predictor-corrector)
   Predictor: R̃ = R_i + h * f(t_i, R_i)
   Corrector: R_{i+1} = R_i + (h/2)[f(t_i,R_i) + f(t_{i+1}, R̃)]
   Retorna array de { i, t, R, predictor, fInicio, fFin, estado }
────────────────────────────────────────────────────────────── */
function metodoHeun(params) {
  const { reservaInicial, nivelCritico, pasoH, tiempoTotal } = params;
  const n = Math.round(tiempoTotal / pasoH);
  const resultados = [];

  let R = reservaInicial;
  let t = 0;

  for (let i = 0; i <= n; i++) {
    const Rval    = Math.max(0, R);
    const fInicio = f(t, Rval, params);
    const estado  = obtenerEstado(Rval, reservaInicial, nivelCritico);

    // Predictor
    const tNext      = parseFloat((t + pasoH).toFixed(8));
    const predictor  = Math.max(0, Rval + pasoH * fInicio);
    const fFin       = f(tNext, predictor, params);

    resultados.push({
      i,
      t: parseFloat(t.toFixed(6)),
      R: parseFloat(Rval.toFixed(2)),
      predictor: parseFloat(predictor.toFixed(2)),
      fInicio: parseFloat(fInicio.toFixed(2)),
      fFin: parseFloat(fFin.toFixed(2)),
      estado
    });

    if (Rval <= 0) break;

    // Corrector
    R = Rval + (pasoH / 2) * (fInicio + fFin);
    t = tNext;
  }

  return resultados;
}

/* ──────────────────────────────────────────────────────────────
   MÉTODO RUNGE-KUTTA DE 4to ORDEN
   k1 = h * f(t_i,         R_i)
   k2 = h * f(t_i + h/2,   R_i + k1/2)
   k3 = h * f(t_i + h/2,   R_i + k2/2)
   k4 = h * f(t_i + h,     R_i + k3)
   R_{i+1} = R_i + (1/6)(k1 + 2k2 + 2k3 + k4)
   Retorna array de { i, t, R, k1, k2, k3, k4, estado }
────────────────────────────────────────────────────────────── */
function metodoRK4(params) {
  const { reservaInicial, nivelCritico, pasoH, tiempoTotal } = params;
  const n = Math.round(tiempoTotal / pasoH);
  const resultados = [];

  let R = reservaInicial;
  let t = 0;
  const h = pasoH;

  for (let i = 0; i <= n; i++) {
    const Rval  = Math.max(0, R);
    const estado = obtenerEstado(Rval, reservaInicial, nivelCritico);

    const k1 = h * f(t,           Rval,          params);
    const k2 = h * f(t + h / 2,   Rval + k1 / 2, params);
    const k3 = h * f(t + h / 2,   Rval + k2 / 2, params);
    const k4 = h * f(t + h,       Rval + k3,     params);

    resultados.push({
      i,
      t: parseFloat(t.toFixed(6)),
      R: parseFloat(Rval.toFixed(2)),
      k1: parseFloat(k1.toFixed(2)),
      k2: parseFloat(k2.toFixed(2)),
      k3: parseFloat(k3.toFixed(2)),
      k4: parseFloat(k4.toFixed(2)),
      estado
    });

    if (Rval <= 0) break;

    R = Rval + (1 / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t = parseFloat((t + h).toFixed(8));
  }

  return resultados;
}

/* ──────────────────────────────────────────────────────────────
   UTILIDADES
────────────────────────────────────────────────────────────── */

/**
 * Clasifica el estado de la reserva en tres niveles:
 * - 'normal'   : R > 30% de la reserva inicial
 * - 'warning'  : entre R_crit y 30% inicial
 * - 'critical' : R <= R_crit
 * - 'empty'    : R = 0
 */
function obtenerEstado(R, reservaInicial, nivelCritico) {
  if (R <= 0)                         return 'empty';
  if (R <= nivelCritico)              return 'critical';
  if (R <= reservaInicial * 0.30)     return 'warning';
  return 'normal';
}

/**
 * Busca el primer día donde R cae por debajo del nivel crítico.
 * Retorna { dia, valor } o null si nunca ocurre.
 */
function encontrarDiaCritico(resultados, nivelCritico) {
  for (const fila of resultados) {
    if (fila.R <= nivelCritico && fila.R > 0) {
      return { dia: fila.t, valor: fila.R };
    }
  }
  return null;
}

/**
 * Busca el día de vaciado total (R = 0).
 * Retorna el valor de t o null.
 */
function encontrarDiaVaciado(resultados) {
  for (const fila of resultados) {
    if (fila.R <= 0) return fila.t;
  }
  return null;
}

/**
 * Calcula el error relativo entre dos métodos (punto a punto).
 * Retorna array de { t, diffAbsoluta, diffRelativa }.
 */
function calcularDiferencias(resA, resB) {
  const diffs = [];
  const minLen = Math.min(resA.length, resB.length);
  for (let i = 0; i < minLen; i++) {
    const base = resB[i].R || 1;
    diffs.push({
      t: resA[i].t,
      diffAbsoluta: Math.abs(resA[i].R - resB[i].R),
      diffRelativa: (Math.abs(resA[i].R - resB[i].R) / base) * 100
    });
  }
  return diffs;
}

/**
 * Formatea un número grande con separador de miles.
 */
function formatNum(n, decimals = 0) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Dada una reserva R, devuelve el porcentaje respecto a la inicial.
 */
function porcentajeReserva(R, reservaInicial) {
  return ((R / reservaInicial) * 100).toFixed(1);
}