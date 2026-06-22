const fs = require('fs');
const services = {
  'api-gateway': '8080',
  'ms-autenticacion': '8081',
  'ms-calificaciones': '8082',
  'ms-asistencia': '8083',
  'ms-notificaciones': '8084',
  'ms-horarios': '8085',
  'ms-reportes': '8086',
  'ms-bff': '8087',
  'ms-eureka-server': '8761',
  'ms-pagos': '8089'
};

for (let [name, port] of Object.entries(services)) {
  const content = `# ${name}

## Descripción
Microservicio parte de la arquitectura del Sistema de Gestión Escolar del Colegio Bernardo O'Higgins.

## Tecnologías
- Spring Boot 3
- Java 17
- Spring Cloud / Eureka

## Ejecución Local
1. Asegúrese de que \`ms-eureka-server\` esté en ejecución.
2. Configure las variables de entorno si es necesario.
3. Ejecute: \`mvn spring-boot:run\`

## API
Documentación interactiva con Swagger disponible en:
\`http://localhost:${port}/swagger-ui.html\`
(No aplica para Eureka Server ni API Gateway en la misma ruta).
`;
  try {
    fs.writeFileSync(`./${name}/README.md`, content);
    console.log(`Creado ${name}/README.md`);
  } catch (e) {
    console.error(`Error en ${name}:`, e.message);
  }
}
