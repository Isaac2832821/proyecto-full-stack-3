package cl.colegio.reportes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Punto de entrada del microservicio de Reportes.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Generar reportes estadísticos: promedios, rankings, porcentaje asistencia</li>
 *   <li>Cachear los resultados en <b>Redis</b> para evitar recalcular en cada petición</li>
 *   <li>Consultar datos a ms-calificaciones y ms-asistencia via REST</li>
 * </ul>
 *
 * <p>Puerto: 8086 | Registro: Eureka | Caché: Redis
 *
 * <p>La anotación {@code @EnableCaching} activa el sistema de caché de Spring,
 * que es implementado por Redis según la configuración en application.yml.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
public class ReportesApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReportesApplication.class, args);
    }
}
