package cl.colegio.autenticacion.exception;

/**
 * Excepción lanzada cuando no se encuentra un usuario en la base de datos.
 * Mapeada a HTTP 404 por el GlobalExceptionHandler.
 */
public class UsuarioNotFoundException extends RuntimeException {

    public UsuarioNotFoundException(String mensaje) {
        super(mensaje);
    }

    public UsuarioNotFoundException(String campo, String valor) {
        super("Usuario no encontrado con " + campo + ": " + valor);
    }
}
