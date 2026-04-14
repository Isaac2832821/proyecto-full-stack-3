package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;
import jakarta.validation.constraints.NotNull;

public record CambiarRolRequest(
        @NotNull(message = "El rol es obligatorio")
        Rol rol
) {}
