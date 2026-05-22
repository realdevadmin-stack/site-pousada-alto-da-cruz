import { enviarReserva } from './firebase.js';

document.getElementById('bookingForm').addEventListener('submit', async function(e){
  e.preventDefault();
  
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const hospedes = document.getElementById('hospedes').value;
  const quarto = document.getElementById('quarto').value;
  const observacoes = document.getElementById('observacoes').value.trim();
  
  const messageEl = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');
  
  // Reset message
  messageEl.textContent = '';
  messageEl.className = '';
  
  // Validate required fields
  if (!nome || !telefone || !checkin || !checkout || !hospedes || !quarto) {
    messageEl.textContent = 'Por favor, preencha todos os campos obrigatórios.';
    messageEl.className = 'error';
    return;
  }

  if (new Date(`${checkout}T00:00:00`) <= new Date(`${checkin}T00:00:00`)) {
    messageEl.textContent = 'A data de saída precisa ser posterior à entrada.';
    messageEl.className = 'error';
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    // Parse number of people
    const people = parseInt(hospedes, 10);
    
    // Send to Firebase
    const reservationId = await enviarReserva({
      guestName: nome,
      phone: telefone,
      cpf: cpf || '',
      checkIn: checkin,
      checkOut: checkout,
      people: people,
      roomType: quarto,
      notes: observacoes,
    });
    
    // Success
    messageEl.textContent = '✓ Reserva enviada com sucesso! A pousada entrará em contato pelo WhatsApp.';
    messageEl.className = 'success';
    
    // Clear form
    document.getElementById('bookingForm').reset();
    
    // Re-enable button after 3 seconds
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
      messageEl.textContent = '';
      messageEl.className = '';
    }, 3000);
    
  } catch (error) {
    console.error('Erro ao enviar reserva:', error);
    messageEl.textContent = 'Erro ao enviar reserva. Tente novamente ou use o WhatsApp.';
    messageEl.className = 'error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Reserva';
  }
});
