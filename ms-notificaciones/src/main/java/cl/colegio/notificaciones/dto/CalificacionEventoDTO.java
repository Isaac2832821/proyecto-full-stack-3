package cl.colegio.notificaciones.dto;

/**
 * DTO del evento recibido desde RabbitMQ cuando se registra una calificación.
 *
 * <p>Este record es deserializado desde el mensaje JSON que publica
 * ms-calificaciones en la cola "calificacion.registrada".
 *
 * @param estudianteId  RUT del estudiante que recibió la nota
 * @param estudianteNombre Nombre completo del estudiante
 * @param asignaturaNombre Nombre de la asignatura evaluada
 * @param nota          Nota registrada (1.0 – 7.0)
 * @param tipo          Tipo de evaluación (PRUEBA, TAREA, EXAMEN, etc.)
 * @param docenteNombre Nombre del docente que registró la nota
 * @param calificacionId ID de la calificación en Firestore
 */
public record CalificacionEventoDTO(
        String estudianteId,
        String estudianteNombre,
        String asignaturaNombre,
        double nota,
        String tipo,
        String docenteNombre,
        String calificacionId
) {}
