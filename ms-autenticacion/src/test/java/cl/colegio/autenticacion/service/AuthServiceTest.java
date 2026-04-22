package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.AuthResponse;
import cl.colegio.autenticacion.dto.CambiarPasswordRequest;
import cl.colegio.autenticacion.dto.LoginRequest;
import cl.colegio.autenticacion.dto.RegisterRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;
import cl.colegio.autenticacion.exception.DuplicateResourceException;
import cl.colegio.autenticacion.exception.UsuarioNotFoundException;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Tests unitarios")
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    private Usuario usuarioAdmin;

    @BeforeEach
    void setUp() {
        usuarioAdmin = Usuario.builder()
                .id("abc123")
                .rut("11111111-1")
                .nombre("Admin")
                .apellido("Sistema")
                .email("admin@colegio.cl")
                .password("$2a$10$hashedPassword")
                .rol(Rol.ADMIN)
                .activo(true)
                .build();
    }

    // ── REGISTRO ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Registro")
    class RegistroTests {

        @Test
        @DisplayName("Registro exitoso retorna AuthResponse con token y refresh token")
        void registroExitoso() {
            var request = new RegisterRequest(
                    "99999999-9", "Nuevo", "Usuario",
                    "nuevo@colegio.cl", "Pass1234", Rol.DOCENTE, null
            );

            when(usuarioRepository.existsByRut(anyString())).thenReturn(false);
            when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encoded");
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
                Usuario u = inv.getArgument(0);
                u.setId("newId123");
                return u;
            });
            when(jwtService.generarToken(any(Usuario.class))).thenReturn("access-token-xyz");
            when(jwtService.generarRefreshToken(any(Usuario.class))).thenReturn("refresh-token-xyz");

            AuthResponse response = authService.registrar(request);

            assertThat(response.token()).isEqualTo("access-token-xyz");
            assertThat(response.refreshToken()).isEqualTo("refresh-token-xyz");
            assertThat(response.nombre()).isEqualTo("Nuevo");
            assertThat(response.rol()).isEqualTo(Rol.DOCENTE);
            verify(usuarioRepository).save(any(Usuario.class));
        }

        @Test
        @DisplayName("Registro con RUT duplicado lanza DuplicateResourceException")
        void registroRutDuplicado() {
            var request = new RegisterRequest(
                    "11111111-1", "Test", "Test",
                    "test@colegio.cl", "Pass1234", Rol.DOCENTE, null
            );
            when(usuarioRepository.existsByRut("11111111-1")).thenReturn(true);

            assertThatThrownBy(() -> authService.registrar(request))
                    .isInstanceOf(DuplicateResourceException.class);
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Registro con email duplicado lanza DuplicateResourceException")
        void registroEmailDuplicado() {
            var request = new RegisterRequest(
                    "99999999-9", "Test", "Test",
                    "admin@colegio.cl", "Pass1234", Rol.DOCENTE, null
            );
            when(usuarioRepository.existsByRut(anyString())).thenReturn(false);
            when(usuarioRepository.existsByEmail("admin@colegio.cl")).thenReturn(true);

            assertThatThrownBy(() -> authService.registrar(request))
                    .isInstanceOf(DuplicateResourceException.class);
            verify(usuarioRepository, never()).save(any());
        }
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("Login exitoso retorna AuthResponse con ambos tokens")
        void loginExitoso() {
            var request = new LoginRequest("11111111-1", "Admin1234!");

            when(usuarioRepository.findByRut("11111111-1")).thenReturn(Optional.of(usuarioAdmin));
            when(jwtService.generarToken(usuarioAdmin)).thenReturn("access-token");
            when(jwtService.generarRefreshToken(usuarioAdmin)).thenReturn("refresh-token");

            AuthResponse response = authService.login(request);

            assertThat(response.token()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token");
            assertThat(response.rut()).isEqualTo("11111111-1");
            verify(authenticationManager).authenticate(any());
        }

        @Test
        @DisplayName("Login con usuario inexistente lanza UsuarioNotFoundException")
        void loginUsuarioInexistente() {
            var request = new LoginRequest("00000000-0", "cualquier");

            when(usuarioRepository.findByRut("00000000-0")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UsuarioNotFoundException.class);
        }
    }

    // ── REFRESH TOKEN ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenTests {

        @Test
        @DisplayName("Refresh token válido genera nuevos tokens")
        void refreshExitoso() {
            when(jwtService.esTokenValido("valid-refresh")).thenReturn(true);
            when(jwtService.esRefreshToken("valid-refresh")).thenReturn(true);
            when(jwtService.extraerRut("valid-refresh")).thenReturn("11111111-1");
            when(usuarioRepository.findByRut("11111111-1")).thenReturn(Optional.of(usuarioAdmin));
            when(jwtService.generarToken(usuarioAdmin)).thenReturn("new-access");
            when(jwtService.generarRefreshToken(usuarioAdmin)).thenReturn("new-refresh");

            AuthResponse response = authService.refreshToken("valid-refresh");

            assertThat(response.token()).isEqualTo("new-access");
            assertThat(response.refreshToken()).isEqualTo("new-refresh");
        }

        @Test
        @DisplayName("Refresh token inválido lanza BadCredentialsException")
        void refreshInvalido() {
            when(jwtService.esTokenValido("invalid")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken("invalid"))
                    .isInstanceOf(BadCredentialsException.class);
        }
    }

    // ── PERFIL ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener Perfil")
    class PerfilTests {

        @Test
        @DisplayName("Obtener perfil retorna UsuarioDTO correctamente")
        void perfilExitoso() {
            when(usuarioRepository.findByRut("11111111-1")).thenReturn(Optional.of(usuarioAdmin));

            UsuarioDTO perfil = authService.obtenerPerfil("11111111-1");

            assertThat(perfil.rut()).isEqualTo("11111111-1");
            assertThat(perfil.nombre()).isEqualTo("Admin");
            assertThat(perfil.rol()).isEqualTo(Rol.ADMIN);
        }

        @Test
        @DisplayName("Perfil de usuario inexistente lanza UsuarioNotFoundException")
        void perfilInexistente() {
            when(usuarioRepository.findByRut("00000000-0")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.obtenerPerfil("00000000-0"))
                    .isInstanceOf(UsuarioNotFoundException.class);
        }
    }

    // ── CAMBIAR PASSWORD ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("Cambiar Contraseña")
    class CambiarPasswordTests {

        @Test
        @DisplayName("Cambiar contraseña exitosamente")
        void cambiarPasswordExitoso() {
            var request = new CambiarPasswordRequest("Admin1234!", "NuevaPass1!");
            when(usuarioRepository.findByRut("11111111-1")).thenReturn(Optional.of(usuarioAdmin));
            when(passwordEncoder.matches("Admin1234!", usuarioAdmin.getPassword())).thenReturn(true);
            when(passwordEncoder.encode("NuevaPass1!")).thenReturn("$2a$10$newHash");

            authService.cambiarPassword("11111111-1", request);

            verify(usuarioRepository).save(usuarioAdmin);
            assertThat(usuarioAdmin.getPassword()).isEqualTo("$2a$10$newHash");
        }

        @Test
        @DisplayName("Cambiar contraseña con password actual incorrecta lanza BadCredentialsException")
        void cambiarPasswordIncorrecta() {
            var request = new CambiarPasswordRequest("Incorrecta!", "NuevaPass1!");
            when(usuarioRepository.findByRut("11111111-1")).thenReturn(Optional.of(usuarioAdmin));
            when(passwordEncoder.matches("Incorrecta!", usuarioAdmin.getPassword())).thenReturn(false);

            assertThatThrownBy(() -> authService.cambiarPassword("11111111-1", request))
                    .isInstanceOf(BadCredentialsException.class);
            verify(usuarioRepository, never()).save(any());
        }
    }
}
