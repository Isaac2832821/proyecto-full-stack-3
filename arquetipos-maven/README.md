# Arquetipos Maven - Proyecto Colegio

Esta carpeta contiene los arquetipos Maven (plantillas) utilizados para generar nuevos microservicios de forma estandarizada en el proyecto.

## Arquetipos disponibles

- **ms-base-archetype**: Plantilla base para un microservicio con Spring Boot 3, Java 17 y configuración predeterminada de Eureka Client.

## Instrucciones para instalar y usar

### 1. Instalar el arquetipo localmente

Abre una terminal en la carpeta del arquetipo (`arquetipos-maven/ms-base-archetype`) y ejecuta:

```bash
mvn clean install
```

Esto instalará el arquetipo en tu repositorio Maven local (`~/.m2`).

### 2. Generar un nuevo microservicio

Ve a la carpeta raíz del proyecto (donde están el resto de microservicios) y ejecuta el siguiente comando interactivo para generar un nuevo servicio:

```bash
mvn archetype:generate \
  -DarchetypeGroupId=cl.colegio.arquetipos \
  -DarchetypeArtifactId=ms-base-archetype \
  -DarchetypeVersion=1.0.0 \
  -DgroupId=cl.colegio.nuevo \
  -DartifactId=ms-nuevo \
  -Dversion=1.0.0 \
  -Dpackage=cl.colegio.nuevo \
  -DserverPort=8084
```

Reemplaza los valores de `groupId`, `artifactId`, `package` y `serverPort` según las necesidades del nuevo microservicio.
