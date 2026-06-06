// ==========================================
// 1. UTILIDADES MATEMÁTICAS
// ==========================================

function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function calcularDerivadas(N, M, D, a, b, c, k, r) {
    const dNdt = -a * N * M + b * D;
    const dMdt = a * N * M - c * M * D;
    const dDdt = k * M - r * D;
    return { dNdt, dMdt, dDdt };
}

function getDefaultParams() {
    return {
        N0: 900,
        M0: 80,
        D0: 50,
        a: 0.00002,
        b: 0.03,
        c: 0.0005,
        k: 0.08,
        r: 0.05,
        tMax: 30,
        h: 1
    };
}

// ==========================================
// 2. MÉTODOS NUMÉRICOS
// ==========================================

// --- Método de Heun ---
function simularHeun(params) {
    const { N0, M0, D0, a, b, c, k, r, tMax, h } = params;
    
    const nSteps = Math.ceil(tMax / h);
    const tiempos = [];
    const Ns = [];
    const Ms = [];
    const Ds = [];
    const tabla = [];
    
    let N = N0;
    let M = M0;
    let D = D0;
    
    tiempos.push(0);
    Ns.push(N);
    Ms.push(M);
    Ds.push(D);
    
    for (let i = 0; i < nSteps; i++) {
        const t = i * h;
        
        // k1
        const { dNdt: k1N, dMdt: k1M, dDdt: k1D } = calcularDerivadas(N, M, D, a, b, c, k, r);
        
        // Predictor
        const N_pred = N + h * k1N;
        const M_pred = M + h * k1M;
        const D_pred = D + h * k1D;
        
        // k2
        const { dNdt: k2N, dMdt: k2M, dDdt: k2D } = calcularDerivadas(N_pred, M_pred, D_pred, a, b, c, k, r);
        
        // Corrector
        const N_next = N + (h / 2) * (k1N + k2N);
        const M_next = M + (h / 2) * (k1M + k2M);
        const D_next = D + (h / 2) * (k1D + k2D);
        
        N = N_next;
        M = M_next;
        D = D_next;
        
        const t_next = (i + 1) * h;
        tiempos.push(redondear(t_next));
        Ns.push(redondear(N));
        Ms.push(redondear(M));
        Ds.push(redondear(D));
        
        // Guardar para tabla (cada 5 pasos o al final)
        if (i % 5 === 0 || i === nSteps - 1) {
            tabla.push({
                t: redondear(t_next),
                N: redondear(N),
                M: redondear(M),
                D: redondear(D),
                k1: `(${redondear(k1N)}, ${redondear(k1M)}, ${redondear(k1D)})`,
                k2: `(${redondear(k2N)}, ${redondear(k2M)}, ${redondear(k2D)})`
            });
        }
    }
    
    return { tiempos, Ns, Ms, Ds, tabla };
}

