package cl.colegio.reportes.dto;

/**
 * DTO con el promedio de notas de un estudiante en una asignatura específica.
 *
 * @param asignaturaId     ID de la asignatura
 * @param asignaturaNombre Nombre de la asignatura
 * @param promedio         Promedio de notas en esa asignatura
 * @param totalNotas       Total de notas registradas en la asignatura
 */
public record PromedioAsignaturaDTO(
        String asignaturaId,
        String asignaturaNombre,
        double promedio,
        int totalNotas
) {}
