package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;

public record AuthResponse(
        String token,
        String refreshToken,
        String tipo,
        String id,
        String rut,
        String nombre,
        String apellido,
        String email,
        Rol rol,
        String idApoderado
) {
    public AuthResponse(String token, String refreshToken, Usuario usuario) {
        this(
                token,
                refreshToken,
                "Bearer",
                usuario.getId(),
                usuario.getRut(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getIdApoderado()
        );
    }
}
