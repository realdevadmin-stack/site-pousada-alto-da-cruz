import {
  auth,
  onAuthStateChange,
  signInAdmin,
  signOutAdmin,
  getUserProfile,
  fetchRooms,
  fetchReservations,
  fetchCashEntries,
  fetchAuditLogs,
  addCashEntry,
  updateReservationStatus,
  logAction,
} from './firebase.js';

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const signOutBtn = document.getElementById('signOutBtn');
const adminContent = document.getElementById('adminContent');
const authBlock = document.getElementById('authBlock');
const adminUserLabel = document.getElementById('adminUserLabel');
const adminRoleLabel = document.getElementById('adminRoleLabel');
const daySummary = document.getElementById('daySummary');
const roomNamesEl = document.getElementById('roomNames');
const calendarGridEl = document.getElementById('calendarGrid');
const reservationDetailsEl = document.getElementById('reservationDetails');
const cashForm = document.getElementById('cashForm');
const cashMessage = document.getElementById('cashMessage');
const cashSummaryEl = document.getElementById('cashSummary');
const reportsCardsEl = document.getElementById('reportsCards');
const logListEl = document.getElementById('logList');
const printCashBtn = document.getElementById('printCashBtn');
const toastEl = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');
const tabButtons = document.querySelectorAll('.tab-btn');
const logsTabBtn = document.querySelector('[data-tab="logsTab"]');

let currentUser = null;
let currentRole = null;
let rooms = [];
let reservations = [];
let cashEntries = [];
let auditLogs = [];

const defaultRooms = [
  { id: 'quarto-casal', name: 'Quarto casal' },
  { id: 'quarto-duplo', name: 'Quarto duplo' },
  { id: 'quarto-individual', name: 'Quarto individual' },
];

const statusClasses = {
  pendente: 'status-pendente',
  confirmada: 'status-confirmada',
  ocupada: 'status-ocupada',
  finalizada: 'status-finalizada',
  cancelada: 'status-cancelada',
};

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 4000);
}

