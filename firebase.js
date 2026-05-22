// Firebase module for Pousada Alto da Cruz Site
// Uses Firebase SDK from CDN for browser-based ES6 module

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function enviarReserva(data) {
  try {
    if (!data.guestName || !data.phone || !data.checkIn || !data.checkOut || !data.people || !data.roomType) {
      throw new Error('Campos obrigatórios faltando');
    }

    if (Number.isNaN(Number(data.people)) || Number(data.people) < 1) {
      throw new Error('Quantidade de hóspedes inválida');
    }

    if (new Date(`${data.checkOut}T00:00:00`) <= new Date(`${data.checkIn}T00:00:00`)) {
      throw new Error('A data de saída precisa ser posterior à entrada');
    }

    const reservation = {
      guestName: data.guestName,
      phone: data.phone,
      cpf: data.cpf || '',
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      people: Number(data.people),
      roomType: data.roomType,
      notes: data.notes || '',
      source: 'site',
      status: 'pendente',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'reservations'), reservation);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao enviar reserva:', error);
    throw error;
  }
}

export async function signInAdmin(email, password) {
  await setPersistence(auth, browserLocalPersistence);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result;
}

export async function signOutAdmin() {
  return signOut(auth);
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  const profileDoc = await getDoc(doc(db, 'users', uid));
  return profileDoc.exists() ? { id: profileDoc.id, ...profileDoc.data() } : null;
}

export async function fetchRooms() {
  const snapshot = await getDocs(collection(db, 'rooms'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchReservations() {
  const reservationsQuery = query(collection(db, 'reservations'), orderBy('checkIn', 'asc'));
  const snapshot = await getDocs(reservationsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchCashEntries() {
  const cashQuery = query(collection(db, 'cash'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(cashQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchAuditLogs() {
  const logsQuery = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addCashEntry(entry) {
  const docRef = await addDoc(collection(db, 'cash'), {
    amount: Number(entry.amount),
    type: entry.type,
    paymentMethod: entry.paymentMethod,
    description: entry.description || '',
    responsible: entry.responsible || '',
    date: entry.date,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateReservationStatus(reservationId, updates) {
  const reservationRef = doc(db, 'reservations', reservationId);
  await updateDoc(reservationRef, updates);
}

export async function logAction(action, details, metadata = {}) {
  await addDoc(collection(db, 'auditLogs'), {
    action,
    details,
    reservationId: metadata.reservationId || null,
    cashId: metadata.cashId || null,
    userId: metadata.userId || null,
    userName: metadata.userName || null,
    createdAt: serverTimestamp(),
    source: 'admin-ui',
  });
}

export { app, db, auth };
