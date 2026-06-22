package cl.colegio.bff.controller;

import cl.colegio.bff.dto.DashboardDTO;
import cl.colegio.bff.service.BffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controlador REST del BFF (Backend For Frontend).
 *
 * <p>Expone endpoints que agregan datos de múltiples microservicios
 * en una sola respuesta, reduciendo el número de llamadas del frontend.
 *
 * <p>Todos los endpoints requieren autenticación JWT (Bearer Token).
 * El token se propaga internamente hacia cada microservicio consultado.
 */
@RestController
@RequestMapping("/bff")
@RequiredArgsConstructor
@Tag(name = "BFF", description = "Backend For Frontend — endpoints agregados para el frontend")
@SecurityRequirement(name = "bearerAuth")
public class BffController {

    private final BffService bffService;

    /**
     * Retorna el dashboard personalizado del usuario autenticado.
     *
     * <p>Agrega en una sola respuesta:
     * <ul>
     *   <li>Perfil del usuario</li>
     *   <li>Cantidad de notificaciones no leídas + últimas 5</li>
     *   <li>Resumen de calificaciones (solo para ESTUDIANTE)</li>
     *   <li>Horarios del día actual</li>
     * </ul>
     *
     * @param request   servlet request para extraer el token del header
     * @param principal usuario autenticado (RUT extraído del JWT)
     * @return {@link DashboardDTO} con datos agregados de todos los MS
     */
    @Operation(
            summary     = "Dashboard del usuario autenticado",
            description = "Agrega perfil, notificaciones, calificaciones (ESTUDIANTE) y horarios del día en una sola llamada."
    )
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(HttpServletRequest request, Principal principal) {
        String bearerToken = extraerToken(request);
        String rol = (String) request.getAttribute("rol");
        if (rol == null) rol = "ESTUDIANTE"; // fallback

        DashboardDTO dashboard = bffService.obtenerDashboard(bearerToken, principal.getName(), rol);
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Extrae el token Bearer del header Authorization.
     *
     * @param request servlet request
     * @return token sin prefijo "Bearer "
     */
    private String extraerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return "";
    }
}
