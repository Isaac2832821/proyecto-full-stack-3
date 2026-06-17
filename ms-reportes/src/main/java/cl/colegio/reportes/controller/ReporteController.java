package cl.colegio.reportes.controller;

import cl.colegio.reportes.dto.ReporteCursoDTO;
import cl.colegio.reportes.dto.ReporteEstudianteDTO;
import cl.colegio.reportes.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Controlador REST para reportes estadísticos del sistema escolar.
 *
 * <p>Los reportes son calculados bajo demanda y <b>cacheados en Redis</b>
 * para mejorar el rendimiento en consultas frecuentes. El ADMIN puede
 * invalidar el caché manualmente.
 *
 * <p>Roles requeridos:
 * <ul>
 *   <li>ADMIN, DOCENTE: acceso a todos los reportes</li>
 *   <li>ESTUDIANTE: solo su propio reporte</li>
 *   <li>APODERADO: reportes de sus estudiantes a cargo</li>
 * </ul>
 */
@RestController
@RequestMapping("/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Reportes estadísticos con caché Redis — promedios, rankings y estadísticas de curso")
@SecurityRequirement(name = "bearerAuth")
public class ReporteController {

    private final ReporteService reporteService;

    /**
     * Genera el reporte estadístico de un estudiante específico.
     *
     * <p>El resultado se almacena en Redis con TTL de 15 minutos.
     * Las consultas subsiguientes retornan el dato cacheado instantáneamente.
     *
     * @param estudianteId RUT del estudiante
     * @param request      HttpServletRequest para extraer el token JWT
     * @return reporte con promedio general, notas por asignatura y estadísticas
     */
    @Operation(summary = "Reporte de estudiante (cacheado 15 min en Redis)",
               description = "Genera estadísticas individuales. Resultado cacheado en Redis con TTL=15min.")
    @GetMapping("/estudiante/{estudianteId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'APODERADO')")
    public ResponseEntity<ReporteEstudianteDTO> reporteEstudiante(
            @PathVariable String estudianteId,
            HttpServletRequest request) {
        String token = extraerToken(request);
        return ResponseEntity.ok(reporteService.generarReporteEstudiante(estudianteId, token));
    }

    /**
     * Genera el reporte estadístico de un curso completo con ranking.
     *
     * <p>El resultado se almacena en Redis con TTL de 30 minutos.
     *
     * @param curso   identificador del curso (ej: "1A", "2B")
     * @param request HttpServletRequest para extraer el token JWT
     * @return reporte con promedio general, ranking de estudiantes y total evaluaciones
     */
    @Operation(summary = "Reporte de curso con ranking (cacheado 30 min en Redis)",
               description = "Genera estadísticas del curso con ranking. Resultado cacheado en Redis con TTL=30min.")
    @GetMapping("/curso/{curso}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCENTE')")
    public ResponseEntity<ReporteCursoDTO> reporteCurso(
            @PathVariable String curso,
            HttpServletRequest request) {
        String token = extraerToken(request);
        return ResponseEntity.ok(reporteService.generarReporteCurso(curso, token));
    }

    /**
     * Invalida todos los cachés de reportes (solo ADMIN).
     *
     * <p>Útil cuando el administrador necesita forzar la regeneración
     * de reportes antes de que expire el TTL configurado en Redis.
     *
     * @return respuesta 204 No Content tras limpiar el caché
     */
    @Operation(summary = "Invalidar caché de reportes (ADMIN)",
               description = "Elimina todos los reportes cacheados en Redis. Útil para forzar actualización antes del TTL.")
    @DeleteMapping("/cache")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> limpiarCache() {
        reporteService.limpiarCache();
        return ResponseEntity.noContent().build();
    }

    /**
     * Extrae el Bearer token del header Authorization de la request.
     *
     * @param request la solicitud HTTP entrante
     * @return el token JWT sin el prefijo "Bearer "
     */
    private String extraerToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return "";
    }
}
