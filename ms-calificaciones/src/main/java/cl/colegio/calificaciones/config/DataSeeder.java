package cl.colegio.calificaciones.config;

import cl.colegio.calificaciones.entity.Asignatura;
import cl.colegio.calificaciones.repository.AsignaturaRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Puebla Firestore con las asignaturas del currículum chileno (MINEDUC)
 * al iniciar el microservicio. Solo ejecuta si la colección está vacía.
 * Cada asignatura tiene asignado un docente desde el seed de autenticación.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder {

    private final AsignaturaRepository asignaturaRepository;

    @PostConstruct
    public void seedAsignaturas() {
        try {
            List<Asignatura> existentes = asignaturaRepository.findAll();
            if (!existentes.isEmpty()) {
                log.info("DataSeeder: colección 'asignaturas' ya contiene {} documentos. Omitiendo seed.",
                        existentes.size());
                return;
            }

            log.info("DataSeeder: poblando asignaturas del currículum chileno (MINEDUC)...");

            // RUTs y nombres de los docentes seeded en ms-autenticacion
            // format: { rut, nombreCompleto }
            final String[] LENGUAJE  = {"22222222-2", "María González"};
            final String[] MATEMATICA= {"22222222-3", "Jorge Muñoz"};
            final String[] CIENCIAS  = {"22222222-4", "Claudia Vega"};
            final String[] HISTORIA  = {"22222222-5", "Andrés Fuentes"};
            final String[] INGLES    = {"22222222-6", "Patricia Soto"};
            final String[] EDUFISICA = {"22222222-7", "Felipe Morales"};
            final String[] ARTES     = {"22222222-8", "Valentina Castro"};
            final String[] TECNOLOGIA= {"22222222-9", "Rodrigo Navarro"};
            final String[] CIUDADANIA= {"22222222-0", "Isabel Ramírez"};
            final String[] ORIENTAC  = {"22222222-K", "Luis Herrera"};

            List<AsignaturaData> asignaturas = List.of(
                // ── Lenguaje ──────────────────────────────────────────────
                new AsignaturaData("Lenguaje y Comunicación",
                        "Comprensión lectora, escritura, oralidad y literatura",
                        LENGUAJE),
                new AsignaturaData("Literatura",
                        "Análisis de textos literarios, géneros y movimientos literarios",
                        LENGUAJE),

                // ── Matemática ────────────────────────────────────────────
                new AsignaturaData("Matemática",
                        "Álgebra, geometría, estadística y probabilidades",
                        MATEMATICA),

                // ── Ciencias Naturales ────────────────────────────────────
                new AsignaturaData("Ciencias Naturales",
                        "Biología, física y química integradas (Ed. Básica)",
                        CIENCIAS),
                new AsignaturaData("Biología",
                        "Estudio de los seres vivos, genética y ecología",
                        CIENCIAS),
                new AsignaturaData("Física",
                        "Mecánica, termodinámica, electricidad y ondas",
                        CIENCIAS),
                new AsignaturaData("Química",
                        "Estructura atómica, reacciones y química orgánica",
                        CIENCIAS),

                // ── Ciencias Sociales ──────────────────────────────────────
                new AsignaturaData("Historia, Geografía y Ciencias Sociales",
                        "Historia universal y de Chile, geografía y formación ciudadana",
                        HISTORIA),
                new AsignaturaData("Geografía",
                        "Geografía física y humana, cartografía y medioambiente",
                        HISTORIA),
                new AsignaturaData("Economía y Sociedad",
                        "Conceptos económicos, sistema financiero y sociedad",
                        HISTORIA),

                // ── Inglés ────────────────────────────────────────────────
                new AsignaturaData("Inglés",
                        "Comprensión y producción oral y escrita en idioma inglés",
                        INGLES),

                // ── Educación Física ──────────────────────────────────────
                new AsignaturaData("Educación Física y Salud",
                        "Actividad física, deportes y hábitos saludables",
                        EDUFISICA),

                // ── Artes ──────────────────────────────────────────────────
                new AsignaturaData("Artes Visuales",
                        "Dibujo, pintura, escultura y apreciación artística",
                        ARTES),
                new AsignaturaData("Música",
                        "Teoría musical, canto, instrumentos y apreciación musical",
                        ARTES),

                // ── Tecnología ────────────────────────────────────────────
                new AsignaturaData("Tecnología",
                        "Diseño, fabricación digital y pensamiento tecnológico",
                        TECNOLOGIA),
                new AsignaturaData("Informática",
                        "Programación, manejo de herramientas digitales y ciberseguridad",
                        TECNOLOGIA),

                // ── Formación Ciudadana ───────────────────────────────────
                new AsignaturaData("Educación Ciudadana",
                        "Derechos, deberes, democracia y participación cívica",
                        CIUDADANIA),
                new AsignaturaData("Filosofía",
                        "Pensamiento crítico, ética, lógica y filosofía política",
                        CIUDADANIA),

                // ── Orientación / Religión ────────────────────────────────
                new AsignaturaData("Orientación",
                        "Desarrollo personal, habilidades socioemocionales y proyecto de vida",
                        ORIENTAC),
                new AsignaturaData("Religión",
                        "Educación religiosa y valores (optativa)",
                        ORIENTAC)
            );

            int creadas = 0;
            for (AsignaturaData data : asignaturas) {
                Asignatura a = Asignatura.builder()
                        .nombre(data.nombre())
                        .descripcion(data.descripcion())
                        .docenteId(data.docente()[0])
                        .docenteNombre(data.docente()[1])
                        .activa(true)
                        .build();
                asignaturaRepository.save(a);
                creadas++;
            }
            log.info("DataSeeder: {} asignaturas creadas exitosamente.", creadas);

        } catch (Exception e) {
            log.error("DataSeeder: error al poblar asignaturas — {}", e.getMessage());
        }
    }

    private record AsignaturaData(String nombre, String descripcion, String[] docente) {}
}
