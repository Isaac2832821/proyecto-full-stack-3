package cl.colegio.calificaciones.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Calificacion {
    private String id;
    private String estudianteId;   // RUT del estudiante
    private String estudianteNombre;
    private String asignaturaId;
    private String asignaturaNombre;
    private double nota;           // 1.0 a 7.0
    private TipoEvaluacion tipo;
    private String fecha;          // ISO 8601 (yyyy-MM-dd)
    private String observacion;
    private String docenteId;      // RUT del docente que registra

    public enum TipoEvaluacion {
        PRUEBA, TAREA, EXAMEN, TRABAJO, PRESENTACION
    }
}
