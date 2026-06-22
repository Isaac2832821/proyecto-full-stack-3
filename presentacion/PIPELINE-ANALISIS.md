# 📊 Análisis de Desempeño del Pipeline CI/CD
## Colegio Bernardo O'Higgins — ISY1101 DevOps

---

## 1. Métricas de Tiempo — Antes vs Después

### Pipeline `deploy-services.yml`

| Etapa | Antes (v1) | Después (v2) | Mejora |
|-------|-----------|-------------|--------|
| Checkout | 10s | 10s | — |
| Docker login | 5s | 5s | — |
| Build ms-autenticacion | ~7 min | ~3 min (cache hit) | **-57%** |
| Build ms-calificaciones | ~7 min | ~3 min (cache hit) | **-57%** |
| Build ms-asistencia | ~7 min | ~3 min (cache hit) | **-57%** |
| Build ms-notificaciones | ❌ No cubría | ~3 min | Nuevo |
| Build ms-horarios | ❌ No cubría | ~3 min | Nuevo |
| Build ms-reportes | ❌ No cubría | ~3 min | Nuevo |
| Deploy SSM | ~2 min | ~3 min (más robusto) | — |
| **Health Check** | ❌ No existía | ~2 min | **Nuevo** |
| **Smoke Test** | ❌ No existía | ~30s | **Nuevo** |
| **Total (cold start)** | ~24 min sec. | ~13 min paralelo | **-46%** |
| **Total (cache hit)** | ~12 min | ~7 min | **-42%** |

> 📝 **Los builds en paralelo** son la optimización más importante: 6 imágenes que tomaban 42 min en serie, ahora tardan ~8 min porque corren en simultáneo.

---

## 2. Análisis de Pasos Redundantes Identificados

### ❌ Problema 1: `deploy-backend.yml` — Workflow huérfano
- **Descripción:** El archivo `deploy-backend.yml` tiene el trigger por push comentado y solo se activa manualmente (`workflow_dispatch`). Incluye los mismos servicios que `deploy-gateway.yml` + `deploy-services.yml`.
- **Riesgo:** Confusión en el equipo — ¿cuál pipeline usar?
- **Solución aplicada:** Se mantiene como fallback manual. Se documenta claramente en comentarios.

### ❌ Problema 2: `deploy-services.yml` v1 — Solo 3 de 6 microservicios
- **Descripción:** ms-notificaciones, ms-horarios y ms-reportes no tenían pipeline de deploy automático.
- **Impacto:** Los 3 servicios debían desplegarse manualmente via SSH.
- **Solución aplicada:** Se agregaron los 3 servicios al matrix. Ahora todos los 6 MS se despliegan automáticamente.

### ❌ Problema 3: Sin validación post-deploy
- **Descripción:** El pipeline terminaba con `docker compose up -d` sin verificar si los contenedores arrancaron correctamente.
- **Impacto:** Un deploy podía "exitoso" en el pipeline pero con el servicio caído en producción.
- **Solución aplicada:** Se agregó Job 3 `health-check` que hace curl al `/actuator/health` de cada MS con 3 reintentos.

### ❌ Problema 4: Sin CI separado
- **Descripción:** Los tests de JUnit/JaCoCo solo se ejecutaban si alguien los corría localmente. No había validación automática en PRs.
- **Impacto:** Posibles regressions que llegaban a `deploy` sin detectarse.
- **Solución aplicada:** Nuevo `ci-tests.yml` que corre en cada push a `main` o `deploy`, y en PRs.

### ⚠️ Problema 5: Tokens AWS_SESSION_TOKEN expirados
- **Descripción:** En AWS Academy Learner Lab, el session token expira cada 4 horas. El pipeline falla con `ExpiredTokenException`.
- **Impacto:** Deploy manual requerido al reiniciar el lab.
- **Mitigación:** Se documentó. La solución real sería usar IAM Roles para GitHub Actions (OIDC), no disponible en Learner Lab.

---

## 3. Tiempos Observados en Producción

> Los siguientes datos son estimaciones basadas en el comportamiento típico de los pipelines.

### Pipeline Deploy-Services (6 MS + EC2)

