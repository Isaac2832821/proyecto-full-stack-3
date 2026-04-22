package cl.colegio.calificaciones.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asignatura {
    private String id;
    private String nombre;       // Ej: "Matemáticas", "Lenguaje"
    private String descripcion;
    private String docenteId;    // ID del docente a cargo
    private String docenteNombre;
    private boolean activa;
}
