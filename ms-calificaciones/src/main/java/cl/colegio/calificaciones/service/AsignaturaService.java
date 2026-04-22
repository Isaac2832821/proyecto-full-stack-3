package cl.colegio.calificaciones.service;

import cl.colegio.calificaciones.dto.AsignaturaRequest;
import cl.colegio.calificaciones.entity.Asignatura;
import cl.colegio.calificaciones.repository.AsignaturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Servicio de gestión de asignaturas.
 * Encapsula la lógica de negocio sobre la colección "asignaturas" de Firestore.
 */
@Service
@RequiredArgsConstructor
public class AsignaturaService {

    private final AsignaturaRepository asignaturaRepository;

    public Asignatura crear(AsignaturaRequest request) {
        var asignatura = Asignatura.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .docenteId(request.docenteId())
                .docenteNombre(request.docenteNombre())
                .activa(true)
                .build();
        return asignaturaRepository.save(asignatura);
    }

    public List<Asignatura> listarTodas() {
        return asignaturaRepository.findAll();
    }

    public Asignatura obtenerPorId(String id) {
        return asignaturaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Asignatura no encontrada con id: " + id));
    }

    public List<Asignatura> listarPorDocente(String docenteId) {
        return asignaturaRepository.findByDocenteId(docenteId);
    }

    public Asignatura actualizar(String id, AsignaturaRequest request) {
        var asignatura = obtenerPorId(id);
        asignatura.setNombre(request.nombre());
        asignatura.setDescripcion(request.descripcion());
        asignatura.setDocenteId(request.docenteId());
        asignatura.setDocenteNombre(request.docenteNombre());
        return asignaturaRepository.save(asignatura);
    }

    public void eliminar(String id) {
        asignaturaRepository.deleteById(id);
    }
}
