// Error "esperado" con su código HTTP. Ej: throw new ErrorHttp(400, 'Falta el nombre');
export class ErrorHttp extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

export const rutaNoEncontrada = (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
};

// Un solo lugar donde terminan todos los errores (Express 5 envía acá los errores de funciones async)
export const manejarErrores = (err, req, res, next) => {
    if (err instanceof ErrorHttp) {
        return res.status(err.estado).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'La imagen pesa demasiado (máximo 3 MB). Probá con una más liviana.' });
    }
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
    }
    console.error(err); // el detalle queda en tu terminal, no se le muestra al usuario
    res.status(500).json({ error: 'Error interno del servidor.' });
};
