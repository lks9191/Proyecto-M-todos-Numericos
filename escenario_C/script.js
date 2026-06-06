// ==========================================
// 1. UTILIDADES MATEMÁTICAS Y DATOS
// ==========================================

function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function generarRango(inicio, fin, paso = 0.5) {
    const resultado = [];
    for (let i = inicio; i <= fin; i += paso) {
        resultado.push(redondear(i, 1));
    }
    return resultado;
}

function calcularIncrementoPorcentual(inicial, final) {
    if (inicial === 0) return 0;
    return ((final - inicial) / inicial) * 100;
}

const productosDataDefault = {
    "Papa": [
        { x: 1, y: 8 }, { x: 5, y: 10 }, { x: 10, y: 13 },
        { x: 15, y: 16 }, { x: 20, y: 19 }, { x: 30, y: 22 }
    ],
    "Arroz": [
        { x: 1, y: 6 }, { x: 5, y: 7 }, { x: 10, y: 8.5 },
        { x: 15, y: 10 }, { x: 20, y: 11 }, { x: 30, y: 13 }
    ],
    "Aceite": [
        { x: 1, y: 12 }, { x: 5, y: 13 }, { x: 10, y: 14.5 },
        { x: 15, y: 16 }, { x: 20, y: 18 }, { x: 30, y: 22 }
    ],
    "Pan": [
        { x: 1, y: 2 }, { x: 5, y: 2.5 }, { x: 10, y: 3 },
        { x: 15, y: 3.5 }, { x: 20, y: 4 }, { x: 30, y: 5 }
    ],
    "Azúcar": [
        { x: 1, y: 5 }, { x: 5, y: 5.5 }, { x: 10, y: 6.5 },
        { x: 15, y: 7.5 }, { x: 20, y: 8.5 }, { x: 30, y: 11 }
    ],
    "Carne": [
        { x: 1, y: 25 }, { x: 5, y: 27 }, { x: 10, y: 30 },
        { x: 15, y: 33 }, { x: 20, y: 36 }, { x: 30, y: 42 }
    ]
};

function getDefaultPuntos(productoNombre) {
    if (productosDataDefault[productoNombre]) {
        return JSON.parse(JSON.stringify(productosDataDefault[productoNombre]));
    }
    return [
        { x: 1, y: 10 }, { x: 10, y: 15 },
        { x: 20, y: 20 }, { x: 30, y: 25 }
    ];
}

// ==========================================
// 2. MÉTODOS NUMÉRICOS
// ==========================================

// --- Lagrange ---
function interpolacionLagrange(puntos, xEvaluar) {
    if (!puntos || puntos.length === 0) return 0;
    const n = puntos.length;
    let resultado = 0;
    
    for (let i = 0; i < n; i++) {
        let termino = puntos[i].y;
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                termino *= (xEvaluar - puntos[j].x) / (puntos[i].x - puntos[j].x);
            }
        }
        resultado += termino;
    }
    return redondear(resultado);
}

function generarCurvaLagrange(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length === 0) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        curva.push({
            x: redondear(x, 1),
            y: interpolacionLagrange(puntos, x)
        });
    }
    return curva;
}

// --- Newton ---
function calcularDiferenciasDivididas(puntos) {
    const n = puntos.length;
    const tabla = [];
    
    for (let i = 0; i < n; i++) {
        tabla[i] = [puntos[i].y];
    }
    
    for (let j = 1; j < n; j++) {
        for (let i = 0; i < n - j; i++) {
            const numerador = tabla[i+1][j-1] - tabla[i][j-1];
            const denominador = puntos[i+j].x - puntos[i].x;
            tabla[i][j] = denominador !== 0 ? numerador / denominador : 0;
        }
    }
    return tabla;
}

function interpolacionNewton(puntos, xEvaluar) {
    if (!puntos || puntos.length === 0) return 0;
    const n = puntos.length;
    const tabla = calcularDiferenciasDivididas(puntos);
    let resultado = tabla[0][0];
    let producto = 1;
    
    for (let i = 1; i < n; i++) {
        producto *= (xEvaluar - puntos[i-1].x);
        resultado += tabla[0][i] * producto;
    }
    return redondear(resultado);
}

