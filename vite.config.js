import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
    logLevel: 'error', // Suppress warnings, only show errors
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    plugins: [react()]
});