function setLoading(active, text = 'Carregando...') {
  if (active) {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.dataset.label = text;
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

function formatDate(dateValue) {
  if (!dateValue) return '-';
  if (typeof dateValue === 'object' && dateValue.toDate) {
    dateValue = dateValue.toDate();
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('pt-BR');
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function getDaysWindow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 10 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    return day;
  });
}

function getStatusClass(status) {
  return statusClasses[status] || 'status-pendente';
}

function buildCalendarView() {
  const days = getDaysWindow();
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-row calendar-row-header';
  headerRow.innerHTML = days.map(day => `<div class="calendar-day-header">${day.getDate()}/${day.getMonth()+1}</div>`).join('');

  calendarGridEl.innerHTML = '';
  calendarGridEl.appendChild(headerRow);

  const roomList = rooms.length ? rooms : defaultRooms;
  roomNamesEl.innerHTML = roomList.map(room => `<div class="calendar-room-name">${room.name}</div>`).join('');

  roomList.forEach(room => {
    const row = document.createElement('div');
    row.className = 'calendar-row';
    row.innerHTML = days.map(() => '<div class="calendar-cell"></div>').join('');
    const reservationsForRoom = reservations.filter(res => res.roomType === room.name);

    reservationsForRoom.forEach(reservation => {
      const checkIn = new Date(`${reservation.checkIn}T00:00:00`);
      const checkOut = new Date(`${reservation.checkOut}T00:00:00`);
      days.forEach((day, dayIndex) => {
        if (day >= checkIn && day < checkOut) {
          const cell = row.children[1 + dayIndex];
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `reservation-chip ${getStatusClass(reservation.status)}`;
          chip.textContent = reservation.guestName;
          chip.title = `${reservation.guestName} • ${reservation.checkIn} → ${reservation.checkOut}`;
          chip.addEventListener('click', () => renderReservationDetails(reservation));
          cell.appendChild(chip);
        }
      });
    });

    calendarGridEl.appendChild(row);
  });

  const checkins = reservations.filter(res => res.checkIn === formatDateString(new Date()));
  const checkouts = reservations.filter(res => res.checkOut === formatDateString(new Date()));
  daySummary.innerHTML = `Hoje: ${checkins.length} check-in(s), ${checkouts.length} check-out(s)`;
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderReservationDetails(reservation) {
  reservationDetailsEl.classList.remove('hidden');
  reservationDetailsEl.innerHTML = `
    <div class="details-panel">
      <div class="details-header">
        <h3>Reserva de ${reservation.guestName}</h3>
        <span class="status-pill ${getStatusClass(reservation.status)}">${reservation.status || 'pendente'}</span>
      </div>
      <div class="details-grid">
        <p><strong>Quarto:</strong> ${reservation.roomType}</p>
        <p><strong>Telefone:</strong> ${reservation.phone}</p>
        <p><strong>Check-in:</strong> ${reservation.checkIn}</p>
        <p><strong>Check-out:</strong> ${reservation.checkOut}</p>
        <p><strong>Hóspedes:</strong> ${reservation.people || '-'} </p>
        <p><strong>Valor estimado:</strong> ${formatCurrency(reservation.amount || 0)}</p>
        <p class="full-width"><strong>Observações:</strong> ${reservation.notes || '-'}</p>
      </div>
      <div class="details-actions">
        <button class="btn" id="confirmReservationBtn">Confirmar</button>
        <button class="btn outline" id="checkinReservationBtn">Check-in</button>
        <button class="btn outline" id="checkoutReservationBtn">Check-out</button>
        <button class="btn outline" id="cancelReservationBtn">Cancelar</button>
        <button class="btn outline" id="printReservationBtn">Imprimir comprovante</button>
        <button class="btn outline" id="whatsappReservationBtn">Enviar WhatsApp</button>
      </div>
    </div>
  `;

  document.getElementById('confirmReservationBtn').addEventListener('click', async () => updateReservationStatusHandler(reservation, 'confirmada'));
  document.getElementById('checkinReservationBtn').addEventListener('click', async () => updateReservationStatusHandler(reservation, 'ocupada'));
  document.getElementById('checkoutReservationBtn').addEventListener('click', async () => updateReservationStatusHandler(reservation, 'finalizada'));
  document.getElementById('cancelReservationBtn').addEventListener('click', async () => updateReservationStatusHandler(reservation, 'cancelada'));
  document.getElementById('printReservationBtn').addEventListener('click', () => { printSection(); showToast('Imprimindo comprovante...'); logAction('imprimir documento', `Impressão de comprovante da reserva ${reservation.guestName}`, { reservationId: reservation.id, userId: currentUser.uid, userName: currentUser.email }); });
  document.getElementById('whatsappReservationBtn').addEventListener('click', () => openWhatsAppForReservation(reservation));
}

async function updateReservationStatusHandler(reservation, newStatus) {
  try {
    setLoading(true, 'Atualizando status...');
    await updateReservationStatus(reservation.id, { status: newStatus });
    await logAction('alterar reserva', `Reserva ${reservation.id} atualizada para ${newStatus}`, { reservationId: reservation.id, userId: currentUser.uid, userName: currentUser.email });
    showToast(`Reserva ${newStatus} com sucesso.`);
    await refreshAdminData();
  } catch (error) {
    console.error(error);
    showToast('Erro ao atualizar reserva.', 'error');
  } finally {
    setLoading(false);
  }
}

function buildReports() {
  const today = formatDateString(new Date());
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todayEntries = cashEntries.filter(entry => entry.date === today);
  const monthEntries = cashEntries.filter(entry => {
    const date = new Date(entry.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const receitaHoje = todayEntries.filter(entry => entry.type === 'entrada').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const despesasHoje = todayEntries.filter(entry => ['saida', 'sangria'].includes(entry.type)).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const receitaMes = monthEntries.filter(entry => entry.type === 'entrada').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const despesasMes = monthEntries.filter(entry => ['saida', 'sangria'].includes(entry.type)).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const lucroHoje = receitaHoje - despesasHoje;
  const lucroMes = receitaMes - despesasMes;
  const ocupacao = reservations.filter(res => res.status === 'ocupada').length;
  const totalRooms = rooms.length || defaultRooms.length;
  const ocupacaoPercent = totalRooms ? Math.round((ocupacao / totalRooms) * 100) : 0;
  const statusCounts = reservations.reduce((acc, reservation) => {
    acc[reservation.status] = (acc[reservation.status] || 0) + 1;
    return acc;
  }, {});

  reportsCardsEl.innerHTML = `
    <article class="report-card">
      <h3>Receita hoje</h3>
      <strong>${formatCurrency(receitaHoje)}</strong>
    </article>
    <article class="report-card">
      <h3>Receita mês</h3>
      <strong>${formatCurrency(receitaMes)}</strong>
    </article>
    <article class="report-card">
      <h3>Despesas mês</h3>
      <strong>${formatCurrency(despesasMes)}</strong>
    </article>
    <article class="report-card">
      <h3>Lucro mês</h3>
      <strong>${formatCurrency(lucroMes)}</strong>
    </article>
    <article class="report-card">
      <h3>Ocupação</h3>
      <strong>${ocupacaoPercent}%</strong>
      <p>${ocupacao} de ${totalRooms} quartos ocupados</p>
    </article>
    <article class="report-card">
      <h3>Reservas por status</h3>
      <p>Pendente: ${statusCounts.pendente || 0}</p>
      <p>Confirmada: ${statusCounts.confirmada || 0}</p>
      <p>Ocupada: ${statusCounts.ocupada || 0}</p>
      <p>Finalizada: ${statusCounts.finalizada || 0}</p>
      <p>Cancelada: ${statusCounts.cancelada || 0}</p>
    </article>
  `;
}

function renderCashSummary() {
  const today = formatDateString(new Date());
  const todayEntries = cashEntries.filter(entry => entry.date === today);
  const grouped = todayEntries.reduce((acc, entry) => {
    acc[entry.type] = acc[entry.type] || 0;
    acc[entry.type] += Number(entry.amount);
    return acc;
  }, {});

  const cost = grouped.entrada || 0;
  const expense = (grouped.saida || 0) + (grouped.sangria || 0);
  const balance = cost - expense;

  cashSummaryEl.innerHTML = `
    <div class="cash-summary-item"><strong>Entradas hoje</strong><span>${formatCurrency(cost)}</span></div>
    <div class="cash-summary-item"><strong>Saídas hoje</strong><span>${formatCurrency(expense)}</span></div>
    <div class="cash-summary-item"><strong>Saldo diário</strong><span>${formatCurrency(balance)}</span></div>
    <div class="cash-summary-item"><strong>Total de lançamentos</strong><span>${todayEntries.length}</span></div>
  `;
}

function renderLogs() {
  logListEl.innerHTML = auditLogs.map(log => `
    <article class="log-item">
      <div>
        <strong>${formatDate(log.createdAt?.toDate ? log.createdAt.toDate() : log.createdAt)}</strong>
        <p>${log.action}</p>
      </div>
      <div>
        <small>${log.userName || 'Sistema'} • ${log.details || ''}</small>
      </div>
    </article>
  `).join('');
}

function openWhatsAppForReservation(reservation) {
  const phone = normalizePhone(reservation.phone || '');
  const message = `Olá ${reservation.guestName},%0aSua reserva no quarto ${reservation.roomType} está ${reservation.status || 'pendente'}.%0aEntrada: ${reservation.checkIn}%0aSaída: ${reservation.checkOut}%0aValor: ${formatCurrency(reservation.amount || 0)}.%0aAguardamos você.`;
  const url = `https://wa.me/55${phone}?text=${message}`;
  window.open(url, '_blank');
  logAction('enviar WhatsApp', `WhatsApp para reserva ${reservation.id}`, { reservationId: reservation.id, userId: currentUser.uid, userName: currentUser.email });
}

function printSection() {
  window.print();
}

async function refreshAdminData() {
  try {
    setLoading(true, 'Atualizando painel...');
    rooms = await fetchRooms();
    reservations = await fetchReservations();
    cashEntries = await fetchCashEntries();
    auditLogs = await fetchAuditLogs();
    buildCalendarView();
    renderCashSummary();
    buildReports();
    if (currentRole === 'admin') {
      renderLogs();
      logsTabBtn.classList.remove('hidden');
    } else {
      logsTabBtn.classList.add('hidden');
    }
  } catch (error) {
    console.error('Erro ao carregar dados administrativos', error);
    showToast('Erro ao carregar dados do painel.', 'error');
  } finally {
    setLoading(false);
  }
}

async function handleCashSubmit(event) {
  event.preventDefault();
  const amount = Number(document.getElementById('cashAmount').value);
  const type = document.getElementById('cashType').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const responsible = document.getElementById('cashResponsible').value.trim();
  const description = document.getElementById('cashDescription').value.trim();

  if (!amount || !responsible || !type) {
    cashMessage.textContent = 'Preencha todos os campos obrigatórios.';
    cashMessage.className = 'form-message error';
    return;
  }

  try {
    setLoading(true, 'Registrando movimento...');
    const entry = {
      amount,
      type,
      paymentMethod,
      description,
      responsible,
      date: formatDateString(new Date()),
      createdAt: new Date(),
    };
    await addCashEntry(entry);
    await logAction('sangria', `Movimento de caixa: ${type} de ${formatCurrency(amount)}`, { userId: currentUser.uid, userName: currentUser.email });
    cashMessage.textContent = 'Movimento registrado com sucesso.';
    cashMessage.className = 'form-message success';
    cashForm.reset();
    await refreshAdminData();
  } catch (error) {
    console.error(error);
    cashMessage.textContent = 'Erro ao registrar movimento.';
    cashMessage.className = 'form-message error';
  } finally {
    setLoading(false);
  }
}

function switchTab(tabName) {
  tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabName));
  document.querySelectorAll('.admin-tab').forEach(section => section.classList.toggle('active', section.id === tabName));
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  if (!email || !password) {
    loginMessage.textContent = 'Preencha e-mail e senha.';
    loginMessage.className = 'form-message error';
    return;
  }

  try {
    setLoading(true, 'Entrando...');
    const result = await signInAdmin(email, password);
    currentUser = result.user;
    const profile = await getUserProfile(currentUser.uid);
    currentRole = profile?.role || 'funcionario';
    authBlock.classList.add('hidden');
    adminContent.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
    adminUserLabel.textContent = currentUser.email;
    adminRoleLabel.textContent = `Perfil: ${currentRole}`;
    loginMessage.textContent = '';
    loginMessage.className = '';
    await refreshAdminData();
  } catch (error) {
    console.error(error);
    loginMessage.textContent = 'Falha no login. Verifique suas credenciais.';
    loginMessage.className = 'form-message error';
  } finally {
    setLoading(false);
  }
}

async function initAuthObserver() {
  onAuthStateChange(async user => {
    if (user) {
      currentUser = user;
      const profile = await getUserProfile(user.uid);
      currentRole = profile?.role || 'funcionario';
      authBlock.classList.add('hidden');
      adminContent.classList.remove('hidden');
      signOutBtn.classList.remove('hidden');
      adminUserLabel.textContent = user.email;
      adminRoleLabel.textContent = `Perfil: ${currentRole}`;
      await refreshAdminData();
    } else {
      currentUser = null;
      currentRole = null;
      adminContent.classList.add('hidden');
      authBlock.classList.remove('hidden');
      signOutBtn.classList.add('hidden');
      adminUserLabel.textContent = 'Usuário';
      adminRoleLabel.textContent = 'Perfil';
    }
  });
}

async function handleSignOut() {
  try {
    await signOutAdmin();
    showToast('Sessão encerrada.');
  } catch (error) {
    console.error(error);
    showToast('Falha ao sair.', 'error');
  }
}

loginForm.addEventListener('submit', handleLogin);
printCashBtn.addEventListener('click', () => { printSection(); showToast('Imprimindo fechamento de caixa...'); });
cashForm.addEventListener('submit', handleCashSubmit);

tabButtons.forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

signOutBtn.addEventListener('click', handleSignOut);

initAuthObserver();
