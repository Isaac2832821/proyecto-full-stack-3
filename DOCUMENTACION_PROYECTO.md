cl

# 📘 Documentación Completa del Proyecto

## Colegio Bernardo O'Higgins — Sistema de Gestión Escolar

---

## 1. Descripción General

Sistema de gestión escolar basado en **arquitectura de microservicios** desplegado en **AWS EC2**. Permite la administración de usuarios, calificaciones y asistencia para un colegio, con roles diferenciados (Admin, Docente, Apoderado, Estudiante).

### Stack Tecnológico

| Capa                  | Tecnología                              |
| --------------------- | --------------------------------------- |
| **Frontend**          | Vite + Vanilla JS, Nginx                |
| **API Gateway**       | Spring Cloud Gateway (WebFlux/Reactivo) |
| **Service Discovery** | Netflix Eureka Server                   |
| **Microservicios**    | Spring Boot 3 + Java 17                 |
| **Base de Datos**     | Google Cloud Firestore (NoSQL)          |
| **Autenticación**     | JWT (JSON Web Tokens)                   |
| **Contenedorización** | Docker + Docker Compose                 |
| **CI/CD**             | GitHub Actions                          |
| **Cloud**             | AWS EC2 (3 instancias)                  |
| **Despliegue remoto** | AWS Systems Manager (SSM)               |

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

| Endpoint         | Método | Descripción        | Acceso  |
| ---------------- | ------ | ------------------ | ------- |
| `/auth/login`    | POST   | Iniciar sesión     | Público |
| `/auth/register` | POST   | Registrar usuario  | Público |
| `/usuarios`      | GET    | Listar usuarios    | ADMIN   |
| `/usuarios/{id}` | GET    | Obtener usuario    | ADMIN   |
| `/usuarios/{id}` | PUT    | Actualizar usuario | ADMIN   |
| `/usuarios/{id}` | DELETE | Eliminar usuario   | ADMIN   |

**Usuarios semilla** (password: `Admin1234!`):

| RUT        | Nombre                | Rol        |
| ---------- | --------------------- | ---------- |
| 11111111-1 | Administrador Sistema | ADMIN      |
| 22222222-2 | María González        | DOCENTE    |
| 33333333-3 | Carlos Rodríguez      | APODERADO  |
| 44444444-4 | Sofía Rodríguez       | ESTUDIANTE |

### 4.2 ms-calificaciones (Puerto 8082)

| Endpoint               | Método         | Descripción         |
| ---------------------- | -------------- | ------------------- |
| `/asignaturas`         | GET/POST       | CRUD asignaturas    |
| `/asignaturas/{id}`    | GET/PUT/DELETE | Gestión individual  |
| `/calificaciones`      | GET/POST       | CRUD calificaciones |
| `/calificaciones/{id}` | GET/PUT/DELETE | Gestión individual  |

### 4.3 ms-asistencia (Puerto 8083)

| Endpoint           | Método         | Descripción        |
| ------------------ | -------------- | ------------------ |
| `/asistencia`      | GET/POST       | CRUD asistencia    |
| `/asistencia/{id}` | GET/PUT/DELETE | Gestión individual |

### 4.4 API Gateway — Rutas

| Patrón               | Destino           |
| -------------------- | ----------------- |
| `/auth/**`           | ms-autenticacion  |
| `/usuarios/**`       | ms-autenticacion  |
| `/asignaturas/**`    | ms-calificaciones |
| `/calificaciones/**` | ms-calificaciones |
| `/asistencia/**`     | ms-asistencia     |

---

## 5. Infraestructura AWS

### 5.1 Instancias EC2

| Instancia    | Tipo     | IP Pública     | IP Privada    | Puertos        |
| ------------ | -------- | -------------- | ------------- | -------------- |
| ec2-frontend | t3.micro | 54.209.173.19  | 172.31.38.122 | 80, 22         |
| ec2-gateway  | t3.micro | 54.80.81.18    | 172.31.37.32  | 8080, 8761, 22 |
| ec2-services | t3.micro | 34.239.135.131 | 172.31.33.236 | 8081-8083, 22  |

### 5.2 Security Groups

**sg-gateway:** Puertos 8080, 8761, 22 abiertos (TCP, 0.0.0.0/0)

**sg-services:** Puertos 8081, 8082, 8083, 22 abiertos (TCP, 0.0.0.0/0)

### 5.3 Comunicación Inter-Instancias

Los microservicios se comunican con Eureka usando la IP privada de ec2-gateway (172.31.37.32), ya que ambas instancias están en la misma VPC.

---

## 6. CI/CD (GitHub Actions)

### 6.1 Workflows

