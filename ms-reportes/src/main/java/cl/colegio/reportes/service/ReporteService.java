package cl.colegio.reportes.service;

import cl.colegio.reportes.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de generación de reportes estadísticos con caché Redis.
 *
 * <h3>Estrategia de caché</h3>
 * <p>Los reportes son calculados consultando datos a ms-calificaciones. Para evitar
 * sobrecargar Firestore con consultas repetidas, los resultados se almacenan en Redis:
 *
 * <ul>
 *   <li>{@code reporte-estudiante} — TTL: 15 min — Reporte por estudiante</li>
 *   <li>{@code reporte-curso} — TTL: 30 min — Estadísticas de curso</li>
 *   <li>{@code ranking-curso} — TTL: 60 min — Ranking de estudiantes</li>
 * </ul>
 *
 * <p>El caché se invalida automáticamente con {@code @CacheEvict} cuando se
 * solicita una actualización forzada (endpoint DELETE /reportes/cache).
 *
 * <p>Patrón aplicado: Service Layer + Cache-Aside Pattern
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteService {

    private final RestTemplate restTemplate;

    @Value("${microservices.calificaciones}")
    private String calificacionesUrl;

    // ── Reporte de Estudiante ──────────────────────────────────────────────

    /**
     * Genera el reporte estadístico de un estudiante específico.
     *
     * <p>El resultado se almacena en el caché "reporte-estudiante" con key = estudianteId.
     * Si el dato está en caché, se retorna directamente sin consultar ms-calificaciones.
     * <b>TTL: 15 minutos</b> (definido en RedisConfig).
     *
     * @param estudianteId  RUT del estudiante
     * @param bearerToken   Token JWT para autenticarse ante ms-calificaciones
     * @return reporte con promedio, nota más alta/baja y desglose por asignatura
     */
    @Cacheable(value = "reporte-estudiante", key = "#estudianteId")
    public ReporteEstudianteDTO generarReporteEstudiante(String estudianteId, String bearerToken) {
        log.info("🔍 Consultando calificaciones para estudiante: {} (sin caché)", estudianteId);

        List<Map<String, Object>> calificaciones = consultarCalificacionesPorEstudiante(estudianteId, bearerToken);

        if (calificaciones.isEmpty()) {
            return new ReporteEstudianteDTO(estudianteId, "N/A", 0.0, 0.0, 0.0, 0, List.of());
        }

        // Extraer nombre del estudiante de la primera calificación
        String nombreEstudiante = (String) calificaciones.get(0).getOrDefault("estudianteNombre", estudianteId);

        // Calcular estadísticas
        double[] notas = calificaciones.stream()
                .mapToDouble(c -> ((Number) c.getOrDefault("nota", 0.0)).doubleValue())
                .toArray();

        double promedio = Arrays.stream(notas).average().orElse(0.0);
        double notaMasAlta = Arrays.stream(notas).max().orElse(0.0);
        double notaMasBaja = Arrays.stream(notas).min().orElse(0.0);

        // Agrupar por asignatura para promedio por asignatura
        Map<String, List<Double>> porAsignatura = new LinkedHashMap<>();
        Map<String, String> nombresAsignatura = new HashMap<>();
        for (var c : calificaciones) {
            String asigId = (String) c.getOrDefault("asignaturaId", "");
            String asigNombre = (String) c.getOrDefault("asignaturaNombre", asigId);
            double nota = ((Number) c.getOrDefault("nota", 0.0)).doubleValue();
            porAsignatura.computeIfAbsent(asigId, k -> new ArrayList<>()).add(nota);
            nombresAsignatura.put(asigId, asigNombre);
        }

        List<PromedioAsignaturaDTO> promediosPorAsig = porAsignatura.entrySet().stream()
                .map(e -> new PromedioAsignaturaDTO(
                        e.getKey(),
                        nombresAsignatura.get(e.getKey()),
                        e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0),
                        e.getValue().size()
                ))
                .sorted(Comparator.comparing(PromedioAsignaturaDTO::asignaturaNombre))
                .toList();

        log.info("✅ Reporte generado para {} — promedio: {:.1f}", estudianteId, promedio);
        return new ReporteEstudianteDTO(
                estudianteId, nombreEstudiante,
                Math.round(promedio * 10.0) / 10.0,
                notaMasAlta, notaMasBaja,
                notas.length, promediosPorAsig
        );
    }

    // ── Reporte de Curso ───────────────────────────────────────────────────

    /**
     * Genera estadísticas del curso y ranking de estudiantes.
     *
     * <p>Resultado almacenado en el caché "reporte-curso" con key = curso.
     * <b>TTL: 30 minutos</b> (definido en RedisConfig).
     *
     * @param curso       identificador del curso (ej: "1A", "2B")
     * @param bearerToken Token JWT para autenticarse ante ms-calificaciones
     * @return reporte con promedio general, ranking y total de evaluaciones
     */
    @Cacheable(value = "reporte-curso", key = "#curso")
    public ReporteCursoDTO generarReporteCurso(String curso, String bearerToken) {
        log.info("🔍 Generando reporte de curso: {} (sin caché)", curso);

        List<Map<String, Object>> todasCalificaciones = consultarTodasCalificaciones(bearerToken);

        // Agrupar por estudiante para calcular promedio individual
        Map<String, List<Double>> porEstudiante = new LinkedHashMap<>();
        Map<String, String> nombresEstudiante = new HashMap<>();

        for (var c : todasCalificaciones) {
            String estudId = (String) c.getOrDefault("estudianteId", "");
            String estudNombre = (String) c.getOrDefault("estudianteNombre", estudId);
            double nota = ((Number) c.getOrDefault("nota", 0.0)).doubleValue();
            porEstudiante.computeIfAbsent(estudId, k -> new ArrayList<>()).add(nota);
            nombresEstudiante.put(estudId, estudNombre);
        }

        // Generar ranking
        List<RankingEstudianteDTO> ranking = new ArrayList<>();
        int posicion = 1;
        var sorted = porEstudiante.entrySet().stream()
                .sorted((a, b) -> Double.compare(
                        b.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0),
                        a.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)))
                .toList();

        for (var entry : sorted) {
            double prom = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            ranking.add(new RankingEstudianteDTO(
                    entry.getKey(),
                    nombresEstudiante.get(entry.getKey()),
                    Math.round(prom * 10.0) / 10.0,
                    posicion++
            ));
        }

        double promedioGeneral = todasCalificaciones.stream()
                .mapToDouble(c -> ((Number) c.getOrDefault("nota", 0.0)).doubleValue())
                .average().orElse(0.0);

        return new ReporteCursoDTO(
                curso,
                Math.round(promedioGeneral * 10.0) / 10.0,
                porEstudiante.size(),
                todasCalificaciones.size(),
                ranking
        );
    }

    // ── Invalidación de caché ──────────────────────────────────────────────

    /**
     * Invalida todos los cachés de reportes (ADMIN).
     *
     * <p>Útil cuando el ADMIN sabe que hay datos nuevos y quiere forzar
     * la regeneración de los reportes antes de que expire el TTL.
     */
    @CacheEvict(value = {"reporte-estudiante", "reporte-curso", "ranking-curso"}, allEntries = true)
    public void limpiarCache() {
        log.info("🗑️ Caché de reportes invalidado manualmente por ADMIN");
    }

    // ── Métodos privados — consultas a ms-calificaciones ──────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> consultarCalificacionesPorEstudiante(String estudianteId, String token) {
        try {
            var headers = new HttpHeaders();
            headers.setBearerAuth(token);
            var entity = new HttpEntity<>(headers);
            var response = restTemplate.exchange(
                    calificacionesUrl + "/calificaciones/estudiante/" + estudianteId,
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Error consultando calificaciones para {}: {}", estudianteId, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> consultarTodasCalificaciones(String token) {
        try {
            var headers = new HttpHeaders();
            headers.setBearerAuth(token);
            var entity = new HttpEntity<>(headers);
            var response = restTemplate.exchange(
                    calificacionesUrl + "/calificaciones",
                    HttpMethod.GET, entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Error consultando todas las calificaciones: {}", e.getMessage());
            return List.of();
        }
    }
}
