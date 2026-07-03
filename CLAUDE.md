# gastos-app — Contexto para Claude

## Qué es
App web personal de control de gastos mensuales. La usa Tomás (tomas1124ge@gmail.com) y posiblemente otros usuarios de confianza. Está desplegada en **Netlify** con deploy automático desde el branch `main` de GitHub (repo: TLG99/gastos-app, público).

## Stack
- **Frontend**: HTML + CSS + JS vanilla (ES modules, sin bundler, sin framework)
- **Backend**: Firebase (Auth con email/contraseña + Firestore para datos)
- **Tipografía**: Inter (Google Fonts)
- **Deploy**: Netlify → auto-deploy en push a main

No hay `package.json`, no hay build step. Los archivos se sirven directamente.

## Estructura de archivos
```
index.html          — único HTML, contiene toda la UI (login, app, modal)
css/styles.css      — todos los estilos, variables CSS para tema claro/oscuro
js/
  main.js           — punto de entrada: initDialogs, initTheme, initAuth
  auth.js           — login/logout con Firebase Auth, maneja show/hide de pantallas
  app.js            — estado central (datos, mesActual), lógica de negocio
  ui.js             — funciones de render (renderSeccion, recalcular, renderPagosProximos...)
  db.js             — operaciones Firestore (cargarTodosLosMeses, guardarMes, eliminarMes)
  firebase.js       — config e inicialización de Firebase
  dialogs.js        — sistema de diálogos visuales (showAlert, showConfirm, showPrompt)
  theme.js          — toggle tema claro/oscuro, persiste en localStorage
  notifications.js  — lógica de días restantes hasta vencimiento (diasRestantes)
                      El envío de emails via EmailJS está DESACTIVADO (revisarAlertas no se llama)
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

## Features actuales
- Login con email/contraseña (Firebase Auth)
- Manejo de múltiples meses (selector + flechas de navegación)
- 3 categorías de gastos: fijos, varios, otros
- Ingresos configurables por mes
- Marcar gastos como pagados (bajan al fondo automáticamente)
- Modal de detalle por gasto: descripción, día límite, badge "Pagado" si aplica
- Badge de días restantes en cada ítem (visible solo si ≤ 7 días y no pagado)
- Banner "Vencimientos próximos" entre las stat-cards y los paneles (ítems con diaLimite ≤ 7 días)
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
- **EmailJS desactivado**: el archivo `notifications.js` existe pero `revisarAlertas` ya no se llama desde ningún lado. El motivo fue que los correos seguían llegando incluso después de borrar gastos.
- **Índices originales en render**: `renderSeccion` ordena visualmente (pagados al fondo) pero preserva los índices originales del array para que editar/borrar funcione correctamente.
- **Autoguardado con debounce**: los cambios se guardan en Firestore 1200ms después de la última edición.
- **El modal de detalle** muestra badge verde "Pagado" si el ítem ya está marcado así.

## Preferencias del usuario
- Respuestas cortas y directas.
- No agregar features extra que no se pidieron.
- No meter abstracciones innecesarias.
- Antes de proponer mejoras, revisar el código real para no dar sugerencias genéricas.
- Cuando se piden mejoras de UI/diseño, mantener el estilo visual ya establecido (variables CSS, misma paleta).
