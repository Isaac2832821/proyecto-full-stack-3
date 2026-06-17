# ms-asistencia — Microservicio de Asistencia

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Gestiona el registro y consulta del control de asistencia de los estudiantes.

---

## 📋 Descripción

Permite a los docentes pasar lista diaria por asignatura. Los estudiantes y apoderados pueden consultar el historial de asistencia. Soporta los estados: **PRESENTE**, **AUSENTE**, **JUSTIFICADO**, **TARDANZA**.

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+ | Maven 3.9+
- Archivo `serviceAccountKey.json` en `src/main/resources/`

```bash
cd ms-asistencia
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8083`**

---

## 🔐 Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta compartida para JWT | `5A7234753778...` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL Eureka | `http://localhost:8761/eureka/` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta credenciales Firebase | — |

---

## 📡 Endpoints REST

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | `/asistencia` | DOCENTE/ADMIN | Registrar asistencia |
| GET | `/asistencia` | ADMIN | Listar todos los registros |
| GET | `/asistencia/{id}` | Autenticado | Obtener por ID |
| GET | `/asistencia/estudiante/{id}` | Autenticado | Por estudiante |
| GET | `/asistencia/fecha/{fecha}` | Autenticado | Por fecha (yyyy-MM-dd) |
| GET | `/asistencia/mis-registros` | DOCENTE | Registros del docente autenticado |
| GET | `/asistencia/estudiante/{id}/asignatura/{asigId}` | Autenticado | Historial alumno por asignatura |
| PUT | `/asistencia/{id}` | DOCENTE/ADMIN | Actualizar registro |
| DELETE | `/asistencia/{id}` | ADMIN | Eliminar registro |

### Swagger UI: `http://localhost:8083/swagger-ui.html`

---

## 📊 Estados de asistencia

| Estado | Descripción |
|--------|-------------|
| `PRESENTE` | El estudiante asistió normalmente |
| `AUSENTE` | El estudiante no asistió |
| `JUSTIFICADO` | Ausencia con justificación (ej: certificado médico) |
| `TARDANZA` | El estudiante llegó tarde |

---

## 🧪 Tests
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```

Tests cubiertos: `AsistenciaServiceTest` (registrar PRESENTE/AUSENTE/JUSTIFICADO/TARDANZA, listar por docente/estudiante/fecha/asignatura, actualizar y eliminar).
