import { defineConfig } from 'vite';

export default defineConfig({
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
    // Entorno jsdom para simular el navegador
    environment: 'jsdom',
    // Cobertura con proveedor v8
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Archivos a analizar
      include: ['src/**/*.js'],
      exclude: ['src/firebase.js', 'src/mensajeria.js', 'src/main.js'],
      // Umbrales mínimos requeridos (85% = requisito del curso)
      thresholds: {
        lines:      85,
        functions:  85,
        branches:   85,
        statements: 85,
      },
    },
    // Muestra cada test ejecutado
    reporter: 'verbose',
  },
});

