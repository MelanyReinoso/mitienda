// Muestra el resultado de una acción (ver useAccion): "Guardado." o el error.
export default function Mensajes({ estado }) {
  return (
    <>
      <p className="aviso" role="status" aria-live="polite">
        {estado.aviso}
      </p>
      {estado.error && (
        <p className="mensaje error" role="alert">
          {estado.error}
        </p>
      )}
    </>
  );
}
