package cl.colegio.reportes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuración de beans auxiliares para ms-reportes.
 * Proporciona un RestTemplate para consultar a otros microservicios.
 */
@Configuration
public class AppConfig {

    /**
     * Bean RestTemplate para realizar peticiones HTTP a ms-calificaciones y ms-asistencia.
     *
     * @return instancia de RestTemplate con configuración por defecto
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
