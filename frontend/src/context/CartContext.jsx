import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CLAVE = 'carrito';

const cargarGuardado = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

// Cada item: { id_variante, id_producto, nombre, talle, color, precio, stock, imagen_url, cantidad }
// OJO: el precio guardado acá es solo para mostrar. Al comprar, el servidor usa el precio real de la base.
export function CartProvider({ children }) {
  const [items, setItems] = useState(cargarGuardado);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      // sin localStorage: el carrito dura hasta recargar
    }
  }, [items]);

  const agregar = useCallback((item, cantidad = 1) => {
    setItems((previos) => {
      const posicion = previos.findIndex((x) => x.id_variante === item.id_variante);
      if (posicion === -1) {
        return [...previos, { ...item, cantidad: Math.min(cantidad, item.stock) }];
      }
      const copia = [...previos];
      copia[posicion] = {
        ...copia[posicion],
        stock: item.stock,
        cantidad: Math.min(copia[posicion].cantidad + cantidad, item.stock),
      };
      return copia;
    });
  }, []);

  const cambiarCantidad = useCallback((idVariante, cantidad) => {
    setItems((previos) =>
      cantidad < 1
        ? previos.filter((x) => x.id_variante !== idVariante)
        : previos.map((x) => (x.id_variante === idVariante ? { ...x, cantidad: Math.min(cantidad, x.stock) } : x))
    );
  }, []);

  const quitar = useCallback((idVariante) => {
    setItems((previos) => previos.filter((x) => x.id_variante !== idVariante));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const valor = useMemo(
    () => ({
      items,
      cantidadTotal: items.reduce((suma, x) => suma + x.cantidad, 0),
      subtotal: items.reduce((suma, x) => suma + x.precio * x.cantidad, 0),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [items, agregar, cambiarCantidad, quitar, vaciar]
  );

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
