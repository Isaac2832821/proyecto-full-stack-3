package cl.colegio.horarios.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger / OpenAPI para ms-horarios.
 *
 * <p>Define el esquema de seguridad {@code bearerAuth} (JWT Bearer Token).
 * Accesible en: {@code http://localhost:8085/swagger-ui.html}
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
     * Metadatos generales de la API de horarios.
     *
     * @return instancia de OpenAPI con título, versión y contacto
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-horarios — API de Horarios Escolares")
                        .description("Microservicio para la gestión de horarios de clases " +
                                "por asignatura, docente, sala y curso.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Colegio Bernardo O'Higgins")
                                .email("admin@colegio.cl")));
    }
}
