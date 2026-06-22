package cl.colegio.bff.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Servicio de validación JWT para ms-bff.
 *
 * <p>Utiliza la misma clave secreta compartida que todos los microservicios
 * para validar los tokens emitidos por ms-autenticacion.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Extrae el RUT (subject) del token JWT.
     *
     * @param token token JWT sin prefijo "Bearer "
     * @return el RUT del usuario autenticado
     */
    public String extraerRut(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extrae el rol del token JWT.
     *
     * @param token token JWT
     * @return el rol del usuario (ADMIN, DOCENTE, ESTUDIANTE, APODERADO)
     */
    public String extraerRol(String token) {
        return getClaims(token).get("rol", String.class);
    }

    /**
     * Valida que el token sea válido y no haya expirado.
     *
     * @param token token JWT a validar
     * @return {@code true} si el token es válido
     */
    public boolean esTokenValido(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Parsea y retorna los claims del token JWT.
     *
     * @param token token JWT
     * @return claims del token
     */
    private Claims getClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
