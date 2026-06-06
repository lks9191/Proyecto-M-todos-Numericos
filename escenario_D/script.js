// ==========================================
// 1. UTILIDADES MATEMÁTICAS Y DATOS
// ==========================================

function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function interpolarLineal(x0, y0, x1, y1, x) {
    if (x1 === x0) return y0;
    const t = (x - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
}

function generarCurvaContinua(dias, precios, rangoMin, rangoMax, paso = 0.2) {
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        let y = 0;
        if (x <= dias[0]) {
            y = precios[0];
        } else if (x >= dias[dias.length - 1]) {
            y = precios[precios.length - 1];
        } else {
            for (let i = 0; i < dias.length - 1; i++) {
                if (x >= dias[i] && x <= dias[i + 1]) {
                    y = interpolarLineal(dias[i], precios[i], dias[i + 1], precios[i + 1], x);
                    break;
                }
            }
        }
        curva.push({ x: redondear(x, 1), y: redondear(y, 2) });
    }
    return curva;
}

const productosDataDefault = {
    "Papa": { dias: [1, 5, 10, 15, 20, 30], precios: [8, 10, 13, 16, 19, 22], cantidad: 10 },
    "Arroz": { dias: [1, 5, 10, 15, 20, 30], precios: [6, 7, 8.5, 10, 11, 13], cantidad: 8 },
    "Aceite": { dias: [1, 5, 10, 15, 20, 30], precios: [12, 13, 14.5, 16, 18, 22], cantidad: 2 },
    "Pan": { dias: [1, 5, 10, 15, 20, 30], precios: [2, 2.5, 3, 3.5, 4, 5], cantidad: 30 },
    "Azucar": { dias: [1, 5, 10, 15, 20, 30], precios: [5, 5.5, 6.5, 7.5, 8.5, 11], cantidad: 5 },
    "Carne": { dias: [1, 5, 10, 15, 20, 30], precios: [25, 27, 30, 33, 36, 42], cantidad: 5 }
};

function getDefaultData(productoNombre) {
    if (productosDataDefault[productoNombre]) {
        const data = productosDataDefault[productoNombre];
        return {
            dias: [...data.dias],
            precios: [...data.precios],
            cantidad: data.cantidad
        };
    }
    return { dias: [1, 10, 20, 30], precios: [10, 15, 20, 25], cantidad: 5 };
}

// Función compartida para calcular el gasto
function calcularGastoTotal(integral, cantidadMensual, diasTotales = 30) {
    const precioPromedioDiario = integral / diasTotales;
    const gastoTotal = precioPromedioDiario * cantidadMensual;
    return {
        precioPromedio: redondear(precioPromedioDiario),
        gastoTotal: redondear(gastoTotal),
        area: integral
    };
}


// ==========================================
// 2. MÉTODOS DE INTEGRACIÓN
// ==========================================

function integracionTrapecioConDetalle(dias, precios) {
    if (!dias || !precios || dias.length < 2) return { integral: 0, detalles: [] };
    
    let integral = 0;
    const detalles = [];
    
    for (let i = 0; i < dias.length - 1; i++) {
        const h = dias[i + 1] - dias[i];
        const area = (h / 2) * (precios[i] + precios[i + 1]);
        integral += area;
        detalles.push({
            segmento: i + 1,
            intervalo: `[${dias[i]}, ${dias[i + 1]}]`,
            h: redondear(h),
            area: redondear(area)
        });
    }
    return { integral: redondear(integral), detalles };
}

function integracionSimpson13(dias, precios) {
    if (!dias || !precios || dias.length < 2) return 0;
    
    const n = dias.length;
    let integral = 0;
    let i = 0;
    
    while (i < n - 1) {
        if (i + 2 < n) {
            const h1 = dias[i + 1] - dias[i];
            const h2 = dias[i + 2] - dias[i + 1];
            
            if (Math.abs(h1 - h2) < 0.01) {
                const h = h1;
                const area = (h / 3) * (precios[i] + 4 * precios[i + 1] + precios[i + 2]);
                integral += area;
                i += 2;
            } else {
                const h = dias[i + 1] - dias[i];
                integral += (h / 2) * (precios[i] + precios[i + 1]);
                i++;
            }
        } else {
            const h = dias[i + 1] - dias[i];
            integral += (h / 2) * (precios[i] + precios[i + 1]);
            i++;
        }
    }
    return redondear(integral);
}

