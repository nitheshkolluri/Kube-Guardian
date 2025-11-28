import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, ".", "")

  if (!env.API_KEY) {
    console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: API_KEY is not set in your .env file.")
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve("./"),
      },
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.API_KEY),
    },
  }
})