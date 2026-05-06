package cl.colegio.asistencia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class AsistenciaApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsistenciaApplication.class, args);
    }
}
