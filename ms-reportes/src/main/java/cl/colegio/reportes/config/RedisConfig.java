package cl.colegio.reportes.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

/**
 * Configuración de Redis como sistema de caché para ms-reportes.
 *
 * <h3>Caché definidos y sus TTL (Time To Live)</h3>
 *
 * <table border="1">
 *   <tr><th>Nombre del caché</th><th>TTL</th><th>Qué almacena</th><th>Por qué ese TTL</th></tr>
 *   <tr>
 *     <td>{@code reporte-estudiante}</td>
 *     <td><b>15 minutos</b></td>
 *     <td>Reporte individual de un estudiante (promedio, notas por asignatura)</td>
 *     <td>Los datos de calificaciones cambian cuando el docente registra nuevas notas.
 *         15 minutos equilibra frescura y rendimiento.</td>
 *   </tr>
 *   <tr>
 *     <td>{@code reporte-curso}</td>
 *     <td><b>30 minutos</b></td>
 *     <td>Estadísticas globales de un curso (promedio clase, distribución de notas)</td>
 *     <td>Las estadísticas de curso son más estables. 30 minutos reduce carga en Firestore
 *         para consultas frecuentes de múltiples docentes/apoderados del mismo curso.</td>
 *   </tr>
 *   <tr>
 *     <td>{@code ranking-curso}</td>
 *     <td><b>60 minutos</b></td>
 *     <td>Ranking de estudiantes por promedio dentro de un curso</td>
 *     <td>El ranking es el dato más costoso de calcular y el menos volátil.
 *         1 hora es apropiado para un dato de consulta administrativa.</td>
 *   </tr>
 * </table>
 *
 * <h3>Serialización</h3>
 * Se usa {@link GenericJackson2JsonRedisSerializer} para almacenar los objetos
 * como JSON legible en Redis, facilitando la depuración con redis-cli.
 */
@Configuration
public class RedisConfig {

    /**
     * TTL para reporte individual de estudiante: 15 minutos.
     * Datos individuales cambian con frecuencia moderada.
     */
    private static final Duration TTL_REPORTE_ESTUDIANTE = Duration.ofMinutes(15);

    /**
     * TTL para reporte estadístico de un curso: 30 minutos.
     * Estadísticas de curso son más estables que datos individuales.
     */
    private static final Duration TTL_REPORTE_CURSO = Duration.ofMinutes(30);

    /**
     * TTL para ranking de estudiantes por curso: 60 minutos.
     * Ranking es costoso de calcular y poco volátil en el corto plazo.
     */
    private static final Duration TTL_RANKING_CURSO = Duration.ofMinutes(60);

    /**
     * Configura el CacheManager con TTL específico por cada caché.
     *
     * @param connectionFactory fábrica de conexiones Redis (auto-configurada)
     * @return CacheManager configurado con TTL por nombre de caché
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        var serializer = new GenericJackson2JsonRedisSerializer(objectMapper());

        // Configuración base: serialización JSON para claves y valores
        var defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        // TTL específico por nombre de caché
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
                "reporte-estudiante", defaultConfig.entryTtl(TTL_REPORTE_ESTUDIANTE),
                "reporte-curso",      defaultConfig.entryTtl(TTL_REPORTE_CURSO),
                "ranking-curso",      defaultConfig.entryTtl(TTL_RANKING_CURSO)
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig.entryTtl(TTL_REPORTE_ESTUDIANTE))
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    /**
     * ObjectMapper configurado para serialización polimórfica en Redis.
     *
     * @return ObjectMapper con tipos incluidos en el JSON
     */
    private ObjectMapper objectMapper() {
        var ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType(Object.class)
                .build();
        return new ObjectMapper()
                .activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL,
                        JsonTypeInfo.As.PROPERTY);
    }
}