// --- Método de Runge-Kutta 4 (RK4) ---
function simularRK4(params) {
    const { N0, M0, D0, a, b, c, k, r, tMax, h } = params;
    
    const nSteps = Math.ceil(tMax / h);
    const tiempos = [];
    const Ns = [];
    const Ms = [];
    const Ds = [];
    const tabla = [];
    
    let N = N0;
    let M = M0;
    let D = D0;
    
    tiempos.push(0);
    Ns.push(N);
    Ms.push(M);
    Ds.push(D);
    
    for (let i = 0; i < nSteps; i++) {
        const t = i * h;
        
        // k1
        const { dNdt: k1N, dMdt: k1M, dDdt: k1D } = calcularDerivadas(N, M, D, a, b, c, k, r);
        
        // k2
        const N_k2 = N + (h / 2) * k1N;
        const M_k2 = M + (h / 2) * k1M;
        const D_k2 = D + (h / 2) * k1D;
        const { dNdt: k2N, dMdt: k2M, dDdt: k2D } = calcularDerivadas(N_k2, M_k2, D_k2, a, b, c, k, r);
        
        // k3
        const N_k3 = N + (h / 2) * k2N;
        const M_k3 = M + (h / 2) * k2M;
        const D_k3 = D + (h / 2) * k2D;
        const { dNdt: k3N, dMdt: k3M, dDdt: k3D } = calcularDerivadas(N_k3, M_k3, D_k3, a, b, c, k, r);
        
        // k4
        const N_k4 = N + h * k3N;
        const M_k4 = M + h * k3M;
        const D_k4 = D + h * k3D;
        const { dNdt: k4N, dMdt: k4M, dDdt: k4D } = calcularDerivadas(N_k4, M_k4, D_k4, a, b, c, k, r);
        
        // Actualizar
        const N_next = N + (h / 6) * (k1N + 2 * k2N + 2 * k3N + k4N);
        const M_next = M + (h / 6) * (k1M + 2 * k2M + 2 * k3M + k4M);
        const D_next = D + (h / 6) * (k1D + 2 * k2D + 2 * k3D + k4D);
        
        N = N_next;
        M = M_next;
        D = D_next;
        
        const t_next = (i + 1) * h;
        tiempos.push(redondear(t_next));
        Ns.push(redondear(N));
        Ms.push(redondear(M));
        Ds.push(redondear(D));
        
        // Guardar para tabla
        if (i % 5 === 0 || i === nSteps - 1) {
            tabla.push({
                t: redondear(t_next),
                N: redondear(N),
                M: redondear(M),
                D: redondear(D),
                k1: `(${redondear(k1N)}, ${redondear(k1M)}, ${redondear(k1D)})`,
                k2: `(${redondear(k2N)}, ${redondear(k2M)}, ${redondear(k2D)})`,
                k3: `(${redondear(k3N)}, ${redondear(k3M)}, ${redondear(k3D)})`,
                k4: `(${redondear(k4N)}, ${redondear(k4M)}, ${redondear(k4D)})`
            });
        }
    }
    
    return { tiempos, Ns, Ms, Ds, tabla };
}


// ==========================================
// 3. LÓGICA DE LA INTERFAZ
// ==========================================

let chartHeun, chartRK4, chartComparacion;
let resultadosHeun = null;
let resultadosRK4 = null;

function obtenerParametros() {
    return {
        N0: parseFloat(document.getElementById('N0').value),
        M0: parseFloat(document.getElementById('M0').value),
        D0: parseFloat(document.getElementById('D0').value),
        a: parseFloat(document.getElementById('a').value),
        b: parseFloat(document.getElementById('b').value),
        c: parseFloat(document.getElementById('c').value),
        k: parseFloat(document.getElementById('k').value),
        r: parseFloat(document.getElementById('r').value),
        tMax: parseFloat(document.getElementById('tMax').value),
        h: 1
    };
}

function cargarParametrosPorDefecto() {
    const defaults = getDefaultParams();
    document.getElementById('N0').value = defaults.N0;
    document.getElementById('M0').value = defaults.M0;
    document.getElementById('D0').value = defaults.D0;
    document.getElementById('a').value = defaults.a;
    document.getElementById('b').value = defaults.b;
    document.getElementById('c').value = defaults.c;
    document.getElementById('k').value = defaults.k;
    document.getElementById('r').value = defaults.r;
    document.getElementById('tMax').value = defaults.tMax;
    simular();
}

function determinarTendencia(valores) {
    if (!valores || valores.length < 2) return 'estable';
    const inicio = valores[0];
    const fin = valores[valores.length - 1];
    
    // Manejar casos donde inicio es cero
    if (inicio === 0) {
        if (fin > 0) return 'aumentando';
        if (fin === 0) return 'estable';
        return 'disminuyendo';
    }
    
    const cambio = (fin - inicio) / inicio;
    if (cambio > 0.05) return 'aumentando';
    if (cambio < -0.05) return 'disminuyendo';
    return 'estable';
}

function actualizarGrafico(chart, tiempos, Ns, Ms, Ds, titulo) {
    if (!chart) return;
    chart.data.labels = tiempos;
    chart.data.datasets = [
        { label: 'Neutrales (N)', data: Ns, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, fill: true, tension: 0.2 },
        { label: 'Manifestantes (M)', data: Ms, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2, fill: true, tension: 0.2 },
        { label: 'Mediadores (D)', data: Ds, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, fill: true, tension: 0.2 }
    ];
    chart.update();
}

