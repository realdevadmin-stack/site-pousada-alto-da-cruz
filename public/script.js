document.getElementById('bookingForm').addEventListener('submit', function(e){
  e.preventDefault();
  
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const hospedes = document.getElementById('hospedes').value;
  const quarto = document.getElementById('quarto').value;
  const nome = document.getElementById('nome').value;
  const telefone = document.getElementById('telefone').value;
  
  // Função para formatar a data americana para o padrão brasileiro (DD/MM/AAAA)
  const formatarData BR = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const msg = `Olá! Quero consultar disponibilidade na Pousada Alto da Cruz.%0A%0A` +
              `*Nome:* ${nome}%0A` +
              `*Telefone:* ${telefone}%0A` +
              `*Check-in:* ${formatarDataBR(checkin)}%0A` +
              `*Check-out:* ${formatarDataBR(checkout)}%0A` +
              `*Hóspedes:* ${hospedes}%0A` +
              `*Quarto:* ${quarto}`;
              
  window.open(`https://wa.me/5571985610497?text=${msg}`, '_blank');
});