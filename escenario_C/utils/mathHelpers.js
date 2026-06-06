// utils/mathHelpers.js

export function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function generarRango(inicio, fin, paso = 0.5) {
    const resultado = [];
    for (let i = inicio; i <= fin; i += paso) {
        resultado.push(redondear(i, 1));
    }
    return resultado;
}

export function calcularIncrementoPorcentual(inicial, final) {
    if (inicial === 0) return 0;
    return ((final - inicial) / inicial) * 100;
}

// Datos por defecto para cada producto
export const productosDataDefault = {
    "Papa": [
        { x: 1, y: 8 },
        { x: 5, y: 10 },
        { x: 10, y: 13 },
        { x: 15, y: 16 },
        { x: 20, y: 19 },
        { x: 30, y: 22 }
    ],
    "Arroz": [
        { x: 1, y: 6 },
        { x: 5, y: 7 },
        { x: 10, y: 8.5 },
        { x: 15, y: 10 },
        { x: 20, y: 11 },
        { x: 30, y: 13 }
    ],
    "Aceite": [
        { x: 1, y: 12 },
        { x: 5, y: 13 },
        { x: 10, y: 14.5 },
        { x: 15, y: 16 },
        { x: 20, y: 18 },
        { x: 30, y: 22 }
    ],
    "Pan": [
        { x: 1, y: 2 },
        { x: 5, y: 2.5 },
        { x: 10, y: 3 },
        { x: 15, y: 3.5 },
        { x: 20, y: 4 },
        { x: 30, y: 5 }
    ],
    "Azúcar": [
        { x: 1, y: 5 },
        { x: 5, y: 5.5 },
        { x: 10, y: 6.5 },
        { x: 15, y: 7.5 },
        { x: 20, y: 8.5 },
        { x: 30, y: 11 }
    ],
    "Carne": [
        { x: 1, y: 25 },
        { x: 5, y: 27 },
        { x: 10, y: 30 },
        { x: 15, y: 33 },
        { x: 20, y: 36 },
        { x: 30, y: 42 }
    ]
};

export function getDefaultPuntos(productoNombre) {
    if (productosDataDefault[productoNombre]) {
        return JSON.parse(JSON.stringify(productosDataDefault[productoNombre]));
    }
    return [
        { x: 1, y: 10 },
        { x: 10, y: 15 },
        { x: 20, y: 20 },
        { x: 30, y: 25 }
    ];
}