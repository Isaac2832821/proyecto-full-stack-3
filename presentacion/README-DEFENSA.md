# 🎓 Defensa Técnica — DevOps Final
## Sistema de Gestión Escolar Colegio Bernardo O'Higgins

> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Duración:** 10–15 minutos  
> **Estructura:** Arquitectura → Pipeline en vivo → Orquestación ECS → Reflexión de mejoras

---

## 🗺️ Estructura de la Defensa (15 min)

| Tiempo | Sección | Qué mostrar |
|--------|---------|-------------|
| 0–2 min | **Introducción** | Arquitectura del sistema, diagrama de microservicios |
| 2–5 min | **CI/CD en acción** | Pipeline corriendo en GitHub Actions |
| 5–9 min | **Orquestación ECS** | Clúster ECS, tasks corriendo, ALB |
| 9–12 min | **Análisis y mejoras** | Métricas de pipeline, optimizaciones implementadas |
| 12–15 min | **Demo en vivo** | Login → navegación → sistema funcionando |

---

## 📐 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNET                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            AWS Application Load Balancer (ALB)                  │
│          DNS: colegio-alb-XXXX.us-east-1.elb.amazonaws.com     │
│                                                                 │
│  :80  →  Frontend Tasks    :8080  →  API Gateway Tasks         │
└────────────┬──────────────────────────┬────────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────────┐   ┌──────────────────────────────────┐
│  ECS Fargate Cluster   │   │  ECS Fargate Cluster            │
│  colegio-cluster       │   │  colegio-cluster                │
│                        │   │                                  │
│  Frontend Service      │   │  API Gateway Service (2 tasks)  │
│  (2 tasks × nginx)     │   │  Eureka Service (1 task)        │
│                        │   │  ms-autenticacion (1 task)      │
│  ✅ Rolling deploy     │   │  ms-calificaciones (1 task)     │
│  ✅ Health checks      │   │                                  │
│  ✅ Auto-restart       │   │  ✅ Rolling deploy              │
└────────────────────────┘   │  ✅ aws ecs wait stable         │
                             └──────────────┬───────────────────┘
                                            │
                                            ▼
                             ┌──────────────────────────────────┐
                             │  EC2-Services (t3.micro)        │
                             │                                  │
                             │  ms-asistencia     :8083        │
                             │  ms-notificaciones :8084        │
                             │  ms-horarios       :8085        │
                             │  ms-reportes       :8086        │
                             │  Redis             :6379        │
                             │  RabbitMQ          :5672/15672  │
                             └─────────────────────────────────┘
