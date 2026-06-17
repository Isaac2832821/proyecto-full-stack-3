package cl.colegio.reportes.dto;

/**
 * DTO de un estudiante dentro del ranking de su curso.
 *
 * @param estudianteId     RUT del estudiante
 * @param estudianteNombre Nombre completo del estudiante
 * @param promedio         Promedio general del estudiante
 * @param posicion         Posición en el ranking (1 = mejor promedio)
 */
public record RankingEstudianteDTO(
        String estudianteId,
        String estudianteNombre,
        double promedio,
        int posicion
) {}
