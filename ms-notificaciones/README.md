# ms-notificaciones

## Descripción
Microservicio parte de la arquitectura del Sistema de Gestión Escolar del Colegio Bernardo O'Higgins.

## Tecnologías
- Spring Boot 3
- Java 17
- Spring Cloud / Eureka

## Ejecución Local
1. Asegúrese de que `ms-eureka-server` esté en ejecución.
2. Configure las variables de entorno si es necesario.
3. Ejecute: `mvn spring-boot:run`

## API
Documentación interactiva con Swagger disponible en:
`http://localhost:8084/swagger-ui.html`
(No aplica para Eureka Server ni API Gateway en la misma ruta).
