package cl.colegio.autenticacion.exception;

/**
 * Excepción lanzada cuando se intenta crear un recurso que ya existe
 * (ej. RUT o email duplicado).
 * Mapeada a HTTP 409 Conflict por el GlobalExceptionHandler.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String mensaje) {
        super(mensaje);
    }

    public DuplicateResourceException(String campo, String valor) {
        super("Ya existe un usuario con el " + campo + ": " + valor);
    }
}
