# gastos-app — Contexto para Claude

## Qué es
App web personal de control de gastos mensuales. La usa Tomás (tomas1124ge@gmail.com) y posiblemente otros usuarios de confianza. Está desplegada en **Netlify** con deploy automático desde el branch `main` de GitHub (repo: TLG99/gastos-app, público).

## Stack
- **Frontend**: HTML + CSS + JS vanilla (ES modules, sin bundler, sin framework)
- **Backend**: Firebase (Auth con email/contraseña + Firestore para datos)
- **Tipografía**: Inter (Google Fonts)
- **Deploy**: Netlify → auto-deploy en push a main
- **Recordatorios por email**: Netlify Scheduled Function (cron diario) + Firebase Admin SDK + EmailJS REST API

El frontend no tiene `package.json` ni build step (se sirve directo). La única
excepción es `netlify/functions/`, que sí tiene su propio `package.json`
(dependencia `firebase-admin`) porque Netlify empaqueta las functions aparte.

## Estructura de archivos
```
index.html          — único HTML, contiene toda la UI (login, app, modal)
css/styles.css      — todos los estilos, variables CSS para tema claro/oscuro
netlify.toml         — publish=".", functions="netlify/functions", cron de check-vencimientos
js/
  main.js           — punto de entrada: initDialogs, initTheme, initAuth
  auth.js           — login/logout con Firebase Auth, maneja show/hide de pantallas
  app.js            — estado central (datos, mesActual), lógica de negocio
  ui.js             — funciones de render (renderSeccion, recalcular, renderPagosProximos...)
  db.js             — operaciones Firestore (cargarTodosLosMeses, guardarMes, eliminarMes)
  firebase.js       — config e inicialización de Firebase
  dialogs.js        — sistema de diálogos visuales (showAlert, showConfirm, showPrompt)
  theme.js          — toggle tema claro/oscuro, persiste en localStorage
  notifications.js  — solo diasRestantes(mes, diaLimite), usado por el banner de vencimientos
netlify/functions/
  check-vencimientos.js — Scheduled Function (cron diario). Recorre usuarios/*, busca
                           gastos con diaLimite = hoy y pagado=false, y manda UN correo
                           por usuario vía EmailJS REST API (server-side, con private key).
                           Marca el envío en usuarios/{uid}/notificaciones/{YYYY-MM-DD}
                           para no duplicar aunque corra más de una vez el mismo día.
  package.json           — dependencia firebase-admin, solo para esta función
```

## Modelo de datos (Firestore)
Colección: `usuarios/{uid}/meses/{mes}` donde `mes` es string tipo `"Jul 2026"`.

Estructura de cada documento:
```js
{
  ingresos: [{ nombre, monto }],
  fijos:    [{ nombre, monto, pagado, descripcion, diaLimite }],
  varios:   [{ nombre, monto, pagado, descripcion, diaLimite }],
  otros:    [{ nombre, monto, pagado, descripcion, diaLimite }]
}
```
- `diaLimite`: número del día del mes en que vence el pago (ej: 15). Opcional.
- `pagado`: boolean. Los ítems pagados se renderizan al fondo de cada sección.
- `alertaEmail` ya no existe — fue eliminado.

Colección adicional: `usuarios/{uid}/notificaciones/{YYYY-MM-DD}` — marca de que ya
se envió el correo de recordatorio ese día (la escribe check-vencimientos.js, no el frontend).

## Features actuales
- Login con email/contraseña (Firebase Auth)
- Manejo de múltiples meses (selector + flechas de navegación)
- 3 categorías de gastos: fijos, varios, otros
- Ingresos configurables por mes
- Marcar gastos como pagados (bajan al fondo automáticamente)
- Modal de detalle por gasto: descripción, día límite, badge "Pagado" si aplica
- Banner "Vencimientos próximos" entre las stat-cards y los paneles: ítems con diaLimite
  ≤ 7 días y no pagados, con chip "Hoy" para el día exacto y chip rojo sólido de
  "atrasado" (con días de atraso) si ya pasó la fecha y sigue sin pagar
- Recordatorio por email automático el día que vence un gasto (ver check-vencimientos.js)
- Copiar gastos fijos/varios del mes anterior (evita duplicados)
- Exportar CSV con todos los meses
- Tema claro/oscuro (toggle en esquina superior derecha)
- Indicador de sync (Sincronizado / Guardando / Error)
- PWA-ready (meta tags para móvil)
- Layout responsive: sidebar en desktop, bottom nav + tabs en móvil

## Cosas importantes / decisiones tomadas
- **Sin framework**: no meter React/Vue/etc. El proyecto es chico y el stack vanilla funciona bien.
- **Sin build step**: no hay npm, webpack, vite. Los módulos se importan directo desde el browser.
- **Firebase CDN**: Firebase se importa desde `gstatic.com` (v12.11.0), no desde node_modules.
- **EmailJS ahora se llama server-side**: antes el envío corría en el navegador (`revisarAlertas` en `notifications.js`) y duplicaba correos porque el dedup vivía en `localStorage` (por dispositivo/navegador). Se sacó todo ese código y se reemplazó por `check-vencimientos.js`, que corre una vez al día en Netlify y guarda el dedup en Firestore (compartido entre dispositivos).
- **Índices originales en render**: `renderSeccion` ordena visualmente (pagados al fondo) pero preserva los índices originales del array para que editar/borrar funcione correctamente.
- **Autoguardado con debounce**: los cambios se guardan en Firestore 1200ms después de la última edición.
- **El modal de detalle** muestra badge verde "Pagado" si el ítem ya está marcado así.

## Preferencias del usuario
- Respuestas cortas y directas.
- No agregar features extra que no se pidieron.
- No meter abstracciones innecesarias.
- Antes de proponer mejoras, revisar el código real para no dar sugerencias genéricas.
- Cuando se piden mejoras de UI/diseño, mantener el estilo visual ya establecido (variables CSS, misma paleta).
