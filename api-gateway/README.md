# API Gateway (BFF - Backend For Frontend)

Punto de entrada único (Reverse Proxy) basado en Spring Cloud Gateway.

## Función
Enruta todas las peticiones desde el frontend hacia los microservicios internos correspondientes (`/api/auth/**`, `/api/asistencia/**`, etc.).

## Ejecución Local
1. Asegúrate de tener Java 17 y Maven.
2. Ejecuta:
   ```bash
   mvn spring-boot:run
   ```
*(Nota: Requiere que Eureka Server esté corriendo en el puerto 8761).*
