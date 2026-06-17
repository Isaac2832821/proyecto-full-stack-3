# ms-calificaciones — Microservicio de Calificaciones

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Gestiona notas y asignaturas, y publica eventos en **RabbitMQ** al registrar calificaciones.

---

## 📋 Descripción

Permite a los docentes registrar calificaciones por asignatura. Al guardar una nota, publica automáticamente un evento en RabbitMQ para que `ms-notificaciones` notifique al estudiante.

## 🐇 Integración RabbitMQ (producer)

```
CalificacionService.registrar()
  → NotificacionProducer.publicarNuevaCalificacion()
    → Exchange: colegio.exchange  (topic, durable)
    → Routing key: calificacion.nueva
      → Consumido por: ms-notificaciones (cola: calificacion.registrada)
```

> **Fault-tolerant:** Si RabbitMQ no está disponible, la nota se guarda igualmente. El error se registra en el log sin interrumpir el flujo.

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+ | Maven 3.9+
- RabbitMQ corriendo en `localhost:5672`
- Archivo `serviceAccountKey.json`

```bash
cd ms-calificaciones
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8082`**

---

## 🔐 Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta compartida para JWT | `5A7234753778...` |
| `RABBITMQ_HOST` | Host de RabbitMQ | `localhost` |
| `RABBITMQ_PORT` | Puerto AMQP | `5672` |
| `RABBITMQ_USER` | Usuario RabbitMQ | `guest` |
| `RABBITMQ_PASS` | Contraseña RabbitMQ | `guest` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL Eureka | `http://localhost:8761/eureka/` |

---

## 📡 Endpoints REST

### Calificaciones
| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | `/calificaciones` | DOCENTE/ADMIN | Registrar calificación (publica evento RabbitMQ) |
| GET | `/calificaciones` | Autenticado | Listar todas |
| GET | `/calificaciones/{id}` | Autenticado | Obtener por ID |
| GET | `/calificaciones/estudiante/{id}` | Autenticado | Por estudiante |
| GET | `/calificaciones/asignatura/{id}` | Autenticado | Por asignatura |
| GET | `/calificaciones/mis-calificaciones` | DOCENTE | Las del docente autenticado |
| PUT | `/calificaciones/{id}` | DOCENTE/ADMIN | Actualizar |
| DELETE | `/calificaciones/{id}` | ADMIN | Eliminar |

### Asignaturas
| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | `/asignaturas` | ADMIN | Crear asignatura |
| GET | `/asignaturas` | Autenticado | Listar todas |
| GET | `/asignaturas/{id}` | Autenticado | Obtener por ID |
| GET | `/asignaturas/docente/{id}` | Autenticado | Por docente |
| PUT | `/asignaturas/{id}` | ADMIN | Actualizar |
| DELETE | `/asignaturas/{id}` | ADMIN | Eliminar |

### Swagger UI: `http://localhost:8082/swagger-ui.html`

---

## 🧪 Tests
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```

Tests cubiertos: `CalificacionServiceTest` (CRUD), `AsignaturaServiceTest` (CRUD), `NotificacionProducerTest` (RabbitMQ routing, fault-tolerance).
