# 🏫 Colegio Bernardo O'Higgins — Sistema de Gestión Escolar

Sistema de gestión escolar completo basado en arquitectura de **microservicios** con **Spring Boot 3.4.4** y **Spring Cloud 2024.0.3**, con frontend en Vanilla JS.

---

## 📋 Índice

- [Arquitectura General](#-arquitectura-general)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos](#-módulos)
- [Orden de Ejecución](#-orden-de-ejecución)
- [API REST — Endpoints](#-api-rest--endpoints)
- [Seguridad y JWT](#-seguridad-y-jwt)
- [Modelo de Datos](#-modelo-de-datos-firestore)
- [Datos Semilla](#-datos-semilla)
- [Tests Unitarios](#-tests-unitarios)
- [Configuraciones Importantes](#-configuraciones-importantes)

---

## 🏗 Arquitectura General

```text
                    ┌─────────────────────────────────┐
                    │       Eureka Server (:8761)      │
                    │  Registro y descubrimiento de    │
                    │          servicios               │
                    └────────────┬────────────────────┘
                                 │ registra / descubre
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   api-gateway    │  │  ms-autenticacion   │  │  ms-calificaciones  │
│    (:8080)       │  │      (:8081)        │  │      (:8082)        │
│                  │  │                     │  │                     │
│ Punto de entrada │  │ Login · Registro    │  │ Calificaciones      │
│ único. Enruta   │─►│ JWT · Usuarios      │  │ Asignaturas         │
│ con lb://       │  │ Firebase Firestore   │  │ Firebase Firestore  │
└────────┬─────────┘  └─────────────────────┘  └─────────────────────┘
         │
┌────────▼─────────┐
│   Frontend       │
│   (:5173)        │
│  Vanilla JS/Vite │
└──────────────────┘
```

**Flujo de una petición:**
1. El frontend hace `fetch` al **api-gateway** (`:8080`).
2. El gateway consulta **Eureka** para resolver la IP del servicio destino (`lb://`).
3. La petición llega al microservicio correspondiente.
4. Cada microservicio valida el JWT de forma **independiente** usando la misma clave secreta.

---

## 🛠 Stack Tecnológico

| Tecnología               | Versión     | Uso                                           |
|--------------------------|-------------|-----------------------------------------------|
| **Java**                 | 17          | Lenguaje principal backend                    |
| **Spring Boot**          | 3.4.4       | Framework base de todos los microservicios    |
| **Spring Cloud**         | 2024.0.3    | Infraestructura de microservicios             |
| **Netflix Eureka**       | —           | Service Discovery                             |
| **Spring Cloud Gateway** | —           | API Gateway reactivo (WebFlux)                |
| **Firebase Admin SDK**   | 9.3.0       | Conexión con Firestore Database (backend)     |
| **Spring Security**      | —           | Autenticación y autorización por roles        |
| **JJWT**                 | 0.12.6      | Generación y validación de tokens JWT         |
| **Lombok**               | —           | Reducción de boilerplate                      |
| **Swagger / OpenAPI**    | 2.8.6       | Documentación interactiva de la API           |
| **JUnit 5 + Mockito**    | —           | Tests unitarios (`ms-autenticacion`)          |
| **Vite / Vanilla JS**    | 6.x         | Frontend SPA                                  |

---

## 📁 Estructura del Proyecto

```text
proyecto/
├── pom.xml                          # POM padre (multi-módulo Maven)
├── README.md                        # Esta documentación
├── informe_estado_proyecto.md       # Historial de desarrollo y sesiones
│
├── eureka-server/                   # Servidor de descubrimiento (:8761)
├── api-gateway/                     # Puerta de entrada única (:8080)
│
├── ms-autenticacion/                # Microservicio de auth (:8081)
│   └── src/main/java/cl/colegio/autenticacion/
│       ├── config/         # SecurityConfig, FirebaseConfig, CorsConfig, DataSeeder, OpenApiConfig
│       ├── controller/     # AuthController, UsuarioController
│       ├── dto/            # RegisterRequest, LoginRequest, AuthResponse, UsuarioDTO...
│       ├── entity/         # Usuario, Rol (enum)
│       ├── exception/      # UsuarioNotFoundException, DuplicateResourceException, GlobalExceptionHandler
│       ├── repository/     # UsuarioRepository (Firestore)
│       ├── security/       # JwtAuthFilter, UsuarioDetailsService
│       └── service/        # AuthService, JwtService, UsuarioService
│
├── ms-calificaciones/               # Microservicio de calificaciones (:8082)
│   └── src/main/java/cl/colegio/calificaciones/
│       ├── config/         # SecurityConfig, FirebaseConfig, CorsConfig
│       ├── controller/     # CalificacionController, AsignaturaController
│       ├── dto/            # CalificacionRequest, AsignaturaRequest
│       ├── entity/         # Calificacion (+ enum TipoEvaluacion), Asignatura
│       ├── exception/      # GlobalExceptionHandler
│       ├── repository/     # CalificacionRepository, AsignaturaRepository (Firestore)
│       ├── security/       # JwtAuthFilter, JwtService
│       └── service/        # CalificacionService, AsignaturaService
│
└── frontend/                        # Cliente Web SPA (:5173)
    ├── index.html
    ├── package.json
    └── src/
        ├── main.js          # Toda la lógica: login, registro, dashboard, fetch
        └── styles/main.css  # Sistema de estilos Dark Mode
```

---

## 📦 Módulos

### 1. eureka-server
Servidor de descubrimiento (Netflix Eureka). Actúa como "directorio": cada microservicio se registra aquí al arrancar y el API Gateway lo consulta para enrutar peticiones.
- **Puerto:** `8761` · **Dashboard:** `http://localhost:8761`
- Modo standalone — no se autoregistra (`register-with-eureka: false`)

---

### 2. api-gateway
Punto de entrada único. El frontend solo habla con este servicio; él decide a qué microservicio reenviar según la ruta.
- **Puerto:** `8080` · **Tecnología:** Spring Cloud Gateway (WebFlux/reactivo)

| Ruta                  | Destino             |
|-----------------------|---------------------|
| `/auth/**`            | `ms-autenticacion`  |
| `/usuarios/**`        | `ms-autenticacion`  |
| `/calificaciones/**`  | `ms-calificaciones` |
| `/asignaturas/**`     | `ms-calificaciones` |

---

### 3. ms-autenticacion
Microservicio central de autenticación. Emite los JWT que todos los demás servicios validan.
- **Puerto:** `8081` · **Swagger:** `http://localhost:8081/swagger-ui.html`
- **BD:** Firestore — colección `usuarios`

**Funcionalidades:** Registro · Login · Refresh Token · Perfil · Cambiar contraseña · CRUD usuarios · Ver hijos (apoderado)

---

### 4. ms-calificaciones
Gestión de calificaciones y asignaturas. Valida JWT de forma independiente sin consultar a `ms-autenticacion`.
- **Puerto:** `8082` · **Swagger:** `http://localhost:8082/swagger-ui.html`
- **BD:** Firestore — colecciones `calificaciones` y `asignaturas`

**Tipos de evaluación:** `PRUEBA` · `TAREA` · `EXAMEN` · `TRABAJO` · `PRESENTACION`

---

### 5. frontend
SPA en Vanilla JS con Vite. Todas las peticiones van al api-gateway (`:8080`).
- **Puerto:** `5173`
- **Vistas por rol:** ADMIN (gestión usuarios) · APODERADO (hijos + notas) · DOCENTE (registrar calificaciones) · ESTUDIANTE (mis notas)

---

## 🚀 Orden de Ejecución

```bash
# 1. Eureka (el registro debe estar primero)
cd eureka-server && mvn spring-boot:run

# 2. Microservicio de autenticación
cd ms-autenticacion && mvn spring-boot:run

# 3. Microservicio de calificaciones
cd ms-calificaciones && mvn spring-boot:run

# 4. API Gateway (necesita que Eureka tenga los servicios)
cd api-gateway && mvn spring-boot:run

# 5. Frontend
cd frontend && npm install && npm run dev
```

> Abre **http://localhost:5173** en el navegador.
> El gateway puede tardar 10-15 segundos en descubrir los servicios tras el arranque.

---

## 🌐 API REST — Endpoints

### `/auth` — Autenticación 🔓

| Método | Ruta              | Descripción                               | Auth |
|--------|-------------------|-------------------------------------------|------|
| POST   | `/auth/register`  | Registrar nuevo usuario                   | No   |
| POST   | `/auth/login`     | Login — retorna `accessToken` + `refreshToken` | No |
| POST   | `/auth/refresh`   | Renovar access token con refresh token    | No   |
| GET    | `/auth/validate`  | Validar si un token es vigente            | No   |
| GET    | `/auth/me`        | Perfil del usuario autenticado            | 🔒   |
| PATCH  | `/auth/password`  | Cambiar contraseña propia                 | 🔒   |

### `/usuarios` — Gestión de Usuarios 🔒

| Método | Ruta                   | Descripción                         | Rol         |
|--------|------------------------|-------------------------------------|-------------|
| GET    | `/usuarios`            | Listar todos los usuarios           | `ADMIN`     |
| GET    | `/usuarios/mis-hijos`  | Estudiantes a cargo del apoderado   | `APODERADO` |
| GET    | `/usuarios/{id}`       | Obtener usuario por ID              | `ADMIN`     |
| PATCH  | `/usuarios/{id}/rol`   | Cambiar rol de un usuario           | `ADMIN`     |
| DELETE | `/usuarios/{id}`       | Desactivar usuario (borrado lógico) | `ADMIN`     |

### `/calificaciones` — Notas 🔒

| Método | Ruta                                        | Descripción                        | Rol                |
|--------|---------------------------------------------|------------------------------------|--------------------|
| POST   | `/calificaciones`                           | Registrar calificación             | `DOCENTE`          |
| GET    | `/calificaciones`                           | Listar todas                       | `ADMIN`, `DOCENTE` |
| GET    | `/calificaciones/{id}`                      | Obtener por ID                     | Autenticado        |
| GET    | `/calificaciones/mis-registros`             | Del docente autenticado            | `DOCENTE`          |
| GET    | `/calificaciones/estudiante/{estudianteId}` | Por estudiante (RUT)               | Autenticado        |
| GET    | `/calificaciones/asignatura/{asignaturaId}` | Por asignatura                     | Autenticado        |
| PUT    | `/calificaciones/{id}`                      | Actualizar calificación            | `DOCENTE`          |
| DELETE | `/calificaciones/{id}`                      | Eliminar calificación              | `ADMIN`, `DOCENTE` |

### `/asignaturas` — Materias 🔒

| Método | Ruta                           | Descripción                        | Rol         |
|--------|--------------------------------|------------------------------------|-------------|
| POST   | `/asignaturas`                 | Crear asignatura                   | `ADMIN`     |
| GET    | `/asignaturas`                 | Listar todas                       | Autenticado |
| GET    | `/asignaturas/{id}`            | Obtener por ID                     | Autenticado |
| GET    | `/asignaturas/mis-asignaturas` | Asignaturas del docente autenticado| `DOCENTE`   |
| PUT    | `/asignaturas/{id}`            | Actualizar asignatura              | `ADMIN`     |
| DELETE | `/asignaturas/{id}`            | Eliminar asignatura                | `ADMIN`     |

---

## 🔐 Seguridad y JWT

### Flujo completo

```text
1. POST /auth/login  →  Spring Security verifica credenciales (BCrypt)
2. ms-autenticacion genera:
   - accessToken  (24 horas)  → para peticiones normales
   - refreshToken (7 días)    → para renovar sin re-login
3. Frontend guarda ambos tokens en localStorage
4. Cada request incluye: Authorization: Bearer <accessToken>
5. El microservicio receptor valida el token con la clave secreta compartida
   (sin consultar a ms-autenticacion — independencia total)
6. Si expira: POST /auth/refresh → nuevos tokens sin re-login
```

### Payload del JWT

```json
{
  "sub":    "12345678-9",      // RUT del usuario
  "id":     "docId-firestore", // Document ID en Firestore
  "rol":    "DOCENTE",         // Rol del usuario
  "type":   "access",          // "access" o "refresh"
  "iat":    1714000000,
  "exp":    1714086400
}
```

### Clave secreta compartida

Ambos microservicios usan la **misma clave** en `application.yml`:
```yaml
jwt:
  secret: 5A7234753778214125442A472D4B6150645367566B5970337336763979244226
  expiration-ms: 86400000       # 24h (access)
  refresh-expiration-ms: 604800000  # 7 días (refresh) — solo ms-autenticacion
```

---

## 📊 Modelo de Datos (Firestore)

### Colección `usuarios`

| Campo        | Tipo    | Descripción                                    |
|--------------|---------|------------------------------------------------|
| `rut`        | String  | Único. Formato `12345678-9`                    |
| `nombre`     | String  |                                                |
| `apellido`   | String  |                                                |
| `email`      | String  | Único                                          |
| `password`   | String  | Hash BCrypt                                    |
| `rol`        | String  | `ADMIN` · `DOCENTE` · `ESTUDIANTE` · `APODERADO` |
| `idApoderado`| String  | ID del apoderado (solo si `rol = ESTUDIANTE`)  |
| `activo`     | Boolean | `false` = desactivado (borrado lógico)         |

### Colección `calificaciones`

| Campo            | Tipo    | Descripción                                         |
|------------------|---------|-----------------------------------------------------|
| `estudianteId`   | String  | RUT del estudiante                                  |
| `estudianteNombre` | String |                                                    |
| `asignaturaId`   | String  |                                                     |
| `asignaturaNombre` | String |                                                    |
| `nota`           | Double  | Rango `1.0 – 7.0` (validado)                       |
| `tipo`           | String  | `PRUEBA` · `TAREA` · `EXAMEN` · `TRABAJO` · `PRESENTACION` |
| `fecha`          | String  | Formato ISO 8601 (`yyyy-MM-dd`)                     |
| `observacion`    | String  | Opcional                                            |
| `docenteId`      | String  | RUT del docente — extraído del JWT automáticamente  |

### Colección `asignaturas`

| Campo          | Tipo    | Descripción                  |
|----------------|---------|------------------------------|
| `nombre`       | String  | Ej: "Matemáticas"            |
| `descripcion`  | String  |                              |
| `docenteId`    | String  | RUT del docente a cargo      |
| `docenteNombre`| String  |                              |
| `activa`       | Boolean |                              |

---

## 🌱 Datos Semilla

Al arrancar `ms-autenticacion`, el `DataSeeder` puebla Firestore si está vacío:

| RUT           | Nombre             | Rol          | Contraseña   |
|---------------|--------------------|--------------|-------------|
| `11111111-1`  | Administrador Sistema | `ADMIN`   | `Admin1234!` |
| `22222222-2`  | María González     | `DOCENTE`    | `Admin1234!` |
| `33333333-3`  | Carlos Rodríguez   | `APODERADO`  | `Admin1234!` |
| `44444444-4`  | Sofía Rodríguez    | `ESTUDIANTE` | `Admin1234!` |

---

## 🧪 Tests Unitarios

El `ms-autenticacion` tiene suite de tests en `AuthServiceTest.java` (JUnit 5 + Mockito).

| Grupo              | Casos cubiertos                                                  |
|--------------------|------------------------------------------------------------------|
| **Registro**       | ✅ Exitoso · ❌ RUT duplicado · ❌ Email duplicado               |
| **Login**          | ✅ Exitoso con tokens · ❌ Usuario inexistente                   |
| **Refresh Token**  | ✅ Válido genera nuevos tokens · ❌ Token inválido               |
| **Perfil**         | ✅ Retorna UsuarioDTO · ❌ Usuario inexistente                   |
| **Cambiar password** | ✅ Exitoso · ❌ Contraseña actual incorrecta                   |

```bash
cd ms-autenticacion
mvn test
```

---

## ⚙ Configuraciones Importantes

### Puertos del sistema

| Servicio            | Puerto |
|---------------------|--------|
| Eureka Server       | `8761` |
| API Gateway         | `8080` |
| ms-autenticacion    | `8081` |
| ms-calificaciones   | `8082` |
| Frontend (Vite)     | `5173` |

### `serviceAccountKey.json`

Cada microservicio que accede a Firestore necesita este archivo en `src/main/resources/`. **No se sube al repositorio** (está en `.gitignore`). Descárgalo desde Firebase Console → Configuración del Proyecto → Cuentas de Servicio.

### Exclusión de JPA/SQL

`ms-autenticacion` y `ms-calificaciones` excluyen la autoconfiguración de JPA ya que usan Firestore:

```yaml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration
```

### CORS

Cada microservicio tiene `CorsConfig.java` que permite `*` porque el control real de CORS se hace en el API Gateway (que deduplica headers con el filtro `DedupeResponseHeader`).

### Compilar todo el proyecto

```bash
mvn clean install -DskipTests
```
