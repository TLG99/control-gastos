// netlify/functions/check-vencimientos.js
// Scheduled Function (ver netlify.toml) que corre una vez al día.
// Recorre todos los usuarios, busca gastos con diaLimite = hoy y
// pagado = false, y manda UN correo por usuario con el resumen.
// El envío queda marcado en Firestore (usuarios/{uid}/notificaciones/{fecha})
// para no reenviar aunque la función se dispare más de una vez el mismo día.

const admin = require('firebase-admin');

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:  process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.firestore();
}

async function enviarEmail(toEmail, items) {
  const lista = items.map(g => `- ${g.nombre}: $${Number(g.monto || 0).toLocaleString('es-CL')}`).join('\n');
  const nombreResumen = items.length === 1 ? items[0].nombre : `${items.length} gastos`;

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id:     process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email:       toEmail,
        gasto_nombre:   nombreResumen,
        dias_restantes: 'Hoy',
        mensaje:        `Hoy vence(n) el pago de:\n${lista}`,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
  }
}

exports.handler = async function () {
  const db  = getDb();
  const hoy = new Date();
  const mesActual = `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;
  const diaHoy     = hoy.getDate();
  const fechaId    = hoy.toISOString().slice(0, 10);

  const usuariosSnap = await db.collection('usuarios').get();
  let enviados = 0;

  for (const userDoc of usuariosSnap.docs) {
    const uid = userDoc.id;

    const marcaRef  = db.doc(`usuarios/${uid}/notificaciones/${fechaId}`);
    const yaEnviado = await marcaRef.get();
    if (yaEnviado.exists) continue;

    const mesSnap = await db.doc(`usuarios/${uid}/meses/${mesActual}`).get();
    if (!mesSnap.exists) continue;
    const data = mesSnap.data();

    const vencenHoy = [];
    for (const sec of ['fijos', 'varios', 'otros']) {
      for (const g of (data[sec] || [])) {
        if (g.diaLimite === diaHoy && !g.pagado) vencenHoy.push(g);
      }
    }
    if (!vencenHoy.length) continue;

    let email;
    try {
      email = (await admin.auth().getUser(uid)).email;
    } catch {
      continue;
    }
    if (!email) continue;

    try {
      await enviarEmail(email, vencenHoy);
      await marcaRef.set({
        enviado: admin.firestore.FieldValue.serverTimestamp(),
        items:   vencenHoy.map(g => g.nombre),
      });
      enviados++;
    } catch (e) {
      console.error(`Error enviando a ${email}:`, e.message);
    }
  }

  return { statusCode: 200, body: `OK, ${enviados} correo(s) enviado(s)` };
};
