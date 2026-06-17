# ms-autenticacion — Microservicio de Autenticación

Microservicio del Sistema de Gestión Escolar del **Colegio Bernardo O'Higgins**.  
Gestiona el registro, login, gestión de usuarios y generación de tokens JWT.

---

## 📋 Descripción

Punto de entrada de identidad del sistema. Genera tokens JWT firmados con HS256 que son validados independientemente por cada microservicio (arquitectura stateless).

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Java 17+ | Maven 3.9+
- Archivo `serviceAccountKey.json` en `src/main/resources/`

```bash
cd ms-autenticacion
mvn spring-boot:run
```

El servicio inicia en **`http://localhost:8081`**

---

## 🔐 Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta HS256 (≥ 32 chars) | `5A7234753778...` |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL Eureka | `http://localhost:8761/eureka/` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta credenciales Firebase | — |

---

## 📡 Endpoints REST

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Público | Login con RUT + contraseña |
| POST | `/auth/register` | ADMIN | Registrar nuevo usuario |
| POST | `/auth/refresh` | Autenticado | Renovar access token |
| GET | `/auth/perfil` | Autenticado | Obtener perfil propio |
| PUT | `/auth/password` | Autenticado | Cambiar contraseña |
| GET | `/usuarios` | ADMIN | Listar todos los usuarios |
| GET | `/usuarios/{id}` | ADMIN | Obtener usuario por ID |
| PUT | `/usuarios/{id}` | ADMIN | Actualizar usuario |
| DELETE | `/usuarios/{id}` | ADMIN | Eliminar usuario |

### Swagger UI: `http://localhost:8081/swagger-ui.html`

---

## 👥 Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema |
| `DOCENTE` | Registro de notas y asistencia |
| `ESTUDIANTE` | Consulta de sus propios datos |
| `APODERADO` | Consulta de datos de sus estudiantes |

---

## 🧪 Tests
```bash
mvn test jacoco:report
# Reporte en: target/site/jacoco/index.html
```

Tests cubiertos: `AuthServiceTest` (registro, login, refresh, cambiar contraseña) y `UsuarioServiceTest` (CRUD de usuarios).