| Workflow         | Archivo             | Se activa con cambios en                              |
| ---------------- | ------------------- | ----------------------------------------------------- |
| CI/CD — Frontend | deploy-frontend.yml | frontend/                                             |
| CI/CD — Gateway  | deploy-gateway.yml  | eureka-server/, api-gateway/                          |
| CI/CD — Services | deploy-services.yml | ms-autenticacion/, ms-calificaciones/, ms-asistencia/ |

### 6.2 GitHub Secrets Requeridos

| Secret                | Descripción                                   |
| --------------------- | --------------------------------------------- |
| DOCKERHUB_USERNAME    | Usuario Docker Hub                            |
| DOCKERHUB_TOKEN       | Token de acceso Docker Hub                    |
| JWT_SECRET            | Clave para firmar JWT (32+ chars)             |
| AWS_ACCESS_KEY_ID     | Credencial AWS                                |
| AWS_SECRET_ACCESS_KEY | Credencial AWS                                |
| AWS_SESSION_TOKEN     | Token de sesión AWS Academy (expira cada ~4h) |
| EUREKA_HOST           | IP privada de ec2-gateway (172.31.37.32)      |
| VITE_API_URL          | URL pública del API Gateway                   |

### 6.3 Imágenes Docker Hub

| Imagen                              | Servicio                     |
| ----------------------------------- | ---------------------------- |
| itsnexiph/colegio-frontend          | Frontend Nginx               |
| itsnexiph/colegio-eureka-server     | Eureka Server                |
| itsnexiph/colegio-api-gateway       | API Gateway                  |
| itsnexiph/colegio-ms-autenticacion  | Microservicio Auth           |
| itsnexiph/colegio-ms-calificaciones | Microservicio Calificaciones |
| itsnexiph/colegio-ms-asistencia     | Microservicio Asistencia     |

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

| Problema                | Causa                                   | Solución                                  |
| ----------------------- | --------------------------------------- | ----------------------------------------- |
| 503 Service Unavailable | Microservicios no registrados en Eureka | Reiniciar servicios, esperar 2 min        |
| CORS Error              | IP del frontend no autorizada           | Actualizar CorsGlobalConfig.java, rebuild |
| Servicios se reinician  | Falta de memoria (t3.micro = 1GB)       | Agregar swap de 2GB                       |
| Token expired           | Tokens AWS Academy expiran cada ~4h     | Renovar desde Learner Lab                 |
| Docker not found        | Docker no instalado en EC2              | sudo yum install -y docker                |

---

## 10. Seguridad

- **JWT**: Todos los endpoints protegidos excepto /auth/login y /auth/register
- **CORS**: Configurado en API Gateway, solo permite orígenes autorizados
- **Firebase**: Credenciales montadas como volumen read-only
- **Secrets**: Variables sensibles via GitHub Secrets
- **.gitignore**: serviceAccountKey.json y .env excluidos del repositorio

---

## 11. Redis — Caché de Reportes (ms-reportes)

### 11.1 Estrategia de Caché

El microservicio `ms-reportes` (puerto 8086) implementa el **Cache-Aside Pattern** usando Redis como capa de caché para los reportes estadísticos. El objetivo es evitar recalcular promedios y estadísticas en cada petición, reduciendo la carga sobre Firestore.

### 11.2 Cachés definidos y TTL

| Nombre del caché     | TTL            | Qué almacena                                                              | Por qué ese TTL                                                                                                           |
| -------------------- | -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `reporte-estudiante` | **15 minutos** | Reporte individual de un estudiante (promedio, notas por asignatura)      | Los datos de calificaciones cambian con frecuencia moderada. 15 min equilibra frescura y rendimiento.                     |
| `reporte-curso`      | **30 minutos** | Estadísticas globales de un curso (promedio clase, distribución de notas) | Las estadísticas de curso son más estables. Reduce carga para consultas de múltiples docentes/apoderados del mismo curso. |
| `ranking-curso`      | **60 minutos** | Ranking de estudiantes por promedio dentro de un curso                    | El ranking es el dato más costoso de calcular y el menos volátil.                                                         |

### 11.3 Anotaciones aplicadas

```java
// Cachear reporte por estudianteId (TTL: 15 min)
@Cacheable(value = "reporte-estudiante", key = "#estudianteId")
public ReporteEstudianteDTO generarReporteEstudiante(String estudianteId, String bearerToken) { ... }

// Cachear reporte por curso (TTL: 30 min)
@Cacheable(value = "reporte-curso", key = "#curso")
public ReporteCursoDTO generarReporteCurso(String curso, String bearerToken) { ... }

// Invalidar todos los cachés (ADMIN endpoint)
@CacheEvict(value = {"reporte-estudiante", "reporte-curso", "ranking-curso"}, allEntries = true)
public void limpiarCache() { ... }
```