function generarTablaNewtonFormateada(puntos) {
    const tabla = calcularDiferenciasDivididas(puntos);
    const n = puntos.length;
    
    const filas = [];
    for (let i = 0; i < n; i++) {
        const fila = { x: puntos[i].x, f0: redondear(tabla[i][0]) };
        for (let j = 1; j <= i; j++) {
            fila[`f${j}`] = redondear(tabla[i-j][j]);
        }
        filas.push(fila);
    }
    return { filas };
}

function generarCurvaNewton(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length === 0) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        curva.push({
            x: redondear(x, 1),
            y: interpolacionNewton(puntos, x)
        });
    }
    return curva;
}

// --- Splines Cúbicos ---
function calcularSplinesCubicos(puntos) {
    if (!puntos || puntos.length < 2) return [];
    
    const n = puntos.length;
    const h = [];
    const alpha = [];
    const l = [];
    const mu = [];
    const z = [];
    const a = [];
    const b = [];
    const c = [];
    const d = [];
    
    for (let i = 0; i < n; i++) a[i] = puntos[i].y;
    for (let i = 0; i < n - 1; i++) h[i] = puntos[i+1].x - puntos[i].x;
    
    for (let i = 1; i < n - 1; i++) {
        alpha[i] = (3 / h[i]) * (a[i+1] - a[i]) - (3 / h[i-1]) * (a[i] - a[i-1]);
    }
    
    l[0] = 1; mu[0] = 0; z[0] = 0;
    
    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (puntos[i+1].x - puntos[i-1].x) - h[i-1] * mu[i-1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i-1] * z[i-1]) / l[i];
    }
    
    l[n-1] = 1; z[n-1] = 0; c[n-1] = 0;
    
    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j+1];
        b[j] = (a[j+1] - a[j]) / h[j] - h[j] * (c[j+1] + 2 * c[j]) / 3;
        d[j] = (c[j+1] - c[j]) / (3 * h[j]);
    }
    
    const segmentos = [];
    for (let i = 0; i < n - 1; i++) {
        segmentos.push({
            intervalo: [puntos[i].x, puntos[i+1].x],
            a: a[i],
            b: b[i],
            c: c[i],
            d: d[i]
        });
    }
    return segmentos;
}

function interpolacionSplines(puntos, xEvaluar) {
    if (!puntos || puntos.length < 2) return null;
    
    const segmentos = calcularSplinesCubicos(puntos);
    if (segmentos.length === 0) return null;
    
    let segmento = null;
    for (let i = 0; i < segmentos.length; i++) {
        const [xi, xi1] = segmentos[i].intervalo;
        if (xEvaluar >= xi && xEvaluar <= xi1) {
            segmento = segmentos[i];
            break;
        }
    }
    
    if (!segmento && xEvaluar < segmentos[0].intervalo[0]) {
        segmento = segmentos[0];
    } else if (!segmento && xEvaluar > segmentos[segmentos.length-1].intervalo[1]) {
        segmento = segmentos[segmentos.length-1];
    }
    
    if (!segmento) return null;
    
    const xi = segmento.intervalo[0];
    const dx = xEvaluar - xi;
    
    const resultado = segmento.a + segmento.b * dx + segmento.c * Math.pow(dx, 2) + segmento.d * Math.pow(dx, 3);
    return redondear(resultado);
}

function generarCurvaSplines(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length < 2) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        const y = interpolacionSplines(puntos, x);
        if (y !== null) {
            curva.push({ x: redondear(x, 1), y: y });
        }
    }
    return curva;
}

// ==========================================
// 3. LÓGICA DE LA INTERFAZ
// ==========================================

let chartLagrange, chartNewton, chartSplines, chartComparacion;
let productos = [];
let productoActivo = null;
let puntosActuales = [];

