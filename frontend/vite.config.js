import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// todo lo que empieza con /api va a flask (asi la cookie de sesion anda sin cors)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        rewrite: (ruta) => ruta.replace(/^\/api/, ""),
      },
    },
  },
});