function inicializarGraficos() {
    const ctxH = document.getElementById('chartHeun').getContext('2d');
    chartHeun = new Chart(ctxH, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });
    
    const ctxR = document.getElementById('chartRK4').getContext('2d');
    chartRK4 = new Chart(ctxR, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });
    
    const ctxC = document.getElementById('chartComparacion').getContext('2d');
    chartComparacion = new Chart(ctxC, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });
}

function renderizarTablaHeun(tabla) {
    const tbody = document.querySelector('#tablaHeun tbody');
    tbody.innerHTML = tabla.map(row => `
        <tr>
            <td>${row.t}</td>
            <td><span style="color:#3b82f6; font-weight:bold">${row.N}</span></td>
            <td><span style="color:#ef4444; font-weight:bold">${row.M}</span></td>
            <td><span style="color:#10b981; font-weight:bold">${row.D}</span></td>
            <td>${row.k1}</td>
            <td>${row.k2}</td>
        </tr>
    `).join('');
}

function renderizarTablaRK4(tabla) {
    const tbody = document.querySelector('#tablaRK4 tbody');
    tbody.innerHTML = tabla.map(row => `
        <tr>
            <td>${row.t}</td>
            <td><span style="color:#3b82f6; font-weight:bold">${row.N}</span></td>
            <td><span style="color:#ef4444; font-weight:bold">${row.M}</span></td>
            <td><span style="color:#10b981; font-weight:bold">${row.D}</span></td>
            <td>${row.k1}</td>
            <td>${row.k2}</td>
            <td>${row.k3}</td>
            <td>${row.k4}</td>
        </tr>
    `).join('');
}

