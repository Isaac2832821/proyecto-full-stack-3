# 📄 Informe de Proyecto — Colegio Bernardo O'Higgins
**Sistema de Gestión Escolar — Arquitectura de Microservicios**

---

## 🗂 Índice

1. [Problemática](#1-problemática)
2. [Solución Propuesta](#2-solución-propuesta)
3. [Requisitos Funcionales y No Funcionales](#3-requisitos-funcionales-y-no-funcionales)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Herramientas y Tecnologías](#5-herramientas-y-tecnologías)
6. [Endpoints — Tabla Completa](#6-endpoints--tabla-completa)
7. [Evidencias de Avance](#7-evidencias-de-avance)
8. [Historial de Desarrollo](#8-historial-de-desarrollo)
9. [Troubleshooting — Problemas Resueltos](#9-troubleshooting--problemas-resueltos)
10. [Sesión de Limpieza — Auditoría de Código](#10-sesión-de-limpieza--auditoría-de-código)
11. [Alcance Actual y Próximos Pasos](#11-alcance-actual-y-próximos-pasos)

---

## 1. Problemática

El Colegio Bernardo O'Higgins gestiona actualmente sus procesos académicos y administrativos de forma **manual o con herramientas no integradas**, lo que genera los siguientes problemas:

| Problema | Impacto |
|----------|---------|
| No existe un sistema centralizado de calificaciones | Docentes registran notas en planillas desconectadas; errores de transcripción frecuentes |
| Los apoderados no tienen acceso en tiempo real al rendimiento de sus hijos | Desinformación; enterados de problemas académicos tardíamente |
| La gestión de usuarios (alumnos, docentes, apoderados) es manual | Riesgo de datos inconsistentes, duplicados o desactualizados |
| No hay control de acceso por rol | Cualquier usuario podría acceder a información que no le corresponde |
| No existe autenticación segura | Riesgo de accesos no autorizados a datos sensibles de estudiantes |

Estos problemas dificultan la comunicación entre los distintos actores del colegio y generan ineficiencias en la gestión académica diaria.

---

## 2. Solución Propuesta

Se desarrolló un **Sistema de Gestión Escolar web** basado en **arquitectura de microservicios**, que permite:

- **Centralizar** la información de usuarios, calificaciones y asignaturas en una base de datos en la nube (Firebase Firestore).
- **Controlar el acceso** mediante roles diferenciados: `ADMIN`, `DOCENTE`, `ESTUDIANTE`, `APODERADO`.
- **Autenticar** a todos los usuarios con tokens JWT seguros (access token de 24h + refresh token de 7 días).
- **Desacoplar** los servicios para que cada uno pueda escalar, desplegarse y fallar de forma independiente.
- Proveer una **interfaz web moderna** (SPA) accesible desde el navegador sin instalación.

### Actores del sistema

| Actor | Capacidades |
|-------|-------------|
| **ADMIN** | Gestión total de usuarios: ver, cambiar roles, desactivar |
| **DOCENTE** | Registrar y consultar calificaciones de sus estudiantes |
| **ESTUDIANTE** | Ver sus propias calificaciones y perfil |
| **APODERADO** | Ver los estudiantes a su cargo y sus calificaciones |

---

## 3. Requisitos Funcionales y No Funcionales

### ✅ Requisitos Funcionales

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-01 | El sistema debe permitir el registro e inicio de sesión de usuarios con RUT y contraseña | ✅ Implementado |
| RF-02 | El sistema debe generar y renovar tokens JWT para mantener la sesión activa | ✅ Implementado |
| RF-03 | El ADMIN puede listar, cambiar rol y desactivar cualquier usuario | ✅ Implementado |
| RF-04 | El APODERADO puede matricular estudiantes y ver sus calificaciones | ✅ Implementado |
| RF-05 | El DOCENTE puede registrar, editar y eliminar calificaciones | ✅ Implementado |
| RF-06 | El ESTUDIANTE puede consultar sus propias calificaciones | ✅ Implementado |
| RF-07 | El sistema debe soportar múltiples tipos de evaluación (prueba, tarea, examen, trabajo, presentación) | ✅ Implementado |
| RF-08 | El sistema debe cargar datos semilla al iniciar si la BD está vacía | ✅ Implementado |
| RF-09 | Los usuarios deben poder cambiar su propia contraseña | ✅ Implementado |
| RF-10 | El DOCENTE puede gestionar las asignaturas a su cargo | ✅ Implementado |

### ⚙️ Requisitos No Funcionales

| ID | Requisito | Implementación |
|----|-----------|---------------|
| RNF-01 | **Seguridad** — Las contraseñas deben almacenarse cifradas | BCrypt con factor de costo estándar |
| RNF-02 | **Seguridad** — Las comunicaciones deben autenticarse con token | JWT firmado con HMAC-SHA256 |
| RNF-03 | **Escalabilidad** — El sistema debe soportar agregar nuevos microservicios sin modificar los existentes | Eureka Service Discovery + API Gateway |
| RNF-04 | **Disponibilidad** — Un microservicio caído no debe tumbar el resto | Servicios independientes; ms-calificaciones valida JWT sin depender de ms-autenticacion |
| RNF-05 | **Rendimiento** — El frontend debe responder sin recargar la página | SPA (Single Page Application) con Vanilla JS |
| RNF-06 | **Mantenibilidad** — El código debe seguir patrones de diseño estandarizados | Repository, Service Layer, DTO, Global Exception Handler |
| RNF-07 | **Validación** — Los datos de entrada deben validarse antes de procesarse | Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@Pattern`, `@DecimalMin/Max`) |
| RNF-08 | **Trazabilidad** — Los errores deben retornar respuestas HTTP claras y consistentes | `GlobalExceptionHandler` con formato JSON unificado |

---

## 4. Arquitectura del Sistema

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                           │
│                  Frontend SPA — Vite + Vanilla JS               │
│                         localhost:5173                           │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP fetch (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY — Puerto 8080                     │
│              Spring Cloud Gateway (WebFlux/Reactivo)            │
│  Enruta con lb:// (Eureka) · Maneja CORS · Sin validación JWT   │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ /auth/**, /usuarios/**        │ /calificaciones/**, /asignaturas/**
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│  ms-autenticacion        │    │  ms-calificaciones            │
│  Puerto 8081             │    │  Puerto 8082                  │
│                          │    │                               │
│  · Registro / Login      │    │  · CRUD Calificaciones        │
│  · Emisión JWT           │    │  · CRUD Asignaturas           │
│  · Gestión de usuarios   │    │  · Validación JWT propia      │
│  · BCrypt passwords      │    │  · docenteId desde JWT        │
│                          │    │                               │
│  Firestore: "usuarios"   │    │  Firestore: "calificaciones"  │
│                          │    │             "asignaturas"     │
└────────────┬─────────────┘    └──────────────┬───────────────┘
             │                                  │
             └────────────┬─────────────────────┘
                          │ Registro de servicios
                          ▼
          ┌───────────────────────────────┐
          │    EUREKA SERVER — Puerto 8761 │
          │    Netflix Service Discovery  │
          └───────────────────────────────┘
                          │
          ┌───────────────────────────────┐
          │    FIREBASE FIRESTORE (Cloud)  │
          │    Base de datos NoSQL         │
          │    Colecciones:               │
          │    · usuarios                 │
          │    · calificaciones           │
          │    · asignaturas              │
          └───────────────────────────────┘
```

### Flujo de autenticación

```
Cliente          Gateway          ms-autenticacion      Firestore
  │                │                     │                  │
  │─POST /auth/login──►│                 │                  │
  │                │──►POST /auth/login──►│                 │
  │                │                     │──findByRut──────►│
  │                │                     │◄─────────────────│
  │                │                     │  valida BCrypt    │
  │                │                     │  genera JWT       │
  │                │◄──{token,refresh}───│                  │
  │◄──{token,refresh}──│                 │                  │
  │                │                     │                  │
  │─GET /calificaciones/..──►│           │                  │
  │   Authorization: Bearer  │           │                  │
  │                │──►GET───────────────────────────►ms-calificaciones
  │                │                                  valida JWT (local)
  │◄──────────────────────────────────────────────────[datos]
```

### Patrones de diseño aplicados

| Patrón | Descripción | Dónde se usa |
|--------|-------------|--------------|
| **Repository Pattern** | Encapsula el acceso a Firestore | `UsuarioRepository`, `CalificacionRepository`, `AsignaturaRepository` |
| **Service Layer** | Encapsula la lógica de negocio | `AuthService`, `UsuarioService`, `CalificacionService`, `AsignaturaService` |
| **DTO Pattern** | Separa representación interna de la externa | `RegisterRequest`, `AuthResponse`, `UsuarioDTO`, `CalificacionRequest` |
| **Filter Chain** | Intercepta y valida cada request HTTP | `JwtAuthFilter` en ambos microservicios |
| **Global Exception Handler** | Centraliza el manejo de errores | `GlobalExceptionHandler` con `@RestControllerAdvice` |

---

## 5. Herramientas y Tecnologías

| Tecnología | Versión | Rol en el proyecto |
|------------|---------|-------------------|
| ![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white) **Java** | 17 | Lenguaje principal del backend |
| ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.4-6DB33F?logo=springboot&logoColor=white) **Spring Boot** | 3.4.4 | Framework base de los microservicios |
| ![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-2024.0.3-6DB33F?logo=spring&logoColor=white) **Spring Cloud** | 2024.0.3 | Eureka, Gateway, Load Balancer |
| ![Spring Security](https://img.shields.io/badge/Spring_Security-6.x-6DB33F?logo=springsecurity&logoColor=white) **Spring Security** | 6.x | Autenticación y autorización por roles |
| ![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black) **Firebase Firestore** | Admin SDK 9.3 | Base de datos NoSQL en la nube |
| ![JWT](https://img.shields.io/badge/JWT-JJWT_0.12.6-000000?logo=jsonwebtokens&logoColor=white) **JJWT** | 0.12.6 | Generación y validación de tokens JWT |
| ![Lombok](https://img.shields.io/badge/Lombok-1.18.x-BC4521?logo=lombok&logoColor=white) **Lombok** | 1.18.x | Reducción de boilerplate (getters, constructores) |
| ![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?logo=swagger&logoColor=black) **Swagger / OpenAPI** | 2.8.6 | Documentación interactiva de la API |
| ![JUnit](https://img.shields.io/badge/JUnit_5-Tests-25A162?logo=junit5&logoColor=white) **JUnit 5 + Mockito** | — | Tests unitarios de servicios |
| ![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white) **Vite** | 6.x | Bundler/dev server del frontend |
| ![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES2022-F7DF1E?logo=javascript&logoColor=black) **Vanilla JS** | ES2022 | Frontend SPA sin frameworks |
| ![Maven](https://img.shields.io/badge/Maven-Multi--módulo-C71A36?logo=apachemaven&logoColor=white) **Maven** | 3.x | Gestión de dependencias y build |
| ![Git](https://img.shields.io/badge/Git-Control_versiones-F05032?logo=git&logoColor=white) **Git + GitHub** | — | Control de versiones y repositorio remoto |

---

## 6. Endpoints — Tabla Completa

### Autenticación (`ms-autenticacion`)

| Método | Endpoint | Descripción | Auth requerida |
|--------|----------|-------------|:--------------:|
| POST | `/auth/register` | Registrar nuevo usuario | ❌ |
| POST | `/auth/login` | Login — retorna `accessToken` + `refreshToken` | ❌ |
| POST | `/auth/refresh` | Renovar access token con refresh token | ❌ |
| GET | `/auth/validate` | Validar si un token es vigente | ❌ |
| GET | `/auth/me` | Perfil del usuario autenticado | ✅ Cualquier rol |
| PATCH | `/auth/password` | Cambiar contraseña propia | ✅ Cualquier rol |

### Usuarios (`ms-autenticacion`)

| Método | Endpoint | Descripción | Rol requerido |
|--------|----------|-------------|:-------------:|
| GET | `/usuarios` | Listar todos los usuarios | `ADMIN` |
| GET | `/usuarios/mis-hijos` | Estudiantes a cargo del apoderado | `APODERADO` |
| GET | `/usuarios/{id}` | Obtener usuario por ID | `ADMIN` |
| PATCH | `/usuarios/{id}/rol` | Cambiar rol de un usuario | `ADMIN` |
| DELETE | `/usuarios/{id}` | Desactivar usuario (borrado lógico) | `ADMIN` |

### Calificaciones (`ms-calificaciones`)

| Método | Endpoint | Descripción | Rol requerido |
|--------|----------|-------------|:-------------:|
| POST | `/calificaciones` | Registrar calificación | `DOCENTE` |
| GET | `/calificaciones` | Listar todas | `ADMIN`, `DOCENTE` |
| GET | `/calificaciones/{id}` | Obtener por ID | Autenticado |
| GET | `/calificaciones/mis-registros` | Calificaciones del docente autenticado | `DOCENTE` |
| GET | `/calificaciones/estudiante/{estudianteId}` | Calificaciones por estudiante (RUT) | Autenticado |
| GET | `/calificaciones/asignatura/{asignaturaId}` | Calificaciones por asignatura | Autenticado |
| PUT | `/calificaciones/{id}` | Actualizar calificación | `DOCENTE` |
| DELETE | `/calificaciones/{id}` | Eliminar calificación | `ADMIN`, `DOCENTE` |

### Asignaturas (`ms-calificaciones`)

| Método | Endpoint | Descripción | Rol requerido |
|--------|----------|-------------|:-------------:|
| POST | `/asignaturas` | Crear asignatura | `ADMIN` |
| GET | `/asignaturas` | Listar todas | Autenticado |
| GET | `/asignaturas/{id}` | Obtener por ID | Autenticado |
| GET | `/asignaturas/mis-asignaturas` | Asignaturas del docente autenticado | `DOCENTE` |
| PUT | `/asignaturas/{id}` | Actualizar asignatura | `ADMIN` |
| DELETE | `/asignaturas/{id}` | Eliminar asignatura | `ADMIN` |

> **Total: 20 endpoints** — 6 de autenticación · 5 de usuarios · 8 de calificaciones · 6 de asignaturas

---

## 7. Evidencias de Avance

### ✅ API Gateway — Enrutamiento verificado

El API Gateway enruta correctamente todas las peticiones. Flujo validado:

```
Frontend (5173) → Gateway (8080) → ms-autenticacion (8081)
                               → ms-calificaciones (8082)
```

**Verificación del Gateway con `curl`:**

```bash
# Login a través del Gateway (no directamente al microservicio)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"11111111-1","password":"Admin1234!"}'

# Respuesta esperada:
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tipo": "Bearer",
  "id": "...",
  "rut": "11111111-1",
  "nombre": "Administrador",
  "apellido": "Sistema",
  "email": "admin@colegio.cl",
  "rol": "ADMIN",
  "idApoderado": null
}
```

```bash
# Consulta de calificaciones a través del Gateway con token
curl http://localhost:8080/calificaciones \
  -H "Authorization: Bearer <token>"

# → Enrutado automáticamente a ms-calificaciones:8082
```

### ✅ Eureka Dashboard — Servicios registrados

Accediendo a `http://localhost:8761` se verifica que los 3 servicios estén registrados:

```
Instancias registradas:
  ● MS-AUTENTICACION    →  localhost:ms-autenticacion:8081   UP
  ● MS-CALIFICACIONES   →  localhost:ms-calificaciones:8082  UP
  ● API-GATEWAY         →  localhost:api-gateway:8080        UP
```

### ✅ Frontend — Vistas por rol

| Rol | Vista principal | Estado |
|-----|----------------|--------|
| ADMIN | Tabla de todos los usuarios con rol y estado | ✅ Funcional |
| APODERADO | Cards de estudiantes a cargo + tabla de notas al hacer clic | ✅ Funcional |
| DOCENTE | Formulario de registro de calificación + tabla de mis registros | ✅ Funcional |
| ESTUDIANTE | Tabla de mis calificaciones + promedio + nota más alta | ✅ Funcional |

### ✅ Swagger UI — Documentación interactiva

- `ms-autenticacion`: `http://localhost:8081/swagger-ui.html`
- `ms-calificaciones`: `http://localhost:8082/swagger-ui.html`

### ✅ Tests unitarios — AuthService

```bash
cd ms-autenticacion && mvn test

[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Casos cubiertos: registro exitoso, RUT duplicado, email duplicado, login exitoso, login fallido, refresh token válido, refresh token inválido, cambiar contraseña.

---


---

## 8. Historial de Desarrollo

> Registro cronológico de todo lo que se construyó, las decisiones técnicas tomadas y las mejoras aplicadas en cada sesión de trabajo.

### 8.1 Arquitectura Base e Infraestructura

#### Proyecto Maven multi-módulo
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

### 8.2 `ms-autenticacion` — Desarrollo Inicial

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

### 8.3 `ms-autenticacion` — Refactoring y Calidad

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

### 8.4 `ms-calificaciones` — Desarrollo

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

### 8.5 `api-gateway` — Integración

Se configuró el gateway para enrutar usando `lb://` (load balancer vía Eureka). El filtro global `DedupeResponseHeader` evita que se dupliquen los headers `Access-Control-Allow-Origin` cuando tanto el microservicio como el gateway añaden CORS headers.

El discovery automático de Eureka (`discovery.locator.enabled: false`) está desactivado — las rutas se definen manualmente para tener control total sobre qué se expone.

---

### 8.6 Frontend — SPA Vanilla JS

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

---

## 9. Troubleshooting — Problemas Resueltos

| Problema | Causa raíz | Solución |
|----------|-----------|----------|
| CORS error en `fetch()` del frontend | El navegador bloqueaba peticiones cross-origin al backend | `CorsConfig.java` en cada microservicio permite `*`; el gateway deduplica headers |
| HTTP 403 en `GET /usuarios/mis-hijos` | La regla de `SecurityConfig` no incluía ese path explícitamente antes de `/**` | Se agregó `.requestMatchers("/usuarios/mis-hijos").hasRole("APODERADO")` antes de la regla genérica |
| Roles no reconocidos por Spring Security | El rol en el JWT no tenía el prefijo `ROLE_` | `JwtAuthFilter` agrega `"ROLE_"` al construir `SimpleGrantedAuthority` |
| IntelliJ no resuelve imports Maven | Maven no recargado tras cambios en `pom.xml` | "Reimport All Maven Projects" desde el panel de Maven |

---

---

## 10. Sesión de Limpieza — Auditoría de Código

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

---

## 11. Alcance Actual y Próximos Pasos

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