function integracionSimpson38(dias, precios) {
    if (!dias || !precios || dias.length < 2) return 0;
    
    const n = dias.length;
    let integral = 0;
    let i = 0;
    
    while (i < n - 1) {
        if (i + 3 < n) {
            const h1 = dias[i + 1] - dias[i];
            const h2 = dias[i + 2] - dias[i + 1];
            const h3 = dias[i + 3] - dias[i + 2];
            
            if (Math.abs(h1 - h2) < 0.01 && Math.abs(h2 - h3) < 0.01) {
                const h = h1;
                const area = (3 * h / 8) * (precios[i] + 3 * precios[i + 1] + 3 * precios[i + 2] + precios[i + 3]);
                integral += area;
                i += 3;
            } else {
                const h = dias[i + 1] - dias[i];
                integral += (h / 2) * (precios[i] + precios[i + 1]);
                i++;
            }
        } else {
            const h = dias[i + 1] - dias[i];
            integral += (h / 2) * (precios[i] + precios[i + 1]);
            i++;
        }
    }
    return redondear(integral);
}


// ==========================================
// 3. LÓGICA DE LA INTERFAZ Y GRÁFICOS
// ==========================================

let chartTrapecio, chartSimpson13, chartSimpson38, chartComparacion;
let productos = [];
let productoEditando = null;
let puntosActuales = [];

function inicializarProductos() {
    const nombres = ['Papa', 'Arroz', 'Aceite', 'Pan', 'Azucar', 'Carne'];
    productos = [];
    for (const nombre of nombres) {
        const data = getDefaultData(nombre);
        productos.push({
            id: nombre,
            nombre: nombre,
            icono: obtenerIcono(nombre),
            cantidad: data.cantidad,
            seleccionado: true,
            dias: [...data.dias],
            precios: [...data.precios]
        });
    }
    productoEditando = 'Papa';
    cargarPuntosProductoActivo();
    renderizarSeleccionProductos();
    renderizarSelectorProductos();
}

function obtenerIcono(nombre) {
    const iconos = {
        'Papa': '🥔', 'Arroz': '🍚', 'Aceite': '🫒', 'Pan': '🍞', 'Azucar': '🍬', 'Carne': '🥩'
    };
    return iconos[nombre] || '📦';
}

function cargarPuntosProductoActivo() {
    const prod = productos.find(p => p.nombre === productoEditando);
    if (prod) {
        puntosActuales = prod.dias.map((dia, idx) => ({ x: dia, y: prod.precios[idx] }));
        renderizarTablaEditable();
        document.getElementById('productoEditandoNombre').innerHTML = `${prod.icono} ${prod.nombre}`;
        document.getElementById('cantidadMensual').value = prod.cantidad;
        document.getElementById('puntosCount').innerText = `${puntosActuales.length} puntos`;
    }
}

function guardarPuntosProductoActual() {
    const prod = productos.find(p => p.nombre === productoEditando);
    if (prod && puntosActuales.length >= 2) {
        const ordenados = [...puntosActuales].sort((a, b) => a.x - b.x);
        prod.dias = ordenados.map(p => p.x);
        prod.precios = ordenados.map(p => p.y);
        prod.cantidad = parseFloat(document.getElementById('cantidadMensual').value) || prod.cantidad;
    }
}

function renderizarTablaEditable() {
    const tbody = document.getElementById('tablaPuntosBody');
    tbody.innerHTML = '';
    
    puntosActuales.forEach((punto, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" class="edit-dia" value="${punto.x}" step="1" data-idx="${idx}" style="width:80px"></td>
            <td><input type="number" class="edit-precio" value="${punto.y}" step="0.5" data-idx="${idx}" style="width:80px"></td>
            <td><button class="btn-icon eliminar-fila" data-idx="${idx}"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    
    document.querySelectorAll('.edit-dia').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            puntosActuales[idx].x = parseFloat(e.target.value);
            ordenarPuntos();
            renderizarTablaEditable();
        });
    });
    
    document.querySelectorAll('.edit-precio').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            puntosActuales[idx].y = parseFloat(e.target.value);
        });
    });
    
    document.querySelectorAll('.eliminar-fila').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.idx);
            puntosActuales.splice(idx, 1);
            renderizarTablaEditable();
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
}

function cargarDefault() {
    const data = getDefaultData(productoEditando);
    puntosActuales = data.dias.map((dia, idx) => ({ x: dia, y: data.precios[idx] }));
    renderizarTablaEditable();
    document.getElementById('cantidadMensual').value = data.cantidad;
}

