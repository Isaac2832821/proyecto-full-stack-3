package cl.colegio.notificaciones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Punto de entrada del microservicio de Notificaciones.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Consumir eventos de RabbitMQ (nuevas calificaciones, inasistencias)</li>
 *   <li>Persistir notificaciones en Firestore</li>
 *   <li>Exponer endpoints REST para que el frontend consulte notificaciones</li>
 * </ul>
 *
 * <p>Puerto: 8084 | Registro: Eureka
 */
@SpringBootApplication
@EnableDiscoveryClient
public class NotificacionesApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificacionesApplication.class, args);
    }
}
