package cl.colegio.reportes.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger / OpenAPI para ms-reportes.
 *
 * <p>Define el esquema de seguridad {@code bearerAuth} (JWT Bearer Token).
 * Los reportes se almacenan en caché Redis (TTL 15-60 min según tipo).
 * Accesible en: {@code http://localhost:8086/swagger-ui.html}
 */
@Configuration
@SecurityScheme(
        name         = "bearerAuth",
        type         = SecuritySchemeType.HTTP,
        scheme       = "bearer",
        bearerFormat = "JWT",
        description  = "Introduce el accessToken obtenido desde /auth/login"
)
public class SwaggerConfig {

    /**
     * Metadatos generales de la API de reportes.
     *
     * @return instancia de OpenAPI con título, versión y contacto
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-reportes — API de Reportes Estadísticos")
                        .description("Microservicio de reportes con caché Redis. " +
                                "Genera estadísticas de calificaciones por estudiante y por curso. " +
                                "TTL: reporte-estudiante=15min, reporte-curso=30min, ranking-curso=60min.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Colegio Bernardo O'Higgins")
                                .email("admin@colegio.cl")));
    }
}
