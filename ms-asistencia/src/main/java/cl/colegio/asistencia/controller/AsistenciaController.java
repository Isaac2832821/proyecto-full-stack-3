package cl.colegio.asistencia.controller;

import cl.colegio.asistencia.dto.AsistenciaRequest;
import cl.colegio.asistencia.entity.Asistencia;
import cl.colegio.asistencia.service.AsistenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controlador REST para gestión de asistencia.
 *
 * Endpoints disponibles por rol:
 *  - DOCENTE : registrar, actualizar, listar sus registros, listar por fecha
 *  - ADMIN   : ver todos, eliminar
 *  - ESTUDIANTE / APODERADO : consultar asistencia por estudianteId
 */
@RestController
@RequestMapping("/asistencia")
@RequiredArgsConstructor
@Tag(name = "Asistencia", description = "CRUD de registros de asistencia escolar")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    // ── Docente ───────────────────────────────────────────────────────────

    @Operation(summary = "Registrar asistencia (DOCENTE)")
    @PostMapping
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<Asistencia> registrar(@Valid @RequestBody AsistenciaRequest request,
                                                Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(asistenciaService.registrar(request, principal.getName()));
    }

    @Operation(summary = "Mis registros de asistencia (DOCENTE)")
    @GetMapping("/mis-registros")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<List<Asistencia>> misRegistros(Principal principal) {
        return ResponseEntity.ok(asistenciaService.listarPorDocente(principal.getName()));
    }

    @Operation(summary = "Asistencia por fecha — pasar lista (DOCENTE/ADMIN)")
    @GetMapping("/fecha/{fecha}")
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMIN')")
    public ResponseEntity<List<Asistencia>> porFecha(@PathVariable String fecha) {
        return ResponseEntity.ok(asistenciaService.listarPorFecha(fecha));
    }

    @Operation(summary = "Actualizar registro de asistencia (DOCENTE)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<Asistencia> actualizar(@PathVariable String id,
                                                 @Valid @RequestBody AsistenciaRequest request,
                                                 Principal principal) {
        return ResponseEntity.ok(asistenciaService.actualizar(id, request, principal.getName()));
    }

    // ── Estudiante / Apoderado ────────────────────────────────────────────

    @Operation(summary = "Ver asistencia de un estudiante por RUT")
    @GetMapping("/estudiante/{estudianteId}")
    public ResponseEntity<List<Asistencia>> porEstudiante(@PathVariable String estudianteId) {
        return ResponseEntity.ok(asistenciaService.listarPorEstudiante(estudianteId));
    }

    @Operation(summary = "Ver asistencia de un estudiante en una asignatura")
    @GetMapping("/estudiante/{estudianteId}/asignatura/{asignaturaId}")
    public ResponseEntity<List<Asistencia>> porEstudianteYAsignatura(
            @PathVariable String estudianteId,
            @PathVariable String asignaturaId) {
        return ResponseEntity.ok(
                asistenciaService.listarPorEstudianteYAsignatura(estudianteId, asignaturaId));
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    @Operation(summary = "Listar todos los registros de asistencia (ADMIN)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Asistencia>> listarTodas() {
        return ResponseEntity.ok(asistenciaService.listarTodas());
    }

    @Operation(summary = "Obtener registro por ID")
    @GetMapping("/{id}")
    public ResponseEntity<Asistencia> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(asistenciaService.obtenerPorId(id));
    }

    @Operation(summary = "Eliminar registro de asistencia (ADMIN)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        asistenciaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
