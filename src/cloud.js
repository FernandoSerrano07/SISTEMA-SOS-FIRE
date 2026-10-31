// Capa de sincronización en la nube (Firebase Firestore + Auth).
// Se empaqueta con esbuild y queda disponible como window.Cloud.
//
// Estructura en Firestore:
//   app/actual                         { id }  -> inspección activa (todos los dispositivos la siguen)
//   inspecciones/{id}                  { fecha, tecnico, encargado, firmaTec, firmaEnc, creada }
//   inspecciones/{id}/equipos/{TIPO_N} { tid, n, c:[...], com, t, by, hist }
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  doc, collection, setDoc, deleteDoc, onSnapshot, writeBatch, connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, connectAuthEmulator,
} from 'firebase/auth';

let db, auth;
let unsub = [];

function init(config) {
  const app = initializeApp(config);
  let localCache;
  try { localCache = persistentLocalCache({ tabManager: persistentMultipleTabManager() }); }
  catch (e) { localCache = memoryLocalCache(); }
  db = initializeFirestore(app, { localCache });
  auth = getAuth(app);
  if (config.emulator) { // solo para pruebas locales
    connectFirestoreEmulator(db, config.emulator.host, config.emulator.firestorePort);
    connectAuthEmulator(auth, `http://${config.emulator.host}:${config.emulator.authPort}`, { disableWarnings: true });
  }
}

const onUser = (cb) => onAuthStateChanged(auth, cb);
const login = (email, pass) => signInWithEmailAndPassword(auth, email.trim(), pass);
const logout = () => signOut(auth);

function stop() { unsub.forEach((u) => u()); unsub = []; }

// Escucha la inspección activa y, dentro de ella, los datos del formato y todos los equipos.
// handlers: { onInspection(id), onMeta(meta, fromServer), onEquipos(changes[], snapMeta), onStatus(online) }
function follow(handlers) {
  stop();
  let innerUnsub = [];
  let currentId = null, creating = false;
  const top = onSnapshot(doc(db, 'app', 'actual'), { includeMetadataChanges: true }, (snap) => {
    handlers.onStatus && handlers.onStatus(!snap.metadata.fromCache);
    const id = snap.exists() ? snap.data().id : null;
    if (!id) {
      if (!snap.metadata.fromCache && !creating && handlers.onNoInspection) { creating = true; handlers.onNoInspection(); }
      return;
    }
    if (id === currentId) return;
    currentId = id;
    innerUnsub.forEach((u) => u()); innerUnsub = [];
    handlers.onInspection(id);
    innerUnsub.push(onSnapshot(doc(db, 'inspecciones', id), (s) => {
      handlers.onMeta(s.exists() ? s.data() : null, s.metadata);
    }));
    innerUnsub.push(onSnapshot(collection(db, 'inspecciones', id, 'equipos'), { includeMetadataChanges: true }, (qs) => {
      handlers.onStatus && handlers.onStatus(!qs.metadata.fromCache);
      const changes = qs.docChanges().map((ch) => ({ type: ch.type, data: ch.doc.data(), pending: ch.doc.metadata.hasPendingWrites }));
      handlers.onEquipos(changes, qs.metadata);
    }, (err) => handlers.onError && handlers.onError(err)));
  }, (err) => handlers.onError && handlers.onError(err));
  unsub.push(top, () => innerUnsub.forEach((u) => u()));
}

// Las escrituras no se esperan: con caché local se aplican al instante y se suben cuando hay señal.
const key = (tid, n) => `${tid}_${n}`;
function saveEquipo(id, tid, n, rec) {
  const ref = doc(db, 'inspecciones', id, 'equipos', key(tid, n));
  return rec ? setDoc(ref, { tid, n: Number(n), ...rec }) : deleteDoc(ref);
}
function saveMeta(id, meta) { return setDoc(doc(db, 'inspecciones', id), meta, { merge: true }); }

async function newInspection(meta) {
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  await Promise.race([
    (async () => {
      await setDoc(doc(db, 'inspecciones', id), { ...meta, creada: Date.now() });
      await setDoc(doc(db, 'app', 'actual'), { id });
    })(),
    new Promise((r) => setTimeout(r, 4000)), // sin señal: queda en cola y se sube después
  ]);
  return id;
}

// Para "Unir respaldos": sube muchos equipos en lotes
async function saveMany(id, items) {
  for (let i = 0; i < items.length; i += 400) {
    const b = writeBatch(db);
    for (const { tid, n, rec } of items.slice(i, i + 400)) b.set(doc(db, 'inspecciones', id, 'equipos', key(tid, n)), { tid, n: Number(n), ...rec });
    b.commit().catch(() => {});
  }
}

window.Cloud = { init, onUser, login, logout, follow, stop, saveEquipo, saveMeta, newInspection, saveMany };
