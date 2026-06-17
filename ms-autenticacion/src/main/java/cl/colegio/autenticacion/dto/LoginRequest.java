package cl.colegio.autenticacion.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El RUT es obligatorio")
        String rut,

        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {}
