//This file configure Vite. IMMPORTANT: This file makes Https optional. 
//To enable Https, create a .env file in the root of the project with the following content:
//VITE_HTTPS=true
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.VITE_HTTPS === "true";

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(useHttps ? [mkcert()] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      ...(useHttps ? { https: {} } : {}),
    },
  };
});