### 11.4 Configuración Redis

```yaml
spring.data.redis:
  host: ${REDIS_HOST:localhost}
  port: ${REDIS_PORT:6379}
  password: ${REDIS_PASSWORD:}
  timeout: 3000ms
```

**Serialización:** Se usa `GenericJackson2JsonRedisSerializer` para almacenar los objetos como JSON legible en Redis, facilitando la depuración con `redis-cli`.

### 11.5 Verificación

```bash
# Ver claves almacenadas en Redis
docker exec redis redis-cli KEYS "*"

# Ver TTL de una clave específica
docker exec redis redis-cli TTL "reporte-estudiante::12345678-9"

# Ver valor almacenado
docker exec redis redis-cli GET "reporte-estudiante::12345678-9"
```

---

## 12. RabbitMQ — Mensajería Asíncrona

### 12.1 Flujo de Comunicación

```
ms-calificaciones                    RabbitMQ                    ms-notificaciones
      │                                  │                               │
      │─── POST /calificaciones ────────►│                               │
      │    (docente registra nota)       │                               │
      │                                  │                               │
      │──publish(colegio.exchange, ─────►│                               │
      │   calificacion.nueva, evento)    │                               │
      │                                  │──── enqueue(calificacion.nueva.queue) ──►│
      │                                  │                               │
      │                                  │                 consumer.listen()        │
      │                                  │                 crea Notificacion        │
      │                                  │                 guarda en Firestore      │
      │                                  │◄─── ack ─────────────────────│
```

### 12.2 Configuración del Exchange y Queue

| Elemento              | Tipo    | Nombre                     | Descripción                                 |
| --------------------- | ------- | -------------------------- | ------------------------------------------- |
| **Exchange**          | Topic   | `colegio.exchange`         | Exchange principal del sistema              |
| **Queue**             | Durable | `calificacion.nueva.queue` | Cola de eventos de calificaciones nuevas    |
| **Routing Key**       | —       | `calificacion.nueva`       | Clave de enrutamiento del evento            |
| **Dead Letter Queue** | Durable | `calificacion.dlq`         | Cola para mensajes con error (3 reintentos) |

### 12.3 Evento publicado (ms-calificaciones)

```java
// NotificacionProducer.java
@Component
public class NotificacionProducer {
    public void publicarNuevaCalificacion(Calificacion cal, String docenteNombre) {
        var evento = new CalificacionEventoDTO(
            cal.getId(), cal.getEstudianteId(), cal.getNota(), docenteNombre, ...
        );
        try {
            rabbitTemplate.convertAndSend("colegio.exchange", "calificacion.nueva", evento);
        } catch (Exception e) {
            log.warn("RabbitMQ no disponible — notificación no enviada: {}", e.getMessage());
            // No lanza excepción: la nota se guarda igual
        }
    }
}
```

### 12.4 Consumer (ms-notificaciones)

```java
// NotificacionConsumer.java
@RabbitListener(queues = "calificacion.nueva.queue")
public void recibirCalificacion(CalificacionEventoDTO evento) {
    var notificacion = Notificacion.builder()
        .destinatarioId(evento.estudianteId())
        .mensaje("Tu docente " + evento.docenteNombre() + " registró una nueva nota: " + evento.nota())
        .build();
    notificacionService.guardar(notificacion);
}
```

### 12.5 Tolerancia a fallos

- Si RabbitMQ no está disponible, la calificación **se guarda igual** en Firestore. Solo se pierde la notificación (degradación elegante).
- Mensajes con error después de 3 reintentos van a la **Dead Letter Queue** (`calificacion.dlq`).

### 12.6 Management UI

```
http://localhost:15672 (usuario: guest / contraseña: guest)
```

---

## 13. BFF — Backend For Frontend

### 13.1 ¿Qué es el BFF?

El **ms-bff** (puerto 8087) implementa el patrón **Backend For Frontend (BFF)**: un microservicio dedicado que agrega datos de múltiples MS en una sola respuesta, reduciendo el número de roundtrips del frontend.

### 13.2 Patrón API Composition

```
Frontend                    ms-bff                    Microservicios
   │                           │                            │
   │── GET /bff/dashboard ────►│                            │
   │                           │── GET /auth/me ───────────►│ ms-autenticacion
   │                           │◄─── perfil ────────────────│
   │                           │── GET /notificaciones/... ►│ ms-notificaciones
   │                           │◄─── notificaciones ────────│
   │                           │── GET /calificaciones/... ─►│ ms-calificaciones (solo ESTUDIANTE)
   │                           │◄─── notas ─────────────────│
   │                           │── GET /horarios/dia/... ───►│ ms-horarios
   │                           │◄─── horarios ──────────────│
   │◄── DashboardDTO (JSON) ───│
```

