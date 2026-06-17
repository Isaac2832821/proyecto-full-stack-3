package cl.colegio.notificaciones.repository;

import cl.colegio.notificaciones.entity.Notificacion;
import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.StreamSupport;

/**
 * Repositorio de acceso a Firestore para la colección "notificaciones".
 *
 * <p>Implementa el patrón Repository para encapsular todas las operaciones
 * de lectura/escritura contra Firestore, manteniendo la capa de servicio
 * libre de detalles de infraestructura.
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class NotificacionRepository {

    private static final String COLECCION = "notificaciones";

    private final Firestore firestore;

    /**
     * Persiste una nueva notificación en Firestore.
     *
     * @param notificacion la notificación a guardar
     * @return la notificación con el ID asignado por Firestore
     */
    public Notificacion save(Notificacion notificacion) {
        try {
            var docRef = firestore.collection(COLECCION).document();
            notificacion.setId(docRef.getId());
            docRef.set(notificacion).get();
            log.debug("Notificación guardada con id: {}", notificacion.getId());
            return notificacion;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al guardar notificación en Firestore", e);
        }
    }

    /**
     * Busca una notificación por su ID.
     *
     * @param id el ID del documento en Firestore
     * @return Optional con la notificación encontrada, o vacío si no existe
     */
    public Optional<Notificacion> findById(String id) {
        try {
            var doc = firestore.collection(COLECCION).document(id).get().get();
            if (!doc.exists()) return Optional.empty();
            var n = doc.toObject(Notificacion.class);
            if (n != null) n.setId(doc.getId());
            return Optional.ofNullable(n);
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar notificación", e);
        }
    }

    /**
     * Retorna todas las notificaciones de un destinatario específico.
     *
     * @param destinatarioId RUT del usuario destinatario
     * @return lista de notificaciones del destinatario
     */
    public List<Notificacion> findByDestinatarioId(String destinatarioId) {
        try {
            var docs = firestore.collection(COLECCION)
                    .whereEqualTo("destinatarioId", destinatarioId)
                    .get().get().getDocuments();
            return docs.stream().map(d -> {
                var n = d.toObject(Notificacion.class);
                if (n != null) n.setId(d.getId());
                return n;
            }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al listar notificaciones", e);
        }
    }

    /**
     * Retorna todas las notificaciones del sistema.
     *
     * @return lista completa de notificaciones
     */
    public List<Notificacion> findAll() {
        try {
            var docs = firestore.collection(COLECCION).get().get().getDocuments();
            return docs.stream().map(d -> {
                var n = d.toObject(Notificacion.class);
                if (n != null) n.setId(d.getId());
                return n;
            }).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al listar todas las notificaciones", e);
        }
    }

    /**
     * Actualiza el estado de lectura de una notificación.
     *
     * @param id     ID de la notificación
     * @param leida  nuevo estado de lectura
     */
    public void updateLeida(String id, boolean leida) {
        try {
            firestore.collection(COLECCION).document(id)
                    .update("leida", leida).get();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al actualizar notificación", e);
        }
    }

    /**
     * Elimina una notificación por su ID.
     *
     * @param id el ID del documento a eliminar
     */
    public void deleteById(String id) {
        try {
            firestore.collection(COLECCION).document(id).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al eliminar notificación", e);
        }
    }
}
