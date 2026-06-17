package cl.colegio.asistencia.dto;

import cl.colegio.asistencia.entity.EstadoAsistencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO de entrada para registrar o actualizar un registro de asistencia.
 */
public record AsistenciaRequest(

        @NotBlank(message = "El RUT del estudiante es obligatorio")
        String estudianteId,

        String estudianteNombre,

        @NotBlank(message = "El ID de asignatura es obligatorio")
        String asignaturaId,

        String asignaturaNombre,

        @NotBlank(message = "La fecha es obligatoria")
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Formato de fecha inválido (YYYY-MM-DD)")
        String fecha,

        @NotNull(message = "El estado de asistencia es obligatorio")
        EstadoAsistencia estado,

        String observacion
) {}
