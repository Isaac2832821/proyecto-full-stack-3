package cl.colegio.autenticacion.controller;

import cl.colegio.autenticacion.dto.CambiarRolRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de usuarios — solo ADMIN")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @Operation(summary = "Listar todos los usuarios")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsuarioDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @Operation(summary = "Listar destinatarios disponibles según el rol del usuario")
    @GetMapping("/destinatarios")
    public ResponseEntity<List<UsuarioDTO>> listarDestinatarios(Principal principal) {
        String rut = principal.getName();
        String rolStr = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getAuthorities()
                .iterator().next().getAuthority().replace("ROLE_", "");

        return ResponseEntity.ok(
            usuarioService.listarTodos().stream()
                .filter(u -> u.activo() && !u.rut().equals(rut))
                .filter(u -> switch (rolStr) {
                    case "ESTUDIANTE" -> Rol.DOCENTE.equals(u.rol());
                    case "DOCENTE"    -> Rol.ESTUDIANTE.equals(u.rol());
                    default           -> true;
                })
                .toList()
        );
    }

    @Operation(summary = "Apoderado: Ver estudiantes a cargo")
    @GetMapping("/mis-hijos")
    @PreAuthorize("hasRole('APODERADO')")
    public ResponseEntity<List<UsuarioDTO>> obtenerMisHijos(Principal principal) {
        return ResponseEntity.ok(usuarioService.obtenerMisHijos(principal.getName()));
    }

    @Operation(summary = "Obtener usuario por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioDTO> obtener(@PathVariable String id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @Operation(summary = "Cambiar rol de un usuario")
    @PatchMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioDTO> cambiarRol(
            @PathVariable String id,
            @Valid @RequestBody CambiarRolRequest request) {
        return ResponseEntity.ok(usuarioService.cambiarRol(id, request));
    }

    @Operation(summary = "Desactivar usuario")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactivar(@PathVariable String id) {
        usuarioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activar usuario")
    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> activar(@PathVariable String id) {
        usuarioService.activar(id);
        return ResponseEntity.noContent().build();
    }
}
