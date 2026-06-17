package cl.colegio.asistencia.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa un registro de asistencia diaria de un estudiante.
 * Se almacena en la colección "asistencia" de Firestore.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asistencia {
    private String id;
    private String estudianteId;      // RUT del estudiante
    private String estudianteNombre;  // Nombre completo (desnormalizado para consultas rápidas)
    private String docenteId;         // RUT del docente que registra
    private String asignaturaId;      // ID de la asignatura
    private String asignaturaNombre;  // Nombre legible de la asignatura
    private String fecha;             // Formato: "YYYY-MM-DD"
    private EstadoAsistencia estado;  // PRESENTE, AUSENTE, JUSTIFICADO, TARDANZA
    private String observacion;       // Opcional
}
