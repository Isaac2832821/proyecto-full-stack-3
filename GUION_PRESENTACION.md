# Guión para la Defensa Técnica (10 - 15 minutos)
## Asignatura: Introducción a Herramientas DevOps
### Proyecto: Sistema de Gestión Escolar - Colegio Bernardo O'Higgins

---

## ⏱️ Estructura de la Presentación
1. **Introducción (1 min):** Quién eres y de qué trata el proyecto.
2. **Evolución de la Arquitectura (3 min):** Por qué pasamos de 1 instancia a 3.
3. **Contenedorización con Docker (3 min):** Beneficios, multi-stage builds y Docker Compose.
4. **Automatización CI/CD (4 min):** Flujo de GitHub Actions y despliegue automatizado.
5. **Impacto DevOps y Conclusión (2 min):** El valor de lo que hemos construido.
6. **Preguntas (2 min)**

---

## 🗣️ Guión Detallado

### 1. Introducción (1 minuto)
"Hola a todos, mi nombre es [Tu Nombre] y hoy les presentaré la implementación DevOps para el Sistema de Gestión Escolar del Colegio Bernardo O'Higgins. Este es un sistema Full-Stack desarrollado en React (Vite) para el Frontend, Java Spring Boot para los microservicios, y Google Firestore como base de datos. Hoy me enfocaré en cómo aplicamos prácticas DevOps para hacer que este sistema sea escalable, resiliente y fácil de actualizar."

### 2. Evolución de la Arquitectura: Decisiones Técnicas (3 minutos)
"Cuando comenzamos, teníamos un enfoque más monolítico en nuestro despliegue. Todos los servicios backend corrían en una sola máquina EC2. Esto generaba un **cuello de botella crítico**: los servicios competían por memoria, y si un componente fallaba, podía arrastrar a todo el sistema.

**Decisión Técnica:** Dividir la infraestructura en 3 instancias EC2 especializadas:
1. **Frontend (`ec2-frontend`):** Sirve exclusivamente nuestra SPA mediante Nginx.
2. **Gateway (`ec2-gateway`):** Aloja el API Gateway y el servidor de descubrimiento Eureka. Es nuestro enrutador principal.
3. **Servicios (`ec2-services`):** Contiene los microservicios de negocio (Autenticación, Calificaciones, Asistencia).

**¿Por qué hicimos esto?** Por **resiliencia y escalabilidad**. Si necesitamos más poder para calcular calificaciones a fin de semestre, solo escalamos la instancia de `services`, sin tocar el `gateway` ni el `frontend`. Además, implementamos seguridad mediante Security Groups, asegurando que los microservicios internos solo sean accesibles a través del Gateway."

### 3. Contenedorización con Docker (3 minutos)
"Para garantizar que 'lo que funciona en mi máquina, funcione en producción', empaquetamos todo en Docker.

**Decisiones Técnicas:**
* **Multi-stage builds:** En nuestros Dockerfiles usamos una etapa `builder` con Maven para compilar el código Java, y luego solo copiamos el `.jar` compilado a una imagen `jre-alpine` súper ligera. Esto reduce el tamaño de nuestras imágenes en un 80% y minimiza vulnerabilidades de seguridad.
* **Usuario no-root:** Por seguridad, todos nuestros contenedores ejecutan sus procesos con un usuario restringido (`appuser`), nunca como root.
* **Docker Compose:** Usamos `docker-compose.yml` divididos por entorno. Declaramos redes internas privadas y usamos volúmenes nombrados para persistir los logs sin importar si un contenedor se reinicia."

### 4. Flujo CI/CD con GitHub Actions (4 minutos)
"La automatización es el corazón de DevOps. Dividimos nuestro pipeline en 3 flujos independientes: Frontend, Gateway y Services. Así, si un desarrollador cambia un color en el frontend, no reconstruimos todo el backend de Java.

**¿Cómo funciona el flujo?**
1. Un desarrollador hace un `push` a la rama `deploy`.
2. GitHub Actions detecta qué carpetas cambiaron. Si cambió el microservicio de autenticación, solo se activa el pipeline de `deploy-services.yml`.
3. **Build & Push:** Construimos la nueva imagen Docker y la subimos a nuestro repositorio en Docker Hub.
4. **Deploy Automático:** Usamos AWS Systems Manager (SSM) para enviarle comandos directamente a nuestra instancia EC2 de forma segura, sin abrir puertos SSH ni exponer claves. La instancia se descarga la nueva imagen y reinicia los contenedores.
Todo esto ocurre en menos de 3 minutos de forma 100% automatizada y sin intervención manual."

### 5. Importancia dentro del Ciclo DevOps (2 minutos)
"Para finalizar, ¿por qué es importante este proceso? 
El ciclo DevOps busca **entregar valor rápido y de forma segura**. Con esta arquitectura:
* Redujimos los tiempos de despliegue de horas (o procesos manuales propensos a errores) a solo unos minutos de forma automatizada.
* La contenedorización nos da **consistencia**: eliminamos el problema de dependencias faltantes en los servidores.
* Si hay un bug crítico, la corrección llega a producción rápidamente gracias al CI/CD.

Hemos transformado un proyecto de software en un producto operativamente maduro, demostrando habilidades que son exactamente lo que la industria tecnológica demanda hoy para escalar aplicaciones en la nube."

### 6. Cierre
"Muchas gracias por su atención. Estoy a su disposición para cualquier pregunta técnica sobre los pipelines, Docker, AWS EC2 o nuestra arquitectura de microservicios."

---

## 💡 Tips para tu Presentación
1. **Apóyate en el diagrama:** Cuando hables de la arquitectura, muestra el diagrama que creamos en el README o en la documentación. Es mucho más fácil entender 3 servidores si la gente los está viendo.
2. **Muestra un Workflow de GitHub:** Ten abierta una pestaña de GitHub Actions que muestre un pipeline en color verde (Exitoso). Ayuda a materializar el concepto de automatización.
3. **Muestra el Dashboard de Eureka:** Si es posible, muestra brevemente cómo los 3 microservicios aparecen registrados (UP) en la interfaz de Eureka. Esto demuestra la comunicación dinámica entre EC2s.
4. **No leas textualmente:** Usa este guion como guía. Trata de explicar los porqués (por qué hicimos multi-stage, por qué separamos los EC2) más que el qué.
