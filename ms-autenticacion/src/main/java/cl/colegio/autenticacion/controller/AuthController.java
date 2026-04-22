package cl.colegio.autenticacion.controller;

import cl.colegio.autenticacion.dto.AuthResponse;
import cl.colegio.autenticacion.dto.CambiarPasswordRequest;
import cl.colegio.autenticacion.dto.LoginRequest;
import cl.colegio.autenticacion.dto.RefreshTokenRequest;
import cl.colegio.autenticacion.dto.RegisterRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.service.AuthService;
import cl.colegio.autenticacion.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de login, registro y gestión de sesión")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @Operation(summary = "Registrar nuevo usuario")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    @Operation(summary = "Iniciar sesión y obtener JWT")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Renovar access token usando refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @Operation(summary = "Validar token JWT (usado por el API Gateway)")
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validarToken(@RequestParam String token) {
        boolean valido = jwtService.esTokenValido(token);
        if (!valido) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false, "mensaje", "Token inválido o expirado"));
        }
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "rut",   jwtService.extraerRut(token),
                "rol",   jwtService.extraerRol(token)
        ));
    }

    @Operation(summary = "Obtener perfil del usuario autenticado", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> obtenerPerfil(Principal principal) {
        return ResponseEntity.ok(authService.obtenerPerfil(principal.getName()));
    }

    @Operation(summary = "Cambiar contraseña del usuario autenticado", security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/password")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            Principal principal,
            @Valid @RequestBody CambiarPasswordRequest request) {
        authService.cambiarPassword(principal.getName(), request);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada exitosamente"));
    }
}
