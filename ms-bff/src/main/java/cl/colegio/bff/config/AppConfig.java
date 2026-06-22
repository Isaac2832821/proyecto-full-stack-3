package cl.colegio.bff.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuración de beans de infraestructura del BFF.
 *
 * <p>Registra el {@link RestTemplate} para llamadas HTTP
 * síncronas hacia los microservicios internos.
 */
@Configuration
public class AppConfig {

    /**
     * Bean de RestTemplate para comunicación HTTP entre microservicios.
     *
     * @return instancia de RestTemplate
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
