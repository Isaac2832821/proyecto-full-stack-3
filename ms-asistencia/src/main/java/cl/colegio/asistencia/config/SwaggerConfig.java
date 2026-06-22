package cl.colegio.asistencia.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger / OpenAPI para ms-asistencia.
 *
 * <p>Define el esquema de seguridad {@code bearerAuth} (JWT Bearer Token)
 * que aparece en la UI de Swagger para autenticar peticiones.
 * Accesible en: {@code http://localhost:8083/swagger-ui.html}
 */
@Configuration
@SecurityScheme(
        name        = "bearerAuth",
        type        = SecuritySchemeType.HTTP,
        scheme      = "bearer",
        bearerFormat = "JWT",
        description  = "Introduce el accessToken obtenido desde /auth/login"
)
public class SwaggerConfig {

    /**
     * Metadatos generales de la API de asistencia.
     *
     * @return instancia de OpenAPI con título, versión y contacto
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-asistencia — API de Asistencia Escolar")
                        .description("Microservicio para el registro y consulta de asistencia de estudiantes. " +
                                "Aplica la regla del 85% del Decreto Nº 511 del MINEDUC.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Colegio Bernardo O'Higgins")
                                .email("admin@colegio.cl")));
    }
}
