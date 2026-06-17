package cl.colegio.horarios.repository;

import cl.colegio.horarios.entity.Horario;
import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * Repositorio de acceso a Firestore para la colección "horarios".
 *
 * <p>Implementa el patrón Repository para encapsular las operaciones CRUD
 * contra Firestore, manteniendo la capa de servicio desacoplada de los
 * detalles de infraestructura de la base de datos.
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class HorarioRepository {

    private static final String COLECCION = "horarios";

    private final Firestore firestore;

    /**
     * Persiste o actualiza un horario en Firestore.
     *
     * @param horario el horario a guardar
     * @return el horario con ID asignado por Firestore
     */
    public Horario save(Horario horario) {
        try {
            if (horario.getId() == null) {
                var docRef = firestore.collection(COLECCION).document();
                horario.setId(docRef.getId());
                docRef.set(horario).get();
            } else {
                firestore.collection(COLECCION).document(horario.getId()).set(horario).get();
            }
            log.debug("Horario guardado con id: {}", horario.getId());
            return horario;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al guardar horario en Firestore", e);
        }
    }

    /**
     * Busca un horario por su ID.
     *
     * @param id el ID del documento en Firestore
     * @return Optional con el horario, o vacío si no existe
     */
    public Optional<Horario> findById(String id) {
        try {
            var doc = firestore.collection(COLECCION).document(id).get().get();
            if (!doc.exists()) return Optional.empty();
            var h = doc.toObject(Horario.class);
            if (h != null) h.setId(doc.getId());
            return Optional.ofNullable(h);
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar horario", e);
        }
    }

    /**
     * Retorna todos los horarios activos del sistema.
     *
     * @return lista de todos los horarios
     */
    public List<Horario> findAll() {
        try {
            return firestore.collection(COLECCION).get().get().getDocuments()
                    .stream().map(d -> {
                        var h = d.toObject(Horario.class);
                        if (h != null) h.setId(d.getId());
                        return h;
                    }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al listar horarios", e);
        }
    }

    /**
     * Retorna los horarios de una asignatura específica.
     *
     * @param asignaturaId ID de la asignatura
     * @return lista de horarios de esa asignatura
     */
    public List<Horario> findByAsignaturaId(String asignaturaId) {
        try {
            return firestore.collection(COLECCION)
                    .whereEqualTo("asignaturaId", asignaturaId).get().get()
                    .getDocuments().stream().map(d -> {
                        var h = d.toObject(Horario.class);
                        if (h != null) h.setId(d.getId());
                        return h;
                    }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar horarios por asignatura", e);
        }
    }

    /**
     * Retorna los horarios de un docente específico.
     *
     * @param docenteId RUT del docente
     * @return lista de horarios del docente
     */
    public List<Horario> findByDocenteId(String docenteId) {
        try {
            return firestore.collection(COLECCION)
                    .whereEqualTo("docenteId", docenteId).get().get()
                    .getDocuments().stream().map(d -> {
                        var h = d.toObject(Horario.class);
                        if (h != null) h.setId(d.getId());
                        return h;
                    }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar horarios por docente", e);
        }
    }

    /**
     * Retorna los horarios de un curso específico.
     *
     * @param curso el identificador del curso (ej: "1°A")
     * @return lista de horarios del curso
     */
    public List<Horario> findByCurso(String curso) {
        try {
            return firestore.collection(COLECCION)
                    .whereEqualTo("curso", curso).get().get()
                    .getDocuments().stream().map(d -> {
                        var h = d.toObject(Horario.class);
                        if (h != null) h.setId(d.getId());
                        return h;
                    }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar horarios por curso", e);
        }
    }

    /**
     * Elimina un horario por su ID.
     *
     * @param id el ID del documento a eliminar
     */
    public void deleteById(String id) {
        try {
            firestore.collection(COLECCION).document(id).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al eliminar horario", e);
        }
    }
}
