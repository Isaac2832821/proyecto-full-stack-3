package cl.colegio.horarios.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa un bloque de horario en el calendario escolar.
 *
 * <p>Un horario define cuándo se dicta una asignatura, indicando el día
 * de la semana, la hora de inicio y fin, y qué docente la imparte.
 *
 * <p>Persistida en la colección "horarios" de Firestore.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Horario {

    /** ID único generado por Firestore. */
    private String id;

    /** ID de la asignatura que se imparte en este bloque. */
    private String asignaturaId;

    /** Nombre de la asignatura (desnormalizado para consultas rápidas). */
    private String asignaturaNombre;

    /** RUT del docente responsable de este bloque. */
    private String docenteId;

    /** Nombre completo del docente (desnormalizado). */
    private String docenteNombre;

    /**
     * Día de la semana: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES.
     */
    private String diaSemana;

    /** Hora de inicio del bloque (formato HH:mm, ej: "08:00"). */
    private String horaInicio;

    /** Hora de fin del bloque (formato HH:mm, ej: "09:30"). */
    private String horaFin;

    /** Sala o aula donde se dicta la clase (ej: "Sala 3A", "Lab. Ciencias"). */
    private String sala;

    /** Curso/nivel al que va dirigido (ej: "1°A", "2°B", "3°A"). */
    private String curso;

    /** Indica si el horario está activo (permite desactivar sin eliminar). */
    @Builder.Default
    private boolean activo = true;
}
