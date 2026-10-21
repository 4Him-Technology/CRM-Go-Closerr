import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// base relativa: o mesmo build funciona no GitHub Pages (em subpasta) e localmente
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: Number(process.env.PORT) || 5175 },
  preview: { port: Number(process.env.PORT) || 4175 },
})
