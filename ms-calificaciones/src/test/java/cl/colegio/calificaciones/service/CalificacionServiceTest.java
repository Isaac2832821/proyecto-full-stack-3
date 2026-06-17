package cl.colegio.calificaciones.service;

import cl.colegio.calificaciones.dto.CalificacionRequest;
import cl.colegio.calificaciones.entity.Calificacion;
import cl.colegio.calificaciones.messaging.NotificacionProducer;
import cl.colegio.calificaciones.repository.CalificacionRepository;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para CalificacionService.
 *
 * <p>Patrón de test: Given-When-Then (AAA: Arrange-Act-Assert).
 * Dependencias externas (Repository, Producer) son mockeadas con Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CalificacionService — Tests unitarios")
class CalificacionServiceTest {

    @Mock private CalificacionRepository calificacionRepository;
    @Mock private NotificacionProducer notificacionProducer;

    @InjectMocks private CalificacionService calificacionService;

    private Calificacion calificacionEjemplo;
    private CalificacionRequest requestEjemplo;

    @BeforeEach
    void setUp() {
        calificacionEjemplo = Calificacion.builder()
                .id("cal-001")
                .estudianteId("12345678-9")
                .estudianteNombre("Juan Pérez")
                .asignaturaId("mat-001")
                .asignaturaNombre("Matemáticas")
                .nota(6.5)
                .tipo(Calificacion.TipoEvaluacion.PRUEBA)
                .fecha("2024-06-01")
                .docenteId("98765432-1")
                .build();

        requestEjemplo = new CalificacionRequest(
                "12345678-9", "Juan Pérez", "mat-001", "Matemáticas",
                6.5, Calificacion.TipoEvaluacion.PRUEBA, "2024-06-01", null
        );
    }

    // ── REGISTRAR ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Registrar calificación")
    class RegistrarTests {

        @Test
        @DisplayName("Registrar calificación exitosamente publica evento en RabbitMQ")
        void registrarExitoso() {
            when(calificacionRepository.save(any(Calificacion.class))).thenReturn(calificacionEjemplo);
            doNothing().when(notificacionProducer).publicarNuevaCalificacion(any(), anyString());

            Calificacion resultado = calificacionService.registrar(requestEjemplo, "98765432-1");

            assertThat(resultado.getId()).isEqualTo("cal-001");
            assertThat(resultado.getNota()).isEqualTo(6.5);
            assertThat(resultado.getEstudianteId()).isEqualTo("12345678-9");

            verify(calificacionRepository).save(any(Calificacion.class));
            verify(notificacionProducer).publicarNuevaCalificacion(any(), eq("98765432-1"));
        }

        @Test
        @DisplayName("Falla en RabbitMQ no interrumpe el guardado de la calificación")
        void registrarFallaRabbitMQNoInterrumpe() {
            when(calificacionRepository.save(any(Calificacion.class))).thenReturn(calificacionEjemplo);
            doThrow(new RuntimeException("RabbitMQ no disponible"))
                    .when(notificacionProducer).publicarNuevaCalificacion(any(), anyString());

            // NO debe lanzar excepción — el producer maneja el error internamente
            assertThatCode(() -> calificacionService.registrar(requestEjemplo, "98765432-1"))
                    .doesNotThrowAnyException();

            verify(calificacionRepository).save(any(Calificacion.class));
        }
    }

    // ── OBTENER ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener calificación")
    class ObtenerTests {

        @Test
        @DisplayName("Obtener calificación existente por ID retorna la calificación")
        void obtenerPorIdExistente() {
            when(calificacionRepository.findById("cal-001")).thenReturn(Optional.of(calificacionEjemplo));

            Calificacion resultado = calificacionService.obtenerPorId("cal-001");

            assertThat(resultado.getId()).isEqualTo("cal-001");
            assertThat(resultado.getNota()).isEqualTo(6.5);
        }

        @Test
        @DisplayName("Obtener calificación inexistente lanza NoSuchElementException")
        void obtenerPorIdInexistente() {
            when(calificacionRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> calificacionService.obtenerPorId("no-existe"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("no-existe");
        }
    }

    // ── LISTAR ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar calificaciones")
    class ListarTests {

        @Test
        @DisplayName("Listar todas retorna lista completa")
        void listarTodas() {
            when(calificacionRepository.findAll()).thenReturn(List.of(calificacionEjemplo));

            var resultado = calificacionService.listarTodas();

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getId()).isEqualTo("cal-001");
        }

        @Test
        @DisplayName("Listar por estudiante filtra correctamente")
        void listarPorEstudiante() {
            when(calificacionRepository.findByEstudianteId("12345678-9"))
                    .thenReturn(List.of(calificacionEjemplo));

            var resultado = calificacionService.listarPorEstudiante("12345678-9");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getEstudianteId()).isEqualTo("12345678-9");
        }

        @Test
        @DisplayName("Listar por asignatura filtra correctamente")
        void listarPorAsignatura() {
            when(calificacionRepository.findByAsignaturaId("mat-001"))
                    .thenReturn(List.of(calificacionEjemplo));

            var resultado = calificacionService.listarPorAsignatura("mat-001");

            assertThat(resultado).hasSize(1);
        }

        @Test
        @DisplayName("Listar por docente filtra correctamente")
        void listarPorDocente() {
            when(calificacionRepository.findByDocenteId("98765432-1"))
                    .thenReturn(List.of(calificacionEjemplo));

            var resultado = calificacionService.listarPorDocente("98765432-1");

            assertThat(resultado).hasSize(1);
        }
    }

    // ── ACTUALIZAR ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Actualizar calificación")
    class ActualizarTests {

        @Test
        @DisplayName("Actualizar calificación existente aplica los cambios")
        void actualizarExitoso() {
            var requestActualizado = new CalificacionRequest(
                    "12345678-9", "Juan Pérez", "mat-001", "Matemáticas",
                    7.0, Calificacion.TipoEvaluacion.EXAMEN, "2024-06-15", "Examen final"
            );
            when(calificacionRepository.findById("cal-001")).thenReturn(Optional.of(calificacionEjemplo));
            when(calificacionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Calificacion resultado = calificacionService.actualizar("cal-001", requestActualizado, "98765432-1");

            assertThat(resultado.getNota()).isEqualTo(7.0);
            assertThat(resultado.getTipo()).isEqualTo(Calificacion.TipoEvaluacion.EXAMEN);
            assertThat(resultado.getObservacion()).isEqualTo("Examen final");
        }

        @Test
        @DisplayName("Actualizar calificación inexistente lanza NoSuchElementException")
        void actualizarInexistente() {
            when(calificacionRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> calificacionService.actualizar("no-existe", requestEjemplo, "98765432-1"))
                    .isInstanceOf(NoSuchElementException.class);
        }
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Eliminar calificación")
    class EliminarTests {

        @Test
        @DisplayName("Eliminar calificación llama al repositorio correctamente")
        void eliminarExitoso() {
            doNothing().when(calificacionRepository).deleteById("cal-001");

            assertThatCode(() -> calificacionService.eliminar("cal-001"))
                    .doesNotThrowAnyException();

            verify(calificacionRepository).deleteById("cal-001");
        }
    }
}
