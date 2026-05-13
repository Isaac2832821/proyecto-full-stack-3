package cl.colegio.asistencia.service;

import cl.colegio.asistencia.dto.AsistenciaRequest;
import cl.colegio.asistencia.entity.Asistencia;
import cl.colegio.asistencia.entity.EstadoAsistencia;
import cl.colegio.asistencia.repository.AsistenciaRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AsistenciaService — Tests unitarios")
class AsistenciaServiceTest {

    @Mock private AsistenciaRepository asistenciaRepository;

    @InjectMocks private AsistenciaService asistenciaService;

    private Asistencia asistenciaExistente;
    private AsistenciaRequest requestValido;

    @BeforeEach
    void setUp() {
        asistenciaExistente = Asistencia.builder()
                .id("asis-001")
                .estudianteId("12345678-9")
                .estudianteNombre("Juan Pérez")
                .docenteId("98765432-1")
                .asignaturaId("MAT-101")
                .asignaturaNombre("Matemáticas")
                .fecha("2026-05-13")
                .estado(EstadoAsistencia.PRESENTE)
                .observacion(null)
                .build();

        requestValido = new AsistenciaRequest(
                "12345678-9", "Juan Pérez",
                "MAT-101", "Matemáticas",
                "2026-05-13", EstadoAsistencia.PRESENTE, null
        );
    }

    // ── REGISTRAR ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Registrar asistencia")
    class RegistrarTests {

        @Test
        @DisplayName("Registro exitoso crea asistencia con datos del request y docenteId del JWT")
        void registroExitoso() {
            when(asistenciaRepository.save(any(Asistencia.class)))
                    .thenAnswer(inv -> {
                        Asistencia a = inv.getArgument(0);
                        a.setId("new-id-123");
                        return a;
                    });

            Asistencia resultado = asistenciaService.registrar(requestValido, "98765432-1");

            assertThat(resultado.getEstudianteId()).isEqualTo("12345678-9");
            assertThat(resultado.getDocenteId()).isEqualTo("98765432-1");
            assertThat(resultado.getEstado()).isEqualTo(EstadoAsistencia.PRESENTE);
            assertThat(resultado.getAsignaturaNombre()).isEqualTo("Matemáticas");
            verify(asistenciaRepository).save(any(Asistencia.class));
        }

