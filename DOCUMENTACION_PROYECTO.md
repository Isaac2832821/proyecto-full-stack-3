# 📘 Documentación Completa del Proyecto
## Colegio Bernardo O'Higgins — Sistema de Gestión Escolar

---

## 1. Descripción General

Sistema de gestión escolar basado en **arquitectura de microservicios** desplegado en **AWS EC2**. Permite la administración de usuarios, calificaciones y asistencia para un colegio, con roles diferenciados (Admin, Docente, Apoderado, Estudiante).

### Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Vite + Vanilla JS, Nginx |
| **API Gateway** | Spring Cloud Gateway (WebFlux/Reactivo) |
| **Service Discovery** | Netflix Eureka Server |
| **Microservicios** | Spring Boot 3 + Java 17 |
| **Base de Datos** | Google Cloud Firestore (NoSQL) |
| **Autenticación** | JWT (JSON Web Tokens) |
| **Contenedorización** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Cloud** | AWS EC2 (3 instancias) |
| **Despliegue remoto** | AWS Systems Manager (SSM) |

---

## 2. Arquitectura del Sistema

### 2.1 Flujo de Comunicación

```
                    ┌──────────────────────────────────────────────────────────────┐
                    │                      AWS - us-east-1                         │
                    │                                                              │
  🌐 Navegador      │  ┌─────────────────┐     ┌──────────────────────────────┐   │
      │             │  │  EC2-Frontend    │     │  EC2-Gateway                 │   │
      │  HTTP :80   │  │  54.209.173.19   │     │  54.80.81.18                 │   │
      └────────────►│  │                  │     │                              │   │
                    │  │  ┌────────────┐  │     │  ┌────────────┐              │   │
                    │  │  │  Frontend  │──┼─────┼─►│API Gateway │◄── :8080     │   │
                    │  │  │  Nginx :80 │  │     │  │            │              │   │
                    │  │  └────────────┘  │     │  └─────┬──────┘              │   │
                    │  └─────────────────┘     │        │                      │   │
                    │                          │  ┌─────▼──────┐              │   │
                    │                          │  │   Eureka    │◄── :8761     │   │
                    │                          │  │   Server    │              │   │
                    │                          │  └─────────────┘              │   │
                    │                          └──────────────────────────────┘   │
                    │                                    │                        │
                    │                          IP Privada: 172.31.37.32           │
                    │                                    │                        │
                    │  ┌─────────────────────────────────┼────────────────────┐   │
                    │  │  EC2-Services                   │                    │   │
                    │  │  34.239.135.131                 │                    │   │
                    │  │                                 │                    │   │
                    │  │  ┌─────────────────┐  ┌────────▼────────┐           │   │
                    │  │  │ms-autenticacion │  │ms-calificaciones│           │   │
                    │  │  │    :8081        │  │    :8082        │           │   │
                    │  │  └────────┬────────┘  └────────┬────────┘           │   │
                    │  │           │                     │                    │   │
                    │  │  ┌────────▼────────┐            │                    │   │
                    │  │  │ ms-asistencia   │            │                    │   │
                    │  │  │    :8083        │            │                    │   │
                    │  │  └────────┬────────┘            │                    │   │
                    │  └───────────┼────────────────────┼────────────────────┘   │
                    │              │                     │                        │
                    └──────────────┼─────────────────────┼────────────────────────┘
                                   │                     │
                              ┌────▼─────────────────────▼────┐
                              │     Google Cloud Firestore     │
                              │     Base de Datos NoSQL        │
                              └───────────────────────────────┘
```

1. El **navegador** accede al frontend en `http://54.209.173.19`
2. El frontend envía peticiones API a `http://54.80.81.18:8080` (API Gateway)
3. El **API Gateway** consulta **Eureka** para descubrir la instancia del microservicio destino
4. El Gateway enruta la petición al microservicio usando **balanceo de carga** (`lb://`)
5. Los microservicios acceden a **Firestore** para persistencia de datos

---

## 3. Estructura del Proyecto

