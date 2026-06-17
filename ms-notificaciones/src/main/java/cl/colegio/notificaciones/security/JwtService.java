package cl.colegio.notificaciones.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Servicio JWT — solo valida y extrae claims del token.
 *
 * <p>No genera tokens (esa responsabilidad es de ms-autenticacion).
 * Utiliza la misma clave secreta compartida entre todos los microservicios
 * para validar tokens de forma independiente sin comunicación entre servicios.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Verifica si el token JWT es válido y no está expirado.
     *
     * @param token el token JWT a verificar
     * @return true si el token es válido y vigente, false en caso contrario
     */
    public boolean esTokenValido(String token) {
        try {
            return getClaims(token).getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrae el RUT del usuario (subject) del token JWT.
     *
     * @param token el token JWT
     * @return el RUT del usuario
     */
    public String extraerRut(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extrae el rol del usuario del token JWT.
     *
     * @param token el token JWT
     * @return el rol del usuario (ADMIN, DOCENTE, ESTUDIANTE, APODERADO)
     */
    public String extraerRol(String token) {
        return getClaims(token).get("rol", String.class);
    }

    /**
     * Extrae el ID de Firestore del usuario del token JWT.
     *
     * @param token el token JWT
     * @return el ID del usuario en Firestore
     */
    public String extraerId(String token) {
        return getClaims(token).get("id", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
