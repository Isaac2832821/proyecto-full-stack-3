package cl.colegio.bff.service;

import cl.colegio.bff.dto.DashboardDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para BffService.
 *
 * <p>Verifica el patrón API Composition y la tolerancia a fallos:
 * si un MS no responde, el BFF retorna datos vacíos para ese campo
 * sin lanzar excepción al caller.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BffService — Tests unitarios")
class BffServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private BffService bffService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bffService, "autenticacionUrl",   "http://localhost:8081");
        ReflectionTestUtils.setField(bffService, "calificacionesUrl",  "http://localhost:8082");
        ReflectionTestUtils.setField(bffService, "notificacionesUrl",  "http://localhost:8084");
        ReflectionTestUtils.setField(bffService, "horariosUrl",        "http://localhost:8085");
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("obtenerDashboard")
    class DashboardTests {

        @Test
        @DisplayName("Dashboard para ESTUDIANTE incluye resumen de calificaciones")
        void dashboardEstudiante_incluyeCalificaciones() {
            Map<String, Object> perfil = Map.of("rut", "12345678-9", "nombre", "Ana");
            List<Map<String, Object>> notificaciones = List.of(
                    Map.of("id", "n1", "leida", false),
                    Map.of("id", "n2", "leida", true)
            );
            List<Map<String, Object>> calificaciones = List.of(
                    Map.of("nota", 6.0, "asignaturaId", "mat-01"),
                    Map.of("nota", 5.0, "asignaturaId", "len-01")
            );

            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(perfil));
            when(restTemplate.exchange(contains("/notificaciones/mis-notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(notificaciones));
            when(restTemplate.exchange(contains("/calificaciones/estudiante/"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(calificaciones));
            when(restTemplate.exchange(contains("/horarios/dia/"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            DashboardDTO result = bffService.obtenerDashboard("token", "12345678-9", "ESTUDIANTE");

            assertThat(result.perfil()).isEqualTo(perfil);
            assertThat(result.notificacionesSinLeer()).isEqualTo(1);
            assertThat(result.resumenCalificaciones()).isNotNull();
            assertThat(result.resumenCalificaciones()).containsKey("promedio");
            assertThat(result.resumenCalificaciones().get("total")).isEqualTo(2);
        }

        @Test
        @DisplayName("Dashboard para DOCENTE NO incluye resumen de calificaciones")
        void dashboardDocente_noIncluyeCalificaciones() {
            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(Map.of("rut", "98765432-1")));
            when(restTemplate.exchange(contains("/notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));
            when(restTemplate.exchange(contains("/horarios"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            DashboardDTO result = bffService.obtenerDashboard("token", "98765432-1", "DOCENTE");

            assertThat(result.resumenCalificaciones()).isNull();
            // Verifica que NO se consultó ms-calificaciones
            verify(restTemplate, never()).exchange(contains("/calificaciones/estudiante"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class));
        }

        @Test
        @DisplayName("Si ms-autenticacion falla, retorna perfil vacío sin lanzar excepción")
        void autenticacionFalla_retornaPerfilVacio() {
            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenThrow(new RestClientException("Connection refused"));
            when(restTemplate.exchange(contains("/notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));
            when(restTemplate.exchange(contains("/horarios"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            assertThatCode(() -> bffService.obtenerDashboard("token", "12345678-9", "ADMIN"))
                    .doesNotThrowAnyException();

            DashboardDTO result = bffService.obtenerDashboard("token", "12345678-9", "ADMIN");
            assertThat(result.perfil()).isEmpty();
        }

        @Test
        @DisplayName("Si ms-notificaciones falla, retorna notificaciones vacías sin lanzar excepción")
        void notificacionesFalla_retornaVacio() {
            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(Map.of("rut", "12345678-9")));
            when(restTemplate.exchange(contains("/notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenThrow(new RestClientException("Timeout"));
            when(restTemplate.exchange(contains("/horarios"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            assertThatCode(() -> bffService.obtenerDashboard("token", "12345678-9", "ADMIN"))
                    .doesNotThrowAnyException();

            DashboardDTO result = bffService.obtenerDashboard("token", "12345678-9", "ADMIN");
            assertThat(result.notificacionesSinLeer()).isZero();
            assertThat(result.ultimasNotificaciones()).isEmpty();
        }

        @Test
        @DisplayName("Conteo de notificaciones sin leer es correcto")
        void conteoNotificacionesSinLeer_correcto() {
            List<Map<String, Object>> notificaciones = List.of(
                    Map.of("id", "n1", "leida", false),
                    Map.of("id", "n2", "leida", false),
                    Map.of("id", "n3", "leida", true),
                    Map.of("id", "n4", "leida", false)
            );

            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(Map.of()));
            when(restTemplate.exchange(contains("/notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(notificaciones));
            when(restTemplate.exchange(contains("/horarios"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            DashboardDTO result = bffService.obtenerDashboard("token", "12345678-9", "ADMIN");

            assertThat(result.notificacionesSinLeer()).isEqualTo(3);
        }

        @Test
        @DisplayName("Lista de últimas notificaciones está limitada a 5")
        void ultimasNotificaciones_limitadoA5() {
            List<Map<String, Object>> muchasNotificaciones = List.of(
                    Map.of("id", "n1", "leida", false),
                    Map.of("id", "n2", "leida", false),
                    Map.of("id", "n3", "leida", false),
                    Map.of("id", "n4", "leida", false),
                    Map.of("id", "n5", "leida", false),
                    Map.of("id", "n6", "leida", false),
                    Map.of("id", "n7", "leida", false)
            );

            when(restTemplate.exchange(contains("/auth/me"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(Map.of()));
            when(restTemplate.exchange(contains("/notificaciones"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(muchasNotificaciones));
            when(restTemplate.exchange(contains("/horarios"), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(ResponseEntity.ok(List.of()));

            DashboardDTO result = bffService.obtenerDashboard("token", "12345678-9", "ADMIN");

            assertThat(result.ultimasNotificaciones()).hasSize(5);
        }
    }
}
