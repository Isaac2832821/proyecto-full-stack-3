import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/firebase.js', 
        'src/main.jsx', 
        'src/App.jsx', 
        'src/**/*.test.{js,jsx}',
        'src/components/**',
        'src/pages/**',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
    reporter: 'verbose',
    globals: true,
  },
});