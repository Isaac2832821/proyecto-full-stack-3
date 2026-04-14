// ── Firebase Configuration ───────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
export default app;
