import {initializeApp} from 'firebase/app';
import {getAuth, connectAuthEmulator} from 'firebase/auth';
import {getFirestore, connectFirestoreEmulator} from 'firebase/firestore';
export const firebaseConfig = {
  apiKey: 'AIzaSyDHi6V578lnD3jIShM-bmgVqwjzUb7cIoE',
  authDomain: 'el-club-del-dije.firebaseapp.com',
  projectId: 'el-club-del-dije',
  storageBucket: 'el-club-del-dije.firebasestorage.app',
  messagingSenderId: '877563207294',
  appId: '1:877563207294:web:12e5b2bf668b037c54022f'
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Únicamente en localhost con ?emulator=1. Nunca se habilita por una URL pública.
if (typeof window !== 'undefined' && ['localhost','127.0.0.1'].includes(window.location.hostname) && new URLSearchParams(window.location.search).get('emulator') === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings:true});
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
