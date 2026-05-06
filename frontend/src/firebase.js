// ── Firebase Configuration ───────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDYUuwSRke9DwnX_T62CZBeQWYYcyhMsk",
  authDomain: "colegio-bernardo-o-higgins.firebaseapp.com",
  projectId: "colegio-bernardo-o-higgins",
  storageBucket: "colegio-bernardo-o-higgins.firebasestorage.app",
  messagingSenderId: "52482002854",
  appId: "1:52482002854:web:fd49882dd43a63315f8967",
  measurementId: "G-BPWF46PNJB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Mensajería helpers ───────────────────────────────────────────────────

/** Enviar un mensaje */
export async function enviarMensaje({ deRut, deNombre, deRol, paraRut, paraNombre, paraRol, asunto, cuerpo }) {
  return addDoc(collection(db, 'mensajes'), {
    deRut, deNombre, deRol,
    paraRut, paraNombre, paraRol,
    asunto, cuerpo,
    fecha: serverTimestamp(),
    leido: false
  });
}

/** Escuchar mensajes recibidos por un usuario (tiempo real) */
export function escucharMensajesRecibidos(rut, callback) {
  const q = query(
    collection(db, 'mensajes'),
    where('paraRut', '==', rut),
    orderBy('fecha', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const mensajes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(mensajes);
  }, (error) => {
    console.error('[Firebase] Error en mensajes recibidos:', error);
    callback([]);
  });
}

/** Escuchar mensajes enviados por un usuario (tiempo real) */
export function escucharMensajesEnviados(rut, callback) {
  const q = query(
    collection(db, 'mensajes'),
    where('deRut', '==', rut),
    orderBy('fecha', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const mensajes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(mensajes);
  }, (error) => {
    console.error('[Firebase] Error en mensajes enviados:', error);
    callback([]);
  });
}

/** Marcar un mensaje como leído */
export async function marcarLeido(mensajeId) {
  const ref = doc(db, 'mensajes', mensajeId);
  return updateDoc(ref, { leido: true });
}

/** Contar mensajes no leídos */
export function escucharNoLeidos(rut, callback) {
  const q = query(
    collection(db, 'mensajes'),
    where('paraRut', '==', rut),
    where('leido', '==', false)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('[Firebase] Error en no leídos:', error);
    callback(0);
  });
}

export default app;