function limpiarTodo() {
    puntosActuales = [];
    renderizarTablaEditable();
}

function renderizarSeleccionProductos() {
    const container = document.getElementById('productosSeleccion');
    container.innerHTML = '';
    for (const prod of productos) {
        const div = document.createElement('div');
        div.className = 'producto-check-item';
        div.innerHTML = `
            <input type="checkbox" id="prod${prod.id}" ${prod.seleccionado ? 'checked' : ''}>
            <label>${prod.icono} ${prod.nombre}</label>
        `;
        container.appendChild(div);
        document.getElementById(`prod${prod.id}`).addEventListener('change', (e) => {
            prod.seleccionado = e.target.checked;
            actualizarSimulacion();
        });
    }
}

function renderizarSelectorProductos() {
    const selector = document.getElementById('selectorProductoEditar');
    selector.innerHTML = '<option value="">Seleccionar producto...</option>';
    for (const prod of productos) {
        const option = document.createElement('option');
        option.value = prod.nombre;
        option.textContent = `${prod.icono} ${prod.nombre}`;
        selector.appendChild(option);
    }
}

function cambiarProductoEditar() {
    const selector = document.getElementById('selectorProductoEditar');
    const nuevo = selector.value;
    if (nuevo) {
        guardarPuntosProductoActual();
        productoEditando = nuevo;
        cargarPuntosProductoActivo();
        actualizarSimulacion();
    }
}

function agregarProductoPersonalizado() {
    const nombre = document.getElementById('nuevoProductoNombre').value.trim();
    const cantidad = parseFloat(document.getElementById('nuevoProductoCantidad').value) || 1;
    if (nombre) {
        productos.push({
            id: nombre.replace(/\s/g, '_'),
            nombre: nombre,
            icono: '📦',
            cantidad: cantidad,
            seleccionado: true,
            dias: [1, 10, 20, 30],
            precios: [10, 15, 20, 25]
        });
        renderizarSeleccionProductos();
        renderizarSelectorProductos();
        document.getElementById('nuevoProductoContainer').style.display = 'none';
        document.getElementById('nuevoProductoNombre').value = '';
        actualizarSimulacion();
    }
}

function actualizarGrafico(chart, curva, dias, precios, titulo, color) {
    if (!chart) return;
    chart.data.labels = curva.map(p => p.x);
    chart.data.datasets = [
        { label: titulo, data: curva.map(p => p.y), borderColor: color, borderWidth: 2, tension: 0.2, pointRadius: 0, fill: false },
        { label: 'Datos', data: dias.map((x, i) => ({ x: x, y: precios[i] })), type: 'scatter', pointRadius: 6, pointBackgroundColor: '#ef4444', borderColor: '#ef4444', showLine: false }
    ];
    chart.update();
}

