package cl.colegio.autenticacion.repository;

import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;
import com.google.cloud.firestore.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Repository que almacena usuarios en Firestore (colección "usuarios").
 * Reemplaza el JpaRepository anterior.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class UsuarioRepository {

    private static final String COLLECTION = "usuarios";

    private final Firestore firestore;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public Usuario save(Usuario usuario) {
        try {
            if (usuario.getId() == null || usuario.getId().isBlank()) {
                DocumentReference docRef = getCollection().document();
                usuario.setId(docRef.getId());
            }
            getCollection().document(usuario.getId()).set(toMap(usuario)).get();
            log.debug("Usuario guardado en Firestore: {}", usuario.getRut());
            return usuario;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al guardar usuario en Firestore", e);
        }
    }

    public Optional<Usuario> findById(String id) {
        try {
            DocumentSnapshot doc = getCollection().document(id).get().get();
            return doc.exists() ? Optional.of(fromDoc(doc)) : Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar usuario por ID", e);
        }
    }

    public Optional<Usuario> findByRut(String rut) {
        return findByField("rut", rut);
    }

    public Optional<Usuario> findByEmail(String email) {
        return findByField("email", email);
    }

    public boolean existsByRut(String rut) {
        return findByRut(rut).isPresent();
    }

    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    public List<Usuario> findAll() {
        try {
            List<QueryDocumentSnapshot> docs = getCollection().get().get().getDocuments();
            return docs.stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al listar usuarios", e);
        }
    }

    public List<Usuario> findByApoderado(String idApoderado) {
        try {
            List<QueryDocumentSnapshot> docs = getCollection()
                    .whereEqualTo("idApoderado", idApoderado)
                    .get().get().getDocuments();
            return docs.stream().map(this::fromDoc).toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar hijos del apoderado", e);
        }
    }

    // ── Internos ─────────────────────────────────────────────────────────────

    private CollectionReference getCollection() {
        return firestore.collection(COLLECTION);
    }

    private Optional<Usuario> findByField(String field, String value) {
        try {
            List<QueryDocumentSnapshot> docs = getCollection()
                    .whereEqualTo(field, value)
                    .get().get().getDocuments();
            return docs.isEmpty() ? Optional.empty() : Optional.of(fromDoc(docs.get(0)));
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error al buscar usuario por " + field, e);
        }
    }

    /**
     * Convierte un Usuario a Map para almacenar en Firestore.
     */
    private Map<String, Object> toMap(Usuario u) {
        Map<String, Object> map = new HashMap<>();
        map.put("rut", u.getRut());
        map.put("nombre", u.getNombre());
        map.put("apellido", u.getApellido());
        map.put("email", u.getEmail());
        map.put("password", u.getPassword());
        map.put("rol", u.getRol().name());
        map.put("idApoderado", u.getIdApoderado());
        map.put("activo", u.isActivo());
        return map;
    }

    /**
     * Convierte un DocumentSnapshot de Firestore a Usuario.
     */
    private Usuario fromDoc(DocumentSnapshot doc) {
        return Usuario.builder()
                .id(doc.getId())
                .rut(doc.getString("rut"))
                .nombre(doc.getString("nombre"))
                .apellido(doc.getString("apellido"))
                .email(doc.getString("email"))
                .password(doc.getString("password"))
                .rol(Rol.valueOf(doc.getString("rol")))
                .idApoderado(doc.getString("idApoderado"))
                .activo(Boolean.TRUE.equals(doc.getBoolean("activo")))
                .build();
    }
}
