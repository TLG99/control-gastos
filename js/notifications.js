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
  if (dias <= 3)  return `Quedan solo ${dias} días para pagar ${nombre}.`;
  return `Faltan ${dias} días para pagar ${nombre}.`;
}

// ── Enviar email de alerta ──
export async function enviarAlerta(userEmail, gastoNombre, dias) {
  await initEmailJS();
  const params = {
    to_email:        userEmail,
    gasto_nombre:    gastoNombre,
    dias_restantes:  dias === 0 ? '¡Hoy vence!' : dias === 1 ? 'Vence mañana' : `${dias} días restantes`,
    mensaje:         construirMensaje(gastoNombre, dias),
  };
  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
}

// ── Revisar todos los gastos con fecha límite y enviar alertas ──
// Se llama al cargar la app. Evita spam guardando en localStorage la última vez que se envió.
export async function revisarAlertas(datos, userEmail) {
  const hoy      = new Date().toDateString();
  const cacheKey = `alertas_enviadas_${userEmail}`;
  const cache    = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  for (const mes of Object.keys(datos)) {
    const d = datos[mes];
    const secciones = ['fijos', 'varios', 'otros'];
    for (const sec of secciones) {
      for (const gasto of (d[sec] || [])) {
        if (!gasto.diaLimite || !gasto.alertaEmail) continue;

        const dias     = diasRestantes(gasto.diaLimite);
        const alertaId = `${mes}_${sec}_${gasto.nombre}`;

        // Solo envía si: quedan 0, 1, 2 o 3 días Y no se envió hoy ya
        if (dias <= 3 && dias >= 0 && cache[alertaId] !== hoy) {
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
}
