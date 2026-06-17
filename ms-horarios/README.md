# ms-horarios — Microservicio de Horarios Escolares

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Gestiona los bloques horarios de clases por asignatura, docente y curso.

---

## 📋 Descripción

Permite al ADMIN configurar el calendario académico (horarios de clases) y a docentes, estudiantes y apoderados consultarlo.

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+ | Maven 3.9+
- Archivo `serviceAccountKey.json` en `src/main/resources/`

```bash
cd ms-horarios
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8085`**

---

## 🔐 Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta compartida para JWT | `5A7234753778...` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL Eureka | `http://localhost:8761/eureka/` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta credenciales Firebase | — |

---

## 📡 Endpoints REST

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/horarios` | Crear horario | `ADMIN` |
| GET | `/horarios` | Listar todos | Autenticado |
| GET | `/horarios/{id}` | Obtener por ID | Autenticado |
| GET | `/horarios/mis-horarios` | Horarios del docente | `DOCENTE` |
| GET | `/horarios/asignatura/{id}` | Por asignatura | Autenticado |
| GET | `/horarios/curso/{curso}` | Por curso | Autenticado |
| PUT | `/horarios/{id}` | Actualizar | `ADMIN` |
| DELETE | `/horarios/{id}` | Eliminar | `ADMIN` |

### Swagger UI: `http://localhost:8085/swagger-ui.html`

---

## 🧪 Tests
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```
