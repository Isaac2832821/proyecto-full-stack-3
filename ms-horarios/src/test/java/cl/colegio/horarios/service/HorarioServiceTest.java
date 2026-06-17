package cl.colegio.horarios.service;

import cl.colegio.horarios.dto.HorarioRequest;
import cl.colegio.horarios.entity.Horario;
import cl.colegio.horarios.repository.HorarioRepository;
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
 * Tests unitarios para HorarioService.
 *
 * <p>Cubre los casos: crear, obtener, listar (todos/por asignatura/docente/curso),
 * actualizar y eliminar horarios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HorarioService — Tests unitarios")
class HorarioServiceTest {

    @Mock private HorarioRepository horarioRepository;

    @InjectMocks private HorarioService horarioService;

    private Horario horarioEjemplo;
    private HorarioRequest requestEjemplo;

    @BeforeEach
    void setUp() {
        horarioEjemplo = Horario.builder()
                .id("hor-001")
                .asignaturaId("mat-001")
                .asignaturaNombre("Matemáticas")
                .docenteId("98765432-1")
                .docenteNombre("Prof. García")
                .diaSemana("LUNES")
                .horaInicio("08:00")
                .horaFin("09:30")
                .sala("Sala 3A")
                .curso("1A")
                .activo(true)
                .build();

        requestEjemplo = new HorarioRequest(
                "mat-001", "Matemáticas",
                "98765432-1", "Prof. García",
                "LUNES", "08:00", "09:30",
                "Sala 3A", "1A"
        );
    }

    // ── CREAR ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Crear horario")
    class CrearTests {

        @Test
        @DisplayName("Crear horario exitosamente retorna el horario con ID")
        void crearExitoso() {
            when(horarioRepository.save(any(Horario.class))).thenReturn(horarioEjemplo);

            Horario resultado = horarioService.crear(requestEjemplo);

            assertThat(resultado.getId()).isEqualTo("hor-001");
            assertThat(resultado.getDiaSemana()).isEqualTo("LUNES");
            assertThat(resultado.getAsignaturaNombre()).isEqualTo("Matemáticas");
            assertThat(resultado.getCurso()).isEqualTo("1A");
            assertThat(resultado.isActivo()).isTrue();
            verify(horarioRepository).save(any(Horario.class));
        }

        @Test
        @DisplayName("Crear horario establece activo=true por defecto")
        void crearHorarioActivoByDefault() {
            when(horarioRepository.save(any(Horario.class))).thenAnswer(inv -> inv.getArgument(0));

            Horario resultado = horarioService.crear(requestEjemplo);

            assertThat(resultado.isActivo()).isTrue();
        }
    }

    // ── OBTENER ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener horario")
    class ObtenerTests {

        @Test
        @DisplayName("Obtener horario existente por ID retorna el horario")
        void obtenerPorIdExistente() {
            when(horarioRepository.findById("hor-001")).thenReturn(Optional.of(horarioEjemplo));

            Horario resultado = horarioService.obtenerPorId("hor-001");

            assertThat(resultado.getId()).isEqualTo("hor-001");
            assertThat(resultado.getSala()).isEqualTo("Sala 3A");
        }

        @Test
        @DisplayName("Obtener horario inexistente lanza NoSuchElementException")
        void obtenerPorIdInexistente() {
            when(horarioRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> horarioService.obtenerPorId("no-existe"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("no-existe");
        }
    }

    // ── LISTAR ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar horarios")
    class ListarTests {

        @Test
        @DisplayName("Listar todos retorna lista completa")
        void listarTodos() {
            when(horarioRepository.findAll()).thenReturn(List.of(horarioEjemplo));

            var resultado = horarioService.listarTodos();

            assertThat(resultado).hasSize(1);
        }

        @Test
        @DisplayName("Listar por asignatura filtra correctamente")
        void listarPorAsignatura() {
            when(horarioRepository.findByAsignaturaId("mat-001"))
                    .thenReturn(List.of(horarioEjemplo));

            var resultado = horarioService.listarPorAsignatura("mat-001");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getAsignaturaId()).isEqualTo("mat-001");
        }

        @Test
        @DisplayName("Listar por docente filtra correctamente")
        void listarPorDocente() {
            when(horarioRepository.findByDocenteId("98765432-1"))
                    .thenReturn(List.of(horarioEjemplo));

            var resultado = horarioService.listarPorDocente("98765432-1");

            assertThat(resultado).hasSize(1);
        }

        @Test
        @DisplayName("Listar por curso filtra correctamente")
        void listarPorCurso() {
            when(horarioRepository.findByCurso("1A")).thenReturn(List.of(horarioEjemplo));

            var resultado = horarioService.listarPorCurso("1A");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getCurso()).isEqualTo("1A");
        }

        @Test
        @DisplayName("Listar por curso sin horarios retorna lista vacía")
        void listarPorCursoVacio() {
            when(horarioRepository.findByCurso("5Z")).thenReturn(List.of());

            var resultado = horarioService.listarPorCurso("5Z");

            assertThat(resultado).isEmpty();
        }
    }

    // ── ACTUALIZAR ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Actualizar horario")
    class ActualizarTests {

        @Test
        @DisplayName("Actualizar horario existente aplica los nuevos datos")
        void actualizarExitoso() {
            var nuevoRequest = new HorarioRequest(
                    "len-001", "Lenguaje",
                    "11111111-1", "Prof. López",
                    "MARTES", "10:00", "11:30",
                    "Sala 2B", "2A"
            );
            when(horarioRepository.findById("hor-001")).thenReturn(Optional.of(horarioEjemplo));
            when(horarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Horario resultado = horarioService.actualizar("hor-001", nuevoRequest);

            assertThat(resultado.getDiaSemana()).isEqualTo("MARTES");
            assertThat(resultado.getHoraInicio()).isEqualTo("10:00");
            assertThat(resultado.getAsignaturaNombre()).isEqualTo("Lenguaje");
            assertThat(resultado.getCurso()).isEqualTo("2A");
        }

        @Test
        @DisplayName("Actualizar horario inexistente lanza NoSuchElementException")
        void actualizarInexistente() {
            when(horarioRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> horarioService.actualizar("no-existe", requestEjemplo))
                    .isInstanceOf(NoSuchElementException.class);
        }
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Eliminar horario")
    class EliminarTests {

        @Test
        @DisplayName("Eliminar horario existente lo borra del repositorio")
        void eliminarExitoso() {
            when(horarioRepository.findById("hor-001")).thenReturn(Optional.of(horarioEjemplo));
            doNothing().when(horarioRepository).deleteById("hor-001");

            assertThatCode(() -> horarioService.eliminar("hor-001"))
                    .doesNotThrowAnyException();

            verify(horarioRepository).deleteById("hor-001");
        }

        @Test
        @DisplayName("Eliminar horario inexistente lanza NoSuchElementException sin llamar al repositorio")
        void eliminarInexistente() {
            when(horarioRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> horarioService.eliminar("no-existe"))
                    .isInstanceOf(NoSuchElementException.class);

            verify(horarioRepository, never()).deleteById(anyString());
        }
    }
}
