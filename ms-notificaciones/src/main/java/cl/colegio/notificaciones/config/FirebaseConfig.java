package cl.colegio.notificaciones.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Configuración de Firebase Admin SDK para acceso a Firestore.
 *
 * <p>El SDK se inicializa usando las credenciales de la cuenta de servicio
 * (serviceAccountKey.json). Se busca primero en la variable de entorno
 * GOOGLE_APPLICATION_CREDENTIALS y luego en el classpath del JAR.
 */
@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            InputStream sa = null;

            String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            if (credPath != null && Files.exists(Path.of(credPath))) {
                sa = new FileInputStream(credPath);
            }

            if (sa == null) {
                sa = getClass().getResourceAsStream("/serviceAccountKey.json");
            }

            if (sa == null) throw new IllegalStateException("serviceAccountKey.json no encontrado");
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(sa))
                    .build();
            FirebaseApp.initializeApp(options);
        }
    }

    @Bean
    public Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}