function inicializarGraficos() {
    const ctxT = document.getElementById('chartTrapecio').getContext('2d');
    chartTrapecio = new Chart(ctxT, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
    const ctxS13 = document.getElementById('chartSimpson13').getContext('2d');
    chartSimpson13 = new Chart(ctxS13, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
    const ctxS38 = document.getElementById('chartSimpson38').getContext('2d');
    chartSimpson38 = new Chart(ctxS38, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
    const ctxC = document.getElementById('chartComparacion').getContext('2d');
    chartComparacion = new Chart(ctxC, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
}

function actualizarSimulacion() {
    const prodActual = productos.find(p => p.nombre === productoEditando);
    if (!prodActual || prodActual.dias.length < 2) return;
    
    const rangoMin = parseFloat(document.getElementById('rangoMin').value);
    const rangoMax = parseFloat(document.getElementById('rangoMax').value);
    
    // Calcular integrales
    const { integral: areaTrapecio, detalles } = integracionTrapecioConDetalle(prodActual.dias, prodActual.precios);
    const areaSimpson13 = integracionSimpson13(prodActual.dias, prodActual.precios);
    const areaSimpson38 = integracionSimpson38(prodActual.dias, prodActual.precios);
    
    const resultTrapecio = calcularGastoTotal(areaTrapecio, prodActual.cantidad, 30);
    const resultSimpson13 = calcularGastoTotal(areaSimpson13, prodActual.cantidad, 30);
    const resultSimpson38 = calcularGastoTotal(areaSimpson38, prodActual.cantidad, 30);
    
    // Actualizar UI
    document.getElementById('trapecioGastoTotal').innerHTML = `${resultTrapecio.gastoTotal} Bs`;
    document.getElementById('trapecioPrecioPromedio').innerHTML = `${resultTrapecio.precioPromedio} Bs/día`;
    document.getElementById('trapecioArea').innerHTML = `${areaTrapecio} Bs·día`;
    
    document.getElementById('simpson13GastoTotal').innerHTML = `${resultSimpson13.gastoTotal} Bs`;
    document.getElementById('simpson13PrecioPromedio').innerHTML = `${resultSimpson13.precioPromedio} Bs/día`;
    document.getElementById('simpson13Area').innerHTML = `${areaSimpson13} Bs·día`;
    
    document.getElementById('simpson38GastoTotal').innerHTML = `${resultSimpson38.gastoTotal} Bs`;
    document.getElementById('simpson38PrecioPromedio').innerHTML = `${resultSimpson38.precioPromedio} Bs/día`;
    document.getElementById('simpson38Area').innerHTML = `${areaSimpson38} Bs·día`;
    
    // Tabla de detalles del trapecio
    const tbody = document.querySelector('#tablaTrapecio tbody');
    tbody.innerHTML = detalles.map(d => `
        <tr><td>${d.segmento}</td><td>${d.intervalo}</td><td>${d.h}</td><td>${d.area}</td></tr>
    `).join('');

    
    // Interpretaciones
    document.getElementById('trapecioInterpretacion').innerHTML = `El área bajo la curva es ${areaTrapecio} Bs·día. Con una cantidad mensual de ${prodActual.cantidad} unidades, el gasto total es ${resultTrapecio.gastoTotal} Bs.`;
    document.getElementById('simpson13Interpretacion').innerHTML = `Simpson 1/3 estima un área de ${areaSimpson13} Bs·día, resultando en un gasto de ${resultSimpson13.gastoTotal} Bs.`;
    document.getElementById('simpson38Interpretacion').innerHTML = `Simpson 3/8 estima un área de ${areaSimpson38} Bs·día, resultando en un gasto de ${resultSimpson38.gastoTotal} Bs.`;
    
    // Gráficos
    const curva = generarCurvaContinua(prodActual.dias, prodActual.precios, rangoMin, rangoMax, 0.2);
    actualizarGrafico(chartTrapecio, curva, prodActual.dias, prodActual.precios, `Trapecio - ${prodActual.nombre}`, '#3b82f6');
    actualizarGrafico(chartSimpson13, curva, prodActual.dias, prodActual.precios, `Simpson 1/3 - ${prodActual.nombre}`, '#10b981');
    actualizarGrafico(chartSimpson38, curva, prodActual.dias, prodActual.precios, `Simpson 3/8 - ${prodActual.nombre}`, '#f59e0b');
    
    if (chartComparacion) {
        chartComparacion.data.labels = curva.map(p => p.x);
        chartComparacion.data.datasets = [
            { label: 'Curva de precios', data: curva.map(p => p.y), borderColor: '#2c7da0', borderWidth: 2, pointRadius: 0 },
            { label: 'Datos', data: prodActual.dias.map((x, i) => ({ x: x, y: prodActual.precios[i] })), type: 'scatter', pointRadius: 6, pointBackgroundColor: '#ef4444', showLine: false }
        ];
        chartComparacion.update();
    }
    
    // Cálculos para todos los productos seleccionados
    const seleccionados = productos.filter(p => p.seleccionado);
    let gastoRealTotal = 0, gastoSinInflacionTotal = 0;
    const gastosProd = [];
    
    for (const prod of seleccionados) {
        const area = integracionTrapecioConDetalle(prod.dias, prod.precios).integral;
        const precioProm = area / 30;
        const gastoReal = precioProm * prod.cantidad;
        const gastoSinInf = prod.precios[0] * prod.cantidad;
        gastoRealTotal += gastoReal;
        gastoSinInflacionTotal += gastoSinInf;
        gastosProd.push({ ...prod, gastoReal, gastoSinInf, diferencia: gastoReal - gastoSinInf, porcentaje: ((gastoReal - gastoSinInf) / gastoSinInf * 100) });
    }
    
    gastosProd.sort((a, b) => b.diferencia - a.diferencia);
    const perdida = gastoRealTotal - gastoSinInflacionTotal;
    
    // Tabla comparativa
    let tablaHTML = `<table class="comparison-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Gasto real</th><th>Gasto sin inflación</th><th>Diferencia</th><th>Incremento</th></tr></thead><tbody>`;
    for (const p of gastosProd) {
        tablaHTML += `<tr><td>${p.icono} ${p.nombre}</td><td>${p.cantidad}</td><td>${redondear(p.gastoReal)} Bs</td><td>${redondear(p.gastoSinInf)} Bs</td><td style="color:${p.diferencia>0?'#dc2626':'#10b981'}">${redondear(p.diferencia)} Bs</td><td>${p.porcentaje>0?'+':''}${redondear(p.porcentaje)}%</td></tr>`;
    }
    tablaHTML += `</tbody></table>`;
    document.getElementById('tablaComparativaProductos').innerHTML = tablaHTML;
    
    // Preguntas
    document.getElementById('respuestaGastoTotal').innerHTML = `<strong>${redondear(gastoRealTotal)} Bs</strong><br><small>Total para ${seleccionados.length} productos</small>`;
    document.getElementById('respuestaGastoSinInflacion').innerHTML = `<strong>${redondear(gastoSinInflacionTotal)} Bs</strong>`;
    document.getElementById('respuestaPerdidaPoder').innerHTML = `<strong>${redondear(perdida)} Bs</strong><br><small>${((perdida/gastoSinInflacionTotal)*100).toFixed(1)}% de pérdida</small>`;
    
    const metodos = [resultTrapecio.gastoTotal, resultSimpson13.gastoTotal, resultSimpson38.gastoTotal];
    const promMetodos = metodos.reduce((a,b)=>a+b,0)/3;
    const masPreciso = ['Trapecio', 'Simpson 1/3', 'Simpson 3/8'][metodos.reduce((iMin, x, i, arr) => Math.abs(x - promMetodos) < Math.abs(arr[iMin] - promMetodos) ? i : iMin, 0)];
    document.getElementById('respuestaMetodoPreciso').innerHTML = `<strong>${masPreciso}</strong>`;
    
    if (gastosProd[0]) {
        document.getElementById('respuestaProductoIncidente').innerHTML = `<strong>${gastosProd[0].icono} ${gastosProd[0].nombre}</strong><br><small>Impacto: ${redondear(gastosProd[0].diferencia)} Bs (${redondear(gastosProd[0].porcentaje)}%)</small>`;
    }
    
    document.getElementById('analisisTexto').innerHTML = `<p>La familia gasta actualmente ${redondear(gastoRealTotal)} Bs mensuales. Si los precios no hubieran subido, gastaría ${redondear(gastoSinInflacionTotal)} Bs. La pérdida del poder adquisitivo es de ${redondear(perdida)} Bs (${((perdida/gastoSinInflacionTotal)*100).toFixed(1)}%).</p><p>Los métodos de integración muestran diferencias menores al 5%. Simpson 1/3 y 3/8 son más precisos para curvas suaves.</p>`;
    document.getElementById('conclusionesTexto').innerHTML = `<p><strong>Conclusiones:</strong> La integración numérica permite calcular el gasto real considerando la variación de precios. El método más preciso es ${masPreciso}. El producto que más impacta el gasto es ${gastosProd[0]?.nombre}.</p><p><strong>Limitaciones:</strong> El modelo asume consumo constante y precios que siguen una interpolación lineal entre puntos conocidos.</p>`;
}

function guardarCambios() {
    guardarPuntosProductoActual();
    actualizarSimulacion();
}

function setupTabs() {
    document.querySelectorAll('.tablink').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.tablink').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tabcontent').forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.tab).classList.add('active');
            setTimeout(() => {
                if (chartTrapecio) chartTrapecio.resize();
                if (chartSimpson13) chartSimpson13.resize();
                if (chartSimpson38) chartSimpson38.resize();
                if (chartComparacion) chartComparacion.resize();
            }, 100);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarGraficos();
    setupTabs();
    inicializarProductos();
    
    document.getElementById('btnCalcular').addEventListener('click', guardarCambios);
    document.getElementById('btnGuardarPuntos').addEventListener('click', guardarCambios);
    document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);
    document.getElementById('btnCargarDefault').addEventListener('click', cargarDefault);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarTodo);
    document.getElementById('btnAgregarProducto').addEventListener('click', () => {
        document.getElementById('nuevoProductoContainer').style.display = 'flex';
    });
    document.getElementById('btnGuardarNuevoProducto').addEventListener('click', agregarProductoPersonalizado);
    document.getElementById('btnCambiarProducto').addEventListener('click', cambiarProductoEditar);
    
    actualizarSimulacion();
});