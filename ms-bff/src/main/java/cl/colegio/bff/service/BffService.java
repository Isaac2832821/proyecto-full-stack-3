package cl.colegio.bff.service;

import cl.colegio.bff.dto.DashboardDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

/**
 * Servicio principal del BFF (Backend For Frontend).
 *
 * <p>Agrega datos de múltiples microservicios en llamadas paralelas/secuenciales
 * para reducir el número de roundtrips del frontend. Aplica el patrón
 * <b>API Composition</b>: consulta cada MS de forma independiente y compone
 * la respuesta final.
 *
 * <p>Tolerancia a fallos: si un MS no responde, el BFF retorna un objeto vacío
 * para ese campo en lugar de fallar toda la respuesta (degradación elegante).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BffService {

    private final RestTemplate restTemplate;

    @Value("${microservices.autenticacion}")
    private String autenticacionUrl;

    @Value("${microservices.calificaciones}")
    private String calificacionesUrl;

    @Value("${microservices.notificaciones}")
    private String notificacionesUrl;

    @Value("${microservices.horarios}")
    private String horariosUrl;

    // ── Dashboard principal ────────────────────────────────────────────────

    /**
     * Genera el dashboard del usuario autenticado.
     *
     * <p>Agrega en una sola respuesta:
     * <ul>
     *   <li>Perfil del usuario ({@code GET /auth/me})</li>
     *   <li>Notificaciones no leídas ({@code GET /notificaciones/mis-notificaciones})</li>
     *   <li>Calificaciones si el rol es ESTUDIANTE ({@code GET /calificaciones/estudiante/{id}})</li>
     *   <li>Horarios del día actual ({@code GET /horarios?diaSemana=...})</li>
     * </ul>
     *
     * @param bearerToken token JWT del usuario autenticado
     * @param rut         RUT del usuario autenticado
     * @param rol         rol del usuario (ADMIN, DOCENTE, ESTUDIANTE, APODERADO)
     * @return dashboard con datos agregados de todos los MS
     */
    public DashboardDTO obtenerDashboard(String bearerToken, String rut, String rol) {
        log.info("Generando dashboard BFF para usuario: {} con rol: {}", rut, rol);

        // 1. Perfil del usuario
        Map<String, Object> perfil = consultarPerfil(bearerToken);

        // 2. Notificaciones
        List<Map<String, Object>> todasNotificaciones = consultarNotificaciones(bearerToken);
        long sinLeer = todasNotificaciones.stream()
                .filter(n -> Boolean.FALSE.equals(n.get("leida")))
                .count();
        List<Map<String, Object>> ultimas5 = todasNotificaciones.stream()
                .limit(5)
                .toList();

        // 3. Calificaciones (solo ESTUDIANTE)
        Map<String, Object> resumenCal = null;
        if ("ESTUDIANTE".equals(rol)) {
            resumenCal = consultarResumenCalificaciones(rut, bearerToken);
        }

        // 4. Horarios del día actual
        String diaSemana = LocalDate.now()
                .getDayOfWeek()
                .getDisplayName(TextStyle.FULL, new Locale("es")).toUpperCase();
        List<Map<String, Object>> horarioHoy = consultarHorariosPorDia(diaSemana, bearerToken);

        return new DashboardDTO(perfil, (int) sinLeer, ultimas5, resumenCal, horarioHoy);
    }

    // ── Métodos privados — consultas a MS ────────────────────────────────

    /**
     * Consulta el perfil del usuario autenticado desde ms-autenticacion.
     *
     * @param token token JWT Bearer
     * @return mapa con los datos del perfil
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> consultarPerfil(String token) {
        try {
            var entity = buildHttpEntity(token);
            var resp = restTemplate.exchange(
                    autenticacionUrl + "/auth/me",
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : Map.of();
        } catch (Exception e) {
            log.warn("BFF: no se pudo obtener perfil — {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Consulta las notificaciones del usuario desde ms-notificaciones.
     *
     * @param token token JWT Bearer
     * @return lista de notificaciones del usuario
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> consultarNotificaciones(String token) {
        try {
            var entity = buildHttpEntity(token);
            var resp = restTemplate.exchange(
                    notificacionesUrl + "/notificaciones/mis-notificaciones",
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : List.of();
        } catch (Exception e) {
            log.warn("BFF: no se pudieron obtener notificaciones — {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Consulta un resumen de calificaciones del estudiante desde ms-calificaciones.
     *
     * @param estudianteId RUT del estudiante
     * @param token        token JWT Bearer
     * @return mapa con promedio y conteo de calificaciones
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> consultarResumenCalificaciones(String estudianteId, String token) {
        try {
            var entity = buildHttpEntity(token);
            var resp = restTemplate.exchange(
                    calificacionesUrl + "/calificaciones/estudiante/" + estudianteId,
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            var lista = resp.getBody() != null ? resp.getBody() : List.<Map<String, Object>>of();
            if (lista.isEmpty()) return Map.of("total", 0, "promedio", 0.0);

            double promedio = lista.stream()
                    .mapToDouble(c -> ((Number) c.getOrDefault("nota", 0.0)).doubleValue())
                    .average().orElse(0.0);

            return Map.of(
                    "total", lista.size(),
                    "promedio", Math.round(promedio * 10.0) / 10.0
            );
        } catch (Exception e) {
            log.warn("BFF: no se pudieron obtener calificaciones — {}", e.getMessage());
            return Map.of("total", 0, "promedio", 0.0);
        }
    }

    /**
     * Consulta los horarios de un día específico desde ms-horarios.
     *
     * @param diaSemana día de la semana en mayúsculas (ej: "LUNES")
     * @param token     token JWT Bearer
     * @return lista de horarios del día
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> consultarHorariosPorDia(String diaSemana, String token) {
        try {
            var entity = buildHttpEntity(token);
            var resp = restTemplate.exchange(
                    horariosUrl + "/horarios/dia/" + diaSemana,
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : List.of();
        } catch (Exception e) {
            log.warn("BFF: no se pudieron obtener horarios — {}", e.getMessage());
            return List.of();
        }
    }

    /** Construye HttpEntity con header Authorization Bearer. */
    private HttpEntity<Void> buildHttpEntity(String token) {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }
}