```
proyecto/
├── .github/workflows/          # Pipelines CI/CD
│   ├── deploy-frontend.yml     # Build + Deploy frontend
│   ├── deploy-gateway.yml      # Build + Deploy Eureka + Gateway
│   ├── deploy-services.yml     # Build + Deploy 3 microservicios
│   └── deploy-backend.yml      # DESHABILITADO (legacy)
├── api-gateway/                # Spring Cloud Gateway
├── eureka-server/              # Netflix Eureka Server
├── ms-autenticacion/           # Microservicio de autenticación
├── ms-calificaciones/          # Microservicio de calificaciones
├── ms-asistencia/              # Microservicio de asistencia
├── frontend/                   # Aplicación web (Vite + Vanilla JS)
├── docker-compose.yml          # Stack completo (desarrollo local)
├── docker-compose.ec2-frontend.yml
├── docker-compose.ec2-gateway.yml
├── docker-compose.ec2-services.yml
├── .env.example                # Template de variables de entorno
└── serviceAccountKey.json      # Credenciales Firebase (no en Git)
```

---

## 4. Microservicios

### 4.1 ms-autenticacion (Puerto 8081)

Gestión de usuarios y autenticación JWT.

| Endpoint | Método | Descripción | Acceso |
|---|---|---|---|
| `/auth/login` | POST | Iniciar sesión | Público |
| `/auth/register` | POST | Registrar usuario | Público |
| `/usuarios` | GET | Listar usuarios | ADMIN |
| `/usuarios/{id}` | GET | Obtener usuario | ADMIN |
| `/usuarios/{id}` | PUT | Actualizar usuario | ADMIN |
| `/usuarios/{id}` | DELETE | Eliminar usuario | ADMIN |

**Usuarios semilla** (password: `Admin1234!`):

| RUT | Nombre | Rol |
|---|---|---|
| 11111111-1 | Administrador Sistema | ADMIN |
| 22222222-2 | María González | DOCENTE |
| 33333333-3 | Carlos Rodríguez | APODERADO |
| 44444444-4 | Sofía Rodríguez | ESTUDIANTE |

### 4.2 ms-calificaciones (Puerto 8082)

| Endpoint | Método | Descripción |
|---|---|---|
| `/asignaturas` | GET/POST | CRUD asignaturas |
| `/asignaturas/{id}` | GET/PUT/DELETE | Gestión individual |
| `/calificaciones` | GET/POST | CRUD calificaciones |
| `/calificaciones/{id}` | GET/PUT/DELETE | Gestión individual |

### 4.3 ms-asistencia (Puerto 8083)

| Endpoint | Método | Descripción |
|---|---|---|
| `/asistencia` | GET/POST | CRUD asistencia |
| `/asistencia/{id}` | GET/PUT/DELETE | Gestión individual |

### 4.4 API Gateway — Rutas

| Patrón | Destino |
|---|---|
| `/auth/**` | ms-autenticacion |
| `/usuarios/**` | ms-autenticacion |
| `/asignaturas/**` | ms-calificaciones |
| `/calificaciones/**` | ms-calificaciones |
| `/asistencia/**` | ms-asistencia |

---

## 5. Infraestructura AWS

### 5.1 Instancias EC2

| Instancia | Tipo | IP Pública | IP Privada | Puertos |
|---|---|---|---|---|
| ec2-frontend | t3.micro | 54.209.173.19 | 172.31.38.122 | 80, 22 |
| ec2-gateway | t3.micro | 54.80.81.18 | 172.31.37.32 | 8080, 8761, 22 |
| ec2-services | t3.micro | 34.239.135.131 | 172.31.33.236 | 8081-8083, 22 |

### 5.2 Security Groups

**sg-gateway:** Puertos 8080, 8761, 22 abiertos (TCP, 0.0.0.0/0)

**sg-services:** Puertos 8081, 8082, 8083, 22 abiertos (TCP, 0.0.0.0/0)

### 5.3 Comunicación Inter-Instancias

Los microservicios se comunican con Eureka usando la IP privada de ec2-gateway (172.31.37.32), ya que ambas instancias están en la misma VPC.

---

## 6. CI/CD (GitHub Actions)

