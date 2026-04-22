package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.CambiarRolRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.entity.Usuario;
import cl.colegio.autenticacion.exception.UsuarioNotFoundException;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Servicio de gestión de usuarios — encapsula la lógica de negocio
 * para operaciones CRUD sobre usuarios.
 *
 * Patrón aplicado: Service Layer
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    // ── Apoderado: ver estudiantes a cargo ──────────────────────────────────

    public List<UsuarioDTO> obtenerMisHijos(String rutApoderado) {
        var apoderado = usuarioRepository.findByRut(rutApoderado)
                .orElseThrow(() -> new UsuarioNotFoundException("RUT", rutApoderado));
        return usuarioRepository.findByApoderado(apoderado.getId())
                .stream()
                .map(UsuarioDTO::from)
                .toList();
    }

    // ── Admin: listar todos ─────────────────────────────────────────────────

    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioDTO::from)
                .toList();
    }

    // ── Admin: obtener por ID ───────────────────────────────────────────────

    public UsuarioDTO obtenerPorId(String id) {
        return UsuarioDTO.from(buscarUsuarioPorId(id));
    }

    // ── Admin: cambiar rol ──────────────────────────────────────────────────

    public UsuarioDTO cambiarRol(String id, CambiarRolRequest request) {
        var usuario = buscarUsuarioPorId(id);
        usuario.setRol(request.rol());
        return UsuarioDTO.from(usuarioRepository.save(usuario));
    }

    // ── Admin: desactivar usuario ───────────────────────────────────────────

    public void desactivar(String id) {
        var usuario = buscarUsuarioPorId(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    // ── Método privado reutilizable — elimina duplicación ───────────────────

    private Usuario buscarUsuarioPorId(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException("id", id));
    }
}
