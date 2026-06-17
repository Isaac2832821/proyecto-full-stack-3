# 🏫 Sistema de Gestión Escolar — Colegio Bernardo O'Higgins

> Plataforma web full-stack con arquitectura de **6 microservicios** desplegada en AWS EC2.  
> Autenticación JWT, base de datos Firestore, mensajería asíncrona con **RabbitMQ** y caché estadístico con **Redis**.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?logo=springboot)
![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.3-brightgreen?logo=spring)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow?logo=firebase)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-orange?logo=rabbitmq)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)
![Vite](https://img.shields.io/badge/Frontend-Vite%20+%20Vanilla%20JS-purple?logo=vite)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-orange?logo=amazonaws)

---

## 📋 Descripción General

Sistema integral para la gestión escolar con cuatro roles de usuario:

| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Gestión de usuarios, horarios, asignaturas, reportes globales |
| **Docente** | Registro de calificaciones, control de asistencia, consulta de horarios |
| **Apoderado** | Consulta de notas, asistencia, notificaciones y reportes del estudiante |
| **Estudiante** | Consulta de notas, asistencia, horarios y notificaciones personales |

---

## 🏗️ Arquitectura del Sistema (EA3)

```
  🌐 Navegador
      │ HTTP :80
      ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                        DOCKER NETWORK                                │
  │                                                                      │
  │  Frontend (nginx:80)                                                 │
  │      │                                                               │
  │      ▼                                                               │
  │  API Gateway (:8080) ──── Eureka Server (:8761)                      │
  │      │                                                               │
  │      ├──► ms-autenticacion  (:8081)  ──► Firestore                  │
  │      │                                                               │
  │      ├──► ms-calificaciones (:8082)  ──► Firestore                  │
  │      │         │                                                     │
  │      │         │ publica evento                                      │
  │      │         ▼                                                     │
  │      │    [RabbitMQ :5672] ──────────────────────────────────┐      │
  │      │    [Management :15672]                                 │      │
  │      │                                                        │      │
  │      ├──► ms-asistencia    (:8083)  ──► Firestore            │      │
  │      │                                                        │      │
  │      ├──► ms-notificaciones(:8084)  ──► Firestore ◄──────────┘      │
  │      │    (consumer RabbitMQ)                                        │
  │      │                                                               │
  │      ├──► ms-horarios      (:8085)  ──► Firestore                   │
  │      │                                                               │
  │      └──► ms-reportes      (:8086)  ──► ms-calificaciones           │
  │               │                         ms-asistencia               │
  │               ▼                                                      │
  │          [Redis :6379]  (caché TTL: 15/30/60 min)                   │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

### Flujo RabbitMQ (mensajería asíncrona)
```
Docente registra nota
  → CalificacionService → NotificacionProducer
    → Exchange: colegio.exchange (topic)
    → Routing key: calificacion.nueva
      → Cola: calificacion.registrada
        → NotificacionConsumer → NotificacionService
          → Notificación guardada en Firestore
```

---

## 📦 Microservicios

| Servicio | Puerto | Descripción | Tecnología especial |
|----------|--------|-------------|---------------------|
| `eureka-server` | 8761 | Registro y descubrimiento de servicios | Netflix Eureka |
| `api-gateway` | 8080 | Puerta de entrada única, validación JWT | Spring Cloud Gateway |
| `ms-autenticacion` | 8081 | Login, registro y gestión de usuarios JWT | — |
| `ms-calificaciones` | 8082 | CRUD de notas por asignatura | **RabbitMQ producer** |
| `ms-asistencia` | 8083 | Registro y consulta de asistencia | — |
| `ms-notificaciones` | 8084 | Notificaciones automáticas al estudiante | **RabbitMQ consumer** |
| `ms-horarios` | 8085 | Gestión de horarios de clases | — |
| `ms-reportes` | 8086 | Reportes estadísticos por estudiante/curso | **Redis cache** |
| `frontend` | 80 | SPA Vite + Vanilla JS | — |

### Infraestructura
| Servicio | Puerto | Rol |
|----------|--------|-----|
| Redis | 6379 | Caché de reportes estadísticos (TTL 15/30/60 min) |
| RabbitMQ | 5672 / 15672 | Broker de eventos + Management UI |

---

## 🛠️ Stack Tecnológico

### Backend
- **Java 17** con **Spring Boot 3.4.4**
- **Spring Cloud 2024.0.3** (Eureka, Gateway)
- **Spring Security** + **JJWT 0.12.6** para autenticación stateless
- **Firebase Admin SDK 9.x** + **Cloud Firestore** como BD NoSQL
- **Spring AMQP** + **RabbitMQ** para mensajería asíncrona
- **Spring Data Redis** + **Redis 7** para caché de reportes
- **SpringDoc OpenAPI 2.8.6** (Swagger UI en cada MS)
- **JaCoCo 0.8.11** para cobertura de tests
- **Lombok** para reducción de boilerplate

### Frontend
- **Vite** como build tool
- **Vanilla JS** (ES Modules)
- **Firebase JS SDK** para mensajería en tiempo real
- **Chart.js** para visualización de datos
- **CSS personalizado** con diseño corporativo (paleta `#1F3A5F`)

### DevOps
- **Docker** + **Docker Compose** para contenedorización local
- **GitHub Actions** para CI/CD automatizado
- **AWS EC2** (3 instancias t3.micro)
- **AWS Systems Manager (SSM)** para despliegue remoto

---

## 📁 Estructura del Proyecto

```
proyecto/
├── .github/workflows/
│   ├── deploy-frontend.yml       # CI/CD Frontend
│   ├── deploy-gateway.yml        # CI/CD Eureka + API Gateway
│   └── deploy-services.yml       # CI/CD Microservicios
├── api-gateway/                  # Spring Cloud Gateway
├── eureka-server/                # Netflix Eureka Server
├── ms-autenticacion/             # Autenticación + JWT
├── ms-calificaciones/            # Notas + RabbitMQ producer
├── ms-asistencia/                # Control de asistencia
├── ms-notificaciones/            # Notificaciones + RabbitMQ consumer  ← NUEVO
├── ms-horarios/                  # Horarios de clases                   ← NUEVO
├── ms-reportes/                  # Reportes estadísticos + Redis cache  ← NUEVO
├── frontend/                     # SPA (Vite + Vanilla JS)
├── docker-compose.yml            # Stack completo (desarrollo local)
├── docker-compose.ec2-*.yml      # Composiciones por instancia EC2
└── .env.example                  # Template de variables de entorno
```

---

## 🚀 Guía de Instalación

### Prerrequisitos
- Java 17+ / Docker Desktop
- Node.js 18+
- Archivo `serviceAccountKey.json` de Firebase

### Opción 1: Docker Compose (recomendado)

```bash
# 1. Clonar y configurar
git clone https://github.com/Isaac2832821/proyecto-full-stack-3.git
cd proyecto-full-stack-3
cp .env.example .env
# Editar .env con tus valores (JWT_SECRET, Firebase, etc.)

# 2. Levantar todo (incluye Redis y RabbitMQ)
docker compose up --build -d

# 3. Acceder
# Frontend:          http://localhost
# Gateway:           http://localhost:8080
# Eureka Dashboard:  http://localhost:8761
# RabbitMQ UI:       http://localhost:15672  (guest/guest)
```

### Opción 2: Ejecución manual

```bash
# Infraestructura
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Servicios backend (en terminales separadas)
cd eureka-server      && mvn spring-boot:run
cd api-gateway        && mvn spring-boot:run
cd ms-autenticacion   && mvn spring-boot:run
cd ms-calificaciones  && mvn spring-boot:run
cd ms-asistencia      && mvn spring-boot:run
cd ms-notificaciones  && mvn spring-boot:run
cd ms-horarios        && mvn spring-boot:run
cd ms-reportes        && mvn spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

### Usuarios de prueba

| RUT | Contraseña | Rol |
|-----|-----------|-----|
| `11111111-1` | `Admin1234!` | Administrador |
| `22222222-2` | `Admin1234!` | Docente |
| `33333333-3` | `Admin1234!` | Apoderado |
| `44444444-4` | `Admin1234!` | Estudiante |

---

## 📡 Endpoints API

Todas las peticiones pasan por el **API Gateway** (`:8080`):

### Autenticación (`/auth`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/login` | Público | Obtener JWT + refresh token |
| POST | `/auth/register` | ADMIN | Registrar usuario |
| POST | `/auth/refresh` | Autenticado | Renovar token |

### Calificaciones (`/calificaciones`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/calificaciones` | DOCENTE/ADMIN | CRUD calificaciones |
| GET | `/calificaciones/estudiante/{id}` | Autenticado | Por estudiante |

> Al crear una calificación, se publica automáticamente un evento en RabbitMQ → ms-notificaciones.

### Asistencia (`/asistencia`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/asistencia` | DOCENTE/ADMIN | CRUD asistencia |
| GET | `/asistencia/fecha/{fecha}` | Autenticado | Por fecha |

### Notificaciones (`/notificaciones`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/notificaciones/mis-notificaciones` | Autenticado | Mis notificaciones |
| PATCH | `/notificaciones/{id}/leida` | Autenticado | Marcar como leída |

### Horarios (`/horarios`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/horarios` | ADMIN/Autenticado | CRUD horarios |
| GET | `/horarios/curso/{curso}` | Autenticado | Por curso |
| GET | `/horarios/mis-horarios` | DOCENTE | Propios del docente |

### Reportes (`/reportes`) — con caché Redis
| Método | Ruta | Acceso | Cache TTL |
|--------|------|--------|-----------|
| GET | `/reportes/estudiante/{id}` | Autenticado | 15 minutos |
| GET | `/reportes/curso/{curso}` | ADMIN/DOCENTE | 30 minutos |
| DELETE | `/reportes/cache` | ADMIN | — |

---

## 🔴 Caché Redis — Estrategia

| Región de caché | TTL | Dato almacenado |
|-----------------|-----|-----------------|
| `reporte-estudiante` | **15 min** | Promedio general + notas por asignatura |
| `reporte-curso` | **30 min** | Estadísticas globales del curso |
| `ranking-curso` | **60 min** | Ranking de estudiantes por promedio |

El ADMIN puede invalidar toda la caché en `/reportes/cache` (DELETE).

---

## 🐳 Docker — Imágenes

Cada componente usa **multi-stage build** con usuario no-root:

| Componente | Builder | Runtime | Puerto |
|------------|---------|---------|--------|
| `frontend` | `node:18-alpine` | `nginx:1.25-alpine` | 80 |
| `eureka-server` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8761 |
| `api-gateway` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8080 |
| `ms-autenticacion` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8081 |
| `ms-calificaciones` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8082 |
| `ms-asistencia` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8083 |
| `ms-notificaciones` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8084 |
| `ms-horarios` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8085 |
| `ms-reportes` | `maven:3.9-temurin-17-alpine` | `eclipse-temurin:17-jre` | 8086 |

---

## 🧪 Tests Unitarios

Todos los microservicios tienen tests con **JUnit 5 + Mockito** y reporte de cobertura con **JaCoCo**:

```bash
# Ejecutar tests y generar reporte de cobertura
cd ms-calificaciones && mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```

| Microservicio | Archivo de test | Casos cubiertos |
|---------------|-----------------|-----------------|
| ms-autenticacion | `AuthServiceTest`, `UsuarioServiceTest` | Login, registro, JWT, perfil |
| ms-calificaciones | `CalificacionServiceTest`, `NotificacionProducerTest` | CRUD, RabbitMQ |
| ms-asistencia | `AsistenciaServiceTest` | CRUD, filtros |
| ms-notificaciones | `NotificacionServiceTest`, `NotificacionConsumerTest` | CRUD, consumer |
| ms-horarios | `HorarioServiceTest` | CRUD, filtros |
| ms-reportes | `ReporteServiceTest` | Promedios, rankings, Redis |

---

## 🚀 CI/CD — GitHub Actions

3 pipelines independientes activados por push a la rama `deploy`:

```
git push origin deploy
        │
        ├── Cambios en frontend/        → deploy-frontend.yml  → ec2-frontend
        ├── Cambios en api-gateway/     → deploy-gateway.yml   → ec2-gateway
        │   o eureka-server/
        └── Cambios en ms-*/            → deploy-services.yml  → ec2-services
```

Cada pipeline: **Build → Push Docker Hub → Deploy via SSM**

### GitHub Secrets requeridos

| Secret | Descripción |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Usuario Docker Hub |
| `DOCKERHUB_TOKEN` | Access token Docker Hub |
| `JWT_SECRET` | Clave secreta JWT (≥ 32 chars) |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_SESSION_TOKEN` | Token de sesión AWS Academy |
| `EUREKA_HOST` | IP privada de ec2-gateway |
| `VITE_API_URL` | URL pública del API Gateway |

---

## ☁️ Infraestructura AWS

### Instancias EC2

| Instancia | Tipo | Servicios | Puertos |
|-----------|------|-----------|---------| 
| `ec2-frontend` | t3.micro | Frontend Nginx | 80 |
| `ec2-gateway` | t3.micro | Eureka + API Gateway | 8080, 8761 |
| `ec2-services` | t3.micro | 6 microservicios + Redis + RabbitMQ | 8081-8086, 6379, 5672 |

---

## 🔐 Seguridad

- **JWT (HS256)** con expiración configurable + refresh token
- Validación en el **API Gateway** antes de enrutar
- Filtro `JwtAuthFilter` en **cada** microservicio (defense in depth)
- Roles: `ADMIN`, `DOCENTE`, `ESTUDIANTE`, `APODERADO`
- `@PreAuthorize` a nivel de método en controladores
- **CORS** configurado en el Gateway
- Credenciales Firebase excluidas del repositorio vía `.gitignore`
- Imágenes Docker con usuario no-root (`appuser:appgroup`)

---

## 🎨 Frontend

- **Paleta**: Primario `#1F3A5F` (azul marino corporativo)
- **Tipografía**: Inter + Poppins (Google Fonts)
- **Login**: Fondo de video animado con glassmorphism
- **Dashboard**: Sidebar responsivo, topbar con perfil
- **Gráficos**: Chart.js para calificaciones y asistencia
- **Mensajería**: Tiempo real con Firestore

---

## 👥 Equipo de Desarrollo

> Proyecto académico — Ingeniería en Informática  
> Asignatura: ISY1101 Introducción a Herramientas DevOps

## 📄 Licencia

Este proyecto es de uso académico. Todos los derechos reservados.
