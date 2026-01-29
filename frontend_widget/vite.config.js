import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/widget.jsx',
      name: 'AIJobWidget',
      fileName: 'ai-job-widget'
    },
    define: {
      'process.env': {}
    }
  }
})