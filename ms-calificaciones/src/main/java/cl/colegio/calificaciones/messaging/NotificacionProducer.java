package cl.colegio.calificaciones.messaging;

import cl.colegio.calificaciones.entity.Calificacion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Productor de eventos RabbitMQ para el microservicio de calificaciones.
 *
 * <p>Publica un mensaje en el exchange "colegio.exchange" cada vez que
 * un docente registra una nueva calificación. El mensaje es consumido
 * por ms-notificaciones para generar notificaciones automáticas.
 *
 * <p>Topología:
 * <pre>
 * CalificacionService.registrar()
 *   → NotificacionProducer.publicarNuevaCalificacion()
 *     → RabbitMQ exchange: colegio.exchange
 *       → routing key: calificacion.nueva
 *         → cola: calificacion.registrada (en ms-notificaciones)
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionProducer {

    private final RabbitTemplate rabbitTemplate;

    /** Nombre del exchange topic compartido del sistema escolar. */
    private static final String EXCHANGE = "colegio.exchange";

    /** Routing key para eventos de nuevas calificaciones. */
    private static final String ROUTING_KEY = "calificacion.nueva";

    /**
     * Publica un evento de nueva calificación registrada en RabbitMQ.
     *
     * <p>El mensaje se serializa como JSON (Jackson2JsonMessageConverter).
     * Si falla la publicación, se registra el error pero NO se interrumpe
     * el flujo principal — la calificación ya fue guardada en Firestore.
     *
     * @param calificacion la calificación recién guardada en Firestore
     * @param docenteNombre nombre del docente que registró la nota
     */
    public void publicarNuevaCalificacion(Calificacion calificacion, String docenteNombre) {
        try {
            var payload = Map.of(
                    "estudianteId",     calificacion.getEstudianteId(),
                    "estudianteNombre", calificacion.getEstudianteNombre() != null
                                        ? calificacion.getEstudianteNombre() : "",
                    "asignaturaNombre", calificacion.getAsignaturaNombre() != null
                                        ? calificacion.getAsignaturaNombre() : "",
                    "nota",             calificacion.getNota(),
                    "tipo",             calificacion.getTipo() != null
                                        ? calificacion.getTipo().name() : "PRUEBA",
                    "docenteNombre",    docenteNombre != null ? docenteNombre : "",
                    "calificacionId",   calificacion.getId() != null ? calificacion.getId() : ""
            );

            rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, payload);
            log.info("📤 Evento publicado en RabbitMQ: nueva calificacion para {}",
                    calificacion.getEstudianteId());

        } catch (Exception e) {
            // La falla en mensajeria NO debe afectar el guardado de la calificacion
            log.error("Error al publicar evento en RabbitMQ: {}", e.getMessage());
        }
    }
}
