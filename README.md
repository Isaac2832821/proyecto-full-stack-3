# 🏫 Sistema de Gestión Escolar — Colegio Bernardo O'Higgins

> Plataforma web full-stack con arquitectura de microservicios desplegada en AWS EC2, autenticación JWT, base de datos Firestore y frontend moderno.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?logo=springboot)
![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.3-brightgreen?logo=spring)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow?logo=firebase)
![Vite](https://img.shields.io/badge/Frontend-Vite%20+%20Vanilla%20JS-purple?logo=vite)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-orange?logo=amazonaws)

---

## 📋 Descripción General

Sistema integral para la gestión escolar con cuatro roles de usuario:

| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Gestión de usuarios, profesores, asignaturas, configuración del sistema |
| **Docente** | Registro de calificaciones, control de asistencia, mensajería |
| **Apoderado** | Consulta de notas, asistencia, comunicación con profesores |
| **Estudiante** | Consulta de notas, asistencia |

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza una arquitectura de **3 instancias EC2 especializadas**:

```
                    ┌──────────────────────────────────────────────────────┐
                    │                  AWS - us-east-1                     │
                    │                                                      │
  🌐 Navegador      │  ┌──────────────┐    ┌───────────────────────────┐   │
      │             │  │ EC2-FRONTEND │    │ EC2-GATEWAY               │   │
      │  HTTP :80   │  │              │    │                           │   │
      └────────────►│  │  Frontend    │    │  ┌──────────┐            │   │
                    │  │  Nginx :80   │───►│  │API Gateway│ :8080     │   │
                    │  └──────────────┘    │  └─────┬─────┘            │   │
                    │                      │  ┌─────▼─────┐            │   │
                    │                      │  │  Eureka   │ :8761     │   │
                    │                      │  └───────────┘            │   │
                    │                      └───────────┬───────────────┘   │
                    │                                   │                   │
                    │  ┌────────────────────────────────▼──────────────┐   │
                    │  │ EC2-SERVICES                                  │   │
                    │  │                                                │   │
                    │  │  ms-autenticacion :8081                       │   │
                    │  │  ms-calificaciones :8082                      │   │
                    │  │  ms-asistencia :8083                          │   │
                    │  └───────────────────────┬───────────────────────┘   │
                    └──────────────────────────┼───────────────────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  Google Firestore    │
                                    │  Base de Datos NoSQL │
                                    └─────────────────────┘
```

### Componentes

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `eureka-server` | 8761 | Registro y descubrimiento de servicios (Netflix Eureka) |
| `api-gateway` | 8080 | Puerta de entrada única, validación JWT, enrutamiento |
| `ms-autenticacion` | 8081 | Login, registro, gestión de usuarios y tokens JWT |
| `ms-calificaciones` | 8082 | CRUD de calificaciones y asignaturas por curso |
| `ms-asistencia` | 8083 | Registro y consulta de asistencia de alumnos |
| `frontend` | 80 | SPA en Vite + Vanilla JS con diseño corporativo |

---

## 🛠️ Stack Tecnológico

### Backend
- **Java 17** con **Spring Boot 3.4.4**
- **Spring Cloud 2024.0.3** (Eureka, Gateway)
- **Spring Security** + **JJWT 0.12.6** para autenticación
- **Firebase Admin SDK 9.x** + **Cloud Firestore** como base de datos NoSQL
- **SpringDoc OpenAPI 2.8.6** (Swagger UI)
- **Lombok** para reducción de boilerplate

### Frontend
- **Vite** como build tool
- **Vanilla JS** (ES Modules)
- **Firebase JS SDK** para mensajería en tiempo real
- **Chart.js** para visualización de datos
- **CSS personalizado** con diseño corporativo (paleta #1F3A5F)

### DevOps
- **Docker** + **Docker Compose** para contenedorización
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
├── ms-autenticacion/             # Microservicio de autenticación
├── ms-calificaciones/            # Microservicio de calificaciones
├── ms-asistencia/                # Microservicio de asistencia
├── frontend/                     # SPA (Vite + Vanilla JS)
├── docker-compose.yml            # Stack completo (desarrollo local)
├── docker-compose.ec2-gateway.yml
├── docker-compose.ec2-services.yml
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
# Editar .env con tus valores

# 2. Levantar todo
docker compose up --build -d

# 3. Acceder
# Frontend:  http://localhost
# Gateway:   http://localhost:8080
# Eureka:    http://localhost:8761
```

### Opción 2: Ejecución manual

```bash
# 1. Eureka Server
cd eureka-server && mvn spring-boot:run

# 2. API Gateway
cd api-gateway && mvn spring-boot:run

# 3. Microservicios (en terminales separadas)
cd ms-autenticacion && mvn spring-boot:run
cd ms-calificaciones && mvn spring-boot:run
cd ms-asistencia && mvn spring-boot:run

# 4. Frontend
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

### Autenticación
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/login` | Público | Obtener JWT |
| POST | `/auth/register` | ADMIN | Registrar usuario |

### Usuarios
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/usuarios` | ADMIN | Listar usuarios |
| GET/PUT/DELETE | `/usuarios/{id}` | ADMIN | Gestión de usuario |

### Calificaciones
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/calificaciones` | DOCENTE/ADMIN | CRUD calificaciones |
| GET/POST | `/asignaturas` | ADMIN | CRUD asignaturas |

### Asistencia
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/asistencia` | DOCENTE/ADMIN | CRUD asistencia |

---

## 🐳 Docker — Imágenes

Cada componente usa **multi-stage build** con usuario no-root:

| Componente | Builder | Runtime | Puerto |
|------------|---------|---------|--------|
| `frontend` | `node:18-alpine` | `nginx:1.25-alpine` | 8080 |
| `eureka-server` | `maven:3.9-temurin-17` | `eclipse-temurin:17-jre-alpine` | 8761 |
| `api-gateway` | `maven:3.9-temurin-17` | `eclipse-temurin:17-jre-alpine` | 8080 |
| `ms-autenticacion` | `maven:3.9-temurin-17` | `eclipse-temurin:17-jre-alpine` | 8081 |
| `ms-calificaciones` | `maven:3.9-temurin-17` | `eclipse-temurin:17-jre-alpine` | 8082 |
| `ms-asistencia` | `maven:3.9-temurin-17` | `eclipse-temurin:17-jre-alpine` | 8083 |

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
| `ec2-services` | t3.micro | 3 microservicios | 8081-8083 |

### Comunicación entre instancias

- Frontend → Gateway: IP pública del gateway (`:8080`)
- Services → Eureka: IP privada del gateway (`:8761`)
- Gateway → Services: IPs registradas en Eureka

---

## 🔐 Seguridad

- **JWT (HS256)** con expiración configurable
- Validación en el **API Gateway** antes de enrutar
- Filtro `JwtAuthFilter` en cada microservicio
- Roles: `ADMIN`, `DOCENTE`, `ESTUDIANTE`, `APODERADO`
- **CORS** configurado en el Gateway
- Credenciales Firebase excluidas del repositorio vía `.gitignore`

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
