package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.entity.Usuario;
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

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // ── Generación de Access Token ──────────────────────────────────────────

    public String generarToken(Usuario usuario) {
        Map<String, Object> claims = Map.of(
                "id",  usuario.getId(),
                "rol", usuario.getRol().name()
        );
        return buildToken(claims, usuario.getRut(), expirationMs);
    }

    // ── Generación de Refresh Token ─────────────────────────────────────────

    public String generarRefreshToken(Usuario usuario) {
        Map<String, Object> claims = Map.of(
                "id",   usuario.getId(),
                "rol",  usuario.getRol().name(),
                "type", "refresh"
        );
        return buildToken(claims, usuario.getRut(), refreshExpirationMs);
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

    public boolean esRefreshToken(String token) {
        try {
            String type = getClaims(token).get("type", String.class);
            return "refresh".equals(type);
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

    private String buildToken(Map<String, Object> claims, String subject, long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

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
