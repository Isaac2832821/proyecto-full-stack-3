# ms-notificaciones — Microservicio de Notificaciones

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Gestiona las notificaciones del sistema, consumiendo eventos de **RabbitMQ** y persistiéndolos en **Firestore**.

---

## 📋 Descripción

Este microservicio actúa como consumidor de mensajes asincrónicos:

- **Escucha** la cola `calificacion.registrada` de RabbitMQ
- **Crea** notificaciones automáticas para los estudiantes cuando se registra una nota
- **Expone** endpoints REST para que el frontend consulte y gestione notificaciones

## 🏗️ Arquitectura de mensajería

```
ms-calificaciones → RabbitMQ (exchange: colegio.exchange, routing: calificacion.nueva)
                  → Cola: calificacion.registrada
                  → ms-notificaciones (NotificacionConsumer)
                  → Firestore: colección "notificaciones"
```

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+
- Maven 3.9+
- RabbitMQ corriendo en `localhost:5672`
- Archivo `serviceAccountKey.json` en `src/main/resources/`

### Ejecutar
```bash
cd ms-notificaciones
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8084`**

### Con Docker
```bash
docker build -t colegio/ms-notificaciones .
docker run -p 8084:8084 \
  -e JWT_SECRET=tu_clave_secreta \
  -e RABBITMQ_HOST=localhost \
  -v /ruta/serviceAccountKey.json:/app/config/serviceAccountKey.json \
  colegio/ms-notificaciones
```

---

## 🔐 Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `JWT_SECRET` | Clave secreta compartida para validar JWT | `5A7234753778...` |
| `RABBITMQ_HOST` | Host del broker RabbitMQ | `localhost` |
| `RABBITMQ_PORT` | Puerto AMQP de RabbitMQ | `5672` |
| `RABBITMQ_USER` | Usuario de RabbitMQ | `guest` |
| `RABBITMQ_PASS` | Contraseña de RabbitMQ | `guest` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL del servidor Eureka | `http://localhost:8761/eureka/` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al archivo de credenciales Firebase | — |

---

## 📡 Endpoints REST

| Método | Endpoint | Descripción | Rol requerido |
|--------|----------|-------------|:-------------:|
| GET | `/notificaciones/mis-notificaciones` | Mis notificaciones | Autenticado |
| GET | `/notificaciones/{id}` | Notificación por ID | Autenticado |
| PATCH | `/notificaciones/{id}/leida` | Marcar como leída | Autenticado |
| GET | `/notificaciones` | Todas las notificaciones | `ADMIN` |
| DELETE | `/notificaciones/{id}` | Eliminar notificación | `ADMIN` |

### Swagger UI
```
http://localhost:8084/swagger-ui.html
```

---

## 🐇 RabbitMQ — Configuración

| Parámetro | Valor |
|-----------|-------|
| Exchange | `colegio.exchange` (tipo: topic) |
| Cola | `calificacion.registrada` (durable) |
| Routing key | `calificacion.#` |
| Serializador | Jackson2JsonMessageConverter (JSON) |

---

## 🧪 Ejecutar tests

```bash
mvn test
```

### Generar reporte de cobertura (JaCoCo)
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```

---

## 🗂️ Estructura del proyecto

```
ms-notificaciones/
├── src/
│   ├── main/
│   │   ├── java/cl/colegio/notificaciones/
│   │   │   ├── NotificacionesApplication.java
│   │   │   ├── config/
│   │   │   │   ├── FirebaseConfig.java
│   │   │   │   ├── RabbitMQConfig.java
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── controller/
│   │   │   │   └── NotificacionController.java
│   │   │   ├── dto/
│   │   │   │   └── CalificacionEventoDTO.java
│   │   │   ├── entity/
│   │   │   │   └── Notificacion.java
│   │   │   ├── exception/
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── messaging/
│   │   │   │   └── NotificacionConsumer.java
│   │   │   ├── repository/
│   │   │   │   └── NotificacionRepository.java
│   │   │   └── security/
│   │   │       ├── JwtAuthFilter.java
│   │   │       └── JwtService.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/cl/colegio/notificaciones/
│           └── service/
│               └── NotificacionServiceTest.java
└── pom.xml
```
