# 📄 Informe de Desarrollo — Colegio Bernardo O'Higgins
**Sistema de Gestión Escolar — Historial técnico completo**

> Este documento registra cronológicamente todo lo que se construyó, las decisiones técnicas tomadas, los problemas resueltos y las mejoras aplicadas en cada sesión de trabajo.
> **Se actualiza cada vez que se realiza un cambio relevante.**

---

## 🗂 Índice

1. [Arquitectura base e infraestructura](#1-arquitectura-base-e-infraestructura)
2. [ms-autenticacion — Desarrollo inicial](#2-ms-autenticacion--desarrollo-inicial)
3. [ms-autenticacion — Refactoring y calidad](#3-ms-autenticacion--refactoring-y-calidad)
4. [ms-calificaciones — Desarrollo](#4-ms-calificaciones--desarrollo)
5. [api-gateway — Integración](#5-api-gateway--integración)
6. [Frontend — SPA Vanilla JS](#6-frontend--spa-vanilla-js)
7. [Troubleshooting — Problemas resueltos](#7-troubleshooting--problemas-resueltos)
8. [Sesión de limpieza — Auditoría de código](#8-sesión-de-limpieza--auditoría-de-código)
9. [Alcance actual y próximos pasos](#9-alcance-actual-y-próximos-pasos)

---

## 1. Arquitectura Base e Infraestructura

### Proyecto Maven multi-módulo
Se creó un `pom.xml` padre con `<packaging>pom</packaging>` que engloba todos los módulos (`eureka-server`, `ms-autenticacion`, `ms-calificaciones`, `api-gateway`). Permite compilar, testear y gestionar dependencias del proyecto completo desde la raíz con `mvn clean install`.

### Eureka Server — Service Discovery
Se configuró Netflix Eureka en el puerto `8761` como servidor de descubrimiento en modo standalone (no se autoregistra). Actúa como "directorio telefónico": cada microservicio se registra al arrancar y el API Gateway lo consulta para resolver IPs en tiempo real. Cualquier microservicio futuro (`ms-asistencia`, etc.) solo necesita agregar `spring-cloud-starter-netflix-eureka-client`.

### API Gateway
Se implementó Spring Cloud Gateway (basado en WebFlux — reactivo) en el puerto `8080`. Es el único punto de entrada para el frontend. Las rutas se definieron manualmente en `application.yml` usando `lb://` (load balancer con Eureka):

| Ruta                 | Destino             |
|----------------------|---------------------|
| `/auth/**`           | `ms-autenticacion`  |
| `/usuarios/**`       | `ms-autenticacion`  |
| `/calificaciones/**` | `ms-calificaciones` |
| `/asignaturas/**`    | `ms-calificaciones` |

**Decisión de diseño:** El gateway **no valida JWT** — delega esa responsabilidad a cada microservicio. Esto permite que los servicios sean completamente independientes y resilientes entre sí.

---

## 2. `ms-autenticacion` — Desarrollo Inicial

### Conexión a Firebase Firestore
Se excluyó la autoconfiguración SQL/JPA de Spring Boot (`DataSourceAutoConfiguration`, `HibernateJpaAutoConfiguration`) y se reemplazó por Firebase Admin SDK. `FirebaseConfig` inyecta el SDK usando el archivo `serviceAccountKey.json`.

**Razón:** Firestore elimina la necesidad de gestionar un servidor de BD local, permite escalar automáticamente y simplifica el modelo de datos (sin esquemas rígidos).

### Repository Manual sobre Firestore
Dado que no se usa Spring Data JPA, se construyó `UsuarioRepository` desde cero con operaciones CRUD directas sobre el SDK de Firestore. Implementa: `save`, `findById`, `findByRut`, `findByEmail`, `existsByRut`, `existsByEmail`, `findAll`, `findByApoderado`.

### JWT — Access Token + Refresh Token
Se implementó un sistema de doble token con JJWT 0.12.6:

| Token         | Duración | Propósito                                    |
|---------------|----------|----------------------------------------------|
| `accessToken` | 24 horas | Para peticiones normales a la API            |
| `refreshToken`| 7 días   | Para renovar el accessToken sin re-login     |

El payload del JWT incluye: RUT (subject), ID de Firestore, rol y tipo de token (`"access"` / `"refresh"`).

**Clave secreta:** Compartida entre `ms-autenticacion` y `ms-calificaciones` para que cada servicio pueda validar tokens de forma independiente sin comunicación entre microservicios.

### Spring Security Stateless
- CSRF deshabilitado (arquitectura REST pura)
- Sesión STATELESS (sin `HttpSession`)
- `JwtAuthFilter` extiende `OncePerRequestFilter`
- Prefijo `ROLE_` agregado al construir `SimpleGrantedAuthority` para compatibilidad con Spring Security
- `@PreAuthorize` en controladores para control fino por rol

### DataSeeder
Componente `ApplicationRunner` que al arrancar verifica si `usuarios` está vacía en Firestore. Si lo está, inserta 4 usuarios de demostración (uno por cada rol) con contraseñas hasheadas con BCrypt.

### Endpoints implementados

| Endpoint                   | Método | Rol          |
|----------------------------|--------|--------------|
| `/auth/register`           | POST   | Público      |
| `/auth/login`              | POST   | Público      |
| `/auth/refresh`            | POST   | Público      |
| `/auth/validate`           | GET    | Público      |
| `/auth/me`                 | GET    | Autenticado  |
| `/auth/password`           | PATCH  | Autenticado  |
| `/usuarios`                | GET    | `ADMIN`      |
| `/usuarios/mis-hijos`      | GET    | `APODERADO`  |
| `/usuarios/{id}`           | GET    | `ADMIN`      |
| `/usuarios/{id}/rol`       | PATCH  | `ADMIN`      |
| `/usuarios/{id}`           | DELETE | `ADMIN`      |

---

## 3. `ms-autenticacion` — Refactoring y Calidad

Primera auditoría del código tras el desarrollo inicial. Se detectaron 11 debilidades y se corrigieron todas.

### Problemas detectados y corregidos

| # | Problema | Severidad | Solución aplicada |
|---|----------|:---------:|-------------------|
| 1 | `JwtAuthFilter` en paquete `service` | 🟡 Media | Movido a `security/` |
| 2 | `UsuarioDetailsService` en paquete `service` | 🟡 Media | Movido a `security/` |
| 3 | `IllegalArgumentException` genérica para errores de negocio | 🟠 Alta | Creadas `UsuarioNotFoundException` (404) y `DuplicateResourceException` (409) |
| 4 | `GlobalExceptionHandler` sin handler para `UsernameNotFoundException` | 🟡 Media | Añadido handler específico → HTTP 401 |
| 5 | Patrón `findById → orElseThrow` repetido 3 veces | 🟡 Media | Método privado `buscarUsuarioPorId()` |
| 6 | Email sin `@Email` en `RegisterRequest` | 🟠 Alta | Añadida validación `@Email` |
| 7 | Sin validación de largo de contraseña | 🟠 Alta | Añadida validación `@Size(min=6, max=100)` |
| 8 | `handleAddHijo` en frontend no usaba `api()` | 🟡 Media | Refactorizado para usar la función utilitaria |
| 9 | Import `Principal` inline en `UsuarioController` | 🟢 Baja | Movido a la cabecera del archivo |
| 10 | Import inline en `AuthResponse` | 🟢 Baja | Corregido |
| 11 | Sin validación de RUT chileno | 🟡 Media | Añadida `@Pattern(regexp = "^\\d{7,8}-[\\dkK]$")` |

### Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| `exception/UsuarioNotFoundException.java` | 🆕 Creado |
| `exception/DuplicateResourceException.java` | 🆕 Creado |
| `exception/GlobalExceptionHandler.java` | ✏️ Mejorado |
| `security/JwtAuthFilter.java` | 🔄 Movido de `service/` |
| `security/UsuarioDetailsService.java` | 🔄 Movido de `service/` |
| `dto/RegisterRequest.java` | ✏️ `@Email`, `@Size`, `@Pattern` |
| `service/AuthService.java` | ✏️ Excepciones personalizadas |
| `service/UsuarioService.java` | ✏️ `buscarUsuarioPorId()` |
| `frontend/src/main.js` | ✏️ `handleAddHijo` usa `api()` |

### Patrones de diseño aplicados

| Patrón | Implementación |
|--------|---------------|
| **Repository Pattern** | `UsuarioRepository` encapsula el acceso a Firestore |
| **Service Layer** | `AuthService`, `UsuarioService` encapsulan lógica de negocio |
| **DTO Pattern** | Records Java inmutables separan la capa de presentación |
| **Filter Chain** | `JwtAuthFilter` intercepta cada request |
| **Global Exception Handler** | `@RestControllerAdvice` centraliza errores |

---

## 4. `ms-calificaciones` — Desarrollo

Nuevo microservicio para gestión académica. Sigue exactamente la misma arquitectura en capas que `ms-autenticacion`.

### Diseño y decisiones clave

**Seguridad independiente:** `ms-calificaciones` tiene su propio `JwtAuthFilter` y `JwtService` que validan tokens usando la clave secreta compartida. No consulta a `ms-autenticacion` en tiempo de ejecución → resiliencia: si `ms-autenticacion` cae, las consultas de calificaciones siguen funcionando.

**docenteId extraído del JWT:** El controlador recibe el RUT del docente directamente de `Principal` (inyectado por Spring Security desde el token), no del request body. El cliente no puede falsificarlo.

### Entidades

**`Calificacion`:**

| Campo             | Tipo   | Restricciones                            |
|-------------------|--------|------------------------------------------|
| `estudianteId`    | String | `@NotBlank`                              |
| `estudianteNombre`| String | Opcional                                 |
| `asignaturaId`    | String | `@NotBlank`                              |
| `asignaturaNombre`| String | Opcional                                 |
| `nota`            | Double | `@DecimalMin(1.0)` / `@DecimalMax(7.0)`  |
| `tipo`            | Enum   | `PRUEBA·TAREA·EXAMEN·TRABAJO·PRESENTACION` |
| `fecha`           | String | `@NotBlank` — ISO 8601 (`yyyy-MM-dd`)    |
| `observacion`     | String | Opcional                                 |
| `docenteId`       | String | Extraído del JWT (no enviado por cliente)|

**`Asignatura`:** `nombre`, `descripcion`, `docenteId`, `docenteNombre`, `activa`

### Endpoints

| Endpoint                                    | Método | Rol                |
|---------------------------------------------|--------|--------------------|
| `/calificaciones`                           | POST   | `DOCENTE`          |
| `/calificaciones`                           | GET    | `ADMIN`, `DOCENTE` |
| `/calificaciones/{id}`                      | GET    | Autenticado        |
| `/calificaciones/mis-registros`             | GET    | `DOCENTE`          |
| `/calificaciones/estudiante/{estudianteId}` | GET    | Autenticado        |
| `/calificaciones/asignatura/{asignaturaId}` | GET    | Autenticado        |
| `/calificaciones/{id}`                      | PUT    | `DOCENTE`          |
| `/calificaciones/{id}`                      | DELETE | `ADMIN`, `DOCENTE` |
| `/asignaturas`                              | POST   | `ADMIN`            |
| `/asignaturas`                              | GET    | Autenticado        |
| `/asignaturas/{id}`                         | GET    | Autenticado        |
| `/asignaturas/mis-asignaturas`              | GET    | `DOCENTE`          |
| `/asignaturas/{id}`                         | PUT    | `ADMIN`            |
| `/asignaturas/{id}`                         | DELETE | `ADMIN`            |

---

## 5. `api-gateway` — Integración

Se configuró el gateway para enrutar usando `lb://` (load balancer vía Eureka). El filtro global `DedupeResponseHeader` evita que se dupliquen los headers `Access-Control-Allow-Origin` cuando tanto el microservicio como el gateway añaden CORS headers.

El discovery automático de Eureka (`discovery.locator.enabled: false`) está desactivado — las rutas se definen manualmente para tener control total sobre qué se expone.

---

## 6. Frontend — SPA Vanilla JS

### Arquitectura
Aplicación de página única (SPA) sin frameworks. Todo el estado se maneja en el objeto `state` global. La función `navigate()` actúa como router simple.

### Función `api()` — utilidad central
```javascript
async function api(endpoint, options = {}) {
  // Agrega automáticamente el JWT a cada petición
  // Lanza error estructurado { status, data } si response no es ok
}
```

### Pantallas implementadas

| Vista              | Rol          | Funcionalidad                                     |
|--------------------|--------------|---------------------------------------------------|
| Login              | Todos        | Formulario RUT + contraseña, guarda JWT           |
| Registro           | Todos        | Alta de usuario (DOCENTE o APODERADO)             |
| Dashboard inicio   | Todos        | Tarjetas con rol, email, RUT, estado              |
| Mi Perfil          | Todos        | Datos desde `/auth/me`                            |
| Cambiar Contraseña | Todos        | Formulario con validación de coincidencia         |
| Gestión Usuarios   | `ADMIN`      | Tabla con todos los usuarios                      |
| Mis Estudiantes    | `APODERADO`  | Cards de hijos + click para ver notas             |
| Matricular         | `APODERADO`  | Formulario para registrar estudiante a su cargo   |
| Calificaciones     | `DOCENTE`    | Formulario de registro + tabla de mis registros   |
| Mis Calificaciones | `ESTUDIANTE` | Tabla de notas + promedio + nota más alta         |

### Gestión de sesión
- `accessToken` y `refreshToken` guardados en `localStorage`
- Al cerrar sesión se limpian ambos tokens y el objeto `user`

---

## 7. Troubleshooting — Problemas Resueltos

| Problema | Causa raíz | Solución |
|----------|-----------|----------|
| CORS error en `fetch()` del frontend | El navegador bloqueaba peticiones cross-origin al backend | `CorsConfig.java` en cada microservicio permite `*`; el gateway deduplica headers |
| HTTP 403 en `GET /usuarios/mis-hijos` | La regla de `SecurityConfig` no incluía ese path explícitamente antes de `/**` | Se agregó `.requestMatchers("/usuarios/mis-hijos").hasRole("APODERADO")` antes de la regla genérica |
| Roles no reconocidos por Spring Security | El rol en el JWT no tenía el prefijo `ROLE_` | `JwtAuthFilter` agrega `"ROLE_"` al construir `SimpleGrantedAuthority` |
| IntelliJ no resuelve imports Maven | Maven no recargado tras cambios en `pom.xml` | "Reimport All Maven Projects" desde el panel de Maven |

---

## 8. Sesión de Limpieza — Auditoría de Código

Segunda revisión técnica completa. Se auditaron todos los archivos de los 5 módulos.

### Bug crítico corregido

**`GlobalExceptionHandler` de `ms-calificaciones`** tenía un handler que capturaba **toda** `RuntimeException` y la devolvía como HTTP 404. Esto era incorrecto porque los errores de Firestore (conexión, timeout, permisos) también son `RuntimeException` y se devolvían como 404 en lugar de 500, ocultando el error real.

**Solución:** Reemplazado por handler específico `NoSuchElementException → 404`. Los errores de infraestructura ahora caen en el handler genérico `Exception → 500`.

### Otras correcciones

| Problema | Archivo | Solución |
|----------|---------|---------|
| `JwtService.esTokenValido()` parseaba el JWT dos veces | `ms-calificaciones/security/JwtService.java` | `getClaims()` se llama una sola vez |
| Regla `permitAll()` para `/h2-console/**` (H2 no se usa) | `ms-autenticacion/config/SecurityConfig.java` | Eliminada |
| `frameOptions(sameOrigin)` para iframe de H2 | `ms-autenticacion/config/SecurityConfig.java` | Eliminado |
| `RuntimeException` genérica en services | `CalificacionService.java`, `AsignaturaService.java` | → `NoSuchElementException` |
| Sin Javadoc en clases de `ms-calificaciones` | Varios | Añadido |

### Archivos / código muerto eliminado

| Elemento eliminado | Razón |
|--------------------|-------|
| `mi-nginx/` (carpeta completa) | Experimento Docker/Nginx sin relación con el sistema |
| `diagnostico_y_mejoras.md` | Contenido absorbido en este informe |
| `frontend/src/firebase.js` | `main.js` nunca lo importaba; el frontend usa solo REST/fetch |
| Dependencia `firebase` en `package.json` | Eliminada junto con el archivo |

---

## 9. Alcance Actual y Próximos Pasos

### ✅ Completado

| Componente | Estado |
|------------|--------|
| Eureka Server | ✅ Operativo |
| API Gateway con rutas manuales | ✅ Operativo |
| `ms-autenticacion` — Auth completa + JWT doble token | ✅ Operativo |
| `ms-autenticacion` — CRUD de usuarios con roles | ✅ Operativo |
| `ms-autenticacion` — Vinculación apoderado-estudiante | ✅ Operativo |
| `ms-calificaciones` — CRUD calificaciones | ✅ Operativo |
| `ms-calificaciones` — CRUD asignaturas | ✅ Operativo |
| Tests unitarios `AuthService` (JUnit 5 + Mockito) | ✅ Operativo |
| Frontend — Login, Registro, Dashboard por rol | ✅ Operativo |
| Frontend — Vista calificaciones (Docente, Estudiante, Apoderado) | ✅ Operativo |
| Limpieza y auditoría de código (sesión 2) | ✅ Completado |

### 🔲 Pendientes

| Tarea | Prioridad |
|-------|-----------|
| `ms-asistencia` — microservicio de asistencia | 🔲 Media |
| Dockerización (`Dockerfile` por servicio + `docker-compose.yml`) | 🔲 Media |
| Tests unitarios para `ms-calificaciones` | 🔲 Media |
| Pipeline CI/CD (GitHub Actions) | 🔲 Baja |
| Notificaciones al registrar una nota | 🔲 Baja |
