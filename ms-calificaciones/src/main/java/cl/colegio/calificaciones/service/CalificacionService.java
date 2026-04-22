package cl.colegio.calificaciones.service;

import cl.colegio.calificaciones.dto.CalificacionRequest;
import cl.colegio.calificaciones.entity.Calificacion;
import cl.colegio.calificaciones.repository.CalificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Servicio de gestión de calificaciones.
 * Encapsula la lógica de negocio sobre la colección "calificaciones" de Firestore.
 */
@Service
@RequiredArgsConstructor
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;

    public Calificacion registrar(CalificacionRequest request, String docenteId) {
        var calificacion = Calificacion.builder()
                .estudianteId(request.estudianteId())
                .estudianteNombre(request.estudianteNombre())
                .asignaturaId(request.asignaturaId())
                .asignaturaNombre(request.asignaturaNombre())
                .nota(request.nota())
                .tipo(request.tipo())
                .fecha(request.fecha())
                .observacion(request.observacion())
                .docenteId(docenteId)
                .build();
        return calificacionRepository.save(calificacion);
    }

    public List<Calificacion> listarTodas() {
        return calificacionRepository.findAll();
    }

    public Calificacion obtenerPorId(String id) {
        return calificacionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Calificación no encontrada con id: " + id));
    }

    public List<Calificacion> listarPorEstudiante(String estudianteId) {
        return calificacionRepository.findByEstudianteId(estudianteId);
    }

    public List<Calificacion> listarPorAsignatura(String asignaturaId) {
        return calificacionRepository.findByAsignaturaId(asignaturaId);
    }

    public List<Calificacion> listarPorDocente(String docenteId) {
        return calificacionRepository.findByDocenteId(docenteId);
    }

    public Calificacion actualizar(String id, CalificacionRequest request, String docenteId) {
        var calificacion = obtenerPorId(id);
        calificacion.setEstudianteId(request.estudianteId());
        calificacion.setEstudianteNombre(request.estudianteNombre());
        calificacion.setAsignaturaId(request.asignaturaId());
        calificacion.setAsignaturaNombre(request.asignaturaNombre());
        calificacion.setNota(request.nota());
        calificacion.setTipo(request.tipo());
        calificacion.setFecha(request.fecha());
        calificacion.setObservacion(request.observacion());
        calificacion.setDocenteId(docenteId);
        return calificacionRepository.save(calificacion);
    }

    public void eliminar(String id) {
        calificacionRepository.deleteById(id);
    }
}
