package cl.colegio.calificaciones.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de RabbitMQ para ms-calificaciones (productor).
 *
 * <p>Define el exchange topic compartido del sistema escolar.
 * ms-calificaciones solo publica mensajes (no consume).
 * El consumer es ms-notificaciones.
 *
 * <h3>Topología</h3>
 * <pre>
 * Exchange: colegio.exchange (topic, durable)
 *   → routing key: "calificacion.nueva"
 *     → consumido por ms-notificaciones (cola: calificacion.registrada)
 * </pre>
 */
@Configuration
public class RabbitMQConfig {

    /** Nombre del exchange topic central del sistema escolar. */
    public static final String EXCHANGE_NAME = "colegio.exchange";

    /**
     * Define el exchange topic durable del sistema.
     * Es el mismo exchange que declara ms-notificaciones;
     * RabbitMQ los reconcilia automáticamente si los parámetros coinciden.
     *
     * @return TopicExchange durable
     */
    @Bean
    public TopicExchange colegioExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    /**
     * Convertidor JSON para serializar los eventos como mensajes JSON.
     *
     * @return Jackson2JsonMessageConverter
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * RabbitTemplate configurado con convertidor JSON.
     *
     * @param connectionFactory conexion al broker
     * @return RabbitTemplate listo para publicar mensajes JSON
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        var template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
