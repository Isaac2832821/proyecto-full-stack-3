# ──────────────────────────────────────────────────────────────────
# Stage 1: Build — Compilación de la aplicación Vite
# Imagen base: node:18-alpine (ligera y segura)
# ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"
LABEL maintainer="Colegio Bernardo O'Higgins"
LABEL description="Frontend SPA — Sistema de Gestión Escolar"

WORKDIR /app

# Copiar solo archivos de dependencias primero para aprovechar cache de capas
# Si package.json no cambia, esta capa se reutiliza en builds posteriores
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar el código fuente
COPY . .

# URL del API Gateway — se inyecta como build arg en el pipeline CI/CD
# En desarrollo local el valor por defecto apunta a localhost
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Build de producción — genera carpeta /app/dist
RUN npm run build

# ──────────────────────────────────────────────────────────────────
# Stage 2: Serve — Nginx con mínimo privilegio (usuario no-root)
# Imagen base: nginx:1.25-alpine (sin el builder de node)
# ──────────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

LABEL maintainer="Colegio Bernardo O'Higgins"
LABEL description="Frontend — Nginx servidor de archivos estáticos"

# Crear grupo y usuario no-root (uid/gid 1001)
# Principio de mínimo privilegio — el proceso no corre como root
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

# Copiar SOLO el artefacto compilado desde el builder (no incluye node_modules)
COPY --from=builder /app/dist /usr/share/nginx/html

# Reemplazar configuración nginx global por la nuestra (soporta usuario no-root)
COPY nginx.conf /etc/nginx/nginx.conf

# Eliminar configuración por defecto de nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Crear directorios temporales accesibles para usuario no-root
RUN mkdir -p /tmp/nginx/client_body \
             /tmp/nginx/proxy \
             /tmp/nginx/fastcgi \
             /tmp/nginx/uwsgi \
             /tmp/nginx/scgi && \
    chown -R appuser:appgroup \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /tmp/nginx

# Puerto sin privilegios (< 1024 requiere root)
EXPOSE 8080

# Cambiar al usuario no-root
USER appuser

# Health check — verifica que nginx responde
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
# rebuild
