# ms-reportes — Microservicio de Reportes Estadísticos

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Genera reportes estadísticos cacheados en **Redis** para mejorar el rendimiento.

---

## 📋 Descripción

Calcula promedios, rankings y estadísticas de los estudiantes consultando datos a ms-calificaciones. Los resultados son **cacheados automáticamente en Redis** para evitar recalcular en cada petición.

## 🔴 Caché Redis — Qué, Por qué y TTL

| Caché | TTL | Qué almacena | Por qué ese TTL |
|-------|-----|--------------|-----------------|
| `reporte-estudiante` | **15 min** | Reporte individual del estudiante (promedio, notas por asignatura) | Las notas cambian con frecuencia moderada; 15 min equilibra frescura y rendimiento |
| `reporte-curso` | **30 min** | Estadísticas globales de un curso | Estadísticas de curso son más estables. Reduce carga en Firestore para múltiples consultas simultáneas |
| `ranking-curso` | **60 min** | Ranking de estudiantes por promedio | El ranking es el dato más costoso y el menos volátil; 1h es apropiado |

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+ | Maven 3.9+
- Redis corriendo en `localhost:6379`

```bash
cd ms-reportes
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8086`**

---

## 🔐 Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta compartida para JWT | `5A7234753778...` |
| `REDIS_HOST` | Host de Redis | `localhost` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `MS_CALIFICACIONES_URL` | URL de ms-calificaciones | `http://localhost:8082` |
| `MS_ASISTENCIA_URL` | URL de ms-asistencia | `http://localhost:8083` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL Eureka | `http://localhost:8761/eureka/` |

---

## 📡 Endpoints REST

| Método | Endpoint | Descripción | Rol | Cache |
|--------|----------|-------------|-----|-------|
| GET | `/reportes/estudiante/{id}` | Reporte individual | Autenticado | Redis 15 min |
| GET | `/reportes/curso/{curso}` | Reporte de curso + ranking | ADMIN/DOCENTE | Redis 30 min |
| DELETE | `/reportes/cache` | Invalidar caché | ADMIN | — |

### Swagger UI: `http://localhost:8086/swagger-ui.html`

---

## 🧪 Tests
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```
