// ── Mensajeria Module ─────────────────────────────────────────────────────
import { enviarMensaje, escucharMensajesRecibidos, escucharMensajesEnviados, marcarLeido } from './firebase.js';

export function setupMensajes(stateRef, apiRef, showToastRef, navigateToRef) {
  const state = stateRef;
  const api = apiRef;
  const showToast = showToastRef;
  const navigateTo = navigateToRef;

  function timeAgo(date) {
    const s = (Date.now() - date.getTime()) / 1000;
    if (s < 60) return 'Ahora';
    if (s < 3600) return 'Hace ' + Math.floor(s/60) + 'm';
    if (s < 86400) return 'Hace ' + Math.floor(s/3600) + 'h';
    if (s < 604800) return 'Hace ' + Math.floor(s/86400) + 'd';
    return date.toLocaleDateString('es-CL');
  }

  function renderMensajes(container) {
    if (state._unsubMensajes) { state._unsubMensajes(); state._unsubMensajes = null; }
    container.innerHTML = '<div style="max-width:780px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem">'
      + '<div><h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem">Bandeja de entrada</h2>'
      + '<p id="msg-count" style="color:var(--text-muted);font-size:0.8125rem;font-family:var(--font-mono)">Cargando...</p></div>'
      + '<button class="btn btn-primary" id="btn-nuevo-msg" style="font-size:0.8125rem">Nuevo mensaje</button>'
      + '</div>'
      + '<div style="display:flex;gap:0.5rem;margin-bottom:1rem">'
      + '<button class="btn btn-secondary msg-tab active-tab" data-tab="recibidos" style="font-size:0.75rem;padding:0.4rem 1rem">Recibidos</button>'
      + '<button class="btn btn-secondary msg-tab" data-tab="enviados" style="font-size:0.75rem;padding:0.4rem 1rem">Enviados</button>'
      + '</div>'
      + '<div id="msg-list" style="display:flex;flex-direction:column;gap:0.625rem"><div class="loading-container"><span class="spinner"></span></div></div>'
      + '</div>';

    document.getElementById('btn-nuevo-msg').addEventListener('click', () => navigateTo('nuevo-mensaje'));
    let currentTab = 'recibidos';
    const rut = state.user.rut;

    function renderList(mensajes) {
      const list = document.getElementById('msg-list');
      const countEl = document.getElementById('msg-count');
      if (!list) return;
      const noLeidos = mensajes.filter(m => !m.leido).length;
      if (countEl) {
        countEl.textContent = currentTab === 'recibidos'
          ? noLeidos + ' sin leer - ' + mensajes.length + ' total'
          : mensajes.length + ' enviados';
      }
      if (mensajes.length === 0) {
        list.innerHTML = '<div style="padding:3rem;text-align:center;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius)">'
          + '<div style="font-size:2rem;margin-bottom:0.75rem;opacity:0.3">&#128237;</div>'
          + '<div style="font-size:0.8125rem;color:var(--text-dim);font-family:var(--font-mono)">No hay mensajes</div></div>';
        return;
      }
      list.innerHTML = mensajes.map(m => {
        const isR = currentTab === 'recibidos';
        const nombre = isR ? m.deNombre : m.paraNombre;
        const ini = nombre ? nombre.split(' ').map(w => w[0]).join('').substring(0, 2) : '??';
        const fecha = m.fecha && m.fecha.toDate ? m.fecha.toDate() : new Date();
        const hace = timeAgo(fecha);
        const unread = isR && !m.leido;
        return '<div class="msg-row" data-id="' + m.id + '" style="background:var(--bg-card);border:1px solid '
          + (unread ? 'rgba(124,58,237,0.3)' : 'var(--border)')
          + ';border-radius:var(--radius-sm);padding:1.25rem 1.5rem;cursor:pointer;transition:var(--transition);display:flex;gap:1rem;align-items:flex-start;'
          + (unread ? 'border-left:3px solid var(--accent)' : '') + '">'
          + '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--accent-light);flex-shrink:0">' + ini + '</div>'
          + '<div style="flex:1;min-width:0">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem">'
          + '<span style="font-weight:' + (unread ? '700' : '500') + ';font-size:0.875rem;color:var(--text)">' + (isR ? 'De: ' : 'Para: ') + nombre + '</span>'
          + '<span style="font-size:0.6875rem;color:var(--text-dim);font-family:var(--font-mono)">' + hace + '</span></div>'
          + '<div style="font-weight:' + (unread ? '600' : '400') + ';font-size:0.8125rem;color:' + (unread ? 'var(--text)' : 'var(--text-muted)') + ';margin-bottom:0.25rem">' + m.asunto + '</div>'
          + '<div style="font-size:0.75rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + m.cuerpo + '</div>'
          + '</div>'
          + (unread ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:4px"></div>' : '')
          + '</div>';
      }).join('');
      list.querySelectorAll('.msg-row').forEach(row => {
        row.addEventListener('click', () => {
          const msg = mensajes.find(m => m.id === row.dataset.id);
          if (msg) { state.mensajeSeleccionado = msg; navigateTo('ver-mensaje'); }
        });
      });
    }

    function subscribe(tab) {
      if (state._unsubMensajes) { state._unsubMensajes(); state._unsubMensajes = null; }
      const list = document.getElementById('msg-list');
      if (list) list.innerHTML = '<div class="loading-container"><span class="spinner"></span></div>';
      if (tab === 'recibidos') {
        state._unsubMensajes = escucharMensajesRecibidos(rut, renderList);
      } else {
        state._unsubMensajes = escucharMensajesEnviados(rut, renderList);
      }
    }

    document.querySelectorAll('.msg-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.msg-tab').forEach(b => b.classList.remove('active-tab'));
        btn.classList.add('active-tab');
        currentTab = btn.dataset.tab;
        subscribe(currentTab);
      });
    });
    subscribe('recibidos');
  }

  async function renderNuevoMensaje(container) {
    container.innerHTML = '<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando destinatarios...</div>';
    try {
      const dest = await api('/usuarios/destinatarios');
      const { rut } = state.user;

      container.innerHTML = '<div style="max-width:640px">'
        + '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.75rem">'
        + '<button class="btn btn-secondary" id="btn-back-msg" style="font-size:0.8125rem;padding:0.4rem 0.75rem">&larr; Volver</button>'
        + '<h2 style="font-size:1.25rem;font-weight:800;letter-spacing:-0.03em">Nuevo mensaje</h2></div>'
        + '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem">'
        + '<div class="form-group"><label>Para</label><select id="msg-para"><option value="" disabled selected>Selecciona destinatario...</option>'
        + dest.map(u => '<option value="' + u.rut + '" data-nombre="' + u.nombre + ' ' + u.apellido + '" data-rol="' + u.rol + '">' + u.nombre + ' ' + u.apellido + ' (' + u.rol + ')</option>').join('')
        + '</select></div>'
        + '<div class="form-group"><label>Asunto</label><input type="text" id="msg-asunto" placeholder="Escribe el asunto..." maxlength="120"></div>'
        + '<div class="form-group"><label>Mensaje</label><textarea id="msg-cuerpo" rows="6" placeholder="Escribe tu mensaje..." style="width:100%;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.875rem;font-family:var(--font);font-size:0.875rem;resize:vertical"></textarea></div>'
        + '<div style="display:flex;justify-content:flex-end;gap:0.75rem">'
        + '<button class="btn btn-secondary" id="btn-cancel-msg">Cancelar</button>'
        + '<button class="btn btn-primary" id="btn-send-msg">Enviar mensaje</button>'
        + '</div></div></div>';

      document.getElementById('btn-back-msg').addEventListener('click', () => navigateTo('mensajes'));
      document.getElementById('btn-cancel-msg').addEventListener('click', () => navigateTo('mensajes'));
      document.getElementById('btn-send-msg').addEventListener('click', async () => {
        const sel = document.getElementById('msg-para');
        const asunto = document.getElementById('msg-asunto').value.trim();
        const cuerpo = document.getElementById('msg-cuerpo').value.trim();
        if (!sel.value || !asunto || !cuerpo) { showToast('Completa todos los campos', 'error'); return; }
        const opt = sel.selectedOptions[0];
        try {
          document.getElementById('btn-send-msg').disabled = true;
          document.getElementById('btn-send-msg').textContent = 'Enviando...';
          await enviarMensaje({
            deRut: state.user.rut,
            deNombre: state.user.nombre + ' ' + state.user.apellido,
            deRol: state.user.rol,
            paraRut: sel.value,
            paraNombre: opt.dataset.nombre,
            paraRol: opt.dataset.rol,
            asunto, cuerpo
          });
          showToast('Mensaje enviado', 'success');
          navigateTo('mensajes');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
          document.getElementById('btn-send-msg').disabled = false;
          document.getElementById('btn-send-msg').textContent = 'Enviar mensaje';
        }
      });
    } catch {
      container.innerHTML = '<div class="alert alert-error">Error al cargar destinatarios</div>';
    }
  }

  async function renderVerMensaje(container) {
    const m = state.mensajeSeleccionado;
    if (!m) { navigateTo('mensajes'); return; }
    if (m.paraRut === state.user.rut && !m.leido) marcarLeido(m.id).catch(() => {});
    const fecha = m.fecha && m.fecha.toDate ? m.fecha.toDate() : new Date();
    const fechaStr = fecha.toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
    const esRecibido = m.paraRut === state.user.rut;
    const otroNombre = esRecibido ? m.deNombre : m.paraNombre;
    const otroRol = esRecibido ? m.deRol : m.paraRol;
    const ini = otroNombre ? otroNombre.split(' ').map(w => w[0]).join('').substring(0, 2) : '??';

    container.innerHTML = '<div style="max-width:700px">'
      + '<button class="btn btn-secondary" id="btn-back-detail" style="font-size:0.8125rem;padding:0.4rem 0.75rem;margin-bottom:1.5rem">&larr; Volver a bandeja</button>'
      + '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
      + '<div style="padding:1.5rem;border-bottom:1px solid var(--border)">'
      + '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;color:var(--accent-light);flex-shrink:0">' + ini + '</div>'
      + '<div><div style="font-weight:700;font-size:0.9375rem;color:var(--text)">' + otroNombre + '</div>'
      + '<div style="font-size:0.6875rem;color:var(--text-dim);font-family:var(--font-mono)">' + otroRol + ' - ' + fechaStr + '</div></div></div>'
      + '<h3 style="font-size:1.125rem;font-weight:700;color:var(--text);margin:0">' + m.asunto + '</h3></div>'
      + '<div style="padding:1.5rem;font-size:0.875rem;color:var(--text-muted);line-height:1.8;white-space:pre-wrap">' + m.cuerpo + '</div></div>'
      + (esRecibido
        ? '<div style="margin-top:1.5rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem">'
          + '<h4 style="font-size:0.875rem;font-weight:700;color:var(--text);margin-bottom:1rem">Responder</h4>'
          + '<div class="form-group" style="margin-bottom:1rem"><textarea id="reply-body" rows="4" placeholder="Escribe tu respuesta..." style="width:100%;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.875rem;font-family:var(--font);font-size:0.875rem;resize:vertical"></textarea></div>'
          + '<div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" id="btn-reply" style="font-size:0.8125rem">Enviar respuesta</button></div></div>'
        : '')
      + '</div>';

    document.getElementById('btn-back-detail').addEventListener('click', () => navigateTo('mensajes'));
    const replyBtn = document.getElementById('btn-reply');
    if (replyBtn) {
      replyBtn.addEventListener('click', async () => {
        const body = document.getElementById('reply-body').value.trim();
        if (!body) { showToast('Escribe una respuesta', 'error'); return; }
        try {
          replyBtn.disabled = true;
          replyBtn.textContent = 'Enviando...';
          await enviarMensaje({
            deRut: state.user.rut,
            deNombre: state.user.nombre + ' ' + state.user.apellido,
            deRol: state.user.rol,
            paraRut: m.deRut,
            paraNombre: m.deNombre,
            paraRol: m.deRol,
            asunto: 'Re: ' + m.asunto,
            cuerpo: body
          });
          showToast('Respuesta enviada', 'success');
          navigateTo('mensajes');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
          replyBtn.disabled = false;
          replyBtn.textContent = 'Enviar respuesta';
        }
      });
    }
  }

  return { renderMensajes, renderNuevoMensaje, renderVerMensaje };
}
