import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // proxy API requests to backend during development
  server: {
    host: true,
    port: 8100,
    strictPort: true,
    proxy: {
      '/missions': 'http://localhost:4000',
      '/applications': 'http://localhost:4000',
      '/auth': 'http://localhost:4000',
      '/notifications': 'http://localhost:4000',
      '/candidatures': 'http://localhost:4000',
      '/users': 'http://localhost:4000',
      '/jeune-profiles': 'http://localhost:4000',
      '/entreprise-profiles': 'http://localhost:4000',
      '/evaluations': 'http://localhost:4000',
      '/stats': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
      '^/admin/(stats|users|pending-verifications|verify-identity|missions|reports|logs|admins)': {
        target: 'http://localhost:4000',
        rewrite: (path: string) => path,
      },
    },
    // allow requests when running dev on custom host names
    allowedHosts: true,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
