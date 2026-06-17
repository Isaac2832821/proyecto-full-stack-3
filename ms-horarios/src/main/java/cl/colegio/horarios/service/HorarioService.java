package cl.colegio.horarios.service;

import cl.colegio.horarios.dto.HorarioRequest;
import cl.colegio.horarios.entity.Horario;
import cl.colegio.horarios.repository.HorarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Servicio de negocio para gestión de horarios escolares.
 *
 * <p>Encapsula la lógica de creación, consulta, actualización y eliminación
 * de bloques horarios. Permite al ADMIN gestionar el calendario académico
 * y a docentes/estudiantes/apoderados consultar sus horarios.
 *
 * <p>Patrón aplicado: Service Layer — desacopla la lógica de negocio del
 * controlador REST y del repositorio de Firestore.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HorarioService {

    private final HorarioRepository horarioRepository;

    /**
     * Crea un nuevo bloque de horario en el sistema.
     *
     * @param request DTO con los datos del horario a crear
     * @return el horario creado con su ID asignado
     */
    public Horario crear(HorarioRequest request) {
        var horario = Horario.builder()
                .asignaturaId(request.asignaturaId())
                .asignaturaNombre(request.asignaturaNombre())
                .docenteId(request.docenteId())
                .docenteNombre(request.docenteNombre())
                .diaSemana(request.diaSemana())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .sala(request.sala())
                .curso(request.curso())
                .activo(true)
                .build();

        var creado = horarioRepository.save(horario);
        log.info("Horario creado: {} {} {} ({})", request.diaSemana(),
                request.horaInicio(), request.asignaturaNombre(), request.curso());
        return creado;
    }

    /**
     * Obtiene un horario por su ID.
     *
     * @param id ID del horario en Firestore
     * @return el horario encontrado
     * @throws NoSuchElementException si no existe horario con ese ID
     */
    public Horario obtenerPorId(String id) {
        return horarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Horario no encontrado con id: " + id));
    }

    /**
     * Retorna todos los horarios del sistema.
     *
     * @return lista completa de horarios
     */
    public List<Horario> listarTodos() {
        return horarioRepository.findAll();
    }

    /**
     * Retorna los horarios de una asignatura específica.
     *
     * @param asignaturaId ID de la asignatura
     * @return lista de horarios de la asignatura
     */
    public List<Horario> listarPorAsignatura(String asignaturaId) {
        return horarioRepository.findByAsignaturaId(asignaturaId);
    }

    /**
     * Retorna los horarios de un docente específico.
     *
     * @param docenteId RUT del docente
     * @return lista de horarios del docente
     */
    public List<Horario> listarPorDocente(String docenteId) {
        return horarioRepository.findByDocenteId(docenteId);
    }

    /**
     * Retorna los horarios de un curso específico (ej: "1°A").
     *
     * @param curso identificador del curso
     * @return lista de horarios del curso
     */
    public List<Horario> listarPorCurso(String curso) {
        return horarioRepository.findByCurso(curso);
    }

    /**
     * Actualiza un horario existente.
     *
     * @param id      ID del horario a actualizar
     * @param request DTO con los nuevos datos
     * @return el horario actualizado
     * @throws NoSuchElementException si no existe horario con ese ID
     */
    public Horario actualizar(String id, HorarioRequest request) {
        var existente = obtenerPorId(id);
        existente.setAsignaturaId(request.asignaturaId());
        existente.setAsignaturaNombre(request.asignaturaNombre());
        existente.setDocenteId(request.docenteId());
        existente.setDocenteNombre(request.docenteNombre());
        existente.setDiaSemana(request.diaSemana());
        existente.setHoraInicio(request.horaInicio());
        existente.setHoraFin(request.horaFin());
        existente.setSala(request.sala());
        existente.setCurso(request.curso());
        return horarioRepository.save(existente);
    }

    /**
     * Elimina un horario del sistema.
     *
     * @param id ID del horario a eliminar
     * @throws NoSuchElementException si no existe horario con ese ID
     */
    public void eliminar(String id) {
        obtenerPorId(id); // Valida que existe antes de eliminar
        horarioRepository.deleteById(id);
        log.info("Horario {} eliminado", id);
    }
}
