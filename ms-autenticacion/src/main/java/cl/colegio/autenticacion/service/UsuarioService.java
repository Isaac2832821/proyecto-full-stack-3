package cl.colegio.autenticacion.service;

import cl.colegio.autenticacion.dto.CambiarRolRequest;
import cl.colegio.autenticacion.dto.UsuarioDTO;
import cl.colegio.autenticacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public List<UsuarioDTO> obtenerMisHijos(String rutApoderado) {
        var apoderado = usuarioRepository.findByRut(rutApoderado)
                .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado"));
        return usuarioRepository.findByApoderado(apoderado.getId())
                .stream()
                .map(UsuarioDTO::from)
                .toList();
    }

    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioDTO::from)
                .toList();
    }

    public UsuarioDTO obtenerPorId(String id) {
        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + id));
        return UsuarioDTO.from(usuario);
    }

    public UsuarioDTO cambiarRol(String id, CambiarRolRequest request) {
        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + id));
        usuario.setRol(request.rol());
        return UsuarioDTO.from(usuarioRepository.save(usuario));
    }

    public void desactivar(String id) {
        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }
}
