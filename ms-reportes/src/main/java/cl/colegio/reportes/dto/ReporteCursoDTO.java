package cl.colegio.reportes.dto;

import java.util.List;

/**
 * DTO con el reporte estadístico de un curso completo.
 *
 * @param curso              Identificador del curso (ej: "1°A")
 * @param promedioGeneral    Promedio general de todos los estudiantes del curso
 * @param totalEstudiantes   Número de estudiantes en el curso
 * @param totalEvaluaciones  Total de evaluaciones del curso
 * @param rankingEstudiantes Lista de estudiantes ordenados por promedio (mayor a menor)
 */
public record ReporteCursoDTO(
        String curso,
        double promedioGeneral,
        int totalEstudiantes,
        int totalEvaluaciones,
        List<RankingEstudianteDTO> rankingEstudiantes
) {}
