package cl.colegio.autenticacion.dto;

import cl.colegio.autenticacion.entity.Rol;

public record UsuarioDTO(
        String id,
        String rut,
        String nombre,
        String apellido,
        String email,
        Rol rol
) {
    public static UsuarioDTO from(cl.colegio.autenticacion.entity.Usuario u) {
        return new UsuarioDTO(u.getId(), u.getRut(), u.getNombre(), u.getApellido(), u.getEmail(), u.getRol());
    }
}
