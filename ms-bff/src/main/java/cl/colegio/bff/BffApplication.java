package cl.colegio.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del microservicio BFF (Backend For Frontend).
 *
 * <p>El BFF agrega datos de múltiples microservicios en un solo request,
 * reduciendo la cantidad de llamadas que el frontend necesita hacer.
 * Se registra en Eureka como {@code ms-bff} y escucha en el puerto 8087.
 */
@SpringBootApplication
public class BffApplication {
    public static void main(String[] args) {
        SpringApplication.run(BffApplication.class, args);
    }
}
