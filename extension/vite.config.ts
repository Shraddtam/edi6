import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
        sidepanel: resolve(__dirname, "sidepanel/index.html"),
        background: resolve(__dirname, "background/service-worker.ts"),
        content: resolve(__dirname, "content/content-script.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background/service-worker.js"
          if (chunk.name === "content") return "content/content-script.js"
          return "assets/[name].js"
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
})
