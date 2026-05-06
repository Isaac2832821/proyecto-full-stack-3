# 🏫 Sistema de Gestión Escolar — Colegio Bernardo O'Higgins

> Plataforma web full-stack de gestión escolar con arquitectura de microservicios, autenticación JWT, base de datos Firestore y frontend moderno en Vite + Vanilla JS.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?logo=springboot)
![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.3-brightgreen?logo=spring)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow?logo=firebase)
![Vite](https://img.shields.io/badge/Frontend-Vite%20+%20Vanilla%20JS-purple?logo=vite)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Descripción General

El sistema permite la gestión integral de un colegio con tres roles de usuario:

| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Gestión de usuarios, profesores, asignaturas, configuración del sistema |
| **Profesor** | Registro de calificaciones, control de asistencia, mensajería |
| **Estudiante/Apoderado** | Consulta de notas, asistencia, comunicación con profesores |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              Vite + Vanilla JS (Puerto 5173)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                      API GATEWAY                             │
│            Spring Cloud Gateway (Puerto 8080)                │
│         JWT Validation · Rate Limiting · Routing             │
└──┬───────────────┬───────────────┬────────────────┬─────────┘
   │               │               │                │
┌──▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
│  ms-    │ │    ms-      │ │   ms-      │ │   Eureka    │
│  auth   │ │  califica-  │ │ asistencia │ │   Server    │
│  :8081  │ │  ciones     │ │   :8083    │ │   :8761     │
│         │ │   :8082     │ │            │ │             │
└──┬──────┘ └──────┬──────┘ └─────┬──────┘ └─────────────┘
   │               │               │
   └───────────────┴───────────────┘
                   │
        ┌──────────▼──────────┐
        │  Google Firestore   │
        │   (Base de datos)   │
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
| `frontend` | 5173 | SPA en Vite + Vanilla JS con diseño corporativo |

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
- **Firebase JS SDK** para autenticación y Firestore en tiempo real
- **Chart.js** para visualización de datos
- **CSS personalizado** con diseño corporativo (paleta #1F3A5F)

---

## 📁 Estructura del Proyecto

```
proyecto/
├── eureka-server/          # Servidor de descubrimiento Eureka
├── api-gateway/            # API Gateway con Spring Cloud Gateway
├── ms-autenticacion/       # Microservicio de autenticación
├── ms-calificaciones/      # Microservicio de calificaciones
├── ms-asistencia/          # Microservicio de asistencia
├── frontend/               # SPA Frontend (Vite + Vanilla JS)
│   ├── src/
│   │   ├── main.js         # Lógica principal + vistas SPA
│   │   ├── mensajeria.js   # Módulo de mensajería en tiempo real
│   │   ├── firebase.js     # Configuración Firebase
│   │   ├── assets/         # Recursos estáticos (logo, video)
│   │   └── styles/
│   │       └── main.css    # Estilos corporativos
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── imagenes/               # Recursos del proyecto (logo)
├── pom.xml                 # POM padre (multi-módulo Maven)
├── .gitignore
└── README.md
```

---

## 🚀 Guía de Instalación y Ejecución

### Prerrequisitos

- Java 17+
- Maven 3.8+
- Node.js 18+
- Cuenta de Firebase con proyecto activo y Firestore habilitado
- Archivo `serviceAccountKey.json` (credenciales de Firebase — **NO subir al repositorio**)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/proyecto-colegio.git
cd proyecto-colegio
```

### 2. Configurar credenciales Firebase

Coloca tu archivo `serviceAccountKey.json` en la raíz de cada microservicio que lo requiera:
- `ms-autenticacion/serviceAccountKey.json`
- `ms-calificaciones/serviceAccountKey.json`
- `ms-asistencia/serviceAccountKey.json`

> ⚠️ **NUNCA subas este archivo a Git.** Está ignorado en `.gitignore`.

### 3. Iniciar servicios backend (orden obligatorio)

```bash
# 1. Eureka Server
cd eureka-server
mvn spring-boot:run

# 2. API Gateway (en otra terminal)
cd api-gateway
mvn spring-boot:run

# 3. Microservicios (en terminales separadas)
cd ms-autenticacion && mvn spring-boot:run
cd ms-calificaciones && mvn spring-boot:run
cd ms-asistencia    && mvn spring-boot:run
```

### 4. Iniciar el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🔐 Seguridad

- Autenticación basada en **JWT (HS256)** con expiración configurable
- Validación del token en el **API Gateway** antes de enrutar
- Filtro `JwtAuthFilter` en cada microservicio como capa adicional
- Roles de usuario: `ADMIN`, `PROFESOR`, `ESTUDIANTE`, `APODERADO`
- Credenciales de Firebase excluidas del repositorio vía `.gitignore`

---

## 📡 Endpoints Principales

### ms-autenticacion (`:8081`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Autenticación y obtención de JWT |
| POST | `/api/auth/register` | ADMIN | Registro de nuevos usuarios |
| GET | `/api/usuarios` | ADMIN | Listado de usuarios |
| GET | `/api/usuarios/{id}` | ADMIN | Detalle de usuario |
| PUT | `/api/usuarios/{id}` | ADMIN | Actualización de usuario |
| DELETE | `/api/usuarios/{id}` | ADMIN | Eliminación de usuario |

### ms-calificaciones (`:8082`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/calificaciones` | PROF/EST | Listado de calificaciones |
| POST | `/api/calificaciones` | PROFESOR | Registrar calificación |
| PUT | `/api/calificaciones/{id}` | PROFESOR | Actualizar calificación |
| DELETE | `/api/calificaciones/{id}` | PROFESOR | Eliminar calificación |
| GET | `/api/asignaturas` | Autenticado | Listado de asignaturas |
| POST | `/api/asignaturas` | ADMIN | Crear asignatura |

### ms-asistencia (`:8083`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/asistencia` | PROF/EST | Consultar registros de asistencia |
| POST | `/api/asistencia` | PROFESOR | Registrar asistencia |
| GET | `/api/asistencia/alumno/{id}` | PROF/EST | Asistencia por alumno |

---

## 🌐 Documentación Swagger

Con los servicios corriendo, accede a la documentación interactiva:

- **ms-autenticacion**: http://localhost:8081/swagger-ui.html
- **ms-calificaciones**: http://localhost:8082/swagger-ui.html
- **ms-asistencia**: http://localhost:8083/swagger-ui.html
- **api-gateway**: http://localhost:8080/swagger-ui.html

---

## 🎨 Frontend — Diseño

El frontend implementa un diseño corporativo tipo SaaS con:
- **Paleta de colores**: Primario `#1F3A5F` (azul marino corporativo)
- **Tipografía**: Inter + Poppins (Google Fonts)
- **Login**: Fondo de video animado con glassmorphism
- **Dashboard**: Sidebar responsivo, topbar con perfil de usuario
- **Gráficos**: Chart.js para visualización de calificaciones y asistencia
- **Mensajería**: Tiempo real con Firestore

---

## 🧪 Testing

```bash
# Ejecutar tests de todos los módulos desde la raíz
mvn test

# Solo un módulo
cd ms-autenticacion
mvn test
```

---

## 👥 Equipo de Desarrollo

> Proyecto académico — Ingeniería en Informática

---

## 📄 Licencia

Este proyecto es de uso académico. Todos los derechos reservados.
