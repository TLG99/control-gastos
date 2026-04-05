// js/ui.js
import { diasRestantes } from "./notifications.js";

export function fmt(n) {
  return '$' + (Math.round(Number(n) || 0)).toLocaleString('es-CL');
}
export function escHtml(s) {
  return String(s).replace(/"/g, '&quot;');
}

// ── Badge de días restantes ──
function badgeDias(gasto) {
  if (!gasto.diaLimite) return '';
  const dias = diasRestantes(gasto.diaLimite);
  if (dias > 7) return '';
  const color = dias <= 1 ? '#F04438' : dias <= 3 ? '#F79009' : '#667085';
  const txt   = dias === 0 ? '¡Hoy!' : dias === 1 ? '1 día' : `${dias} días`;
  return `<span class="badge-dias" style="background:${color}15;color:${color};border:1px solid ${color}40">${txt}</span>`;
}

// ── Indicador de descripción ──
function dotDesc(gasto) {
  return gasto.descripcion
    ? `<span class="desc-dot" title="${escHtml(gasto.descripcion)}">●</span>`
    : '';
}

// ── Selector de mes ──
export function poblarSelector(mesesOrdenados, mesActual) {
  const opts = mesesOrdenados
    .map(m => `<option value="${m}" ${m === mesActual ? 'selected' : ''}>${m}</option>`)
    .join('');
  document.getElementById('sel-mes').innerHTML     = opts;
  document.getElementById('sel-mes-mob').innerHTML = opts;
  const label = mesActual || '—';
  document.getElementById('header-mes').textContent     = label;
  document.getElementById('main-mes-title').textContent = label;
  document.getElementById('mob-mes-label').textContent  = label;
}

// ── Ingresos ──
export function renderIngresos(datos, mesActual) {
  const d = datos[mesActual];
  const html = d.ingresos.map((ing, i) => `
    <div class="ingreso-item">
      <label>${ing.nombre}</label>
      <input type="number" value="${ing.monto}" placeholder="0"
        oninput="window._setIng(${i}, this.value)">
      <button class="btn-del-ing" onclick="window._delIng(${i})">×</button>
    </div>`).join('');
  document.getElementById('ingresos-grid').innerHTML     = html;
  document.getElementById('mob-ingresos-grid').innerHTML = html;
}

// ── Sección de gastos ──
export function renderSeccion(datos, mesActual, sec) {
  const lista = datos[mesActual][sec] || [];
  document.getElementById('lista-' + sec).innerHTML = lista.map((g, i) => `
    <div class="gasto-item" style="${g.pagado ? 'opacity:.45' : ''}">
      <input class="gi-nombre" type="text" value="${escHtml(g.nombre)}"
        style="${g.pagado ? 'text-decoration:line-through' : ''}"
        onchange="window._setNom('${sec}', ${i}, this.value)">
      ${dotDesc(g)}
      ${badgeDias(g)}
      <input class="gi-monto" type="number" value="${g.monto}"
        oninput="window._setMon('${sec}', ${i}, this.value)">
      <button class="btn-dots" onclick="window._detalle('${sec}', ${i})" title="Ver detalle">···</button>
      <button class="btn-pagado ${g.pagado ? 'pagado' : ''}"
        onclick="window._togPag('${sec}', ${i})"
        title="${g.pagado ? 'Marcar pendiente' : 'Marcar pagado'}">✓</button>
      <button class="btn-del-item" onclick="window._delGas('${sec}', ${i})">×</button>
    </div>`).join('');
}

// ── Recalcular totales ──
export function recalcular(datos, mesActual) {
  if (!mesActual || !datos[mesActual]) return;
  const d          = datos[mesActual];
  const totalIng   = d.ingresos.reduce((a, x) => a + (Number(x.monto) || 0), 0);
  const totalItems = ['fijos','varios','otros'].reduce((a, s) => a + (d[s] || []).length, 0);
  const totalGas   = ['fijos','varios','otros'].reduce((a, s) =>
    a + (d[s] || []).reduce((b, g) => b + (Number(g.monto) || 0), 0), 0);
  const saldo = totalIng - totalGas;
  const pct   = totalIng > 0 ? Math.round(saldo / totalIng * 100) : 0;
  const pctC  = Math.max(0, Math.min(100, pct));
  const col   = pct >= 30 ? 'var(--green)' : pct >= 0 ? 'var(--amber)' : 'var(--red)';

  // Sidebar
  document.getElementById('t-ingreso').textContent = fmt(totalIng);
  document.getElementById('t-gastos').textContent  = fmt(totalGas);
  const sv = document.getElementById('t-saldo');
  sv.textContent = fmt(saldo); sv.className = 'mval ' + (saldo >= 0 ? 'verde' : 'rojo');
  document.getElementById('t-pct').textContent = pct + '%';
  const bf = document.getElementById('bar-fill');
  bf.style.width = pctC + '%'; bf.style.background = col;

  // Stat cards
  document.getElementById('sc-ingreso').textContent   = fmt(totalIng);
  document.getElementById('sc-gastos').textContent    = fmt(totalGas);
  document.getElementById('sc-gas-badge').textContent = totalItems + ' items';
  const ss = document.getElementById('sc-saldo');
  ss.textContent = fmt(saldo); ss.style.color = saldo >= 0 ? 'var(--green)' : 'var(--red)';
  const ssb = document.getElementById('sc-sal-badge');
  ssb.textContent = saldo >= 0 ? 'Positivo' : 'Negativo';
  ssb.className   = 'sc-badge ' + (saldo >= 0 ? 'badge-green' : 'badge-red');
  document.getElementById('sc-pct').textContent  = pct + '%';
  document.getElementById('sc-pct').style.color  = col;

  // Móvil
  document.getElementById('mob-ingreso').textContent = fmt(totalIng);
  document.getElementById('mob-gastos').textContent  = fmt(totalGas);
  const ms = document.getElementById('mob-saldo');
  ms.textContent = fmt(saldo); ms.className = 'mc-val ' + (saldo >= 0 ? 'verde' : 'rojo');
  const mp = document.getElementById('mob-pct');
  mp.textContent = pct + '%'; mp.style.color = col;
  document.getElementById('mob-pct2').textContent = pct + '%';
  const mbf = document.getElementById('mob-bar-fill');
  mbf.style.width = pctC + '%'; mbf.style.background = col;

  ['fijos','varios','otros'].forEach(s => {
    const tot = (d[s] || []).reduce((a, g) => a + (Number(g.monto) || 0), 0);
    document.getElementById('tot-' + s).textContent = fmt(tot);
  });
}

// ── Toggle colapsar ──
export function toggleSec(sec) {
  const body = document.getElementById('body-' + sec);
  const tog  = document.getElementById('tog-' + sec);
  tog.textContent = body.classList.toggle('oculto') ? '▼' : '▲';
}

// ── Tabs móvil ──
export function switchMobTab(tab) {
  document.getElementById('mob-panel-resumen').classList.remove('tab-active');
  ['fijos','varios','otros'].forEach(s => document.getElementById('panel-' + s).classList.remove('tab-active'));
  ['resumen','fijos','varios','otros'].forEach(s => {
    const b = document.getElementById('bnav-' + s);
    if (b) b.classList.remove('active');
  });
  if (tab === 'resumen') document.getElementById('mob-panel-resumen').classList.add('tab-active');
  else document.getElementById('panel-' + tab).classList.add('tab-active');
  const ab = document.getElementById('bnav-' + tab);
  if (ab) ab.classList.add('active');
}

window.toggleSec    = toggleSec;
window.switchMobTab = switchMobTab;