### 6.1 Workflows

| Workflow | Archivo | Se activa con cambios en |
|---|---|---|
| CI/CD — Frontend | deploy-frontend.yml | frontend/ |
| CI/CD — Gateway | deploy-gateway.yml | eureka-server/, api-gateway/ |
| CI/CD — Services | deploy-services.yml | ms-autenticacion/, ms-calificaciones/, ms-asistencia/ |

### 6.2 GitHub Secrets Requeridos

| Secret | Descripción |
|---|---|
| DOCKERHUB_USERNAME | Usuario Docker Hub |
| DOCKERHUB_TOKEN | Token de acceso Docker Hub |
| JWT_SECRET | Clave para firmar JWT (32+ chars) |
| AWS_ACCESS_KEY_ID | Credencial AWS |
| AWS_SECRET_ACCESS_KEY | Credencial AWS |
| AWS_SESSION_TOKEN | Token de sesión AWS Academy (expira cada ~4h) |
| EUREKA_HOST | IP privada de ec2-gateway (172.31.37.32) |
| VITE_API_URL | URL pública del API Gateway |

### 6.3 Imágenes Docker Hub

| Imagen | Servicio |
|---|---|
| itsnexiph/colegio-frontend | Frontend Nginx |
| itsnexiph/colegio-eureka-server | Eureka Server |
| itsnexiph/colegio-api-gateway | API Gateway |
| itsnexiph/colegio-ms-autenticacion | Microservicio Auth |
| itsnexiph/colegio-ms-calificaciones | Microservicio Calificaciones |
| itsnexiph/colegio-ms-asistencia | Microservicio Asistencia |

---

## 7. Desarrollo Local

```bash
# 1. Clonar repositorio
git clone https://github.com/Isaac2832821/proyecto-full-stack-3.git
cd proyecto-full-stack-3

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todo
docker compose up --build

# 4. Acceder
# Frontend: http://localhost
# API Gateway: http://localhost:8080
# Eureka: http://localhost:8761
```

---

## 8. Despliegue Manual en EC2

### ec2-gateway (via SSM)
```bash
sudo su - ec2-user
DOCKERHUB_USERNAME=itsnexiph JWT_SECRET=<secret> docker compose -f docker-compose.ec2-gateway.yml pull
DOCKERHUB_USERNAME=itsnexiph JWT_SECRET=<secret> docker compose -f docker-compose.ec2-gateway.yml up -d
```

### ec2-services (via SSM)
```bash
sudo su - ec2-user
DOCKERHUB_USERNAME=itsnexiph JWT_SECRET=<secret> EUREKA_HOST=172.31.37.32 docker compose -f docker-compose.ec2-services.yml pull
DOCKERHUB_USERNAME=itsnexiph JWT_SECRET=<secret> EUREKA_HOST=172.31.37.32 docker compose -f docker-compose.ec2-services.yml up -d
```

### ec2-frontend (via SSM)
```bash
sudo su - ec2-user
docker pull itsnexiph/colegio-frontend:latest
docker stop frontend && docker rm frontend
docker run -d --name frontend --restart unless-stopped -p 80:8080 itsnexiph/colegio-frontend:latest
```

---

## 9. Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| 503 Service Unavailable | Microservicios no registrados en Eureka | Reiniciar servicios, esperar 2 min |
| CORS Error | IP del frontend no autorizada | Actualizar CorsGlobalConfig.java, rebuild |
| Servicios se reinician | Falta de memoria (t3.micro = 1GB) | Agregar swap de 2GB |
| Token expired | Tokens AWS Academy expiran cada ~4h | Renovar desde Learner Lab |
| Docker not found | Docker no instalado en EC2 | sudo yum install -y docker |

---

## 10. Seguridad

- **JWT**: Todos los endpoints protegidos excepto /auth/login y /auth/register
- **CORS**: Configurado en API Gateway, solo permite orígenes autorizados
- **Firebase**: Credenciales montadas como volumen read-only
- **Secrets**: Variables sensibles via GitHub Secrets
- **.gitignore**: serviceAccountKey.json y .env excluidos del repositorio
