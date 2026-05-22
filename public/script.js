document.getElementById("bookingForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const hospedes = document.getElementById("hospedes").value;
  const quarto = document.getElementById("quarto").value;
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();

  if (!nome || !telefone || !checkin || !checkout || !hospedes || !quarto) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  if (new Date(`${checkout}T00:00:00`) <= new Date(`${checkin}T00:00:00`)) {
    alert("A data de saída precisa ser posterior à entrada.");
    return;
  }

  const formatarDataBR = (dataStr) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const msg = `Olá! Quero consultar disponibilidade na Pousada Alto da Cruz.%0A%0A` +
    `*Nome:* ${encodeURIComponent(nome)}%0A` +
    `*Telefone:* ${encodeURIComponent(telefone)}%0A` +
    `*Check-in:* ${formatarDataBR(checkin)}%0A` +
    `*Check-out:* ${formatarDataBR(checkout)}%0A` +
    `*Hóspedes:* ${encodeURIComponent(hospedes)}%0A` +
    `*Quarto:* ${encodeURIComponent(quarto)}`;

  window.open(`https://wa.me/5571985610497?text=${msg}`, "_blank", "noopener,noreferrer");
});
