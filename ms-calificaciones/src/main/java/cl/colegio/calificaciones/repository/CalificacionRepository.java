package cl.colegio.calificaciones.repository;

import cl.colegio.calificaciones.entity.Calificacion;
import com.google.cloud.firestore.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Slf4j
@Repository
@RequiredArgsConstructor
public class CalificacionRepository {

    private final Firestore firestore;
    private static final String COLLECTION = "calificaciones";

    public Calificacion save(Calificacion c) {
        try {
            if (c.getId() == null || c.getId().isBlank()) {
                DocumentReference docRef = firestore.collection(COLLECTION).document();
                c.setId(docRef.getId());
                docRef.set(toMap(c)).get();
            } else {
                firestore.collection(COLLECTION).document(c.getId())
                        .set(toMap(c)).get();
            }
            return c;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error guardando calificación", e);
        }
    }

    public Optional<Calificacion> findById(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION).document(id).get().get();
            return doc.exists() ? Optional.of(fromDoc(doc)) : Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error buscando calificación", e);
        }
    }

    public List<Calificacion> findAll() {
        try {
            return firestore.collection(COLLECTION).get().get().getDocuments()
                    .stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error listando calificaciones", e);
        }
    }

    public List<Calificacion> findByEstudianteId(String estudianteId) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("estudianteId", estudianteId).get().get()
                    .getDocuments().stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error buscando por estudiante", e);
        }
    }

    public List<Calificacion> findByAsignaturaId(String asignaturaId) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("asignaturaId", asignaturaId).get().get()
                    .getDocuments().stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error buscando por asignatura", e);
        }
    }

    public List<Calificacion> findByDocenteId(String docenteId) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("docenteId", docenteId).get().get()
                    .getDocuments().stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error buscando por docente", e);
        }
    }

    public void deleteById(String id) {
        try {
            firestore.collection(COLLECTION).document(id).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error eliminando calificación", e);
        }
    }

    private Map<String, Object> toMap(Calificacion c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("estudianteId", c.getEstudianteId());
        map.put("estudianteNombre", c.getEstudianteNombre());
        map.put("asignaturaId", c.getAsignaturaId());
        map.put("asignaturaNombre", c.getAsignaturaNombre());
        map.put("nota", c.getNota());
        map.put("tipo", c.getTipo() != null ? c.getTipo().name() : null);
        map.put("fecha", c.getFecha());
        map.put("observacion", c.getObservacion());
        map.put("docenteId", c.getDocenteId());
        return map;
    }

    private Calificacion fromDoc(DocumentSnapshot doc) {
        String tipoStr = doc.getString("tipo");
        return Calificacion.builder()
                .id(doc.getId())
                .estudianteId(doc.getString("estudianteId"))
                .estudianteNombre(doc.getString("estudianteNombre"))
                .asignaturaId(doc.getString("asignaturaId"))
                .asignaturaNombre(doc.getString("asignaturaNombre"))
                .nota(doc.getDouble("nota") != null ? doc.getDouble("nota") : 0)
                .tipo(tipoStr != null ? Calificacion.TipoEvaluacion.valueOf(tipoStr) : null)
                .fecha(doc.getString("fecha"))
                .observacion(doc.getString("observacion"))
                .docenteId(doc.getString("docenteId"))
                .build();
    }
}