function inicializarProductos() {
    productos = [
        { id: 'Papa', nombre: 'Papa', icono: '<i class="fas fa-seedling"></i>', puntos: null },
        { id: 'Arroz', nombre: 'Arroz', icono: '<i class="fas fa-bowl-food"></i>', puntos: null },
        { id: 'Aceite', nombre: 'Aceite', icono: '<i class="fas fa-flask"></i>', puntos: null },
        { id: 'Pan', nombre: 'Pan', icono: '<i class="fas fa-bread-slice"></i>', puntos: null },
        { id: 'Azucar', nombre: 'Azúcar', icono: '<i class="fas fa-cube"></i>', puntos: null },
        { id: 'Carne', nombre: 'Carne', icono: '<i class="fas fa-drumstick-bite"></i>', puntos: null }
    ];
    
    for (const prod of productos) {
        prod.puntos = JSON.parse(JSON.stringify(getDefaultPuntos(prod.id)));
    }
    
    productoActivo = 'Papa';
    cargarPuntosProductoActivo();
    renderizarProductosTabs();
}

function cargarPuntosProductoActivo() {
    const prod = productos.find(p => p.id === productoActivo);
    if (prod && prod.puntos) {
        puntosActuales = JSON.parse(JSON.stringify(prod.puntos));
        renderizarTablaEditable();
    }
}

function guardarPuntosProductoActual() {
    const prod = productos.find(p => p.id === productoActivo);
    if (prod) {
        prod.puntos = JSON.parse(JSON.stringify(puntosActuales));
    }
}

function renderizarProductosTabs() {
    const container = document.getElementById('productosTabs');
    container.innerHTML = '';
    
    productos.forEach(prod => {
        const btn = document.createElement('button');
        btn.className = `producto-tab ${productoActivo === prod.id ? 'active' : ''}`;
        btn.innerHTML = `${prod.icono} ${prod.nombre}`;
        btn.onclick = () => {
            guardarPuntosProductoActual();
            productoActivo = prod.id;
            cargarPuntosProductoActivo();
            renderizarProductosTabs();
            actualizarSimulacion();
        };
        container.appendChild(btn);
    });
}

function agregarNuevoProducto() {
    const customName = document.getElementById('productoCustom').value.trim();
    if (customName) {
        const newId = customName.replace(/\s/g, '_');
        productos.push({ 
            id: newId, 
            nombre: customName, 
            icono: '<i class="fas fa-box"></i>', 
            puntos: [
                { x: 1, y: 10 },
                { x: 10, y: 15 },
                { x: 20, y: 20 },
                { x: 30, y: 25 }
            ]
        });
        productoActivo = newId;
        cargarPuntosProductoActivo();
        renderizarProductosTabs();
        renderizarTablaEditable();
        document.getElementById('productoCustomContainer').style.display = 'none';
        document.getElementById('productoCustom').value = '';
        actualizarSimulacion();
    }
}

function eliminarProductoActivo() {
    if (productos.length <= 1) {
        alert('Debe haber al menos un producto');
        return;
    }
    const index = productos.findIndex(p => p.id === productoActivo);
    if (index !== -1) {
        productos.splice(index, 1);
        productoActivo = productos[0].id;
        cargarPuntosProductoActivo();
        renderizarProductosTabs();
        renderizarTablaEditable();
        actualizarSimulacion();
    }
}

function renderizarTablaEditable() {
    const tbody = document.getElementById('tablaPuntosBody');
    tbody.innerHTML = '';
    document.getElementById('puntosCount').innerText = `${puntosActuales.length} puntos`;
    
    puntosActuales.forEach((punto, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" class="edit-dia" value="${punto.x}" step="1" data-idx="${idx}" style="width:80px"></td>
            <td><input type="number" class="edit-precio" value="${punto.y}" step="0.2" data-idx="${idx}" style="width:80px"></td>
            <td><button class="btn-icon eliminar-fila" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    
    document.querySelectorAll('.edit-dia').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            puntosActuales[idx].x = parseFloat(e.target.value);
            ordenarPuntos();
            renderizarTablaEditable();
            guardarPuntosProductoActual();
            actualizarSimulacion();
        });
    });
    
    document.querySelectorAll('.edit-precio').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            puntosActuales[idx].y = parseFloat(e.target.value);
            guardarPuntosProductoActual();
            actualizarSimulacion();
        });
    });
    
    document.querySelectorAll('.eliminar-fila').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.idx);
            puntosActuales.splice(idx, 1);
            renderizarTablaEditable();
            guardarPuntosProductoActual();
            actualizarSimulacion();
        });
    });
}

