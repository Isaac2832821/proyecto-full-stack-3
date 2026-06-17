package cl.colegio.horarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para la creación y actualización de un bloque de horario.
 *
 * @param asignaturaId    ID de la asignatura (requerido)
 * @param asignaturaNombre Nombre de la asignatura
 * @param docenteId       RUT del docente responsable (requerido)
 * @param docenteNombre   Nombre completo del docente
 * @param diaSemana       Día de la semana (LUNES a VIERNES, requerido)
 * @param horaInicio      Hora de inicio en formato HH:mm (requerido)
 * @param horaFin         Hora de fin en formato HH:mm (requerido)
 * @param sala            Sala donde se dicta la clase
 * @param curso           Curso destinatario (ej: "1°A")
 */
public record HorarioRequest(
        @NotBlank(message = "El ID de la asignatura es requerido")
        String asignaturaId,

        String asignaturaNombre,

        @NotBlank(message = "El RUT del docente es requerido")
        String docenteId,

        String docenteNombre,

        @NotBlank(message = "El día de la semana es requerido")
        @Pattern(regexp = "LUNES|MARTES|MIERCOLES|JUEVES|VIERNES",
                message = "El día debe ser LUNES, MARTES, MIERCOLES, JUEVES o VIERNES")
        String diaSemana,

        @NotBlank(message = "La hora de inicio es requerida")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Formato de hora inválido (HH:mm)")
        String horaInicio,

        @NotBlank(message = "La hora de fin es requerida")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Formato de hora inválido (HH:mm)")
        String horaFin,

        String sala,

        @NotBlank(message = "El curso es requerido")
        String curso
) {}
