package cl.colegio.calificaciones.repository;

import cl.colegio.calificaciones.entity.Asignatura;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Slf4j
@Repository
@RequiredArgsConstructor
public class AsignaturaRepository {

    private final Firestore firestore;
    private static final String COLLECTION = "asignaturas";

    public Asignatura save(Asignatura asignatura) {
        try {
            if (asignatura.getId() == null || asignatura.getId().isBlank()) {
                DocumentReference docRef = firestore.collection(COLLECTION).document();
                asignatura.setId(docRef.getId());
                docRef.set(toMap(asignatura)).get();
            } else {
                firestore.collection(COLLECTION).document(asignatura.getId())
                        .set(toMap(asignatura)).get();
            }
            return asignatura;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error guardando asignatura", e);
        }
    }

    public Optional<Asignatura> findById(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION).document(id).get().get();
            return doc.exists() ? Optional.of(fromDoc(doc)) : Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error buscando asignatura", e);
        }
    }

    public List<Asignatura> findAll() {
        try {
            return firestore.collection(COLLECTION).get().get().getDocuments()
                    .stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error listando asignaturas", e);
        }
    }

    public List<Asignatura> findByDocenteId(String docenteId) {
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
            throw new RuntimeException("Error eliminando asignatura", e);
        }
    }

    private Map<String, Object> toMap(Asignatura a) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", a.getId());
        map.put("nombre", a.getNombre());
        map.put("descripcion", a.getDescripcion());
        map.put("docenteId", a.getDocenteId());
        map.put("docenteNombre", a.getDocenteNombre());
        map.put("activa", a.isActiva());
        return map;
    }

    private Asignatura fromDoc(DocumentSnapshot doc) {
        return Asignatura.builder()
                .id(doc.getId())
                .nombre(doc.getString("nombre"))
                .descripcion(doc.getString("descripcion"))
                .docenteId(doc.getString("docenteId"))
                .docenteNombre(doc.getString("docenteNombre"))
                .activa(Boolean.TRUE.equals(doc.getBoolean("activa")))
                .build();
    }
}
