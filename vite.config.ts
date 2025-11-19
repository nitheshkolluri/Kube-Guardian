import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Security Warning
  if (!env.API_KEY) {
    console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: API_KEY is not set in your .env file. The app will fail to connect to Gemini AI.");
  }

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the existing code to work
      // We explicitly only expose API_KEY to prevent leaking other secrets from the host machine
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})