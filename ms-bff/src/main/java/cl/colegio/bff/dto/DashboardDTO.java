package cl.colegio.bff.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO del dashboard del usuario autenticado.
 *
 * <p>Agrega datos de múltiples microservicios en una sola respuesta:
 * <ul>
 *   <li>Perfil del usuario (ms-autenticacion)</li>
 *   <li>Notificaciones no leídas (ms-notificaciones)</li>
 *   <li>Resumen de calificaciones (ms-calificaciones — solo para ESTUDIANTE)</li>
 *   <li>Horario del día actual (ms-horarios)</li>
 * </ul>
 *
 * @param perfil              datos del usuario autenticado
 * @param notificacionesSinLeer cantidad de notificaciones no leídas
 * @param ultimasNotificaciones lista de las últimas 5 notificaciones
 * @param resumenCalificaciones resumen de notas (null si no es ESTUDIANTE)
 * @param horarioHoy          horarios del día actual del usuario
 */
public record DashboardDTO(
        Map<String, Object> perfil,
        int notificacionesSinLeer,
        List<Map<String, Object>> ultimasNotificaciones,
        Map<String, Object> resumenCalificaciones,
        List<Map<String, Object>> horarioHoy
) {}
