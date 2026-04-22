package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;

public record UsuarioDTO(
        String id,
        String rut,
        String nombre,
        String apellido,
        String email,
        Rol rol,
        String idApoderado
) {
    public static UsuarioDTO from(Usuario u) {
        return new UsuarioDTO(
                u.getId(),
                u.getRut(),
                u.getNombre(),
                u.getApellido(),
                u.getEmail(),
                u.getRol(),
                u.getIdApoderado()
        );
    }
}
