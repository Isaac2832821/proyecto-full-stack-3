package cl.colegio.notificaciones.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger / OpenAPI para ms-notificaciones.
 *
 * <p>Define el esquema de seguridad {@code bearerAuth} (JWT Bearer Token).
 * Las notificaciones se crean automáticamente vía RabbitMQ cuando ms-calificaciones
 * publica un evento {@code calificacion.nueva}.
 * Accesible en: {@code http://localhost:8084/swagger-ui.html}
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
     * Metadatos generales de la API de notificaciones.
     *
     * @return instancia de OpenAPI con título, versión y contacto
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-notificaciones — API de Notificaciones")
                        .description("Microservicio de notificaciones en tiempo real. " +
                                "Consume mensajes RabbitMQ de ms-calificaciones (exchange: colegio.exchange, " +
                                "routing key: calificacion.nueva) y persiste notificaciones en Firestore.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Colegio Bernardo O'Higgins")
                                .email("admin@colegio.cl")));
    }
}
