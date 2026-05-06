package cl.colegio.asistencia.service;

import cl.colegio.asistencia.dto.AsistenciaRequest;
import cl.colegio.asistencia.entity.Asistencia;
import cl.colegio.asistencia.repository.AsistenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Servicio de gestión de asistencia.
 * Encapsula la lógica de negocio sobre la colección "asistencia" de Firestore.
 */
@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;

    /**
     * Registra un nuevo control de asistencia. El docenteId se obtiene del JWT (Principal).
     */
    public Asistencia registrar(AsistenciaRequest request, String docenteId) {
        var asistencia = Asistencia.builder()
                .estudianteId(request.estudianteId())
                .estudianteNombre(request.estudianteNombre())
                .docenteId(docenteId)
                .asignaturaId(request.asignaturaId())
                .asignaturaNombre(request.asignaturaNombre())
                .fecha(request.fecha())
                .estado(request.estado())
                .observacion(request.observacion())
                .build();
        return asistenciaRepository.save(asistencia);
    }

    /**
     * Actualiza un registro existente (solo el docente que lo creó o un ADMIN).
     */
    public Asistencia actualizar(String id, AsistenciaRequest request, String docenteId) {
        var existente = obtenerPorId(id);
        existente.setEstudianteNombre(request.estudianteNombre());
        existente.setAsignaturaId(request.asignaturaId());
        existente.setAsignaturaNombre(request.asignaturaNombre());
        existente.setFecha(request.fecha());
        existente.setEstado(request.estado());
        existente.setObservacion(request.observacion());
        return asistenciaRepository.save(existente);
    }

    public Asistencia obtenerPorId(String id) {
        return asistenciaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Registro de asistencia no encontrado con id: " + id));
    }

    public List<Asistencia> listarTodas() {
        return asistenciaRepository.findAll();
    }

    /**
     * Todos los registros del docente autenticado (para la vista del docente).
     */
    public List<Asistencia> listarPorDocente(String docenteId) {
        return asistenciaRepository.findByDocenteId(docenteId);
    }

    /**
     * Todos los registros de un estudiante por RUT (para vista de alumno / apoderado).
     */
    public List<Asistencia> listarPorEstudiante(String estudianteId) {
        return asistenciaRepository.findByEstudianteId(estudianteId);
    }

    /**
     * Registros de asistencia filtrados por fecha (para pasar lista diaria).
     */
    public List<Asistencia> listarPorFecha(String fecha) {
        return asistenciaRepository.findByFecha(fecha);
    }

    /**
     * Historial de un estudiante en una asignatura específica.
     */
    public List<Asistencia> listarPorEstudianteYAsignatura(String estudianteId, String asignaturaId) {
        return asistenciaRepository.findByEstudianteIdAndAsignaturaId(estudianteId, asignaturaId);
    }

    public void eliminar(String id) {
        asistenciaRepository.deleteById(id);
    }
}
