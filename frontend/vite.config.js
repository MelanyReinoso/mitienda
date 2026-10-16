import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Puerto fijo: el backend solo acepta pedidos desde http://localhost:5173 (CORS_ORIGIN en su .env)
  server: { port: 5173, strictPort: true },
});
