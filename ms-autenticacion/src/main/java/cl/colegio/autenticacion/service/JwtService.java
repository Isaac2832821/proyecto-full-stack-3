package cl.colegio.autenticacion.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    // ── Generación ──────────────────────────────────────────────────────────

    public String generarToken(cl.colegio.autenticacion.entity.Usuario usuario) {
        Map<String, Object> claims = Map.of(
                "id",  usuario.getId(),
                "rol", usuario.getRol().name()
        );
        return Jwts.builder()
                .claims(claims)
                .subject(usuario.getRut())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Validación ──────────────────────────────────────────────────────────

    public boolean esTokenValido(String token, UserDetails userDetails) {
        final String rut = extraerRut(token);
        return rut.equals(userDetails.getUsername()) && !estaExpirado(token);
    }

    public boolean esTokenValido(String token) {
        try {
            getClaims(token); // lanza excepción si es inválido
            return !estaExpirado(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Extracción de claims ────────────────────────────────────────────────

    public String extraerRut(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    public String extraerRol(String token) {
        return getClaims(token).get("rol", String.class);
    }

    public <T> T extraerClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(getClaims(token));
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private boolean estaExpirado(String token) {
        return extraerClaim(token, Claims::getExpiration).before(new Date());
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
