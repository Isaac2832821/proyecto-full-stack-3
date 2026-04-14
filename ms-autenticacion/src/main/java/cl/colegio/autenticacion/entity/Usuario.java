package cl.colegio.autenticacion.entity;

import lombok.*;

/**
 * Modelo de usuario — almacenado como documento en Firestore.
 * Colección: "usuarios"
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    private String id;          // Document ID de Firestore

    private String rut;

    private String nombre;

    private String apellido;

    private String email;

    private String password;    // almacenado encriptado con BCrypt

    private Rol rol;

    @Builder.Default
    private boolean activo = true;
}
