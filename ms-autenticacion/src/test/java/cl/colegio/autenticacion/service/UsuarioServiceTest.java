package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.CambiarRolRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService — Tests unitarios")
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private UsuarioService usuarioService;

    private Usuario admin;
    private Usuario apoderado;
    private Usuario estudiante;

    @BeforeEach
    void setUp() {
        admin = Usuario.builder()
                .id("id-admin").rut("11111111-1").nombre("Admin").apellido("Sistema")
                .email("admin@colegio.cl").rol(Rol.ADMIN).activo(true).build();

        apoderado = Usuario.builder()
                .id("id-apoderado").rut("33333333-3").nombre("Carlos").apellido("López")
                .email("carlos@colegio.cl").rol(Rol.APODERADO).activo(true).build();

        estudiante = Usuario.builder()
                .id("id-estudiante").rut("44444444-4").nombre("Sofía").apellido("López")
                .email("sofia@colegio.cl").rol(Rol.ESTUDIANTE).idApoderado("id-apoderado")
                .activo(true).build();
    }

    // ── LISTAR TODOS ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar Todos")
    class ListarTodosTests {

        @Test
        @DisplayName("Listar todos retorna lista de DTOs")
        void listarTodosExitoso() {
            when(usuarioRepository.findAll()).thenReturn(List.of(admin, apoderado, estudiante));

            List<UsuarioDTO> resultado = usuarioService.listarTodos();

            assertThat(resultado).hasSize(3);
            assertThat(resultado.get(0).rut()).isEqualTo("11111111-1");
        }

        @Test
        @DisplayName("Listar todos retorna lista vacía cuando no hay usuarios")
        void listarTodosVacio() {
            when(usuarioRepository.findAll()).thenReturn(List.of());

            assertThat(usuarioService.listarTodos()).isEmpty();
        }
    }

    // ── OBTENER POR ID ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener por ID")
    class ObtenerPorIdTests {

        @Test
        @DisplayName("Obtener por ID exitoso retorna DTO")
        void obtenerPorIdExitoso() {
            when(usuarioRepository.findById("id-admin")).thenReturn(Optional.of(admin));

            UsuarioDTO resultado = usuarioService.obtenerPorId("id-admin");

            assertThat(resultado.nombre()).isEqualTo("Admin");
            assertThat(resultado.rol()).isEqualTo(Rol.ADMIN);
        }

        @Test
        @DisplayName("Obtener por ID inexistente lanza UsuarioNotFoundException")
        void obtenerPorIdInexistente() {
            when(usuarioRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> usuarioService.obtenerPorId("no-existe"))
                    .isInstanceOf(UsuarioNotFoundException.class);
        }
    }

    // ── OBTENER MIS HIJOS ────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener Mis Hijos")
    class MisHijosTests {

        @Test
        @DisplayName("Apoderado obtiene lista de estudiantes a cargo")
        void misHijosExitoso() {
            when(usuarioRepository.findByRut("33333333-3")).thenReturn(Optional.of(apoderado));
            when(usuarioRepository.findByApoderado("id-apoderado")).thenReturn(List.of(estudiante));

            List<UsuarioDTO> hijos = usuarioService.obtenerMisHijos("33333333-3");

            assertThat(hijos).hasSize(1);
            assertThat(hijos.get(0).nombre()).isEqualTo("Sofía");
        }

        @Test
        @DisplayName("Apoderado sin hijos retorna lista vacía")
        void misHijosSinEstudiantes() {
            when(usuarioRepository.findByRut("33333333-3")).thenReturn(Optional.of(apoderado));
            when(usuarioRepository.findByApoderado("id-apoderado")).thenReturn(List.of());

            assertThat(usuarioService.obtenerMisHijos("33333333-3")).isEmpty();
        }
    }

    // ── CAMBIAR ROL ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Cambiar Rol")
    class CambiarRolTests {

        @Test
        @DisplayName("Cambiar rol exitosamente")
        void cambiarRolExitoso() {
            when(usuarioRepository.findById("id-estudiante")).thenReturn(Optional.of(estudiante));
            when(usuarioRepository.save(any(Usuario.class))).thenReturn(estudiante);

            UsuarioDTO resultado = usuarioService.cambiarRol("id-estudiante", new CambiarRolRequest(Rol.DOCENTE));

            assertThat(estudiante.getRol()).isEqualTo(Rol.DOCENTE);
            verify(usuarioRepository).save(estudiante);
        }
    }

    // ── DESACTIVAR ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Desactivar Usuario")
    class DesactivarTests {

        @Test
        @DisplayName("Desactivar usuario exitosamente")
        void desactivarExitoso() {
            when(usuarioRepository.findById("id-admin")).thenReturn(Optional.of(admin));

            usuarioService.desactivar("id-admin");

            assertThat(admin.isActivo()).isFalse();
            verify(usuarioRepository).save(admin);
        }

        @Test
        @DisplayName("Desactivar usuario inexistente lanza UsuarioNotFoundException")
        void desactivarInexistente() {
            when(usuarioRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> usuarioService.desactivar("no-existe"))
                    .isInstanceOf(UsuarioNotFoundException.class);
            verify(usuarioRepository, never()).save(any());
        }
    }
}
