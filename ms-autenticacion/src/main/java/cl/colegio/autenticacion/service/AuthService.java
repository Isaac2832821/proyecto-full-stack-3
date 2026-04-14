package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.AuthResponse;
import cl.colegio.autenticacion.dto.LoginRequest;
import cl.colegio.autenticacion.dto.RegisterRequest;
import cl.colegio.autenticacion.entity.Usuario;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
            throw new IllegalArgumentException("Ya existe un usuario con el RUT: " + request.rut());
        }
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + request.email());
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
        return new AuthResponse(token, usuario);
    }

    // ── Login ───────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Spring Security valida credenciales; lanza excepción si son incorrectas
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.rut(), request.password())
        );

        var usuario = usuarioRepository.findByRut(request.rut())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String token = jwtService.generarToken(usuario);
        return new AuthResponse(token, usuario);
    }
}