function ordenarPuntos() {
    puntosActuales.sort((a, b) => a.x - b.x);
}

function agregarFila() {
    const maxDia = puntosActuales.length > 0 ? Math.max(...puntosActuales.map(p => p.x)) + 5 : 10;
    puntosActuales.push({ x: maxDia, y: 0 });
    renderizarTablaEditable();
    guardarPuntosProductoActual();
}

function cargarDefault() {
    const puntos = getDefaultPuntos(productoActivo);
    puntosActuales = JSON.parse(JSON.stringify(puntos));
    guardarPuntosProductoActual();
    renderizarTablaEditable();
    actualizarSimulacion();
}

function limpiarTodo() {
    puntosActuales = [];
    guardarPuntosProductoActual();
    renderizarTablaEditable();
    actualizarSimulacion();
}

function actualizarGrafico(chart, curva, puntos, titulo, color) {
    if (!chart) return;
    chart.data.labels = curva.map(p => p.x);
    chart.data.datasets = [
        { label: titulo, data: curva.map(p => p.y), borderColor: color, borderWidth: 2, tension: 0.1, pointRadius: 0, fill: false },
        { label: 'Datos conocidos', data: puntos.map(p => ({ x: p.x, y: p.y })), type: 'scatter', pointRadius: 6, pointBackgroundColor: '#ef4444', borderColor: '#ef4444', showLine: false }
    ];
    chart.update();
}

function inicializarGraficos() {
    const ctxL = document.getElementById('chartLagrange').getContext('2d');
    chartLagrange = new Chart(ctxL, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });
    
    const ctxN = document.getElementById('chartNewton').getContext('2d');
    chartNewton = new Chart(ctxN, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });
    
    const ctxS = document.getElementById('chartSplines').getContext('2d');
    chartSplines = new Chart(ctxS, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: true } });

    const ctxC = document.getElementById('chartComparacion').getContext('2d');
    chartComparacion = new Chart(ctxC, {
        type: 'scatter', 
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { type: 'linear' }
            }
        }
    });
}

