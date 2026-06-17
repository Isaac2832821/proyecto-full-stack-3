package cl.colegio.horarios;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Punto de entrada del microservicio de Horarios.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Gestionar los horarios de clases por asignatura, docente y curso</li>
 *   <li>Permitir al ADMIN configurar el calendario académico</li>
 *   <li>Exponer endpoints para consulta por docentes, estudiantes y apoderados</li>
 * </ul>
 *
 * <p>Puerto: 8085 | Registro: Eureka
 */
@SpringBootApplication
@EnableDiscoveryClient
public class HorariosApplication {
    public static void main(String[] args) {
        SpringApplication.run(HorariosApplication.class, args);
    }
}
