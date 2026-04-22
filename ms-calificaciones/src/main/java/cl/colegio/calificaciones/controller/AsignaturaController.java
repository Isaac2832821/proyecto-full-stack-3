package cl.colegio.calificaciones.controller;

import cl.colegio.calificaciones.dto.AsignaturaRequest;
import cl.colegio.calificaciones.entity.Asignatura;
import cl.colegio.calificaciones.service.AsignaturaService;
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
@RequestMapping("/asignaturas")
@RequiredArgsConstructor
@Tag(name = "Asignaturas", description = "CRUD de asignaturas")
public class AsignaturaController {

    private final AsignaturaService asignaturaService;

    @Operation(summary = "Crear asignatura (ADMIN)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Asignatura> crear(@Valid @RequestBody AsignaturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asignaturaService.crear(request));
    }

    @Operation(summary = "Listar todas las asignaturas")
    @GetMapping
    public ResponseEntity<List<Asignatura>> listarTodas() {
        return ResponseEntity.ok(asignaturaService.listarTodas());
    }

    @Operation(summary = "Obtener asignatura por ID")
    @GetMapping("/{id}")
    public ResponseEntity<Asignatura> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(asignaturaService.obtenerPorId(id));
    }

    @Operation(summary = "Listar asignaturas del docente autenticado")
    @GetMapping("/mis-asignaturas")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<List<Asignatura>> misAsignaturas(Principal principal) {
        return ResponseEntity.ok(asignaturaService.listarPorDocente(principal.getName()));
    }

    @Operation(summary = "Actualizar asignatura (ADMIN)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Asignatura> actualizar(@PathVariable String id,
                                                  @Valid @RequestBody AsignaturaRequest request) {
        return ResponseEntity.ok(asignaturaService.actualizar(id, request));
    }

    @Operation(summary = "Eliminar asignatura (ADMIN)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        asignaturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
