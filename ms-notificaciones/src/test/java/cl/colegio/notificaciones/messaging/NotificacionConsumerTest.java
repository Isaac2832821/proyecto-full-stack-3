package cl.colegio.notificaciones.messaging;

import cl.colegio.notificaciones.dto.CalificacionEventoDTO;
import cl.colegio.notificaciones.service.NotificacionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para el consumidor RabbitMQ de notificaciones.
 *
 * <p>Verifica que al recibir un evento de calificación, se crea la notificación
 * con el contenido correcto (tipo, título, mensaje) para el estudiante destinatario.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificacionConsumer — Tests unitarios")
class NotificacionConsumerTest {

    @Mock private NotificacionService notificacionService;

    @InjectMocks private NotificacionConsumer notificacionConsumer;

    @Test
    @DisplayName("Al recibir evento de calificación, crea notificación de tipo CALIFICACION")
    void handleCalificacionRegistrada_creaNotificacion() {
        var evento = new CalificacionEventoDTO(
                "12345678-9",
                "Juan Pérez",
                "Matemáticas",
                6.5,
                "PRUEBA",
                "Prof. García",
                "cal-001"
        );

        notificacionConsumer.handleCalificacionRegistrada(evento);

        verify(notificacionService).crear(
                eq("12345678-9"),
                eq("CALIFICACION"),
                contains("Matemáticas"),
                contains("Prof. García"),
                eq("cal-001")
        );
    }

    @Test
    @DisplayName("El título de la notificación incluye el nombre de la asignatura")
    void handleCalificacionRegistrada_tituloContienAsignatura() {
        var evento = new CalificacionEventoDTO(
                "11111111-1", "María López", "Ciencias", 5.5, "TAREA", "Prof. Soto", "cal-002"
        );

        notificacionConsumer.handleCalificacionRegistrada(evento);

        verify(notificacionService).crear(
                eq("11111111-1"),
                eq("CALIFICACION"),
                argThat(titulo -> titulo.contains("Ciencias")),
                anyString(),
                eq("cal-002")
        );
    }

    @Test
    @DisplayName("El mensaje incluye la nota y el tipo de evaluación")
    void handleCalificacionRegistrada_mensajeConNota() {
        var evento = new CalificacionEventoDTO(
                "22222222-2", "Pedro", "Historia", 7.0, "EXAMEN", "Prof. Ramírez", "cal-003"
        );

        notificacionConsumer.handleCalificacionRegistrada(evento);

        verify(notificacionService).crear(
                eq("22222222-2"),
                eq("CALIFICACION"),
                anyString(),
                argThat(mensaje -> mensaje.contains("7") && mensaje.contains("Historia")),
                eq("cal-003")
        );
    }
}