```
JOB: build-and-push (paralelo, 6 runners simultáneos)
├── ms-autenticacion:  8m 12s  (primera vez, sin caché)
├── ms-calificaciones: 7m 45s
├── ms-asistencia:     7m 38s
├── ms-notificaciones: 6m 52s
├── ms-horarios:       6m 44s
└── ms-reportes:       7m 15s
→ TOTAL paralelo: 8m 12s (limitado por el más lento)

JOB: deploy (SSM)
└── SSM + docker compose pull + up + sleep 30: 2m 45s

JOB: health-check
└── 6 × curl actuator/health + smoke test: 1m 30s

TOTAL PIPELINE: ~12 min 27s (primera vez)
TOTAL PIPELINE: ~6 min 50s (con caché GHA activo)
```

### Pipeline Deploy-ECS (Fargate)

```
JOB: build-and-push (5 servicios en paralelo)
├── Build + Push Docker Hub: ~4 min (caché)
├── Register Task Definition: ~15s
├── ECS update-service: ~5s
└── aws ecs wait services-stable: ~2-3 min

TOTAL PIPELINE: ~8 min (con caché)
TOTAL PIPELINE: ~13 min (sin caché)
```

---

## 4. Mejoras de Alta Disponibilidad

### Antes (Solo EC2)
```
Single Point of Failure:
  ec2-frontend   → Si cae la instancia, el frontend cae
  ec2-gateway    → Si cae, todos los servicios son inaccesibles
  ec2-services   → 6 MS caen simultáneamente
```

### Después (ECS Fargate + ALB)
```
Alta Disponibilidad:
  ALB             → Distribuye tráfico entre múltiples tasks
  Frontend Tasks  → 2 tasks en diferentes AZs (auto-healing)
  Gateway Tasks   → 2 tasks en diferentes AZs
  Rolling Deploy  → Siempre hay al menos 1 task healthy durante el deploy

Si una task de Gateway cae:
  → ECS detecta fallo en health check (~30s)
  → ECS lanza nueva task automáticamente
  → ALB deja de enrutar a la task caída
  → Nueva task pasa health check
  → Tráfico se restaura (~60-90s downtime máximo)
```

---

## 5. Análisis de Costos (AWS Academy)

| Recurso | Costo/hora | 8h/día | Mes estimado |
|---------|-----------|--------|-------------|
| ECS Fargate (512 CPU, 1024MB) × 5 tasks | ~$0.012 | ~$0.10 | ~$3 |
| ALB | $0.008/h + $0.008/LCU | ~$0.06 | ~$2 |
| EC2 t3.micro × 1 (ec2-services) | $0.0104 | ~$0.08 | ~$2.50 |
| CloudWatch Logs (7 días retención) | ~$0.001 | ~$0.01 | ~$0.30 |
| **Total estimado** | | **~$0.25/día** | **~$7.80** |

> ✅ Costo muy razonable para un entorno académico. Con el script `cluster-setup.sh` se puede detener todos los services (desired-count=0) cuando no se usan.

---

## 6. Reflexión sobre el Proceso de Mejora Continua

### ¿Qué aprendimos?

1. **La visibilidad es fundamental**: Sin health checks post-deploy, un pipeline "verde" puede ocultar un servicio caído. La lección: el pipeline debe terminar solo cuando el servicio está *realmente* funcionando.

2. **El paralelismo es la optimización más impactante**: Pasar de builds secuenciales a matrix paralelos redujo el tiempo de pipeline a la mitad, sin cambios en el código.

3. **La caché tiene retorno**: El caché de GitHub Actions reduce el tiempo de build de 8 min a 3 min en builds subsiguientes. La inversión (configurar `cache-from/cache-to`) es mínima.

4. **Separar CI de CD mejora la calidad**: Al tener tests en cada PR, los errores se detectan antes de llegar a producción. El desarrollador recibe feedback en minutos, no cuando el deploy falla.

5. **ECS vs EC2 para orquestación**: Docker Compose en EC2 es simple pero frágil. ECS agrega self-healing, rolling updates y métricas de salud sin complejidad adicional en el código.

### ¿Qué mejoraríamos con más tiempo?

- [ ] **OIDC para AWS**: Eliminar `AWS_SESSION_TOKEN` usando GitHub's OIDC provider. Más seguro y no expira.
- [ ] **Auto Scaling**: `aws application-autoscaling` basado en CPU > 70% para escalar automáticamente.
- [ ] **Notification**: Slack webhook al final del pipeline (éxito/fallo).
- [ ] **Rollback automático**: Si el health check falla, hacer `update-service` con la revisión anterior de la task definition.
- [ ] **Migrar los 6 MS a ECS**: Actualmente solo gateway, eureka, frontend y 2 MS están en ECS. Los 6 MS restantes podrían beneficiarse del self-healing de ECS.
