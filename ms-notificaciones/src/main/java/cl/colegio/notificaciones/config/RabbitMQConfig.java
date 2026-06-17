package cl.colegio.notificaciones.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de RabbitMQ para el microservicio de notificaciones.
 *
 * <h3>Topología de mensajería</h3>
 * <pre>
 * Exchange: colegio.exchange  (tipo: topic)
 *   └── Binding: "calificacion.#" → Queue: calificacion.registrada
 * </pre>
 *
 * <h3>Decisiones de diseño</h3>
 * <ul>
 *   <li>Se usa un exchange de tipo <b>topic</b> para permitir agregar futuros
 *       productores con rutas distintas (ej: "inasistencia.#").</li>
 *   <li>La cola es <b>durable</b>: sobrevive reinicios del broker.</li>
 *   <li>Se usa <b>Jackson2JsonMessageConverter</b> para serializar/deserializar
 *       los mensajes como JSON.</li>
 * </ul>
 */
@Configuration
public class RabbitMQConfig {

    /** Nombre del exchange central del sistema escolar. */
    public static final String EXCHANGE_NAME = "colegio.exchange";

    /** Nombre de la cola donde llegan los eventos de calificaciones. */
    public static final String CALIFICACION_QUEUE = "calificacion.registrada";

    /** Routing key que enlaza las calificaciones con la cola. */
    public static final String CALIFICACION_ROUTING_KEY = "calificacion.#";

    /**
     * Define el exchange topic del sistema.
     *
     * @return TopicExchange durable llamado "colegio.exchange"
     */
    @Bean
    public TopicExchange colegioExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    /**
     * Define la cola de eventos de calificaciones.
     *
     * @return Queue durable llamada "calificacion.registrada"
     */
    @Bean(name = "calificacionQueue")
    public Queue calificacionQueue() {
        return QueueBuilder.durable(CALIFICACION_QUEUE).build();
    }

    /**
     * Enlaza la cola de calificaciones con el exchange topic
     * usando el routing key "calificacion.#".
     *
     * @param calificacionQueue la cola a enlazar
     * @param colegioExchange   el exchange donde se enlaza
     * @return el Binding configurado
     */
    @Bean
    public Binding calificacionBinding(Queue calificacionQueue, TopicExchange colegioExchange) {
        return BindingBuilder
                .bind(calificacionQueue)
                .to(colegioExchange)
                .with(CALIFICACION_ROUTING_KEY);
    }

    /**
     * Configura el convertidor de mensajes a JSON.
     *
     * @return Jackson2JsonMessageConverter para serialización automática
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configura el RabbitTemplate con el convertidor JSON.
     *
     * @param connectionFactory la conexión al broker RabbitMQ
     * @return RabbitTemplate configurado
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        var template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