function actualizarSimulacion() {
    if (puntosActuales.length < 2) {
        alert('Ingrese al menos 2 puntos para interpolar');
        return;
    }
    
    const diaInterpolar = parseFloat(document.getElementById('diaInterpolar').value);
    const rangoMin = parseFloat(document.getElementById('rangoMin').value);
    const rangoMax = parseFloat(document.getElementById('rangoMax').value);
    
    const puntosOrdenados = [...puntosActuales].sort((a, b) => a.x - b.x);
    const productoNombre = productos.find(p => p.id === productoActivo)?.nombre || productoActivo;
    
    const curvaLagrange = generarCurvaLagrange(puntosOrdenados, rangoMin, rangoMax, 0.2);
    const curvaNewton = generarCurvaNewton(puntosOrdenados, rangoMin, rangoMax, 0.2);
    const curvaSplines = generarCurvaSplines(puntosOrdenados, rangoMin, rangoMax, 0.2);
    
    const precioLagrange = interpolacionLagrange(puntosOrdenados, diaInterpolar);
    const precioNewton = interpolacionNewton(puntosOrdenados, diaInterpolar);
    const precioSplines = interpolacionSplines(puntosOrdenados, diaInterpolar);
    
    document.getElementById('lagrangeDia').innerText = diaInterpolar;
    document.getElementById('lagrangePrecio').innerHTML = `${precioLagrange} Bs`;
    document.getElementById('lagrangeGrado').innerHTML = `${puntosOrdenados.length - 1}`;
    
    document.getElementById('newtonDia').innerText = diaInterpolar;
    document.getElementById('newtonPrecio').innerHTML = `${precioNewton} Bs`;
    document.getElementById('newtonGrado').innerHTML = `${puntosOrdenados.length - 1}`;
    
    document.getElementById('splinesDia').innerText = diaInterpolar;
    document.getElementById('splinesPrecio').innerHTML = precioSplines !== null ? `${precioSplines} Bs` : 'No disponible';
    document.getElementById('splinesSegmentos').innerHTML = `${puntosOrdenados.length - 1}`;
    
    const { filas } = generarTablaNewtonFormateada(puntosOrdenados);
    const n = puntosOrdenados.length;

    const thead = document.getElementById('newtonThead');
    thead.innerHTML = '<tr><th>xᵢ</th>' + Array.from({ length: n }, (_, i) => `<th>f[${i}]</th>`).join('') + '</tr>';

    const tbody = document.getElementById('newtonTbody');
    tbody.innerHTML = filas.map((f, i) => {
        let celdas = `<td style="padding:4px">${f.x}</td>`;
        for (let col = 0; col < n; col++) {
            const val = f[`f${col}`];
            celdas += `<td style="padding:4px">${val !== undefined ? val : ''}</td>`;
        }
        return `<tr>${celdas}</tr>`;
    }).join('');
    
    actualizarGrafico(chartLagrange, curvaLagrange, puntosOrdenados, `Lagrange - ${productoNombre}`, '#3b82f6');
    actualizarGrafico(chartNewton, curvaNewton, puntosOrdenados, `Newton - ${productoNombre}`, '#10b981');
    actualizarGrafico(chartSplines, curvaSplines, puntosOrdenados, `Splines - ${productoNombre}`, '#f59e0b');
    
    if (chartComparacion && curvaLagrange.length) {
        chartComparacion.data.labels = [];  
        chartComparacion.data.datasets = [
            {
                label: 'Lagrange',
                data: curvaLagrange.map(p => ({ x: p.x, y: p.y })),
                borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0,
                type: 'line', showLine: true, fill: false
            },
            {
                label: 'Newton',
                data: curvaNewton.map(p => ({ x: p.x, y: p.y })),
                borderColor: '#10b981', borderWidth: 2, pointRadius: 0,
                type: 'line', showLine: true, fill: false
            },
            {
                label: 'Splines',
                data: curvaSplines.map(p => ({ x: p.x, y: p.y })),
                borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0,
                type: 'line', showLine: true, fill: false
            },
            {
                label: 'Datos',
                data: puntosOrdenados.map(p => ({ x: p.x, y: p.y })),
                type: 'scatter', pointRadius: 6,
                pointBackgroundColor: '#ef4444', borderColor: '#ef4444', showLine: false
            }
        ];
        chartComparacion.update();
    }
    
    let tablaPreciosDia = '<table class="mini-table"><thead><tr><th>Producto</th><th>Precio día ' + diaInterpolar + '</th><th>Incremento mensual</th></tr></thead><tbody>';
    
    const productosConData = [];
    for (const prod of productos) {
        if (prod.puntos && prod.puntos.length >= 2) {
            const prodPuntos = [...prod.puntos].sort((a, b) => a.x - b.x);
            const precioInterpolado = interpolacionLagrange(prodPuntos, diaInterpolar);
            const primerPrecio = prodPuntos[0].y;
            const ultimoPrecio = prodPuntos[prodPuntos.length - 1].y;
            const incremento = ((ultimoPrecio - primerPrecio) / primerPrecio * 100).toFixed(1);
            productosConData.push({
                nombre: prod.nombre,
                icono: prod.icono,
                precio: precioInterpolado,
                incremento: parseFloat(incremento),
                incrementoStr: incremento,
                tendencia: incremento > 0 ? '<i class="fas fa-arrow-trend-up" style="color:#10b981"></i>' : incremento < 0 ? '<i class="fas fa-arrow-trend-down" style="color:#ef4444"></i>' : '<i class="fas fa-minus" style="color:#6b7280"></i>'
            });
            tablaPreciosDia += `<tr>
                <td>${prod.icono} ${prod.nombre}</td>
                <td><strong>${precioInterpolado} Bs</strong></td>
                <td>${tendenciaIcono(parseFloat(incremento))} ${incremento}%</td>
            </tr>`;
        }
    }
    tablaPreciosDia += '</tbody></table>';
    
    function tendenciaIcono(inc) {
        if (inc > 10) return '<i class="fas fa-rocket" style="color:#f59e0b"></i>';
        if (inc > 0) return '<i class="fas fa-chart-line" style="color:#10b981"></i>';
        if (inc < 0) return '<i class="fas fa-chart-line" style="color:#ef4444"></i>';
        return '<i class="fas fa-equals" style="color:#6b7280"></i>';
    }
    
    productosConData.sort((a, b) => b.incremento - a.incremento);
    const mayorIncremento = productosConData[0];
    
    document.getElementById('respuestaPrecioDia').innerHTML = `
        <div style="max-height: 200px; overflow-y: auto;">
            ${tablaPreciosDia}
        </div>
        <small style="display:block; margin-top:8px;"><i class="fas fa-chart-simple"></i> Usando interpolación</small>
    `;
    
    let comportamientoHTML = '<div style="max-height: 200px; overflow-y: auto;"><table class="mini-table"><thead><tr><th>Producto</th><th>Precio inicial</th><th>Precio final</th><th>Variación</th><th>Tendencia</th></tr></thead><tbody>';
    for (const prod of productosConData) {
        const prodPuntos = [...productos.find(p => p.nombre === prod.nombre).puntos].sort((a, b) => a.x - b.x);
        const primero = prodPuntos[0].y;
        const ultimo = prodPuntos[prodPuntos.length - 1].y;
        comportamientoHTML += `<tr>
            <td>${prod.icono} ${prod.nombre}</td>
            <td>${primero} Bs</td>
            <td>${ultimo} Bs</td>
            <td><strong>${prod.incrementoStr}%</strong></td>
            <td>${prod.tendencia}</td>
        </tr>`;
    }
    comportamientoHTML += '</tbody></table></div>';
    document.getElementById('respuestaComportamiento').innerHTML = comportamientoHTML;
    
    if (mayorIncremento) {
        document.getElementById('respuestaMayorIncremento').innerHTML = `
            <div style="font-size:1.1rem;">
                <i class="fas fa-trophy" style="color:#f59e0b"></i> <strong>${mayorIncremento.icono} ${mayorIncremento.nombre}</strong><br>
                Incremento del <strong style="color:#dc2626">${mayorIncremento.incrementoStr}%</strong> en el período
            </div>
            <i class="fas fa-chart-line"></i> Análisis basado en datos de precios del mes
        `;
    } else {
        document.getElementById('respuestaMayorIncremento').innerHTML = 'No hay suficientes datos';
    }
    
    let confiabilidad = '';
    if (puntosOrdenados.length >= 5) {
        confiabilidad = `<i class="fas fa-check-circle" style="color:#10b981"></i> Alta confiabilidad dentro del rango [${puntosOrdenados[0].x}, ${puntosOrdenados[puntosOrdenados.length-1].x}]. Error estimado menor al 5% con puntos bien distribuidos.`;
    } else if (puntosOrdenados.length >= 3) {
        confiabilidad = `<i class="fas fa-triangle-exclamation" style="color:#f59e0b"></i> Confiabilidad media. Con ${puntosOrdenados.length} puntos, el polinomio es grado ${puntosOrdenados.length-1}. Agregar más puntos mejora la precisión.`;
    } else {
        confiabilidad = `<i class="fas fa-circle-exclamation" style="color:#dc2626"></i> Confiabilidad baja. Solo ${puntosOrdenados.length} puntos. Se recomienda al menos 3 puntos para una interpolación razonable.`;
    }
    document.getElementById('respuestaConfiabilidad').innerHTML = confiabilidad;
    
    let maxGap = 0;
    for (let i = 1; i < puntosOrdenados.length; i++) {
        const gap = puntosOrdenados[i].x - puntosOrdenados[i-1].x;
        if (gap > maxGap) maxGap = gap;
    }
    let dispersosMsg = '';
    if (maxGap > 15) {
        dispersosMsg = `<i class="fas fa-triangle-exclamation" style="color:#f59e0b"></i> Los datos tienen gaps de hasta ${maxGap} días. La interpolación puede ser poco precisa en esos tramos. Se recomienda splines cúbicos para mayor suavidad.`;
    } else if (maxGap > 7) {
        dispersosMsg = `<i class="fas fa-chart-line" style="color:#3b82f6"></i> Los datos tienen gaps moderados (${maxGap} días). La interpolación es aceptable pero con incertidumbre.`;
    } else {
        dispersosMsg = `<i class="fas fa-check-circle" style="color:#10b981"></i> Los datos están bien distribuidos (gap máximo ${maxGap} días). La interpolación es confiable.`;
    }
    document.getElementById('respuestaDispersos').innerHTML = dispersosMsg;
    
    document.getElementById('respuestaComparacionMetodos').innerHTML = `
        <strong>Lagrange/Newton:</strong> Resultados idénticos (polinomio grado ${puntosOrdenados.length-1}).<br>
        <strong><i class="fas fa-waveform"></i> Splines cúbicos:</strong> Curva más suave, evita oscilaciones. Recomendado para datos con tendencia no polinómica.<br>
        <strong><i class="fas fa-star" style="color:#f59e0b"></i> Mejor método:</strong> ${puntosOrdenados.length > 5 ? 'Splines cúbicos' : 'Lagrange/Newton'} para este caso.
    `;
    
    const primerPrecio = puntosOrdenados[0].y;
    const ultimoPrecio = puntosOrdenados[puntosOrdenados.length - 1].y;
    const incremento = ((ultimoPrecio - primerPrecio) / primerPrecio * 100).toFixed(1);
    
    document.getElementById('analisisTexto').innerHTML = `
        <p><strong><i class="fas fa-chart-line"></i> Análisis del modelo:</strong> La interpolación permite estimar precios en días sin medición. Para <strong>${productoNombre}</strong>, el precio pasó de ${primerPrecio} Bs a ${ultimoPrecio} Bs (${incremento}%).</p>
        <p><strong><i class="fas fa-triangle-exclamation"></i> Limitaciones:</strong> La interpolación polinómica puede oscilar (fenómeno de Runge) con muchos puntos equidistantes. Los splines cúbicos son más estables.</p>
        <p><strong><i class="fas fa-lightbulb"></i> Recomendación:</strong> Para análisis económico, usar splines cúbicos por su suavidad.</p>
    `;
    
    document.getElementById('conclusionesTexto').innerHTML = `
        <p><strong><i class="fas fa-check-circle" style="color:#10b981"></i> Conclusiones:</strong> La interpolación es una herramienta poderosa para reconstruir curvas de precios. Permite responder preguntas clave sobre el comportamiento del mercado.</p>
        <p><strong><i class="fas fa-triangle-exclamation"></i> Limitaciones del modelo:</strong> No considera factores externos (bloqueos, rumores). Asume que el comportamiento entre puntos sigue un polinomio o spline.</p>
    `;
}

function setupTabs() {
    document.querySelectorAll('.tablink').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.tablink').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tabcontent').forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.tab).classList.add('active');
            
            setTimeout(() => {
                if (chartLagrange) chartLagrange.resize();
                if (chartNewton) chartNewton.resize();
                if (chartSplines) chartSplines.resize();
                if (chartComparacion) chartComparacion.resize();
            }, 100);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarGraficos();
    setupTabs();
    inicializarProductos();
    
    document.getElementById('btnActualizar').addEventListener('click', actualizarSimulacion);
    document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);
    document.getElementById('btnCargarDefault').addEventListener('click', cargarDefault);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarTodo);
    document.getElementById('btnNuevoProducto').addEventListener('click', () => {
        document.getElementById('productoCustomContainer').style.display = 'flex';
    });
    document.getElementById('btnGuardarProducto').addEventListener('click', agregarNuevoProducto);
    document.getElementById('btnEliminarProducto').addEventListener('click', eliminarProductoActivo);
    
    actualizarSimulacion();
});