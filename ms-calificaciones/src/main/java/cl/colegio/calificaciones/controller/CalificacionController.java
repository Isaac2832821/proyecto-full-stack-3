package cl.colegio.calificaciones.controller;

import cl.colegio.calificaciones.dto.CalificacionRequest;
import cl.colegio.calificaciones.entity.Calificacion;
import cl.colegio.calificaciones.service.CalificacionService;
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

@RestController
@RequestMapping("/calificaciones")
@RequiredArgsConstructor
@Tag(name = "Calificaciones", description = "CRUD de calificaciones / notas")
public class CalificacionController {

    private final CalificacionService calificacionService;

    @Operation(summary = "Registrar calificación (DOCENTE)")
    @PostMapping
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<Calificacion> registrar(@Valid @RequestBody CalificacionRequest request,
                                                   Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calificacionService.registrar(request, principal.getName()));
    }

    @Operation(summary = "Listar todas las calificaciones (ADMIN/DOCENTE)")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCENTE')")
    public ResponseEntity<List<Calificacion>> listarTodas() {
        return ResponseEntity.ok(calificacionService.listarTodas());
    }

    @Operation(summary = "Obtener calificación por ID")
    @GetMapping("/{id}")
    public ResponseEntity<Calificacion> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(calificacionService.obtenerPorId(id));
    }

    @Operation(summary = "Mis calificaciones registradas (DOCENTE)")
    @GetMapping("/mis-registros")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<List<Calificacion>> misRegistros(Principal principal) {
        return ResponseEntity.ok(calificacionService.listarPorDocente(principal.getName()));
    }

    @Operation(summary = "Calificaciones de un estudiante por RUT")
    @GetMapping("/estudiante/{estudianteId}")
    public ResponseEntity<List<Calificacion>> porEstudiante(@PathVariable String estudianteId) {
        return ResponseEntity.ok(calificacionService.listarPorEstudiante(estudianteId));
    }

    @Operation(summary = "Calificaciones por asignatura")
    @GetMapping("/asignatura/{asignaturaId}")
    public ResponseEntity<List<Calificacion>> porAsignatura(@PathVariable String asignaturaId) {
        return ResponseEntity.ok(calificacionService.listarPorAsignatura(asignaturaId));
    }

    @Operation(summary = "Actualizar calificación (DOCENTE)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<Calificacion> actualizar(@PathVariable String id,
                                                    @Valid @RequestBody CalificacionRequest request,
                                                    Principal principal) {
        return ResponseEntity.ok(calificacionService.actualizar(id, request, principal.getName()));
    }

    @Operation(summary = "Eliminar calificación (ADMIN/DOCENTE)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        calificacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