        @Test
        @DisplayName("Registro con estado AUSENTE se guarda correctamente")
        void registroAusente() {
            var requestAusente = new AsistenciaRequest(
                    "12345678-9", "Juan Pérez",
                    "MAT-101", "Matemáticas",
                    "2026-05-13", EstadoAsistencia.AUSENTE, "No asistió"
            );
            when(asistenciaRepository.save(any(Asistencia.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            Asistencia resultado = asistenciaService.registrar(requestAusente, "98765432-1");

            assertThat(resultado.getEstado()).isEqualTo(EstadoAsistencia.AUSENTE);
            assertThat(resultado.getObservacion()).isEqualTo("No asistió");
        }
    }

    // ── ACTUALIZAR ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Actualizar asistencia")
    class ActualizarTests {

        @Test
        @DisplayName("Actualización exitosa modifica estado y observación")
        void actualizarExitoso() {
            var requestActualizado = new AsistenciaRequest(
                    "12345678-9", "Juan Pérez",
                    "MAT-101", "Matemáticas",
                    "2026-05-13", EstadoAsistencia.JUSTIFICADO, "Certificado médico"
            );
            when(asistenciaRepository.findById("asis-001")).thenReturn(Optional.of(asistenciaExistente));
            when(asistenciaRepository.save(any(Asistencia.class))).thenAnswer(inv -> inv.getArgument(0));

            Asistencia resultado = asistenciaService.actualizar("asis-001", requestActualizado, "98765432-1");

            assertThat(resultado.getEstado()).isEqualTo(EstadoAsistencia.JUSTIFICADO);
            assertThat(resultado.getObservacion()).isEqualTo("Certificado médico");
            verify(asistenciaRepository).save(asistenciaExistente);
        }

        @Test
        @DisplayName("Actualizar registro inexistente lanza NoSuchElementException")
        void actualizarInexistente() {
            when(asistenciaRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> asistenciaService.actualizar("no-existe", requestValido, "98765432-1"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("no encontrado");
        }
    }

    // ── OBTENER POR ID ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("Obtener por ID")
    class ObtenerPorIdTests {

        @Test
        @DisplayName("Obtener registro existente retorna la asistencia")
        void obtenerExistente() {
            when(asistenciaRepository.findById("asis-001")).thenReturn(Optional.of(asistenciaExistente));

            Asistencia resultado = asistenciaService.obtenerPorId("asis-001");

            assertThat(resultado.getId()).isEqualTo("asis-001");
            assertThat(resultado.getEstudianteNombre()).isEqualTo("Juan Pérez");
        }

        @Test
        @DisplayName("Obtener registro inexistente lanza NoSuchElementException")
        void obtenerInexistente() {
            when(asistenciaRepository.findById("no-existe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> asistenciaService.obtenerPorId("no-existe"))
                    .isInstanceOf(NoSuchElementException.class);
        }
    }

    // ── LISTAR ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Listar asistencias")
    class ListarTests {

        @Test
        @DisplayName("Listar todas retorna lista completa")
        void listarTodas() {
            when(asistenciaRepository.findAll()).thenReturn(List.of(asistenciaExistente));

            List<Asistencia> resultado = asistenciaService.listarTodas();

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getEstudianteId()).isEqualTo("12345678-9");
        }

        @Test
        @DisplayName("Listar por docente filtra correctamente")
        void listarPorDocente() {
            when(asistenciaRepository.findByDocenteId("98765432-1")).thenReturn(List.of(asistenciaExistente));

            List<Asistencia> resultado = asistenciaService.listarPorDocente("98765432-1");

            assertThat(resultado).hasSize(1);
            verify(asistenciaRepository).findByDocenteId("98765432-1");
        }

        @Test
        @DisplayName("Listar por estudiante filtra correctamente")
        void listarPorEstudiante() {
            when(asistenciaRepository.findByEstudianteId("12345678-9")).thenReturn(List.of(asistenciaExistente));

            List<Asistencia> resultado = asistenciaService.listarPorEstudiante("12345678-9");

            assertThat(resultado).hasSize(1);
            verify(asistenciaRepository).findByEstudianteId("12345678-9");
        }

        @Test
        @DisplayName("Listar por fecha retorna registros del día")
        void listarPorFecha() {
            when(asistenciaRepository.findByFecha("2026-05-13")).thenReturn(List.of(asistenciaExistente));

            List<Asistencia> resultado = asistenciaService.listarPorFecha("2026-05-13");

            assertThat(resultado).hasSize(1);
            verify(asistenciaRepository).findByFecha("2026-05-13");
        }

        @Test
        @DisplayName("Listar por estudiante y asignatura retorna historial específico")
        void listarPorEstudianteYAsignatura() {
            when(asistenciaRepository.findByEstudianteIdAndAsignaturaId("12345678-9", "MAT-101"))
                    .thenReturn(List.of(asistenciaExistente));

            List<Asistencia> resultado = asistenciaService.listarPorEstudianteYAsignatura("12345678-9", "MAT-101");

            assertThat(resultado).hasSize(1);
            verify(asistenciaRepository).findByEstudianteIdAndAsignaturaId("12345678-9", "MAT-101");
        }
    }

    // ── ELIMINAR ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Eliminar asistencia")
    class EliminarTests {

        @Test
        @DisplayName("Eliminar por ID invoca al repositorio correctamente")
        void eliminarExitoso() {
            doNothing().when(asistenciaRepository).deleteById("asis-001");

            asistenciaService.eliminar("asis-001");

            verify(asistenciaRepository).deleteById("asis-001");
        }
    }
}
