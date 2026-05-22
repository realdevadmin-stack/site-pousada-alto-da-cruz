// Firebase module for Pousada Alto da Cruz Site
// Sends reservation data to Firestore (padc-991e3 project)
// Uses Firebase SDK from CDN for browser-based ES6 module

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Send reservation from public site to Firestore
 * @param {Object} data - Reservation data
 * @param {string} data.guestName - Guest name (required)
 * @param {string} data.phone - WhatsApp phone (required)
 * @param {string} data.cpf - CPF (optional)
 * @param {string} data.checkIn - Check-in date (YYYY-MM-DD format, required)
 * @param {string} data.checkOut - Check-out date (YYYY-MM-DD format, required)
 * @param {number} data.people - Number of guests (required)
 * @param {string} data.roomType - Room type (required)
 * @param {string} data.notes - Special notes (optional)
 * @returns {Promise<string>} Document ID if successful
 */
export async function enviarReserva(data) {
  try {
    // Validate required fields
    if (!data.guestName || !data.phone || !data.checkIn || !data.checkOut || !data.people || !data.roomType) {
      throw new Error('Campos obrigatórios faltando');
    }

    // Create reservation document
    const reservation = {
      guestName: data.guestName,
      phone: data.phone,
      cpf: data.cpf || '',
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      people: data.people,
      roomType: data.roomType,
      notes: data.notes || '',
      source: 'site',
      status: 'pendente',
      createdAt: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'reservations'), reservation);
    console.log('Reserva enviada com sucesso:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao enviar reserva:', error);
    throw error;
  }
}

export default {
  enviarReserva,
  db,
};
