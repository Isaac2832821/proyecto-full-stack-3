package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotBlank(message = "El RUT es obligatorio")
        String rut,

        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        String apellido,

        @NotBlank(message = "El email es obligatorio")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        String password,

        @NotNull(message = "El rol es obligatorio")
        Rol rol,

        String idApoderado // Opcional, solo usado si rol es ESTUDIANTE
) {}
