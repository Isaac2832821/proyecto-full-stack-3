package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.AuthResponse;
import cl.colegio.autenticacion.dto.CambiarPasswordRequest;
import cl.colegio.autenticacion.dto.LoginRequest;
import cl.colegio.autenticacion.dto.RegisterRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.entity.Usuario;
import cl.colegio.autenticacion.exception.DuplicateResourceException;
import cl.colegio.autenticacion.exception.UsuarioNotFoundException;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de autenticación — encapsula la lógica de registro y login.
 *
 * Patrón aplicado: Service Layer
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // ── Registro ────────────────────────────────────────────────────────────

    public AuthResponse registrar(RegisterRequest request) {
        if (usuarioRepository.existsByRut(request.rut())) {
            throw new DuplicateResourceException("RUT", request.rut());
        }
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("email", request.email());
        }

        var usuario = Usuario.builder()
                .rut(request.rut())
                .nombre(request.nombre())
                .apellido(request.apellido())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .rol(request.rol())
                .idApoderado(request.idApoderado())
                .activo(true)
                .build();

        usuario = usuarioRepository.save(usuario);
        String token = jwtService.generarToken(usuario);
        String refreshToken = jwtService.generarRefreshToken(usuario);
        return new AuthResponse(token, refreshToken, usuario);
    }

    // ── Login ───────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Spring Security valida credenciales; lanza excepción si son incorrectas
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.rut(), request.password())
        );

        var usuario = usuarioRepository.findByRut(request.rut())
                .orElseThrow(() -> new UsuarioNotFoundException("RUT", request.rut()));

        String token = jwtService.generarToken(usuario);
        String refreshToken = jwtService.generarRefreshToken(usuario);
        return new AuthResponse(token, refreshToken, usuario);
    }

    // ── Refresh Token ───────────────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.esTokenValido(refreshToken) || !jwtService.esRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Refresh token inválido o expirado");
        }

        String rut = jwtService.extraerRut(refreshToken);
        var usuario = usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new UsuarioNotFoundException("RUT", rut));

        String nuevoToken = jwtService.generarToken(usuario);
        String nuevoRefreshToken = jwtService.generarRefreshToken(usuario);
        return new AuthResponse(nuevoToken, nuevoRefreshToken, usuario);
    }

    // ── Obtener perfil del usuario autenticado ──────────────────────────────

    public UsuarioDTO obtenerPerfil(String rut) {
        var usuario = usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new UsuarioNotFoundException("RUT", rut));
        return UsuarioDTO.from(usuario);
    }

    // ── Cambiar contraseña ──────────────────────────────────────────────────

    public void cambiarPassword(String rut, CambiarPasswordRequest request) {
        var usuario = usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new UsuarioNotFoundException("RUT", rut));

        // Verificar que la contraseña actual sea correcta
        if (!passwordEncoder.matches(request.passwordActual(), usuario.getPassword())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta");
        }

        usuario.setPassword(passwordEncoder.encode(request.passwordNueva()));
        usuarioRepository.save(usuario);
    }
}
