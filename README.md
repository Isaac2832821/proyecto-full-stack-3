# 🏫 Proyecto Colegio Bernardo O'Higgins — Microservicios

Sistema de gestión escolar basado en arquitectura de **microservicios** con **Spring Boot 3.4.4** y **Spring Cloud 2024.0.3**, incluyendo un **Frontend** moderno.

---

## 📋 Índice

- [Arquitectura General](#-arquitectura-general)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos](#-módulos)
  - [1. eureka-server](#1-eureka-server)
  - [2. ms-autenticacion](#2-ms-autenticacion)
  - [3. frontend](#3-frontend)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [API REST — Endpoints](#-api-rest--endpoints)
- [Seguridad y JWT](#-seguridad-y-jwt)
- [Modelo de Datos (Firestore)](#-modelo-de-datos-firestore)
- [Datos Semilla](#-datos-semilla-desarrollo)
- [Configuraciones Importantes](#-configuraciones-importantes)

---

## 🏗 Arquitectura General

```text
┌─────────────────────────────────────────────────────┐
│              Eureka Server (:8761)                  │
│         Registro y descubrimiento de servicios      │
└────────────────────────┬────────────────────────────┘
                         │ registra
                         ▼
┌─────────────────────────────────────────────────────┐      ┌──────────────────────────┐
│          ms-autenticacion (:8081)                   │◄──── │   Frontend (:5173/3000)  │
│   Registro · Login · JWT · Gestión de Usuarios      │      │  Cliente web (Vite/JS)   │
│                 Firebase Firestore                  │      └──────────────────────────┘
└─────────────────────────────────────────────────────┘
```

El microservicio se registra en **Eureka Server**. El cliente (frontend) se comunica con la API de autenticación para realizar Login y Registro. Las cuentas se persisten utilizando **Google Firebase Firestore** en la nube en lugar de una base de datos relacional local.

---

## 🛠 Stack Tecnológico

| Tecnología               | Versión     | Uso                                      |
|--------------------------|-------------|------------------------------------------|
| **Java**                 | 17          | Lenguaje principal backend               |
| **Spring Boot**          | 3.4.4       | Framework base backend                   |
| **Spring Cloud**         | 2024.0.3    | Infraestructura de microservicios        |
| **Netflix Eureka**       | —           | Service Discovery                        |
| **Firebase Admin SDK**   | 9.3.0       | Conexión con Firestore Database          |
| **Spring Security**      | —           | Autenticación y autorización             |
| **JJWT**                 | 0.12.6      | Generación y validación de tokens JWT    |
| **Swagger / OpenAPI**    | 2.8.6       | Documentación API UI                     |
| **Vite / Vanilla JS**    | 6.x         | Entorno de desarrollo para Frontend      |
| **CSS3**                 | —           | Sistema de diseño (Dark Mode)            |

---

## 📁 Estructura del Proyecto

```text
proyecto/
├── pom.xml                          # POM padre (multi-módulo)
├── eureka-server/                   # Servidor de descubrimiento (Spring Boot)
│   ├── src/main/java/.../EurekaServerApplication.java
│   └── src/main/resources/application.yml
│
├── ms-autenticacion/                # Microservicio de autenticación (Spring Boot)
│   └── src/main/
│       ├── java/cl/colegio/autenticacion/
│       │   ├── config/              # SecurityConfig, FirebaseConfig, CrosConfig, DataSeeder
│       │   ├── controller/          # Endpoints Auth y Usuarios
│       │   ├── repository/          # Firestore UsuarioRepository
│       │   └── service/             # Lógica de Negocio y JWT
│       └── resources/
│           ├── application.yml
│           └── serviceAccountKey.json  # Credenciales de Firebase (NO COMPARTIR)
│
└── frontend/                        # Cliente Web
    ├── index.html                   # HTML Principal
    ├── package.json                 # Dependencias (npm)
    └── src/
        ├── main.js                  # Lógica JS: Login, Registro, Dashboard, API fetch
        ├── firebase.js              # Configuración frontend de Firebase SDK
        └── styles/
            └── main.css             # Sistema de estilos
```

---

## 📦 Módulos

### 1. eureka-server

**Servidor de descubrimiento de servicios** (Netflix Eureka). Se levanta en el puerto `8761`. Acceso al Dashboard en `http://localhost:8761`.

### 2. ms-autenticacion

**Microservicio de autenticación**. Maneja registro, validación JWT, encriptación con BCrypt y gestión de usuarios conectándose a Cloud Firestore.
- Puerto: `8081`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

### 3. frontend

Aplicación cliente o SPA. Consume directamente la API del `ms-autenticacion`.
- Puerto: `5173` (por defecto con Vite)
- UI: Múltiples pantallas manejadas por estado mediante JS (Login, Registro, Dashboard de Usuarios).

---

## ✅ Requisitos Previos

- **Java 17** (JDK)
- **Node.js** (18+ recomendado) y **npm**
- Un proyecto en **Firebase** con **Firestore** habilitado en "Modo Prueba" y el archivo `serviceAccountKey.json` colocado en `ms-autenticacion/src/main/resources/`.

---

## 🚀 Instalación y Ejecución

### Orden de ejecución recomendado:

1. **Eureka Server**
   ```bash
   cd eureka-server
   mvn spring-boot:run
   ```

2. **Microservicio de Autenticación**
   ```bash
   cd ms-autenticacion
   mvn spring-boot:run
   ```

3. **Frontend (Vite)**
   Abre una nueva terminal en la raíz del proyecto.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Ve a [http://localhost:5173](http://localhost:5173) en tu navegador para ver la web y probar todo el flujo.

---

## 🌐 API REST — Endpoints

La documentación completa e interactiva está disponible al correr la aplicación local en: **http://localhost:8081/swagger-ui.html**

### `/auth` (públicos 🔓)

- **POST /auth/login**: Autenticar usuario usando el RUT y contraseña. Retorna token JWT.
- **POST /auth/register**: Crear una cuenta nueva. Guarda directamente en Firestore.
- **GET /auth/validate**: Validar vigencia de token JWT.

### `/usuarios` (solo ADMIN 🔒, requiere JWT)

- **GET /usuarios**: Lista todos los usuarios de Firestore.
- **GET /usuarios/{id}**: Detalles de uno en específico por el document ID de la BD.
- **PATCH /usuarios/{id}/rol**: Edita rol.
- **DELETE /usuarios/{id}**: Borrado lógico (Desactivar usuario).

---

## 🔐 Seguridad y JWT

1. El usuario se registra a través del frontend Web. Dicha petición `/auth/register` crea un JWT y al mismo tiempo un documento en Firestore.
2. Spring Security protege las carpetas de recursos. CORS está activado mediante `CorsConfig`.
3. Todo requerimiento a `/usuarios/` exige un JWT Bearer Token emitido con ROL "ADMIN".
4. El Filter Validator revisa y verifica cada Request a través de HMAC. Las contraseñas en DB están encriptadas con algoritmos nativos `BCryptPasswordEncoder`.

---

## 📊 Modelo de Datos (Firestore)

Ya no dependemos del SQL tradicional (`@Entity`, JPA, Long IDs). Los atributos de un `Usuario` en la colección `usuarios` de la BD en nube constan de:

- **DNI (doc reference)**: Generado por Google ej. `Kj9d8S3d8S...` 
- `rut` (String) Ej: `12345678-9`
- `nombre`, `apellido`, `email` (String)
- `password` (String Encriptado)
- `rol` (Enum: `ESTUDIANTE`, `DOCENTE`, `APODERADO`, `ADMIN`)
- `activo` (Boolean)

---

## 🌱 Datos Semilla (Desarrollo)

Si la base de datos de Firestore inicia en blanco o está vacía, el componente `DataSeeder` inserta automáticamente cuentas de demostración. 
Contraseña maestra provisional: `Admin1234!`

**Cuentas generadas**:
- Administrador (`11111111-1`) — ROL `ADMIN` *(Puede ver la lista de usuarios en el Frontend)*
- María (`22222222-2`) — ROL `DOCENTE`
- Carlos (`33333333-3`) — ROL `APODERADO`
- Sofía (`44444444-4`) — ROL `ESTUDIANTE`

---

## ⚙ Configuraciones Importantes

- El archivo `application.yml` fue limpiado de todas las configuraciones de DataSource/JPA. En cambio se desactivaron mediante `autoconfigure.exclude`. 
- **CORS** se encarga de que Frontend (puerto 5173 o 3000) pueda ver y llegar libremente al backend en (8081).
- Si experimentas problemas en IntelliJ con las importaciones o el `Rebuild`, cerciórate de cargar todos los paquetes mediante Maven / Recargando el Proyecto (`Reimport All Maven Projects`).
