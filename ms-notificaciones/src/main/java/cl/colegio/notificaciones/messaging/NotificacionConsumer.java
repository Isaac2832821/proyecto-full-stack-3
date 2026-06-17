package cl.colegio.notificaciones.messaging;

import cl.colegio.notificaciones.dto.CalificacionEventoDTO;
import cl.colegio.notificaciones.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumidor de mensajes RabbitMQ para el microservicio de notificaciones.
 *
 * <p>Escucha la cola {@code "calificacion.registrada"} donde ms-calificaciones
 * publica un evento cada vez que un docente registra una nueva nota. Al recibir
 * el mensaje, crea automáticamente una notificación para el estudiante afectado.
 *
 * <p>Flujo de mensajería:
 * <pre>
 * ms-calificaciones → RabbitMQ (exchange: colegio.exchange)
 *                   → cola: calificacion.registrada
 *                   → ms-notificaciones (este consumer)
 *                   → Firestore: colección "notificaciones"
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionConsumer {

    private final NotificacionService notificacionService;

    /**
     * Maneja el evento de nueva calificación registrada.
     *
     * <p>Al recibir el mensaje, construye un título y mensaje descriptivo
     * y crea una notificación para el estudiante destinatario.
     *
     * @param evento DTO del evento deserializado desde el JSON del mensaje
     */
    @RabbitListener(queues = "#{@rabbitMQConfig.calificacionQueue()}")
    public void handleCalificacionRegistrada(CalificacionEventoDTO evento) {
        log.info("📨 Evento recibido: nueva calificación para estudiante {}", evento.estudianteId());

        String titulo = String.format("Nueva nota en %s", evento.asignaturaNombre());
        String mensaje = String.format(
                "El docente %s registró una %s con nota %.1f en %s.",
                evento.docenteNombre(),
                evento.tipo().toLowerCase(),
                evento.nota(),
                evento.asignaturaNombre()
        );

        notificacionService.crear(
                evento.estudianteId(),
                "CALIFICACION",
                titulo,
                mensaje,
                evento.calificacionId()
        );
    }
}
