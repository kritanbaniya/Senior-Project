//This file configure Vite. IMMPORTANT: This file makes Https optional. 
//To enable Https, create a .env file in the root of the project with the following content:
//VITE_HTTPS=true
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.VITE_HTTPS === "true";

  return {
    plugins: [
      react(),
      ...(useHttps ? [mkcert()] : []),
    ],
    server: {
      host: true,               // LAN access
      https: useHttps,          // only if VITE_HTTPS=true
    },
  };
});