```

---

## 🔄 Pipeline CI/CD — Flujo Completo

```
Developer pushes to 'deploy' branch
        │
        ├─── [ci-tests.yml] ─────────────────────────────────────┐
        │    Trigger: push a main/deploy                         │
        │    1. JDK 17 setup + Maven cache                       │
        │    2. mvn test jacoco:report (6 MS en paralelo)        │
        │    3. Upload JaCoCo HTML como artifact                  │
        │    4. Resumen de cobertura en GitHub Summary           │
        │    ⏱️ ~4-6 min                                         │
        │                                                         │
        ├─── [deploy-ecs.yml] ───────────────────────────────────┤
        │    Trigger: api-gateway/**, frontend/**, ms-autenticacion/** │
        │    1. Build + Push Docker Hub (caché GHA)             │
        │    2. Register nueva Task Definition ECS con SHA       │
        │    3. aws ecs update-service --force-new-deployment    │
        │    4. aws ecs wait services-stable (máx 10 min)       │
        │    5. Health check vía ALB DNS                         │
        │    ⏱️ ~7-9 min                                        │
        │                                                         │
        ├─── [deploy-services.yml] ──────────────────────────────┤
        │    Trigger: ms-*/** (6 microservicios)                  │
        │    1. Build + Push (6 imágenes en paralelo, caché GHA)│
        │    2. SSM RunShellScript en EC2-Services               │
        │    3. docker compose pull + up -d                      │
        │    4. Health check: actuator/health de cada MS         │
        │    5. Smoke test: POST /auth/login                     │
        │    ⏱️ ~8-12 min                                       │
        │                                                         │
        ├─── [deploy-gateway.yml] ───────────────────────────────┤
        │    Trigger: eureka-server/**, api-gateway/**           │
        │    1. Build + Push (2 imágenes en paralelo)           │
        │    2. SSM deploy en EC2-Gateway                       │
        │    3. Health check: Eureka UI + Gateway actuator       │
        │    ⏱️ ~5-7 min                                        │
        │                                                         │
        └─── [deploy-frontend.yml] ──────────────────────────────┘
             Trigger: frontend/**
             1. Build + Push (1 imagen, caché GHA)
             2. SSM: docker pull + run
             3. Smoke test: HTTP 200 en IP pública
             4. Publica URL en GitHub Summary
             ⏱️ ~4-5 min
```

---

## 🚀 Script de Demo en Vivo

### Abrir en el navegador antes de empezar:
1. `https://github.com/Isaac2832821/proyecto-full-stack-3/actions` — GitHub Actions
2. AWS Console → ECS → Clusters → colegio-cluster
3. `http://<ALB-DNS>` — Frontend del sistema

### Paso a paso de la demo:

```bash
# 1. DEMOSTRAR el pipeline en tiempo real
# Hacer un cambio menor y push

git checkout deploy
echo "# Deploy demo $(date)" >> README.md
git add README.md
git commit -m "demo: trigger pipeline para defensa técnica"
git push origin deploy

# → Ir a GitHub Actions y mostrar los pipelines corriendo en paralelo
```

```bash
# 2. MOSTRAR el clúster ECS mientras el pipeline corre
aws ecs describe-clusters --clusters colegio-cluster --region us-east-1 \
  --query "clusters[0].{Nombre:clusterName,Estado:status,ActiveServices:activeServicesCount,RunningTasks:runningTasksCount}"

# Mostrar las tasks corriendo
aws ecs list-tasks --cluster colegio-cluster --region us-east-1
```

```bash
# 3. MOSTRAR los services y su estado
aws ecs describe-services \
  --cluster colegio-cluster \
  --services colegio-eureka colegio-gateway colegio-autenticacion colegio-calificaciones colegio-frontend \
  --region us-east-1 \
  --query "services[*].{Servicio:serviceName,Running:runningCount,Desired:desiredCount,Status:status}" \
  --output table
```

```bash
# 4. DEMOSTRAR escalabilidad (High Availability)
# Escalar el gateway de 2 a 3 instancias en vivo
aws ecs update-service \
  --cluster colegio-cluster \
  --service colegio-gateway \
  --desired-count 3 \
  --region us-east-1 \
  --query "service.{Running:runningCount,Desired:desiredCount}"

echo "Esperando nuevo task..."
aws ecs wait services-stable --cluster colegio-cluster --services colegio-gateway --region us-east-1
echo "✅ Ahora hay 3 instancias del Gateway!"

# Volver a 2
aws ecs update-service --cluster colegio-cluster --service colegio-gateway --desired-count 2 --region us-east-1
```

```bash
# 5. MOSTRAR los logs en CloudWatch
aws logs get-log-events \
  --log-group-name /ecs/colegio-api-gateway \
  --log-stream-name $(aws logs describe-log-streams \
    --log-group-name /ecs/colegio-api-gateway \
    --order-by LastEventTime --descending \
    --query "logStreams[0].logStreamName" --output text) \
  --region us-east-1 \
  --query "events[-10:].message" \
  --output text
```

```bash
# 6. SMOKE TEST en vivo
ALB_DNS="colegio-alb-XXXX.us-east-1.elb.amazonaws.com"

# Frontend responde
curl -I "http://$ALB_DNS/"

# API Gateway responde
curl -s -X POST "http://$ALB_DNS:8080/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"rut":"11111111-1","password":"Admin1234!"}' | python3 -m json.tool
```

---

## 📊 Análisis de Desempeño del Pipeline

Ver archivo [PIPELINE-ANALISIS.md](./PIPELINE-ANALISIS.md) para el análisis completo.

### Resumen de Optimizaciones Implementadas

| Optimización | Impacto | Antes | Después |
|-------------|---------|-------|---------|
| **Caché GHA por servicio** | Menos tiempo de build | ~8 min/MS | ~3 min/MS (cache hit) |
| **Matrix builds paralelos** | N builds → 1 job | ~24 min secuencial | ~8 min paralelo |
| **fail-fast: false** | Resilencia | Un fallo cancela todo | Los demás continúan |
| **Health check post-deploy** | Detección temprana | No existía | 3 reintentos automáticos |
| **Smoke test** | Validación E2E | No existía | Verifica login real |
| **CI separado de CD** | Feedback rápido | No existía | Tests en 4-6 min |
| **6/6 MS cubiertos** | Cobertura completa | 3/6 servicios | 6/6 servicios |
| **ECS rolling deploy** | Zero-downtime | Downtime en EC2 restart | 0% downtime |

---

## 💡 Puntos Clave para la Defensa

### ¿Por qué ECS Fargate y no EKS?
- **Costo académico**: EKS cobra $0.10/hora por el control plane. ECS Fargate no.
- **Compatibilidad**: Funciona directo con Docker Compose (familiar para el equipo)
- **Menos complejidad**: No gestionar nodos EC2, networking de pods, etc.
- **Suficiente para la escala**: Alta disponibilidad, rolling updates, health checks

### ¿Por qué separar CI de CD?
- **Feedback loop más rápido**: Los tests corren en PRs, no solo en deploys
- **Separación de responsabilidades**: Un fallo en tests no bloquea el deploy si el código ya fue revisado
- **Best practice DevOps**: CI es calidad, CD es entrega

### ¿Qué garantiza la alta disponibilidad?
1. **ECS Service**: `desiredCount=2`, si una task cae ECS lanza otra automáticamente
2. **ALB Health Checks**: El ALB no enruta tráfico a tasks unhealthy
3. **Rolling Deploy**: `maximumPercent=200` → siempre hay instancias running durante el deploy
4. **`restart: unless-stopped`** en EC2 para los MS que no están en ECS

---

## ❓ Preguntas Frecuentes de Defensa

**P: ¿Cómo funciona el rolling update?**  
R: ECS sube nuevas tasks con la imagen nueva antes de bajar las antiguas. Con `minimumHealthyPercent=50` y `maximumPercent=200`, para un service de 2 tasks: sube 2 nuevas, espera healthcheck OK, baja 2 viejas. Cero downtime.

**P: ¿Qué pasa si el build falla en un MS del matrix?**  
R: Con `fail-fast: false`, los otros 5 MS continúan su build y deploy. Solo el MS que falló se detiene. Esto evita que un error de compilación en `ms-horarios` bloquee el deploy de `ms-autenticacion`.

**P: ¿Cómo se manejan los secretos?**  
R: JWT_SECRET y credenciales AWS se almacenan en GitHub Secrets (cifrado). En producción ECS, los secrets se pasan via AWS Secrets Manager referenciados en la Task Definition (no en texto plano en variables de entorno).

**P: ¿Qué es el caché GHA y cómo reduce el tiempo?**  
R: GitHub Actions puede cachear las capas de Docker entre runs. Como los Dockerfiles usan multi-stage build (maven:alpine + temurin:jre), las capas de descarga de dependencias Maven se cachean. En el segundo run, el build tarda ~3 min en vez de ~8 min.

**P: ¿Cómo escalan los microservicios en EC2?**  
R: Actualmente no escalan automáticamente (EC2 fixed). La estrategia de mejora sería migrar los 6 MS restantes a ECS y agregar Auto Scaling basado en CPU/RAM con `aws application-autoscaling register-scalable-target`.