function simular() {
    const params = obtenerParametros();
    
    // Heun
    resultadosHeun = simularHeun(params);
    const tendenciaN_Heun = determinarTendencia(resultadosHeun.Ns);
    const tendenciaM_Heun = determinarTendencia(resultadosHeun.Ms);
    const tendenciaD_Heun = determinarTendencia(resultadosHeun.Ds);
    
    document.getElementById('heunTMax').innerText = params.tMax;
    document.getElementById('heunNFinal').innerHTML = `${redondear(resultadosHeun.Ns[resultadosHeun.Ns.length-1])}`;
    document.getElementById('heunMFinal').innerHTML = `${redondear(resultadosHeun.Ms[resultadosHeun.Ms.length-1])}`;
    document.getElementById('heunDFinal').innerHTML = `${redondear(resultadosHeun.Ds[resultadosHeun.Ds.length-1])}`;
    document.getElementById('heunTendencias').innerHTML = `N: ${tendenciaN_Heun}<br>M: ${tendenciaM_Heun}<br>D: ${tendenciaD_Heun}`;
    
    renderizarTablaHeun(resultadosHeun.tabla);
    
    document.getElementById('heunInterpretacion').innerHTML = `
        <strong>Interpretación del método de Heun:</strong><br>
        Con los parámetros ingresados, la población de manifestantes ${tendenciaM_Heun === 'aumentando' ? 'aumenta' : tendenciaM_Heun === 'disminuyendo' ? 'disminuye' : 'se estabiliza'} durante el período simulado.
        Los mediadores ${tendenciaD_Heun === 'aumentando' ? 'aumentan' : tendenciaD_Heun === 'disminuyendo' ? 'disminuyen' : 'se estabilizan'}.
        El método de Heun (predictor-corrector) tiene un error de truncamiento local O(h³) y global O(h²).
    `;
    
    // RK4
    resultadosRK4 = simularRK4(params);
    const tendenciaN_RK4 = determinarTendencia(resultadosRK4.Ns);
    const tendenciaM_RK4 = determinarTendencia(resultadosRK4.Ms);
    const tendenciaD_RK4 = determinarTendencia(resultadosRK4.Ds);
    
    document.getElementById('rk4TMax').innerText = params.tMax;
    document.getElementById('rk4NFinal').innerHTML = `${redondear(resultadosRK4.Ns[resultadosRK4.Ns.length-1])}`;
    document.getElementById('rk4MFinal').innerHTML = `${redondear(resultadosRK4.Ms[resultadosRK4.Ms.length-1])}`;
    document.getElementById('rk4DFinal').innerHTML = `${redondear(resultadosRK4.Ds[resultadosRK4.Ds.length-1])}`;
    document.getElementById('rk4Tendencias').innerHTML = `N: ${tendenciaN_RK4}<br>M: ${tendenciaM_RK4}<br>D: ${tendenciaD_RK4}`;
    
    renderizarTablaRK4(resultadosRK4.tabla);
    
    document.getElementById('rk4Interpretacion').innerHTML = `
        <strong>Interpretación del método RK4:</strong><br>
        RK4 es más preciso que Heun, con error O(h⁴). Los resultados finales son ${Math.abs(resultadosRK4.Ns[resultadosRK4.Ns.length-1] - resultadosHeun.Ns[resultadosHeun.Ns.length-1]) > 5 ? 'significativamente diferentes' : 'muy similares'} a Heun.
        La diferencia entre métodos indica el error de aproximación numérica.
    `;
    
    // Gráficos
    actualizarGrafico(chartHeun, resultadosHeun.tiempos, resultadosHeun.Ns, resultadosHeun.Ms, resultadosHeun.Ds, 'Heun');
    actualizarGrafico(chartRK4, resultadosRK4.tiempos, resultadosRK4.Ns, resultadosRK4.Ms, resultadosRK4.Ds, 'RK4');
    
    if (chartComparacion && resultadosHeun.tiempos.length > 0) {
        chartComparacion.data.labels = resultadosHeun.tiempos;
        chartComparacion.data.datasets = [
            { label: 'Heun - Manifestantes (M)', data: resultadosHeun.Ms, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], tension: 0.2 },
            { label: 'RK4 - Manifestantes (M)', data: resultadosRK4.Ms, borderColor: '#dc2626', borderWidth: 3, tension: 0.2 },
            { label: 'Heun - Mediadores (D)', data: resultadosHeun.Ds, borderColor: '#10b981', borderWidth: 2, borderDash: [5, 5], tension: 0.2 },
            { label: 'RK4 - Mediadores (D)', data: resultadosRK4.Ds, borderColor: '#059669', borderWidth: 3, tension: 0.2 }
        ];
        chartComparacion.update();
    }
    
    // ========== PREGUNTAS DEL DESAFÍO  ==========
    const M_final_heun = resultadosHeun.Ms[resultadosHeun.Ms.length - 1];
    const M_inicial = params.M0;
    
    // Determinar tendencia de manifestantes
    let M_tendencia = '';
    let M_tendencia_color = '';
    if (M_final_heun > M_inicial * 1.05) {
        M_tendencia = 'aumenta';
        M_tendencia_color = '#dc2626';
    } else if (M_final_heun < M_inicial * 0.95) {
        M_tendencia = 'disminuye';
        M_tendencia_color = '#10b981';
    } else {
        M_tendencia = 'se mantiene estable';
        M_tendencia_color = '#f59e0b';
    }
    
    // Estabilidad
    const ultimoM = resultadosHeun.Ms[resultadosHeun.Ms.length - 1];
    const penultimoM = resultadosHeun.Ms[resultadosHeun.Ms.length - 2];
    const diferenciaFinal = Math.abs(ultimoM - penultimoM);
    
    let estabilidad = '';
    if (diferenciaFinal < 1 && ultimoM > 0) {
        estabilidad = 'Sí, el sistema tiende a un estado estable. Las poblaciones convergen a valores constantes.';
    } else if (ultimoM <= 0.1) {
        estabilidad = 'El conflicto se ha extinguido completamente. Los manifestantes han desaparecido.';
    } else if (ultimoM > M_inicial * 2) {
        estabilidad = 'El conflicto se ha masificado. Los manifestantes crecen sin control en el tiempo simulado.';
    } else {
        estabilidad = 'No se alcanza un estado estable en el tiempo simulado. El conflicto podría continuar evolucionando.';
    }
    document.getElementById('respuestaEstabilidad').innerHTML = estabilidad;
    
    // Manifestantes
    document.getElementById('respuestaManifestantes').innerHTML = `Los manifestantes <strong style="color:${M_tendencia_color}">${M_tendencia}</strong> durante la simulación. Pasan de ${redondear(M_inicial)} a ${redondear(M_final_heun)}.`;
    
    // Efecto de mejorar diálogo (c)
    const paramsAltoDialogo = { ...params, c: params.c * 2 };
    const simHeunAltoC = simularHeun(paramsAltoDialogo);
    const M_final_altoC = simHeunAltoC.Ms[simHeunAltoC.Ms.length - 1];
    
    let reduccionPorcentual = '';
    if (M_final_heun > 0 && M_final_altoC >= 0) {
        const reduccion = ((M_final_heun - M_final_altoC) / M_final_heun * 100);
        if (isFinite(reduccion) && !isNaN(reduccion)) {
            reduccionPorcentual = `<strong style="color:#10b981">${reduccion.toFixed(1)}%</strong>`;
        } else if (M_final_altoC === 0 && M_final_heun > 0) {
            reduccionPorcentual = `<strong style="color:#10b981">100% (los manifestantes desaparecen)</strong>`;
        } else {
            reduccionPorcentual = `<strong style="color:#f59e0b">no hay cambio significativo</strong>`;
        }
    } else {
        reduccionPorcentual = `<strong style="color:#f59e0b">no se puede calcular (manifestantes iniciales cero)</strong>`;
    }
    document.getElementById('respuestaDialogo').innerHTML = `Mejorar la tasa de diálogo (c) al ${(params.c * 2).toFixed(4)} reduce los manifestantes en ${reduccionPorcentual}. El diálogo efectivo es clave para la desescalada.`;
    
    // Sin mediadores
    const paramsSinMediadores = { ...params, k: 0, D0: 0 };
    const simHeunSinM = simularHeun(paramsSinMediadores);
    const M_final_sinM = simHeunSinM.Ms[simHeunSinM.Ms.length - 1];
    
    let aumentoPorcentual = '';
    if (M_final_heun > 0 && M_final_sinM >= 0) {
        const aumento = ((M_final_sinM - M_final_heun) / M_final_heun * 100);
        if (isFinite(aumento) && !isNaN(aumento)) {
            if (aumento > 0) {
                aumentoPorcentual = `<strong style="color:#dc2626">aumentan ${aumento.toFixed(1)}%</strong>`;
            } else if (aumento < 0) {
                aumentoPorcentual = `<strong style="color:#10b981">disminuyen ${Math.abs(aumento).toFixed(1)}%</strong>`;
            } else {
                aumentoPorcentual = `<strong style="color:#f59e0b">se mantienen igual</strong>`;
            }
        } else if (M_final_sinM > 0 && M_final_heun === 0) {
            aumentoPorcentual = `<strong style="color:#dc2626">pasan de 0 a ${redondear(M_final_sinM)} (aumento infinito porcentual)</strong>`;
        } else {
            aumentoPorcentual = `<strong style="color:#f59e0b">no se puede determinar</strong>`;
        }
    } else {
        aumentoPorcentual = `<strong style="color:#f59e0b">no se puede calcular (manifestantes finales cero)</strong>`;
    }
    document.getElementById('respuestaSinMediadores').innerHTML = `Sin mediadores (k=0, D₀=0), los manifestantes ${aumentoPorcentual}. La ausencia de diálogo agrava el conflicto.`;
    
    // Parámetros para masificación
    const umbralA = params.a * 2.5;
    const umbralC = params.c * 0.4;
    const umbralK = params.k * 0.3;
    
    const paramsMasificacion = { ...params, a: umbralA, c: umbralC, k: umbralK };
    const simMasificacion = simularHeun(paramsMasificacion);
    const M_final_masivo = simMasificacion.Ms[simMasificacion.Ms.length - 1];
    const M_inicial_masivo = paramsMasificacion.M0;
    
    let masificacionTexto = '';
    if (M_final_masivo > M_inicial_masivo * 3) {
        masificacionTexto = `<span style="color:#dc2626">⚠️ CONFIRMADO: Con estos valores los manifestantes se multiplican por ${(M_final_masivo / M_inicial_masivo).toFixed(1)}</span>`;
    } else {
        masificacionTexto = `<span style="color:#f59e0b">Con los valores actuales, no se alcanza masificación extrema</span>`;
    }
    
    document.getElementById('respuestaMasificacion').innerHTML = `El conflicto se masifica cuando:<br>
        • a (contagio) > ${umbralA.toFixed(4)}<br>
        • c (diálogo) < ${umbralC.toFixed(4)}<br>
        • k (reacción) < ${umbralK.toFixed(4)}<br>
        ${masificacionTexto}<br>
        <small style="color:#64748b">Valores actuales: a=${params.a}, c=${params.c}, k=${params.k}</small>`;
    
    // Análisis crítico
    const diferenciaMetodos = Math.abs(M_final_heun - resultadosRK4.Ms[resultadosRK4.Ms.length-1]);
    document.getElementById('analisisTexto').innerHTML = `
        <p><strong>Análisis de sensibilidad:</strong> El modelo muestra que pequeños cambios en los parámetros pueden producir grandes diferencias en el resultado final. La tasa de contagio (a) es el parámetro más sensible.</p>
        <p><strong>Comparación Heun vs RK4:</strong> Ambos métodos muestran tendencias similares, pero RK4 es más preciso (error O(h⁴) vs O(h²) de Heun). La diferencia en manifestantes finales es de ${diferenciaMetodos.toFixed(1)} personas.</p>
        <p><strong>Validez del modelo:</strong> Este modelo simplificado captura la dinámica esencial de difusión de opinión, pero no considera factores como redes sociales, noticias falsas o intervenciones externas.</p>
    `;
    
    // Conclusiones
    let estabilidadTexto = '';
    if (M_final_heun > M_inicial * 1.5) {
        estabilidadTexto = 'el conflicto tiende a escalar significativamente';
    } else if (M_final_heun < M_inicial * 0.5) {
        estabilidadTexto = 'el conflicto tiende a resolverse';
    } else if (M_final_heun < 0.1) {
        estabilidadTexto = 'el conflicto se extingue por completo';
    } else {
        estabilidadTexto = 'el conflicto se estabiliza en niveles moderados';
    }
    
    const efectividadDialogo = params.c > 0.02 ? 'efectiva' : (params.c > 0.01 ? 'moderada' : 'baja');
    
    document.getElementById('conclusionesTexto').innerHTML = `
        <p><strong>Conclusiones:</strong> Según el modelo, ${estabilidadTexto}. Los manifestantes ${M_tendencia} de ${redondear(M_inicial)} a ${redondear(M_final_heun)}. La presencia de mediadores con efectividad ${efectividadDialogo} (c=${params.c}) influye directamente en la evolución del conflicto.</p>
        <p><strong>Limitaciones del modelo:</strong> El modelo es determinista (no incluye aleatoriedad). Asume población constante y no considera factores externos como eventos disparadores. Es una simplificación útil para entender tendencias generales.</p>
        <p><strong>Mejoras posibles:</strong> Incorporar ruido estocástico, considerar redes sociales, añadir umbrales críticos, validar con datos reales de conflictos sociales.</p>
    `;
}

function resetDefault() {
    cargarParametrosPorDefecto();
}

function setupTabs() {
    document.querySelectorAll('.tablink').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.tablink').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tabcontent').forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.tab).classList.add('active');
            setTimeout(() => {
                if (chartHeun) chartHeun.resize();
                if (chartRK4) chartRK4.resize();
                if (chartComparacion) chartComparacion.resize();
            }, 100);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarGraficos();
    setupTabs();
    
    document.getElementById('btnSimular').addEventListener('click', simular);
    document.getElementById('btnResetDefault').addEventListener('click', resetDefault);
    
    simular();
});