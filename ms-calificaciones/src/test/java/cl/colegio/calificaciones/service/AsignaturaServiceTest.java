package cl.colegio.calificaciones.service;

import cl.colegio.calificaciones.dto.AsignaturaRequest;
import cl.colegio.calificaciones.entity.Asignatura;
import cl.colegio.calificaciones.repository.AsignaturaRepository;
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
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para AsignaturaService.
 *
 * <p>Cubre: crear, listar (todas / por docente), obtener por ID,
 * actualizar y eliminar asignaturas.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AsignaturaService — Tests unitarios")
class AsignaturaServiceTest {

    @Mock private AsignaturaRepository asignaturaRepository;

    @InjectMocks private AsignaturaService asignaturaService;

    private Asignatura asignaturaEjemplo;
    private AsignaturaRequest requestEjemplo;

    @BeforeEach
    void setUp() {
        asignaturaEjemplo = Asignatura.builder()
                .id("asig-001")
                .nombre("Matemáticas")
                .descripcion("Álgebra y cálculo")
                .docenteId("98765432-1")
                .docenteNombre("Prof. García")
                .activa(true)
                .build();

        requestEjemplo = new AsignaturaRequest(
                "Matemáticas", "Álgebra y cálculo", "98765432-1", "Prof. García"
        );
    }

    // ── CREAR ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Crear asignatura")
    class CrearTests {

        @Test
        @DisplayName("Crear asignatura exitosamente retorna la asignatura con ID y activa=true")
        void crear_DebeRetornarAsignaturaGuardada() {
            when(asignaturaRepository.save(any(Asignatura.class))).thenReturn(asignaturaEjemplo);

            Asignatura resultado = asignaturaService.crear(requestEjemplo);

            assertThat(resultado.getId()).isEqualTo("asig-001");
            assertThat(resultado.getNombre()).isEqualTo("Matemáticas");
            assertThat(resultado.isActiva()).isTrue();
            verify(asignaturaRepository, times(1)).save(any(Asignatura.class));
        }

        @Test
        @DisplayName("Crear asignatura establece activa=true por defecto")
        void crearAsignaturaActivaPorDefecto() {
            when(asignaturaRepository.save(any(Asignatura.class))).thenAnswer(inv -> inv.getArgument(0));

            Asignatura resultado = asignaturaService.crear(requestEjemplo);

            assertThat(resultado.isActiva()).isTrue();
        }

        @Test
        @DisplayName("La asignatura creada conserva todos los campos del request")
        void crearConservaCampos() {
            when(asignaturaRepository.save(any(Asignatura.class))).thenAnswer(inv -> inv.getArgument(0));

            Asignatura resultado = asignaturaService.crear(requestEjemplo);

            assertThat(resultado.getNombre()).isEqualTo("Matemáticas");
            assertThat(resultado.getDocenteId()).isEqualTo("98765432-1");
            assertThat(resultado.getDocenteNombre()).isEqualTo("Prof. García");
            assertThat(resultado.getDescripcion()).isEqualTo("Álgebra y cálculo");
        }
    }

    // ── OBTENER ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener asignatura por ID")
    class ObtenerPorIdTests {

        @Test
        @DisplayName("Obtener asignatura existente retorna la asignatura correctamente")
        void obtenerPorId_CuandoExiste_DebeRetornarAsignatura() {
            when(asignaturaRepository.findById("asig-001")).thenReturn(Optional.of(asignaturaEjemplo));

            Asignatura resultado = asignaturaService.obtenerPorId("asig-001");

            assertThat(resultado.getId()).isEqualTo("asig-001");
            assertThat(resultado.getNombre()).isEqualTo("Matemáticas");
            verify(asignaturaRepository, times(1)).findById("asig-001");
        }

        @Test
        @DisplayName("Obtener asignatura inexistente lanza NoSuchElementException")
        void obtenerPorId_CuandoNoExiste_LanzaExcepcion() {
            when(asignaturaRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> asignaturaService.obtenerPorId("no-existe"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("no-existe");
        }
    }

    // ── LISTAR ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar asignaturas")
    class ListarTests {

        @Test
        @DisplayName("Listar todas retorna lista completa del sistema")
        void listarTodas() {
            when(asignaturaRepository.findAll()).thenReturn(List.of(asignaturaEjemplo));

            var resultado = asignaturaService.listarTodas();

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getNombre()).isEqualTo("Matemáticas");
        }

        @Test
        @DisplayName("Listar por docente retorna solo las asignaturas de ese docente")
        void listarPorDocente() {
            when(asignaturaRepository.findByDocenteId("98765432-1"))
                    .thenReturn(List.of(asignaturaEjemplo));

            var resultado = asignaturaService.listarPorDocente("98765432-1");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getDocenteId()).isEqualTo("98765432-1");
        }

        @Test
        @DisplayName("Listar por docente sin asignaturas retorna lista vacía")
        void listarPorDocenteSinAsignaturas() {
            when(asignaturaRepository.findByDocenteId("00000000-0")).thenReturn(List.of());

            var resultado = asignaturaService.listarPorDocente("00000000-0");

            assertThat(resultado).isEmpty();
        }
    }

    // ── ACTUALIZAR ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Actualizar asignatura")
    class ActualizarTests {

        @Test
        @DisplayName("Actualizar asignatura existente aplica los nuevos datos")
        void actualizarExitoso() {
            var nuevoRequest = new AsignaturaRequest(
                    "Matemáticas Avanzadas", "Cálculo diferencial e integral",
                    "11111111-1", "Prof. López"
            );
            when(asignaturaRepository.findById("asig-001")).thenReturn(Optional.of(asignaturaEjemplo));
            when(asignaturaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Asignatura resultado = asignaturaService.actualizar("asig-001", nuevoRequest);

            assertThat(resultado.getNombre()).isEqualTo("Matemáticas Avanzadas");
            assertThat(resultado.getDescripcion()).isEqualTo("Cálculo diferencial e integral");
            assertThat(resultado.getDocenteId()).isEqualTo("11111111-1");
        }

        @Test
        @DisplayName("Actualizar asignatura inexistente lanza NoSuchElementException sin guardar")
        void actualizarInexistente() {
            when(asignaturaRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> asignaturaService.actualizar("no-existe", requestEjemplo))
                    .isInstanceOf(NoSuchElementException.class);

            verify(asignaturaRepository, never()).save(any());
        }
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Eliminar asignatura")
    class EliminarTests {

        @Test
        @DisplayName("Eliminar asignatura llama al repositorio con el ID correcto")
        void eliminarExitoso() {
            doNothing().when(asignaturaRepository).deleteById("asig-001");

            assertThatCode(() -> asignaturaService.eliminar("asig-001"))
                    .doesNotThrowAnyException();

            verify(asignaturaRepository).deleteById("asig-001");
        }
    }
}
