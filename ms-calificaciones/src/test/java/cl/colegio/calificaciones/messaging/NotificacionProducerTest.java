package cl.colegio.calificaciones.messaging;

import cl.colegio.calificaciones.entity.Calificacion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para NotificacionProducer.
 *
 * <p>Verifica que:
 * - El mensaje se envía al exchange correcto con el routing key correcto
 * - Un fallo en RabbitMQ NO lanza excepción al caller
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificacionProducer — Tests unitarios")
class NotificacionProducerTest {

    @Mock private RabbitTemplate rabbitTemplate;

    @InjectMocks private NotificacionProducer notificacionProducer;

    @Test
    @DisplayName("Publicar calificación envía al exchange correcto con routing key calificacion.nueva")
    void publicarNuevaCalificacion_exitoso() {
        var calificacion = Calificacion.builder()
                .id("cal-001")
                .estudianteId("12345678-9")
                .estudianteNombre("Juan")
                .asignaturaNombre("Matemáticas")
                .nota(6.5)
                .tipo(Calificacion.TipoEvaluacion.PRUEBA)
                .build();

        doNothing().when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        notificacionProducer.publicarNuevaCalificacion(calificacion, "Prof. García");

        verify(rabbitTemplate).convertAndSend(
                eq("colegio.exchange"),
                eq("calificacion.nueva"),
                any(Object.class)
        );
    }

    @Test
    @DisplayName("Si RabbitMQ falla, NO lanza excepción al caller")
    void publicarNuevaCalificacion_fallaRabbitMQNoLanzaExcepcion() {
        var calificacion = Calificacion.builder()
                .id("cal-002")
                .estudianteId("11111111-1")
                .nota(5.0)
                .build();

        doThrow(new RuntimeException("RabbitMQ connection refused"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        assertThatCode(() -> notificacionProducer.publicarNuevaCalificacion(calificacion, "Prof. López"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Calificación con campos null no falla al publicar")
    void publicarCalificacionConCamposNull() {
        var calificacion = Calificacion.builder()
                .id("cal-003")
                .estudianteId("33333333-3")
                .nota(4.0)
                // estudianteNombre, asignaturaNombre, tipo = null
                .build();

        doNothing().when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        assertThatCode(() -> notificacionProducer.publicarNuevaCalificacion(calificacion, null))
                .doesNotThrowAnyException();
    }
}
