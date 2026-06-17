package cl.colegio.reportes.service;

import cl.colegio.reportes.dto.ReporteCursoDTO;
import cl.colegio.reportes.dto.ReporteEstudianteDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para ReporteService.
 *
 * <p>Las llamadas HTTP a ms-calificaciones son mockeadas con RestTemplate mock.
 * Los cachés Redis son desactivados en tests unitarios (no hay contexto Spring).
 *
 * <p>Nota: El @Cacheable de Spring se activa solo con ApplicationContext completo.
 * En tests unitarios con Mockito puro, el método se ejecuta directamente.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReporteService — Tests unitarios")
class ReporteServiceTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks private ReporteService reporteService;

    @BeforeEach
    void setUp() {
        // Inyectar la URL del microservicio vía reflection (simula @Value)
        ReflectionTestUtils.setField(reporteService, "calificacionesUrl", "http://localhost:8082");
    }

    // ── REPORTE ESTUDIANTE ────────────────────────────────────────────────────

    @Nested
    @DisplayName("Reporte de estudiante")
    class ReporteEstudianteTests {

        @Test
        @DisplayName("Reporte de estudiante con calificaciones calcula promedio correctamente")
        void reporteConCalificaciones() {
            var calificaciones = List.of(
                    Map.<String, Object>of("estudianteId", "12345678-9",
                            "estudianteNombre", "Juan Pérez",
                            "asignaturaId", "mat-001",
                            "asignaturaNombre", "Matemáticas",
                            "nota", 6.0),
                    Map.<String, Object>of("estudianteId", "12345678-9",
                            "estudianteNombre", "Juan Pérez",
                            "asignaturaId", "mat-001",
                            "asignaturaNombre", "Matemáticas",
                            "nota", 5.0)
            );

            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(calificaciones));

            ReporteEstudianteDTO reporte = reporteService.generarReporteEstudiante("12345678-9", "token");

            assertThat(reporte.estudianteId()).isEqualTo("12345678-9");
            assertThat(reporte.estudianteNombre()).isEqualTo("Juan Pérez");
            assertThat(reporte.promedioGeneral()).isEqualTo(5.5);
            assertThat(reporte.notaMasAlta()).isEqualTo(6.0);
            assertThat(reporte.notaMasBaja()).isEqualTo(5.0);
            assertThat(reporte.totalEvaluaciones()).isEqualTo(2);
            assertThat(reporte.promediosPorAsignatura()).hasSize(1);
        }

        @Test
        @DisplayName("Reporte de estudiante sin calificaciones retorna valores en cero")
        void reporteSinCalificaciones() {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            ReporteEstudianteDTO reporte = reporteService.generarReporteEstudiante("99999999-9", "token");

            assertThat(reporte.promedioGeneral()).isEqualTo(0.0);
            assertThat(reporte.totalEvaluaciones()).isEqualTo(0);
            assertThat(reporte.promediosPorAsignatura()).isEmpty();
        }

        @Test
        @DisplayName("Reporte de estudiante con múltiples asignaturas desglosa correctamente")
        void reporteMultiplesAsignaturas() {
            var calificaciones = List.of(
                    Map.<String, Object>of("estudianteId", "12345678-9",
                            "estudianteNombre", "Juan",
                            "asignaturaId", "mat-001", "asignaturaNombre", "Matemáticas", "nota", 7.0),
                    Map.<String, Object>of("estudianteId", "12345678-9",
                            "estudianteNombre", "Juan",
                            "asignaturaId", "len-001", "asignaturaNombre", "Lenguaje", "nota", 5.0)
            );

            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(calificaciones));

            ReporteEstudianteDTO reporte = reporteService.generarReporteEstudiante("12345678-9", "token");

            assertThat(reporte.promediosPorAsignatura()).hasSize(2);
            assertThat(reporte.promedioGeneral()).isEqualTo(6.0);
        }

        @Test
        @DisplayName("Error en ms-calificaciones retorna reporte vacío sin lanzar excepción")
        void reporteErrorConexion() {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenThrow(new RuntimeException("Connection refused"));

            assertThatCode(() -> reporteService.generarReporteEstudiante("12345678-9", "token"))
                    .doesNotThrowAnyException();
        }
    }

    // ── REPORTE CURSO ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Reporte de curso")
    class ReporteCursoTests {

        @Test
        @DisplayName("Reporte de curso con datos genera ranking correctamente")
        void reporteCursoConDatos() {
            var calificaciones = List.of(
                    Map.<String, Object>of("estudianteId", "11111111-1",
                            "estudianteNombre", "Ana", "nota", 7.0),
                    Map.<String, Object>of("estudianteId", "22222222-2",
                            "estudianteNombre", "Carlos", "nota", 5.0),
                    Map.<String, Object>of("estudianteId", "11111111-1",
                            "estudianteNombre", "Ana", "nota", 6.0)
            );

            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(calificaciones));

            ReporteCursoDTO reporte = reporteService.generarReporteCurso("1A", "token");

            assertThat(reporte.curso()).isEqualTo("1A");
            assertThat(reporte.totalEstudiantes()).isEqualTo(2);
            assertThat(reporte.totalEvaluaciones()).isEqualTo(3);
            // Ana tiene promedio 6.5, debería ser posicion 1
            assertThat(reporte.rankingEstudiantes()).isNotEmpty();
            assertThat(reporte.rankingEstudiantes().get(0).estudianteNombre()).isEqualTo("Ana");
        }

        @Test
        @DisplayName("Reporte de curso vacío retorna promedio 0 y lista vacía")
        void reporteCursoVacio() {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            ReporteCursoDTO reporte = reporteService.generarReporteCurso("99Z", "token");

            assertThat(reporte.promedioGeneral()).isEqualTo(0.0);
            assertThat(reporte.totalEstudiantes()).isEqualTo(0);
            assertThat(reporte.rankingEstudiantes()).isEmpty();
        }
    }

    // ── LIMPIAR CACHÉ ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Limpiar caché Redis")
    class LimpiarCacheTests {

        @Test
        @DisplayName("Limpiar caché se ejecuta sin lanzar excepciones")
        void limpiarCacheExitoso() {
            // En tests unitarios @CacheEvict no tiene contexto Spring, solo valida que no falla
            assertThatCode(() -> reporteService.limpiarCache())
                    .doesNotThrowAnyException();
        }
    }
}
