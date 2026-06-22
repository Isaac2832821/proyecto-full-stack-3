package cl.colegio.reportes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Configuración CORS para ms-reportes.
 *
 * <p>Permite que el frontend y el API Gateway realicen peticiones cross-origin.
 * En producción, reemplazar {@code *} por los dominios permitidos.
 */
@Configuration
public class CorsConfig {

    /**
     * Configura y registra el filtro CORS global.
     *
     * @return filtro CORS aplicado a todos los endpoints
     */
    @Bean
    public CorsFilter corsFilter() {
        var config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(false);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
