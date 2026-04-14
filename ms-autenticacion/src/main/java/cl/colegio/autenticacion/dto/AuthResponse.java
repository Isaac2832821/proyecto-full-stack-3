package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;

public record AuthResponse(
        String token,
        String tipo,
        String id,
        String rut,
        String nombre,
        String apellido,
        String email,
        Rol rol,
        String idApoderado
) {
    public AuthResponse(String token, cl.colegio.autenticacion.entity.Usuario usuario) {
        this(
                token,
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
