# Análisis de Patrones de Diseño y Arquetipos

## 1. Patrones de Diseño Utilizados

Para la construcción de este sistema de gestión escolar, se implementaron múltiples patrones de diseño arquitectónicos y de software que garantizan escalabilidad, mantenibilidad y bajo acoplamiento.

### A. Patrón Backend For Frontend (BFF) / API Gateway
- **Qué es:** Es un patrón arquitectónico donde un servidor (en este caso el `api-gateway`) actúa como único punto de entrada para el frontend.
- **Por qué se eligió:** El frontend (React) necesita consumir datos de múltiples microservicios (Autenticación, Asistencia, Calificaciones). Llamar a cada uno directamente desde el cliente expone la arquitectura interna, aumenta la latencia y complica la seguridad.
- **Problema que resuelve:** Centraliza la autenticación (verificación de tokens JWT), maneja el enrutamiento (`/api/auth/**`, `/api/calificaciones/**`) y evita el problema de *Over-fetching/Under-fetching* o múltiples llamadas cruzadas desde el navegador (CORS centralizado).

### B. Patrón Microservicios
- **Qué es:** Arquitectura donde la aplicación se divide en servicios pequeños, independientes y débilmente acoplados, que se comunican a través de red (HTTP/REST).
- **Por qué se eligió:** Permite escalar componentes críticos de forma independiente. Por ejemplo, el servicio de `ms-asistencia` puede recibir mucha carga al inicio de la jornada escolar, mientras que `ms-calificaciones` tiene picos a fin de semestre.
- **Problema que resuelve:** Elimina el cuello de botella del monolito. Si un servicio falla (ej. Autenticación de terceros), no derriba el sistema completo. Permite a distintos equipos trabajar y desplegar de forma autónoma.

### C. Patrón Factory / Service Locator (En Spring Boot)
- **Qué es:** Patrón creacional utilizado internamente por el contenedor de Inversión de Control (IoC) de Spring.
- **Por qué se eligió:** Se usa implícitamente mediante las anotaciones `@Service`, `@Repository` y `@RestController`.
- **Problema que resuelve:** Evita instanciar objetos manualmente con `new` a lo largo del código. El framework gestiona el ciclo de vida de los componentes, inyectando las dependencias necesarias. Esto facilita enormemente la escritura de pruebas unitarias mediante *Mocks*.

### D. Patrón Singleton
- **Qué es:** Garantiza que una clase tenga una única instancia en toda la aplicación.
- **Por qué se eligió:** Al inyectar configuraciones críticas, como `FirebaseConfig` o `SecurityConfig`, solo necesitamos que se inicialicen una vez al arrancar el microservicio.
- **Problema que resuelve:** Optimiza el uso de memoria y previene inconsistencias al asegurar que todos los hilos o requests usen el mismo cliente de base de datos o manejador de seguridad.

---

## 2. Arquetipos Maven Utilizados

### Arquetipo Base de Microservicio (`ms-base-archetype`)
- **Qué es:** Es una plantilla (Maven Archetype) preconfigurada que contiene la estructura estándar de carpetas y dependencias necesarias para cualquier nuevo servicio de la plataforma.
- **Por qué se eligió:** En una arquitectura de microservicios, crear cada nuevo servicio desde cero (configurando el `pom.xml`, la conexión a Eureka, los puertos, etc.) es propenso a errores y genera deuda técnica.
- **Problema que resuelve:** Automatiza la creación de nuevos componentes. Cuando el equipo necesite crear, por ejemplo, el `ms-comunicaciones`, simplemente ejecuta el arquetipo y obtiene un servicio listo para correr, que cumple con los estándares del proyecto (Java 17, Spring Boot 3, Eureka Client, estructura Controller/Service/Repository predefinida).
