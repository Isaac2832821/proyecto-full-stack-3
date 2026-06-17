package cl.colegio.notificaciones.service;

import cl.colegio.notificaciones.entity.Notificacion;
import cl.colegio.notificaciones.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Servicio de negocio para gestión de notificaciones del sistema escolar.
 *
 * <p>Encapsula toda la lógica relacionada con la creación, consulta y
 * marcado de notificaciones. Las notificaciones son creadas principalmente
 * por el consumidor de RabbitMQ ({@link cl.colegio.notificaciones.messaging.NotificacionConsumer}).
 *
 * <p>Patrón aplicado: Service Layer — separa la lógica de negocio del
 * controlador y del repositorio.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    /**
     * Crea y persiste una nueva notificación para un destinatario.
     *
     * @param destinatarioId RUT del usuario que recibirá la notificación
     * @param tipo           tipo de notificación (CALIFICACION, INASISTENCIA, SISTEMA)
     * @param titulo         título corto descriptivo
     * @param mensaje        mensaje detallado del evento
     * @param referenciaId   ID del objeto relacionado (calificación, asistencia, etc.)
     * @return la notificación persistida con su ID asignado
     */
    public Notificacion crear(String destinatarioId, String tipo,
                               String titulo, String mensaje, String referenciaId) {
        var notificacion = Notificacion.builder()
                .destinatarioId(destinatarioId)
                .tipo(tipo)
                .titulo(titulo)
                .mensaje(mensaje)
                .leida(false)
                .fechaCreacion(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .referenciaId(referenciaId)
                .build();

        var guardada = notificacionRepository.save(notificacion);
        log.info("Notificación creada [{}] para destinatario: {}", tipo, destinatarioId);
        return guardada;
    }

    /**
     * Lista todas las notificaciones de un usuario específico.
     *
     * @param destinatarioId RUT del usuario
     * @return lista de notificaciones del destinatario, ordenadas por fecha descendente
     */
    public List<Notificacion> listarPorDestinatario(String destinatarioId) {
        return notificacionRepository.findByDestinatarioId(destinatarioId);
    }

    /**
     * Lista todas las notificaciones del sistema (uso exclusivo de ADMIN).
     *
     * @return lista completa de todas las notificaciones
     */
    public List<Notificacion> listarTodas() {
        return notificacionRepository.findAll();
    }

    /**
     * Obtiene una notificación por su ID.
     *
     * @param id ID de la notificación en Firestore
     * @return la notificación encontrada
     * @throws NoSuchElementException si no existe notificación con ese ID
     */
    public Notificacion obtenerPorId(String id) {
        return notificacionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notificación no encontrada con id: " + id));
    }

    /**
     * Marca una notificación como leída.
     *
     * @param id ID de la notificación a marcar
     * @return la notificación actualizada
     */
    public Notificacion marcarComoLeida(String id) {
        obtenerPorId(id); // Valida que existe
        notificacionRepository.updateLeida(id, true);
        log.debug("Notificación {} marcada como leída", id);
        return obtenerPorId(id);
    }

    /**
     * Elimina una notificación del sistema.
     *
     * @param id ID de la notificación a eliminar
     * @throws NoSuchElementException si no existe notificación con ese ID
     */
    public void eliminar(String id) {
        obtenerPorId(id); // Valida que existe antes de eliminar
        notificacionRepository.deleteById(id);
        log.info("Notificación {} eliminada", id);
    }
}
