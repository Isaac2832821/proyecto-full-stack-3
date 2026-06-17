package cl.colegio.asistencia.dto;

/**
 * DTO de resumen de asistencia de un estudiante.
 *
 * <p>Incluye el porcentaje de asistencia y el indicador de riesgo de reprobación
 * por inasistencia, conforme al reglamento escolar chileno (mínimo 85%).
 *
 * <p>Regla aplicada (Decreto Nº 511 MINEDUC):
 * <ul>
 *   <li>≥ 85% → situación regular</li>
 *   <li>75% a 84.9% → en riesgo (alerta temprana)</li>
 *   <li>< 75% → reprueba por inasistencia</li>
 * </ul>
 */
public record ResumenAsistenciaDTO(

        /** RUT del estudiante. */
        String estudianteId,

        /** Nombre completo del estudiante. */
        String estudianteNombre,

        /** Asignatura evaluada (null = resumen general de todas las asignaturas). */
        String asignaturaNombre,

        /** Total de clases registradas en el período. */
        int totalClases,

        /** Número de veces que asistió (PRESENTE + TARDANZA). */
        int clasesAsistidas,

        /** Número de inasistencias injustificadas (AUSENTE). */
        int inasistenciasInjustificadas,

        /** Número de inasistencias justificadas (JUSTIFICADO). */
        int inasistenciasJustificadas,

        /** Número de tardanzas registradas (TARDANZA). */
        int tardanzas,

        /**
         * Porcentaje de asistencia calculado.
         *
         * <p>Fórmula: {@code (clasesAsistidas / totalClases) * 100}
         * donde clasesAsistidas = PRESENTE + TARDANZA + JUSTIFICADO.
         */
        double porcentajeAsistencia,

        /**
         * Estado de asistencia del estudiante según el umbral MINEDUC.
         *
         * <ul>
         *   <li>{@code REGULAR} — ≥ 85%</li>
         *   <li>{@code EN_RIESGO} — entre 75% y 84.9%</li>
         *   <li>{@code CRITICO} — menor al 75%</li>
         * </ul>
         */
        EstadoAsistenciaResumen estadoResumen,

        /**
         * Indica si el estudiante reprueba por inasistencia según el
         * reglamento escolar (menos del 75% de asistencia).
         */
        boolean repruebaPorInasistencia

) {
    /** Estados posibles del resumen de asistencia. */
    public enum EstadoAsistenciaResumen {
        /** Asistencia mayor o igual al 85% — sin problemas. */
        REGULAR,
        /** Asistencia entre 75% y 84.9% — se debe notificar al apoderado. */
        EN_RIESGO,
        /** Asistencia menor al 75% — reprueba por inasistencia. */
        CRITICO
    }
}
