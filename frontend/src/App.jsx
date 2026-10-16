import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Catalogo from './pages/Catalogo.jsx';
import ProductoDetalle from './pages/ProductoDetalle.jsx';
import Carrito from './pages/Carrito.jsx';
import Ingresar from './pages/Ingresar.jsx';
import Registro from './pages/Registro.jsx';
import OlvidePassword from './pages/OlvidePassword.jsx';
import RestablecerPassword from './pages/RestablecerPassword.jsx';
import RutaAdmin from './components/RutaAdmin.jsx';
import RutaPrivada from './components/RutaPrivada.jsx';
import Checkout from './pages/Checkout.jsx';
import MisPedidos from './pages/MisPedidos.jsx';
import PedidoDetalle from './pages/PedidoDetalle.jsx';
import AdminCategorias from './pages/admin/AdminCategorias.jsx';
import AdminConfiguracion from './pages/admin/AdminConfiguracion.jsx';
import AdminPedidos from './pages/admin/AdminPedidos.jsx';
import AdminProductos from './pages/admin/AdminProductos.jsx';
import AdminProductoForm from './pages/admin/AdminProductoForm.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenedor pagina">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route
            path="/checkout"
            element={
              <RutaPrivada>
                <Checkout />
              </RutaPrivada>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <RutaPrivada>
                <MisPedidos />
              </RutaPrivada>
            }
          />
          <Route
            path="/pedido/:id"
            element={
              <RutaPrivada>
                <PedidoDetalle />
              </RutaPrivada>
            }
          />
          <Route path="/ingresar" element={<Ingresar />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/olvide" element={<OlvidePassword />} />
          <Route path="/restablecer" element={<RestablecerPassword />} />
          <Route
            path="/admin/productos"
            element={
              <RutaAdmin>
                <AdminProductos />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/productos/nuevo"
            element={
              <RutaAdmin>
                <AdminProductoForm />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/productos/:id"
            element={
              <RutaAdmin>
                <AdminProductoForm />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/pedidos"
            element={
              <RutaAdmin>
                <AdminPedidos />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <RutaAdmin>
                <AdminCategorias />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <RutaAdmin>
                <AdminConfiguracion />
              </RutaAdmin>
            }
          />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
