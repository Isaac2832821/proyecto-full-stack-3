# Informe Técnico — Sistema de Gestión Escolar
## Colegio Bernardo O'Higgins
### Plataforma Web Full-Stack con Arquitectura de Microservicios

---

**Versión:** 1.0.0  
**Fecha:** Mayo 2026  
**Estado:** En desarrollo / Funcional  
**Repositorio:** GitHub — proyecto-colegio

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Planteamiento del Problema](#2-planteamiento-del-problema)
3. [Solución Propuesta](#3-solución-propuesta)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Especificación de Microservicios](#5-especificación-de-microservicios)
6. [Modelo de Datos](#6-modelo-de-datos)
7. [Seguridad y Autenticación](#7-seguridad-y-autenticación)
8. [Frontend — Diseño e Implementación](#8-frontend--diseño-e-implementación)
9. [API Endpoints](#9-api-endpoints)
10. [Requisitos Funcionales y No Funcionales](#10-requisitos-funcionales-y-no-funcionales)
11. [Stack Tecnológico](#11-stack-tecnológico)
12. [Guía de Despliegue](#12-guía-de-despliegue)
13. [Estado Actual del Proyecto](#13-estado-actual-del-proyecto)
14. [Conclusiones](#14-conclusiones)

---

## 1. Resumen Ejecutivo

Se desarrolló una plataforma web de gestión escolar para el **Colegio Bernardo O'Higgins** utilizando una arquitectura de microservicios moderna. El sistema centraliza la administración de calificaciones, asistencia, comunicación y gestión de usuarios bajo un único ecosistema digital, con interfaces diferenciadas por rol (administrador, profesor, estudiante/apoderado).

La solución emplea tecnologías de nivel empresarial: **Java 17 + Spring Boot 3.4.4** para el backend, **Google Cloud Firestore** como base de datos NoSQL escalable, **Spring Cloud Netflix Eureka** para descubrimiento de servicios, y un frontend SPA desarrollado en **Vite + Vanilla JS** con diseño corporativo tipo SaaS.

---

## 2. Planteamiento del Problema

Los colegios de educación media en Chile enfrentan desafíos operativos críticos:

- **Fragmentación de información**: Calificaciones, asistencia y comunicados gestionados en sistemas separados o en papel.
- **Falta de trazabilidad**: Historial académico disperso, sin acceso unificado para apoderados.
- **Demora en comunicaciones**: Ausencia de mensajería digital entre profesores, estudiantes y apoderados.
- **Escalabilidad limitada**: Sistemas monolíticos que no crecen con la institución.
- **Seguridad insuficiente**: Acceso sin control de roles ni auditoría.

### Impacto

Estos problemas generan ineficiencia administrativa, insatisfacción de apoderados y riesgo de pérdida de datos críticos del proceso educativo.

---

## 3. Solución Propuesta

### Enfoque Arquitectónico

Se optó por una **arquitectura de microservicios** desacoplada, donde cada dominio funcional es un servicio independiente. Esto permite:

- **Escalabilidad horizontal**: Cada microservicio puede escalarse de forma independiente según la carga.
- **Mantenibilidad**: Un equipo puede trabajar en `ms-calificaciones` sin afectar `ms-asistencia`.
- **Resiliencia**: Un fallo en un servicio no colapsa todo el sistema.
- **Despliegue continuo**: Cada servicio puede actualizarse sin downtime del sistema completo.

### Decisiones de Diseño Clave

| Decisión | Alternativa considerada | Justificación |
|----------|------------------------|---------------|
| Firestore (NoSQL) | PostgreSQL (SQL) | Flexibilidad de esquema, escala automática, SDK nativo en Firebase |
| JWT stateless | Sesiones con Redis | No requiere almacenamiento de estado, compatible con microservicios |
| Eureka Discovery | Kubernetes DNS | Menor complejidad operacional para el contexto académico |
| Spring Cloud Gateway | Nginx Proxy | Integración nativa con el ecosistema Spring, filtros JWT en Java |
| Vite + Vanilla JS | React / Angular | Sin overhead de framework, control total del DOM, bundles pequeños |

---

## 4. Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                           │
│            http://localhost:5173 (Desarrollo)                    │
│                  Frontend SPA — Vite + JS                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTPS / REST
                          │  Authorization: Bearer <JWT>
┌─────────────────────────▼───────────────────────────────────────┐
│                     API GATEWAY                                  │
│              Spring Cloud Gateway — Puerto 8080                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Filtros: JwtAuthFilter → RateLimiter → RouteLocator     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────┬──────────────┬──────────────────┬────────────────────────┘
       │              │                  │
  /auth/**      /calificaciones/**   /asistencia/**
       │              │                  │
┌──────▼──────┐ ┌─────▼────────┐ ┌──────▼──────┐
│ms-autenti-  │ │ms-califica-  │ │ms-asistencia│
│cacion :8081 │ │ciones :8082  │ │   :8083     │
│             │ │              │ │             │
│ Controllers │ │ Controllers  │ │ Controllers │
│ Services    │ │ Services     │ │ Services    │
│ Security    │ │ Security     │ │ Security    │
│ Firebase    │ │ Firebase     │ │ Firebase    │
└──────┬──────┘ └──────┬───────┘ └──────┬──────┘
       │               │                │
       └───────────────┴────────────────┘
                       │
           ┌───────────▼────────────┐
           │   Google Cloud         │
           │   Firestore            │
           │   (NoSQL Database)     │
           └────────────────────────┘

           ┌────────────────────────┐
           │   Eureka Server        │
           │   Puerto 8761          │
           │   Service Registry     │
           └────────────────────────┘
```

### Flujo de Autenticación

```
Cliente → POST /api/auth/login → API Gateway → ms-autenticacion
       ←─── 200 OK { token: "eyJ..." } ──────────────────────────

Cliente → GET /api/calificaciones (Bearer token) → API Gateway
       → [JwtAuthFilter valida firma] → ms-calificaciones
       ←─── 200 OK { calificaciones: [...] } ─────────────────────
```

---

## 5. Especificación de Microservicios

### 5.1 Eureka Server (`:8761`)

**Responsabilidad**: Registro centralizado de instancias de microservicios.

- Basado en Spring Cloud Netflix Eureka
- Dashboard web disponible en `http://localhost:8761`
- Todos los microservicios se registran automáticamente al arrancar
- Health checks periódicos para detectar instancias caídas

**Configuración clave**:
```yaml
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: false
```

---

### 5.2 API Gateway (`:8080`)

**Responsabilidad**: Punto de entrada único, enrutamiento, validación JWT.

**Rutas configuradas**:

| Ruta de entrada | Destino | Descripción |
|-----------------|---------|-------------|
| `/api/auth/**` | ms-autenticacion | Endpoints públicos de login/registro |
| `/api/calificaciones/**` | ms-calificaciones | Protegido — requiere JWT válido |
| `/api/asistencia/**` | ms-asistencia | Protegido — requiere JWT válido |
| `/api/usuarios/**` | ms-autenticacion | Protegido — solo ADMIN |

**Características**:
- Filtro JWT global: valida la firma del token antes de reenviar la solicitud
- CORS habilitado para el frontend en `localhost:5173`
- Integración con Eureka para descubrimiento dinámico de instancias

---

### 5.3 ms-autenticacion (`:8081`)

**Responsabilidad**: Gestión de identidad, autenticación y autorización.

**Entidades principales**:
- `Usuario`: id, nombre, correo, password (hash), rol, activo, fechaCreacion
- Colección Firestore: `usuarios`

**Funcionalidades**:
- Login con email/password → genera JWT firmado con clave secreta HS256
- Registro de usuarios con hash BCrypt de contraseña
- CRUD completo de usuarios (solo ADMIN)
- Validación de email único
- Token con claims: `sub` (uid), `rol`, `nombre`, `exp`

**Tecnologías específicas**:
- `JJWT 0.12.6` para generación y validación de tokens
- `Spring Security` con configuración stateless
- `Firebase Admin SDK 9.3.0` para Firestore
- `SpringDoc OpenAPI 2.8.6` para Swagger UI

---

### 5.4 ms-calificaciones (`:8082`)

**Responsabilidad**: Gestión de notas académicas y asignaturas.

**Entidades principales**:
- `Calificacion`: id, alumnoId, asignaturaId, nota, tipo, fecha, profesorId
- `Asignatura`: id, nombre, codigo, nivel, profesorId
- Colecciones Firestore: `calificaciones`, `asignaturas`

**Funcionalidades**:
- CRUD de calificaciones con control de acceso por rol
- CRUD de asignaturas (solo ADMIN)
- Filtrado de calificaciones por alumno, asignatura, período
- Validación de notas en rango 1.0 – 7.0

**Control de acceso**:
- `ADMIN`: acceso total
- `PROFESOR`: crear/editar/eliminar calificaciones de sus cursos
- `ESTUDIANTE`: solo lectura de sus propias notas
- `APODERADO`: lectura de notas de sus pupilos

---

### 5.5 ms-asistencia (`:8083`)

**Responsabilidad**: Registro y consulta del control de asistencia.

**Entidades principales**:
- `Asistencia`: id, alumnoId, fecha, estado (PRESENTE/AUSENTE/TARDANZA), justificacion, profesorId
- Colección Firestore: `asistencia`

**Funcionalidades**:
- Registro masivo de asistencia (lista completa de un curso)
- Consulta por alumno y rango de fechas
- Estadísticas de porcentaje de asistencia
- Justificaciones de ausencias

---

## 6. Modelo de Datos

### Colecciones Firestore

```
usuarios/
  {uid}/
    nombre: string
    correo: string
    password: string (BCrypt hash)
    rol: "ADMIN" | "PROFESOR" | "ESTUDIANTE" | "APODERADO"
    activo: boolean
    fechaCreacion: timestamp

asignaturas/
  {asignaturaId}/
    nombre: string
    codigo: string
    nivel: string (ej: "1°A", "2°B")
    profesorId: string (ref → usuarios)

calificaciones/
  {calificacionId}/
    alumnoId: string (ref → usuarios)
    asignaturaId: string (ref → asignaturas)
    nota: number (1.0 - 7.0)
    tipo: "PRUEBA" | "TAREA" | "EXAMEN"
    fecha: timestamp
    profesorId: string (ref → usuarios)

asistencia/
  {asistenciaId}/
    alumnoId: string (ref → usuarios)
    asignaturaId: string (ref → asignaturas)
    fecha: timestamp
    estado: "PRESENTE" | "AUSENTE" | "TARDANZA"
    justificacion: string (opcional)
    profesorId: string (ref → usuarios)

mensajes/
  {mensajeId}/
    de: string (uid remitente)
    para: string (uid destinatario)
    contenido: string
    leido: boolean
    timestamp: timestamp
```

---

## 7. Seguridad y Autenticación

### Flujo JWT

```
1. Cliente envía: POST /api/auth/login { correo, password }
2. ms-autenticacion verifica credenciales en Firestore
3. Si válido: genera JWT con JJWT:
   Header: { alg: "HS256", typ: "JWT" }
   Payload: { sub: uid, rol: "PROFESOR", nombre: "...", exp: ... }
   Signature: HMACSHA256(header + payload, SECRET_KEY)
4. Retorna: { token: "eyJ...", tipo: "Bearer", rol: "PROFESOR" }
5. Frontend almacena el token y lo envía en cada solicitud:
   Authorization: Bearer eyJ...
6. API Gateway intercepta, valida firma y extrae claims
7. Si válido: reenvía solicitud al microservicio destino
```

### Capas de Seguridad

| Capa | Implementación |
|------|----------------|
| Transporte | HTTPS (producción) |
| Autenticación | JWT HS256, expiración configurable |
| Autorización | Roles en claims JWT, validados en cada servicio |
| Contraseñas | BCrypt con factor de coste 10 |
| Credenciales Firebase | Archivo `serviceAccountKey.json` excluido de Git |
| CORS | Configurado explícitamente en Gateway y cada servicio |

### Configuración Spring Security (por microservicio)

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**", "/swagger-ui/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
```

---

## 8. Frontend — Diseño e Implementación

### Arquitectura SPA

El frontend es una Single Page Application (SPA) sin framework, con navegación por vistas inyectadas dinámicamente en el DOM.

```
frontend/
├── src/
│   ├── main.js          # Router SPA + todas las vistas
│   ├── mensajeria.js    # Módulo de mensajería Firestore real-time
│   ├── firebase.js      # Inicialización Firebase JS SDK
│   ├── assets/
│   │   ├── logo.png     # Logotipo corporativo
│   │   └── fondo-login.mp4  # Video de fondo del login
│   └── styles/
│       └── main.css     # Sistema de diseño corporativo
├── index.html           # Shell HTML
├── vite.config.js       # Proxy del dev server
└── package.json
```

### Sistema de Diseño

| Variable CSS | Valor | Uso |
|--------------|-------|-----|
| `--primary` | `#1F3A5F` | Color corporativo principal |
| `--primary-light` | `#2B5080` | Hover states |
| `--accent` | `#3498DB` | Acciones, botones CTA |
| `--sidebar-bg` | `#1F3A5F` | Fondo del sidebar |
| `--text-primary` | `#1A2B3C` | Texto principal |
| `--surface` | `#FFFFFF` | Tarjetas y contenedores |
| `--border` | `#E2E8F0` | Bordes sutiles |

### Vistas por Rol

**Login**
- Fondo de video animado con overlay glassmorphism
- Validación de credenciales con JWT
- Redirección automática según rol

**Dashboard — Administrador**
- Gestión completa de usuarios (crear, editar, eliminar)
- Gestión de profesores y asignaturas
- Estadísticas del sistema

**Dashboard — Profesor**
- Registro de calificaciones por asignatura y alumno
- Control de asistencia con registro masivo
- Mensajería con estudiantes y apoderados
- Vista de gráficos de rendimiento (Chart.js)

**Dashboard — Estudiante/Apoderado**
- Vista de calificaciones propias / del pupilo
- Historial de asistencia con estadísticas
- Mensajería con profesores

### Mensajería en Tiempo Real

El módulo `mensajeria.js` utiliza **Firestore real-time listeners** (`onSnapshot`) para actualizar la bandeja de entrada sin necesidad de polling.

---

## 9. API Endpoints

### Base URL (Desarrollo): `http://localhost:8080`

#### Autenticación

```
POST   /api/auth/login              → { token, rol, nombre }
POST   /api/auth/register           → { uid, mensaje }   [ADMIN]
```

#### Usuarios

```
GET    /api/usuarios                → [Usuario]           [ADMIN]
GET    /api/usuarios/{id}           → Usuario             [ADMIN]
PUT    /api/usuarios/{id}           → Usuario             [ADMIN]
DELETE /api/usuarios/{id}           → 204                 [ADMIN]
```

#### Calificaciones

```
GET    /api/calificaciones                    → [Calificacion]
GET    /api/calificaciones/alumno/{id}        → [Calificacion]
POST   /api/calificaciones                    → Calificacion    [PROF]
PUT    /api/calificaciones/{id}               → Calificacion    [PROF]
DELETE /api/calificaciones/{id}               → 204             [PROF]
```

#### Asignaturas

```
GET    /api/asignaturas             → [Asignatura]
GET    /api/asignaturas/{id}        → Asignatura
POST   /api/asignaturas             → Asignatura          [ADMIN]
PUT    /api/asignaturas/{id}        → Asignatura          [ADMIN]
DELETE /api/asignaturas/{id}        → 204                 [ADMIN]
```

#### Asistencia

```
GET    /api/asistencia                        → [Asistencia]
GET    /api/asistencia/alumno/{id}            → [Asistencia]
POST   /api/asistencia                        → Asistencia      [PROF]
PUT    /api/asistencia/{id}                   → Asistencia      [PROF]
```

---

## 10. Requisitos Funcionales y No Funcionales

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-01 | El sistema debe permitir iniciar sesión con email y contraseña | Alta |
| RF-02 | El sistema debe controlar el acceso según el rol del usuario | Alta |
| RF-03 | Los profesores deben poder registrar y editar calificaciones | Alta |
| RF-04 | Los estudiantes deben poder consultar sus propias notas | Alta |
| RF-05 | Los profesores deben poder registrar asistencia diaria | Alta |
| RF-06 | Los usuarios deben poder enviarse mensajes entre sí | Media |
| RF-07 | El administrador debe poder gestionar usuarios del sistema | Alta |
| RF-08 | El administrador debe poder gestionar asignaturas | Alta |
| RF-09 | El sistema debe mostrar estadísticas y gráficos de rendimiento | Media |
| RF-10 | Los apoderados deben poder ver las notas de sus pupilos | Alta |

### Requisitos No Funcionales

| ID | Requisito | Categoría | Métrica |
|----|-----------|-----------|---------|
| RNF-01 | El login debe responder en menos de 2 segundos | Rendimiento | < 2s p95 |
| RNF-02 | El sistema debe soportar múltiples usuarios simultáneos | Escalabilidad | ≥ 100 usuarios concurrentes |
| RNF-03 | Los tokens JWT deben expirar y renovarse | Seguridad | Expiración < 24h |
| RNF-04 | Las contraseñas deben almacenarse con hash | Seguridad | BCrypt factor 10 |
| RNF-05 | La interfaz debe ser responsiva | Usabilidad | Compatible mobile/desktop |
| RNF-06 | El código fuente debe excluir credenciales | Seguridad | Sin secrets en Git |
| RNF-07 | Los servicios deben registrarse automáticamente | Disponibilidad | Auto-discovery Eureka |
| RNF-08 | La API debe estar documentada | Mantenibilidad | Swagger UI disponible |

---

## 11. Stack Tecnológico

### Backend — Detalle de Dependencias

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| Spring Boot | 3.4.4 | Framework base de aplicaciones |
| Spring Cloud | 2024.0.3 | Eureka, Gateway, Config |
| Spring Security | (Boot managed) | Autenticación y autorización |
| JJWT | 0.12.6 | Generación y validación de JWT |
| Firebase Admin SDK | 9.3.0 / 9.4.3 | Acceso a Firestore |
| SpringDoc OpenAPI | 2.8.6 | Documentación Swagger |
| Lombok | (Boot managed) | Reducción de boilerplate |
| JUnit 5 | (Boot managed) | Testing unitario e integración |

### Frontend — Dependencias

| Dependencia | Propósito |
|-------------|-----------|
| Vite | Build tool y dev server |
| Firebase JS SDK | Auth y Firestore en tiempo real |
| Chart.js | Gráficos de calificaciones/asistencia |

### Infraestructura de Desarrollo

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Java | 17 LTS | Runtime y compilación |
| Maven | 3.8+ | Gestión de dependencias y build |
| Node.js | 18+ | Runtime frontend |
| npm | 9+ | Gestión de paquetes frontend |
| Git | 2.x | Control de versiones |

---

## 12. Guía de Despliegue

### Orden de Inicio (OBLIGATORIO)

```
1. eureka-server  (esperar a que esté UP en :8761)
2. api-gateway    (esperar a que se registre en Eureka)
3. ms-autenticacion, ms-calificaciones, ms-asistencia (en cualquier orden)
4. frontend (npm run dev)
```

### Variables de Entorno Requeridas

```bash
# JWT (mismo valor en todos los microservicios)
JWT_SECRET=<clave-secreta-minimo-32-caracteres>
JWT_EXPIRATION=86400000   # 24 horas en ms

# Firebase (ruta al archivo de credenciales)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

### Verificación del Sistema

Una vez todos los servicios estén corriendo:

1. **Eureka Dashboard**: http://localhost:8761 — deben aparecer todos los servicios como UP
2. **API Gateway health**: http://localhost:8080/actuator/health
3. **Login de prueba**: POST http://localhost:8080/api/auth/login
4. **Frontend**: http://localhost:5173

---

## 13. Estado Actual del Proyecto

### ✅ Completado

| Componente | Estado | Notas |
|------------|--------|-------|
| Eureka Server | ✅ Funcional | Registro y discovery operativo |
| API Gateway | ✅ Funcional | Enrutamiento y validación JWT |
| ms-autenticacion | ✅ Funcional | Login, registro, CRUD usuarios |
| ms-calificaciones | ✅ Funcional | CRUD calificaciones y asignaturas |
| ms-asistencia | ✅ Funcional | Registro y consulta de asistencia |
| Frontend — Login | ✅ Funcional | Video fondo, glassmorphism |
| Frontend — Dashboard Admin | ✅ Funcional | Gestión usuarios, profesores, asignaturas |
| Frontend — Dashboard Profesor | ✅ Funcional | Calificaciones, asistencia, gráficos |
| Frontend — Dashboard Estudiante | ✅ Funcional | Vista de notas y asistencia |
| Mensajería real-time | ✅ Funcional | Firestore onSnapshot |
| Diseño corporativo | ✅ Funcional | Paleta #1F3A5F, responsivo |
| Swagger UI | ✅ Disponible | En cada microservicio |
| Seguridad JWT | ✅ Funcional | HS256, roles en claims |

### 🔄 En Progreso / Mejoras Pendientes

| Item | Prioridad | Descripción |
|------|-----------|-------------|
| Tests unitarios | Media | Incrementar cobertura de tests |
| Dockerización | Media | Dockerfiles para cada servicio |
| Docker Compose | Media | Orquestación local completa |
| Variables de entorno | Alta | Externizar configuraciones sensibles |
| Logging centralizado | Baja | ELK Stack o equivalente |

---

## 14. Conclusiones

### Logros Técnicos

1. **Arquitectura desacoplada**: Los microservicios son completamente independientes, permitiendo desarrollo y despliegue paralelos.

2. **Seguridad robusta**: La implementación de JWT stateless garantiza que ningún estado de sesión se almacene en el servidor, mejorando la escalabilidad y seguridad.

3. **Escalabilidad nativa**: Al usar Firestore (PaaS) y Spring Cloud, el sistema puede escalar horizontalmente sin cambios arquitectónicos.

4. **Experiencia de usuario**: El diseño corporativo con glassmorphism, animaciones y gráficos interactivos ofrece una experiencia premium que rivaliza con productos SaaS comerciales.

5. **Mensajería en tiempo real**: La integración con Firestore `onSnapshot` proporciona actualizaciones instantáneas sin polling, reduciendo la latencia percibida a cero.

### Aprendizajes

- La configuración CORS en un sistema multi-capa (Gateway + Microservicio) requiere coordinación cuidadosa para evitar errores en el navegador.
- Firestore impone límites en consultas compuestas que requieren índices adicionales; estos deben crearse manualmente desde la consola de Firebase.
- La validación del JWT en dos capas (Gateway + microservicio) añade seguridad en profundidad pero requiere que la misma clave secreta esté disponible en todos los servicios.

### Trabajo Futuro

- **Contenedorización**: Migrar todos los servicios a Docker con un `docker-compose.yml` centralizado.
- **CI/CD**: Pipeline con GitHub Actions para testing automático y despliegue.
- **Monitoreo**: Integración de Prometheus + Grafana para métricas de rendimiento.
- **Notificaciones**: Push notifications con Firebase Cloud Messaging para alertas de notas y asistencia.

---

*Documento generado el Mayo de 2026 — Proyecto académico Ingeniería en Informática*