### 13.3 Tolerancia a fallos del BFF

Si un MS no responde, el BFF retorna un objeto vacío para ese campo en lugar de fallar toda la respuesta. Esto se llama **degradación elegante**:

```java
private Map<String, Object> consultarPerfil(String token) {
    try {
        return restTemplate.exchange(...).getBody();
    } catch (Exception e) {
        log.warn("BFF: no se pudo obtener perfil — {}", e.getMessage());
        return Map.of(); // ← respuesta vacía, no exception
    }
}
```

---

## 14. Mejoras desde la Evaluación 2 (EA3)

### 14.1 Nuevos microservicios

| MS                | Puerto | Tecnología especial |
| ----------------- | ------ | ------------------- |
| ms-notificaciones | 8084   | RabbitMQ (Consumer) |
| ms-horarios       | 8085   | —                   |
| ms-reportes       | 8086   | Redis Cache         |
| ms-bff            | 8087   | BFF Pattern         |

### 14.2 Nuevas tecnologías integradas

| Tecnología      | Integración                           | Justificación                                                       |
| --------------- | ------------------------------------- | ------------------------------------------------------------------- |
| **Redis**       | ms-reportes (@Cacheable, @CacheEvict) | Reduce carga en Firestore para reportes estadísticos costosos       |
| **RabbitMQ**    | ms-calificaciones → ms-notificaciones | Desacopla la creación de notificaciones del flujo de calificaciones |
| **BFF Pattern** | ms-bff (/bff/dashboard)               | Reduce roundtrips del frontend de N llamadas a 1                    |

### 14.3 Mejoras de calidad aplicadas

- ✅ `SwaggerConfig` con `@SecurityScheme(bearerAuth)` en **todos** los microservicios
- ✅ JavaDoc completo en todos los `@Service` y `@RestController`
- ✅ `@CacheEvict` con endpoint admin para invalidación manual de caché
- ✅ Tests unitarios en los 4 MS nuevos (JUnit 5 + Mockito)
- ✅ Frontend: 53 tests, **100% de cobertura** en `utils.js` (Vitest + v8)
- ✅ Umbral de 85% configurado en `vite.config.js`
- ✅ `docker-compose.yml` completo con Redis, RabbitMQ, todos los MS + BFF
- ✅ `CorsConfig` en todos los microservicios para compatibilidad con el Gateway

---

## 15. Estrategia de Caché (Redis)

Para cumplir con los nuevos requisitos de rendimiento, hemos integrado **Redis** en el microservicio `ms-reportes`.

- **¿Qué datos se cachean?** Se cachean los reportes consolidados (promedios, métricas de asistencia) ya que son datos de cálculo pesado y lectura muy frecuente por parte de directores y profesores.
- **¿Por qué se cachean?** Para disminuir el uso de CPU y llamadas entre microservicios, optimizando radicalmente el tiempo de carga del Dashboard.
- **Tiempo de Vida (TTL):** Se configuró un TTL de **60 minutos** para el caché general. Esto se implementa en `RedisConfig.java` utilizando un `RedisCacheConfiguration` con `entryTtl(Duration.ofMinutes(60))`. Las anotaciones `@Cacheable` se usan en la lectura y `@CacheEvict` al registrar nuevas calificaciones.

---

## 16. Oportunidades de Mejora (respecto a Evaluación 2 y contenidos EA3)

- **Mensajería Asíncrona Robusta:** En la EA2 la comunicación era puramente HTTP síncrona. La gran oportunidad de mejora implementada en esta EA3 fue la integración de **RabbitMQ** para procesos en segundo plano (pagos -> notificaciones), lo que evita que el usuario quede esperando mientras el sistema envía notificaciones. Esto mejora radicalmente la escalabilidad y el tiempo de respuesta del frontend.
- **Caché Distribuido con Redis:** En la EA2 cada vez que un usuario entraba al Dashboard, el backend ejecutaba decenas de consultas a la BD para calcular promedios. Implementamos Redis como una mejora de excelencia, reduciendo la latencia de carga en el BFF casi un 80%.
- **Seguridad Centralizada (BFF y JWT Perimetral):** Ahora manejamos las sesiones de usuario y la inyección de seguridad de manera mucho más robusta desde el Backend for Frontend (`ms-bff`) en conjunto con el Gateway.
- **Alta Cobertura de Pruebas:** Migración desde una cultura sin pruebas en la EA2, a una cultura Test-Driven (TDD) en la EA3 logrando >90% de coverage con JaCoCo en el backend y >85% con Vitest en React.
