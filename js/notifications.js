// js/notifications.js
// Lógica de alertas por email usando EmailJS

const EMAILJS_PUBLIC_KEY  = 'dFObvu1IN2Aa95pdp';
const EMAILJS_SERVICE_ID  = 'service_5frdfpj';
const EMAILJS_TEMPLATE_ID = 'template_oyupw9r';

// Carga el SDK de EmailJS dinámicamente
export function initEmailJS() {
  return new Promise((resolve) => {
    if (window.emailjs) { resolve(); return; }
    const script    = document.createElement('script');
    script.src      = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload   = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); resolve(); };
    document.head.appendChild(script);
  });
}

// ── Calcular días restantes hasta el día N del mes actual ──
export function diasRestantes(diaLimite) {
  const hoy   = new Date();
  const anio  = hoy.getFullYear();
  const mes   = hoy.getMonth();
  let limite  = new Date(anio, mes, diaLimite);

  // Si ya pasó este mes, apunta al mes siguiente
  if (limite < hoy) {
    limite = new Date(anio, mes + 1, diaLimite);
  }

  const diff = limite - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Construir mensaje según días restantes ──
function construirMensaje(nombre, dias) {
  if (dias === 0) return `Hoy es el último día para pagar ${nombre}. ¡No lo dejes pasar!`;
  if (dias === 1) return `Mañana vence el pago de ${nombre}. Tienes 1 día.`;
  return `Faltan ${dias} días para pagar ${nombre}.`;
}

// ── Enviar email de alerta ──
export async function enviarAlerta(userEmail, gastoNombre, dias) {
  await initEmailJS();
  const params = {
    to_email:        userEmail,
    gasto_nombre:    gastoNombre,
    dias_restantes:  dias === 0 ? '¡Hoy vence!' : 'Vence mañana',
    mensaje:         construirMensaje(gastoNombre, dias),
  };
  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
}

// ── Revisar todos los gastos con fecha límite y enviar alertas ──
// Solo envía alertas cuando quedan 0 o 1 días.
// Guarda en localStorage la fecha de último envío por alerta para no duplicar en el mismo día.
export async function revisarAlertas(datos, userEmail) {
  const hoy      = new Date().toDateString(); // Ej: "Sun Apr 12 2026"
  const cacheKey = `alertas_enviadas_${userEmail}`;
  let cache      = {};
  try {
    cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  } catch { cache = {}; }

  for (const mes of Object.keys(datos)) {
    const d = datos[mes];
    const secciones = ['fijos', 'varios', 'otros'];
    for (const sec of secciones) {
      for (const gasto of (d[sec] || [])) {
        if (!gasto.diaLimite || !gasto.alertaEmail) continue;

        const dias     = diasRestantes(gasto.diaLimite);
        // ── CAMBIO: solo alertar si queda 0 o 1 día ──
        if (dias > 1 || dias < 0) continue;

        // Clave única: incluye el día límite para evitar duplicados si se copia
        // el mismo gasto en otro mes con el mismo nombre y mismo diaLimite
        const alertaId = `${sec}_${gasto.nombre}_dia${gasto.diaLimite}`;

        // Si ya se envió hoy este alertaId exacto, no reenviar
        if (cache[alertaId] === hoy) continue;

        try {
          await enviarAlerta(userEmail, gasto.nombre, dias);
          cache[alertaId] = hoy;
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch (e) {
          console.error('Error enviando alerta:', e);
        }
      }
    }
  }
}