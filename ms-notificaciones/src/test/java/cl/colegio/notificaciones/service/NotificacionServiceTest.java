package cl.colegio.notificaciones.service;

import cl.colegio.notificaciones.entity.Notificacion;
import cl.colegio.notificaciones.repository.NotificacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para NotificacionService.
 *
 * <p>Cubre los casos principales: creación, consulta, marcado como leída y eliminación.
 * El repositorio Firestore es mockeado para evitar dependencia de infraestructura.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificacionService — Tests unitarios")
class NotificacionServiceTest {

    @Mock private NotificacionRepository notificacionRepository;

    @InjectMocks private NotificacionService notificacionService;

    private Notificacion notificacionEjemplo;

    @BeforeEach
    void setUp() {
        notificacionEjemplo = Notificacion.builder()
                .id("notif-001")
                .destinatarioId("12345678-9")
                .tipo("CALIFICACION")
                .titulo("Nueva nota en Matemáticas")
                .mensaje("El docente Juan registró una prueba con nota 6.5 en Matemáticas.")
                .leida(false)
                .fechaCreacion("2024-06-01T10:00:00")
                .referenciaId("cal-001")
                .build();
    }

    // ── CREAR ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Crear notificación")
    class CrearTests {

        @Test
        @DisplayName("Crear notificación exitosamente persiste en Firestore")
        void crearExitoso() {
            when(notificacionRepository.save(any(Notificacion.class))).thenReturn(notificacionEjemplo);

            Notificacion resultado = notificacionService.crear(
                    "12345678-9", "CALIFICACION",
                    "Nueva nota en Matemáticas",
                    "El docente Juan registró una prueba con nota 6.5.",
                    "cal-001"
            );

            assertThat(resultado.getId()).isEqualTo("notif-001");
            assertThat(resultado.getDestinatarioId()).isEqualTo("12345678-9");
            assertThat(resultado.getTipo()).isEqualTo("CALIFICACION");
            assertThat(resultado.isLeida()).isFalse();
            verify(notificacionRepository).save(any(Notificacion.class));
        }

        @Test
        @DisplayName("La notificación creada tiene leida=false por defecto")
        void crearNotificacionNoLeida() {
            when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(inv -> inv.getArgument(0));

            Notificacion resultado = notificacionService.crear(
                    "12345678-9", "SISTEMA", "Bienvenido", "Mensaje de bienvenida", null
            );

            assertThat(resultado.isLeida()).isFalse();
            assertThat(resultado.getTipo()).isEqualTo("SISTEMA");
        }
    }

    // ── LISTAR ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar notificaciones")
    class ListarTests {

        @Test
        @DisplayName("Listar por destinatario retorna solo las notificaciones del usuario")
        void listarPorDestinatario() {
            when(notificacionRepository.findByDestinatarioId("12345678-9"))
                    .thenReturn(List.of(notificacionEjemplo));

            var resultado = notificacionService.listarPorDestinatario("12345678-9");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getDestinatarioId()).isEqualTo("12345678-9");
        }

        @Test
        @DisplayName("Listar por destinatario sin notificaciones retorna lista vacía")
        void listarPorDestinatarioVacia() {
            when(notificacionRepository.findByDestinatarioId("00000000-0")).thenReturn(List.of());

            var resultado = notificacionService.listarPorDestinatario("00000000-0");

            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("Listar todas retorna lista completa del sistema")
        void listarTodas() {
            when(notificacionRepository.findAll()).thenReturn(List.of(notificacionEjemplo));

            var resultado = notificacionService.listarTodas();

            assertThat(resultado).hasSize(1);
        }
    }

    // ── OBTENER ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener notificación por ID")
    class ObtenerTests {

        @Test
        @DisplayName("Obtener notificación existente retorna la notificación")
        void obtenerExistente() {
            when(notificacionRepository.findById("notif-001")).thenReturn(Optional.of(notificacionEjemplo));

            Notificacion resultado = notificacionService.obtenerPorId("notif-001");

            assertThat(resultado.getId()).isEqualTo("notif-001");
            assertThat(resultado.getTitulo()).isEqualTo("Nueva nota en Matemáticas");
        }

        @Test
        @DisplayName("Obtener notificación inexistente lanza NoSuchElementException")
        void obtenerInexistente() {
            when(notificacionRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificacionService.obtenerPorId("no-existe"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("no-existe");
        }
    }

    // ── MARCAR LEÍDA ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Marcar notificación como leída")
    class MarcarLeidaTests {

        @Test
        @DisplayName("Marcar como leída actualiza el estado y retorna la notificación")
        void marcarComoLeidaExitoso() {
            var notificacionLeida = Notificacion.builder()
                    .id("notif-001").destinatarioId("12345678-9")
                    .tipo("CALIFICACION").titulo("Nueva nota en Matemáticas")
                    .mensaje("Mensaje").leida(true).fechaCreacion("2024-06-01T10:00:00")
                    .build();

            when(notificacionRepository.findById("notif-001"))
                    .thenReturn(Optional.of(notificacionEjemplo))   // primera llamada (validate)
                    .thenReturn(Optional.of(notificacionLeida));      // segunda llamada (return)
            doNothing().when(notificacionRepository).updateLeida(anyString(), anyBoolean());

            Notificacion resultado = notificacionService.marcarComoLeida("notif-001");

            assertThat(resultado.isLeida()).isTrue();
            verify(notificacionRepository).updateLeida("notif-001", true);
        }

        @Test
        @DisplayName("Marcar como leída notificación inexistente lanza NoSuchElementException")
        void marcarInexistente() {
            when(notificacionRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificacionService.marcarComoLeida("no-existe"))
                    .isInstanceOf(NoSuchElementException.class);
        }
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Eliminar notificación")
    class EliminarTests {

        @Test
        @DisplayName("Eliminar notificación existente llama al repositorio")
        void eliminarExitoso() {
            when(notificacionRepository.findById("notif-001")).thenReturn(Optional.of(notificacionEjemplo));
            doNothing().when(notificacionRepository).deleteById("notif-001");

            assertThatCode(() -> notificacionService.eliminar("notif-001"))
                    .doesNotThrowAnyException();

            verify(notificacionRepository).deleteById("notif-001");
        }

        @Test
        @DisplayName("Eliminar notificación inexistente lanza NoSuchElementException")
        void eliminarInexistente() {
            when(notificacionRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificacionService.eliminar("no-existe"))
                    .isInstanceOf(NoSuchElementException.class);

            verify(notificacionRepository, never()).deleteById(anyString());
        }
    }
}
