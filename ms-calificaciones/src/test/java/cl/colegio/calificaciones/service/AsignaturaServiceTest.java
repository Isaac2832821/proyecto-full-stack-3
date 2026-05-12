package cl.colegio.calificaciones.service;

import cl.colegio.calificaciones.dto.AsignaturaRequest;
import cl.colegio.calificaciones.entity.Asignatura;
import cl.colegio.calificaciones.repository.AsignaturaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsignaturaServiceTest {

    @Mock
    private AsignaturaRepository asignaturaRepository;

    @InjectMocks
    private AsignaturaService asignaturaService;

    @Test
    void crear_DebeRetornarAsignaturaGuardada() {
        // Arrange
        AsignaturaRequest request = new AsignaturaRequest("Matemáticas", "Curso de Álgebra", "docente1", "Juan Perez");
        Asignatura asignaturaEsperada = Asignatura.builder()
                .id("1")
                .nombre("Matemáticas")
                .descripcion("Curso de Álgebra")
                .docenteId("docente1")
                .docenteNombre("Juan Perez")
                .activa(true)
                .build();

        when(asignaturaRepository.save(any(Asignatura.class))).thenReturn(asignaturaEsperada);

        // Act
        Asignatura resultado = asignaturaService.crear(request);

        // Assert
        assertNotNull(resultado);
        assertEquals("Matemáticas", resultado.getNombre());
        assertTrue(resultado.getActiva());
        verify(asignaturaRepository, times(1)).save(any(Asignatura.class));
    }

    @Test
    void obtenerPorId_CuandoExiste_DebeRetornarAsignatura() {
        // Arrange
        Asignatura asignaturaEsperada = Asignatura.builder().id("1").nombre("Historia").build();
        when(asignaturaRepository.findById("1")).thenReturn(Optional.of(asignaturaEsperada));

        // Act
        Asignatura resultado = asignaturaService.obtenerPorId("1");

        // Assert
        assertNotNull(resultado);
        assertEquals("Historia", resultado.getNombre());
        verify(asignaturaRepository, times(1)).findById("1");
    }
}
