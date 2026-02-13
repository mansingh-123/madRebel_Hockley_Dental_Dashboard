import { defineConfig } from "vite"

export default defineConfig({
  server: {
    proxy: {
      "/reports": {
        target: "https://kpi.medrebel.io",
        changeOrigin: true,
        secure: false
      },
      "/ai": {
        target: "https://kpi.medrebel.io",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
