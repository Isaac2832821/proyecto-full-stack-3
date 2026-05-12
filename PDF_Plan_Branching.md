# Plan de Branching y Estrategia Git

## 1. Estrategia de Ramas (GitFlow Simplificado / GitHub Flow)

Para gestionar el ciclo de vida del código, el equipo utiliza una estrategia basada en **GitHub Flow** adaptada para entornos de microservicios, asegurando entregas continuas y reducción de conflictos.

### Ramas Principales:
- **`main` (o `master`):** Es la rama de producción. Contiene el código completamente estable, testeado y desplegado en los servidores de AWS (EC2). *Nadie comitea directamente en `main`.*
- **`develop`:** Es la rama de integración principal. Aquí se unen todas las nuevas características antes de pasar a producción. Es el entorno de "Staging" o pre-producción.

### Ramas de Apoyo:
- **`feature/<nombre-funcionalidad>`:** (ej. `feature/modulo-asistencia`). Se ramifican siempre desde `develop`. Aquí los desarrolladores construuyen nuevas funcionalidades.
- **`hotfix/<nombre-error>`:** (ej. `hotfix/login-crash`). Se ramifican directamente desde `main` en caso de un error crítico en producción. Una vez resuelto, se hace merge tanto a `main` como a `develop`.

---

## 2. Flujo de Trabajo (Merges y Pull Requests)

1. **Creación:** El desarrollador crea una rama `feature/` desde la versión más actualizada de `develop`.
2. **Desarrollo:** Realiza commits atómicos y descriptivos.
3. **Pull Request (PR):** Una vez terminada la funcionalidad, se abre un PR hacia la rama `develop` en GitHub.
4. **Code Review:** Otro miembro del equipo debe revisar el código. GitHub Actions ejecuta automáticamente las pruebas unitarias.
5. **Merge:** Si pasa las pruebas y es aprobado, se realiza el *Merge* hacia `develop`.
6. **Release:** Cuando `develop` alcanza un punto de entrega (Sprint finalizado), se realiza un PR desde `develop` hacia `main` para el despliegue automático en producción.

---

## 3. Resolución de Conflictos

Los conflictos de fusión (Merge Conflicts) ocurren cuando dos desarrolladores modifican el mismo archivo (ej. `pom.xml` o un Controlador) en ramas distintas. La estrategia para resolverlos es:

1. **Comunicación:** El desarrollador que sufre el conflicto al hacer el PR se comunica con el autor del otro cambio.
2. **Rebase o Pull origin develop:** Antes de solicitar el PR final, el desarrollador debe actualizar su rama local ejecutando `git pull origin develop`.
3. **Resolución Manual:** Si hay conflictos, se resuelven en el entorno local (usando VSCode/IntelliJ), aceptando los cambios de origen (Incoming Changes) o combinándolos (Merge Changes) según corresponda.
4. **Testing Local:** Después de resolver un conflicto, es **obligatorio** correr la aplicación y las pruebas localmente (`mvn test` o `npm run test`) para garantizar que la solución manual no rompió la lógica del sistema.
