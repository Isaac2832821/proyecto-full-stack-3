package cl.colegio.calificaciones.dto;

import cl.colegio.calificaciones.entity.Calificacion;
import jakarta.validation.constraints.*;

public record CalificacionRequest(
        @NotBlank(message = "El ID del estudiante es obligatorio")
        String estudianteId,

        String estudianteNombre,

        @NotBlank(message = "El ID de la asignatura es obligatorio")
        String asignaturaId,

        String asignaturaNombre,

        @DecimalMin(value = "1.0", message = "La nota mínima es 1.0")
        @DecimalMax(value = "7.0", message = "La nota máxima es 7.0")
        double nota,

        @NotNull(message = "El tipo de evaluación es obligatorio")
        Calificacion.TipoEvaluacion tipo,

        @NotBlank(message = "La fecha es obligatoria")
        String fecha,

        String observacion
) {}
