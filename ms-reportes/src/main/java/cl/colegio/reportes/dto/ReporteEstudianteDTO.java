package cl.colegio.reportes.dto;

import java.util.List;

/**
 * DTO con el reporte estadístico de un estudiante individual.
 *
 * @param estudianteId     RUT del estudiante
 * @param estudianteNombre Nombre completo del estudiante
 * @param promedioGeneral  Promedio de todas las notas (1.0 – 7.0)
 * @param notaMasAlta      Nota más alta registrada
 * @param notaMasBaja      Nota más baja registrada
 * @param totalEvaluaciones Total de evaluaciones registradas
 * @param promediosPorAsignatura Lista de promedios por asignatura
 */
public record ReporteEstudianteDTO(
        String estudianteId,
        String estudianteNombre,
        double promedioGeneral,
        double notaMasAlta,
        double notaMasBaja,
        int totalEvaluaciones,
        List<PromedioAsignaturaDTO> promediosPorAsignatura
) {}
