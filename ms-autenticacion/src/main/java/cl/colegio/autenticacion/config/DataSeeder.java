package cl.colegio.autenticacion.config;

import cl.colegio.autenticacion.entity.Rol;
import cl.colegio.autenticacion.entity.Usuario;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Carga datos semilla en Firestore al arrancar la aplicación,
 * solo si la colección de usuarios está vacía.
 * Contraseña por defecto: Admin1234!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!usuarioRepository.findAll().isEmpty()) {
            log.info("Firestore ya contiene usuarios — se omite la carga de datos semilla.");
            return;
        }

        log.info("Cargando datos semilla en Firestore...");
        String encoded = passwordEncoder.encode("Admin1234!");

        usuarioRepository.save(Usuario.builder()
                .rut("11111111-1").nombre("Administrador").apellido("Sistema")
                .email("admin@colegio.cl").password(encoded)
                .rol(Rol.ADMIN).activo(true).build());

        usuarioRepository.save(Usuario.builder()
                .rut("22222222-2").nombre("María").apellido("González")
                .email("mgonzalez@colegio.cl").password(encoded)
                .rol(Rol.DOCENTE).activo(true).build());

        usuarioRepository.save(Usuario.builder()
                .rut("33333333-3").nombre("Carlos").apellido("Rodríguez")
                .email("crodriguez@gmail.com").password(encoded)
                .rol(Rol.APODERADO).activo(true).build());

        usuarioRepository.save(Usuario.builder()
                .rut("44444444-4").nombre("Sofía").apellido("Rodríguez")
                .email("sofia.rodriguez@alumno.colegio.cl").password(encoded)
                .rol(Rol.ESTUDIANTE).activo(true).build());

        log.info("Datos semilla cargados exitosamente en Firestore.");
    }
}
