// js/notifications.js
// Cálculo de días restantes hasta el día límite de un gasto.
// El envío de recordatorios por email corre server-side, ver
// netlify/functions/check-vencimientos.js (Netlify Scheduled Function).

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Calcular días restantes hasta el día N del mes del gasto ──
// Negativo = ya pasó el día límite (atrasado).
export function diasRestantes(mes, diaLimite) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [nombreMes, anio] = mes.split(' ');
  const limite = new Date(parseInt(anio), MESES.indexOf(nombreMes), diaLimite);

  const diff = limite - hoy;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
