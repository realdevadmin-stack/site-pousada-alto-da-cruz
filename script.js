import { enviarReserva } from './firebase.js';

const bookingForm = document.getElementById('bookingForm');
const whatsappBtn = document.getElementById('whatsappBtn');
const formMessage = document.getElementById('formMessage');
const toastEl = document.getElementById('toast');

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 4000);
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

bookingForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const hospedes = document.getElementById('hospedes').value;
  const quarto = document.getElementById('quarto').value;
  const observacoes = document.getElementById('observacoes').value.trim();
  const submitBtn = document.getElementById('submitBtn');

  formMessage.textContent = '';
  formMessage.className = 'form-message';

  if (!nome || !telefone || !checkin || !checkout || !hospedes || !quarto) {
    formMessage.textContent = 'Por favor, preencha todos os campos obrigatórios.';
    formMessage.classList.add('error');
    showToast('Preencha os dados da reserva antes de enviar.', 'error');
    return;
  }

  if (new Date(`${checkout}T00:00:00`) <= new Date(`${checkin}T00:00:00`)) {
    formMessage.textContent = 'A data de saída precisa ser posterior à entrada.';
    formMessage.classList.add('error');
    showToast('Data de saída inválida.', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const people = parseInt(hospedes, 10);

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

    formMessage.textContent = '✓ Reserva enviada com sucesso! A pousada entrará em contato pelo WhatsApp.';
    formMessage.classList.add('success');
    showToast('Reserva enviada com sucesso.');
    bookingForm.reset();

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }, 3000);
  } catch (error) {
    console.error('Erro ao enviar reserva:', error);
    formMessage.textContent = 'Erro ao enviar reserva. Tente novamente ou use o WhatsApp.';
    formMessage.classList.add('error');
    showToast('Erro ao enviar reserva.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Reserva';
  }
});

whatsappBtn.addEventListener('click', function () {
  const nome = document.getElementById('nome').value.trim();
  const telefone = normalizePhone(document.getElementById('telefone').value);
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const quarto = document.getElementById('quarto').value;
  const valor = 'R$ 0,00';

  if (nome && telefone && checkin && checkout && quarto) {
    const message = `Olá ${nome}! Gostaria de reservar o ${quarto} de ${checkin} até ${checkout}. Valor estimado: ${valor}.`;
    this.href = `https://wa.me/55${telefone}?text=${encodeURIComponent(message)}`;
  } else {
    this.href = 'https://wa.me/5571985610497';
    showToast('Complete os dados para enviar mensagem automática.', 'error');
  }
});
