package cl.colegio.notificaciones.controller;

import cl.colegio.notificaciones.entity.Notificacion;
import cl.colegio.notificaciones.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controlador REST para consulta y gestión de notificaciones.
 *
 * <p>Endpoints disponibles por rol:
 * <ul>
 *   <li>Cualquier usuario autenticado: ver sus propias notificaciones, marcar como leída</li>
 *   <li>ADMIN: ver todas las notificaciones del sistema, eliminar</li>
 * </ul>
 *
 * <p>Las notificaciones se crean automáticamente vía RabbitMQ cuando:
 * <ul>
 *   <li>Un docente registra una calificación (desde ms-calificaciones)</li>
 * </ul>
 */
@RestController
@RequestMapping("/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Consulta y gestión de notificaciones del sistema escolar")
@SecurityRequirement(name = "bearerAuth")
public class NotificacionController {

    private final NotificacionService notificacionService;

    // ── Usuario autenticado ───────────────────────────────────────────────

    /**
     * Retorna todas las notificaciones del usuario autenticado.
     *
     * @param principal usuario autenticado (RUT extraído del JWT)
     * @return lista de notificaciones del usuario
     */
    @Operation(summary = "Mis notificaciones — lista todas las notificaciones del usuario autenticado")
    @GetMapping("/mis-notificaciones")
    public ResponseEntity<List<Notificacion>> misNotificaciones(Principal principal) {
        return ResponseEntity.ok(notificacionService.listarPorDestinatario(principal.getName()));
    }

    /**
     * Obtiene una notificación específica por su ID.
     *
     * @param id ID de la notificación
     * @return la notificación encontrada
     */
    @Operation(summary = "Obtener notificación por ID")
    @GetMapping("/{id}")
    public ResponseEntity<Notificacion> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(notificacionService.obtenerPorId(id));
    }

    /**
     * Marca una notificación como leída.
     *
     * @param id ID de la notificación a marcar
     * @return la notificación actualizada con leida=true
     */
    @Operation(summary = "Marcar notificación como leída")
    @PatchMapping("/{id}/leida")
    public ResponseEntity<Notificacion> marcarComoLeida(@PathVariable String id) {
        return ResponseEntity.ok(notificacionService.marcarComoLeida(id));
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    /**
     * Lista todas las notificaciones del sistema (solo ADMIN).
     *
     * @return lista completa de todas las notificaciones
     */
    @Operation(summary = "Listar todas las notificaciones (ADMIN)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Notificacion>> listarTodas() {
        return ResponseEntity.ok(notificacionService.listarTodas());
    }

    /**
     * Elimina una notificación del sistema (solo ADMIN).
     *
     * @param id ID de la notificación a eliminar
     * @return respuesta 204 No Content
     */
    @Operation(summary = "Eliminar notificación (ADMIN)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        notificacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
