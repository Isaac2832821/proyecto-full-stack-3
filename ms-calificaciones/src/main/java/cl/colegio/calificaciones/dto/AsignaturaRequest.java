package cl.colegio.calificaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AsignaturaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100)
        String nombre,

        String descripcion,

        @NotBlank(message = "El ID del docente es obligatorio")
        String docenteId,

        String docenteNombre
) {}
