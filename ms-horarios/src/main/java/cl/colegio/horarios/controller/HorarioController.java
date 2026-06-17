package cl.colegio.horarios.controller;

import cl.colegio.horarios.dto.HorarioRequest;
import cl.colegio.horarios.entity.Horario;
import cl.colegio.horarios.service.HorarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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
 * Controlador REST para gestión de horarios escolares.
 *
 * <p>Endpoints disponibles por rol:
 * <ul>
 *   <li>ADMIN: crear, actualizar, eliminar y ver todos los horarios</li>
 *   <li>DOCENTE: ver sus propios horarios</li>
 *   <li>Todos los autenticados: consultar por asignatura o curso</li>
 * </ul>
 */
@RestController
@RequestMapping("/horarios")
@RequiredArgsConstructor
@Tag(name = "Horarios", description = "Gestión del calendario de clases por asignatura, docente y curso")
@SecurityRequirement(name = "bearerAuth")
public class HorarioController {

    private final HorarioService horarioService;

    // ── Admin ──────────────────────────────────────────────────────────────

    /**
     * Crea un nuevo bloque de horario en el sistema.
     *
     * @param request datos del nuevo horario
     * @return el horario creado con HTTP 201
     */
    @Operation(summary = "Crear horario (ADMIN)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Horario> crear(@Valid @RequestBody HorarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(horarioService.crear(request));
    }

    /**
     * Actualiza un horario existente.
     *
     * @param id      ID del horario a actualizar
     * @param request nuevos datos del horario
     * @return el horario actualizado
     */
    @Operation(summary = "Actualizar horario (ADMIN)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Horario> actualizar(@PathVariable String id,
                                              @Valid @RequestBody HorarioRequest request) {
        return ResponseEntity.ok(horarioService.actualizar(id, request));
    }

    /**
     * Elimina un horario del sistema.
     *
     * @param id ID del horario a eliminar
     * @return respuesta 204 No Content
     */
    @Operation(summary = "Eliminar horario (ADMIN)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        horarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ── Consultas ──────────────────────────────────────────────────────────

    /**
     * Lista todos los horarios del sistema.
     *
     * @return lista completa de horarios
     */
    @Operation(summary = "Listar todos los horarios")
    @GetMapping
    public ResponseEntity<List<Horario>> listarTodos() {
        return ResponseEntity.ok(horarioService.listarTodos());
    }

    /**
     * Obtiene un horario específico por su ID.
     *
     * @param id ID del horario
     * @return el horario encontrado
     */
    @Operation(summary = "Obtener horario por ID")
    @GetMapping("/{id}")
    public ResponseEntity<Horario> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(horarioService.obtenerPorId(id));
    }

    /**
     * Retorna los horarios del docente autenticado.
     *
     * @param principal usuario autenticado (RUT del docente desde JWT)
     * @return lista de horarios del docente
     */
    @Operation(summary = "Mis horarios (DOCENTE)")
    @GetMapping("/mis-horarios")
    @PreAuthorize("hasRole('DOCENTE')")
    public ResponseEntity<List<Horario>> misHorarios(Principal principal) {
        return ResponseEntity.ok(horarioService.listarPorDocente(principal.getName()));
    }

    /**
     * Retorna los horarios de una asignatura específica.
     *
     * @param asignaturaId ID de la asignatura
     * @return lista de horarios de la asignatura
     */
    @Operation(summary = "Horarios por asignatura")
    @GetMapping("/asignatura/{asignaturaId}")
    public ResponseEntity<List<Horario>> porAsignatura(@PathVariable String asignaturaId) {
        return ResponseEntity.ok(horarioService.listarPorAsignatura(asignaturaId));
    }

    /**
     * Retorna los horarios de un curso específico.
     *
     * @param curso identificador del curso (ej: "1A", "2B")
     * @return lista de horarios del curso
     */
    @Operation(summary = "Horarios por curso")
    @GetMapping("/curso/{curso}")
    public ResponseEntity<List<Horario>> porCurso(@PathVariable String curso) {
        return ResponseEntity.ok(horarioService.listarPorCurso(curso));
    }
}
