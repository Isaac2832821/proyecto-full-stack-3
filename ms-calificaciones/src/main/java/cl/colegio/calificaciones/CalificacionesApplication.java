package cl.colegio.calificaciones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CalificacionesApplication {
    public static void main(String[] args) {
        SpringApplication.run(CalificacionesApplication.class, args);
    }
}
