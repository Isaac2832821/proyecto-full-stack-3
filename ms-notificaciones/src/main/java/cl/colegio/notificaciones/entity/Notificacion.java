package cl.colegio.notificaciones.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa una notificación del sistema escolar.
 *
 * <p>Las notificaciones se generan automáticamente cuando:
 * <ul>
 *   <li>Un docente registra una nueva calificación</li>
 *   <li>Un docente registra una inasistencia</li>
 * </ul>
 *
 * <p>Persistida en la colección "notificaciones" de Firestore.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {

    /** ID único generado por Firestore. */
    private String id;

    /** RUT del usuario destinatario de la notificación. */
    private String destinatarioId;

    /** Tipo de notificación: CALIFICACION, INASISTENCIA, SISTEMA. */
    private String tipo;

    /** Título corto de la notificación (ej: "Nueva nota en Matemáticas"). */
    private String titulo;

    /** Mensaje descriptivo con el detalle del evento. */
    private String mensaje;

    /** Indica si el usuario ya leyó la notificación. */
    @Builder.Default
    private boolean leida = false;

    /** Fecha y hora de creación en formato ISO 8601. */
    private String fechaCreacion;

    /** ID del objeto relacionado (ej: ID de la calificación que generó la notif). */
    private String referenciaId;
}
