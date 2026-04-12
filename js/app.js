// js/app.js
// Estado central y lógica de negocio

import { setUserId, cargarTodosLosMeses, guardarMes, eliminarMes } from "./db.js";
import { poblarSelector, renderIngresos, renderSeccion, recalcular } from "./ui.js";
import { revisarAlertas } from "./notifications.js";

// ── Estado ──
let datos      = {};
let mesActual  = '';
let saveTimer  = null;
let userEmail  = '';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function parseMes(s) {
  const [m, y] = s.split(' ');
  return new Date(parseInt(y), MESES.indexOf(m), 1);
}
function formatMes(d) {
  return MESES[d.getMonth()] + ' ' + d.getFullYear();
}
function mesAnterior(s) {
  const d = parseMes(s);
  d.setMonth(d.getMonth() - 1);
  return formatMes(d);
}
export function mesesOrdenados() {
  return Object.keys(datos).sort((a, b) => parseMes(a) - parseMes(b));
}
export function mesVacio() {
  return { ingresos: [], fijos: [], varios: [], otros: [] };
}

function autoGuardar() {
  recalcular(datos, mesActual);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => guardarMes(mesActual, datos[mesActual]), 1200);
}

// ── Cargar mes ──
export function cargarMes(mes) {
  mesActual = mes;
  if (!datos[mes]) datos[mes] = mesVacio();
  poblarSelector(mesesOrdenados(), mesActual);
  renderIngresos(datos, mesActual);
  renderSeccion(datos, mesActual, 'fijos');
  renderSeccion(datos, mesActual, 'varios');
  renderSeccion(datos, mesActual, 'otros');
  recalcular(datos, mesActual);
}

export function navMes(dir) {
  if (!mesActual) return;
  const lista = mesesOrdenados();
  const n = lista.indexOf(mesActual) + dir;
  if (n >= 0 && n < lista.length) cargarMes(lista[n]);
}

// ── Ingresos ──
export function setIngreso(i, v) {
  datos[mesActual].ingresos[i].monto = Number(v) || 0;
  autoGuardar();
}
export function delIngreso(i) {
  datos[mesActual].ingresos.splice(i, 1);
  autoGuardar();
  renderIngresos(datos, mesActual);
}
export function agregarIngreso(nombre, monto) {
  if (!mesActual) return alert('Selecciona un mes primero');
  datos[mesActual].ingresos.push({ nombre, monto: Number(monto) || 0 });
  autoGuardar();
  renderIngresos(datos, mesActual);
}
export function agregarIngresoCustom() {
  const n = prompt('Nombre del ingreso:');
  if (!n) return;
  agregarIngreso(n.trim(), 0);
}

// ── Gastos ──
export function setNombre(sec, i, v) {
  datos[mesActual][sec][i].nombre = v;
  autoGuardar();
}
export function setMonto(sec, i, v) {
  datos[mesActual][sec][i].monto = Number(v) || 0;
  autoGuardar();
}
export function togglePagado(sec, i) {
  datos[mesActual][sec][i].pagado = !datos[mesActual][sec][i].pagado;
  autoGuardar();
  renderSeccion(datos, mesActual, sec);
}
export function delGasto(sec, i) {
  datos[mesActual][sec].splice(i, 1);
  autoGuardar();
  renderSeccion(datos, mesActual, sec);
}
export function addGasto(sec) {
  if (!mesActual) return alert('Selecciona un mes primero');
  const nom    = document.getElementById('add-' + sec + '-nom');
  const mon    = document.getElementById('add-' + sec + '-mon');
  const nombre = nom.value.trim();
  if (!nombre) { nom.focus(); return; }
  datos[mesActual][sec].push({
    nombre, monto: Number(mon.value) || 0,
    pagado: false, descripcion: '', diaLimite: null, alertaEmail: false
  });
  nom.value = ''; mon.value = '';
  autoGuardar();
  renderSeccion(datos, mesActual, sec);
  nom.focus();
}

// ── Modal detalle ──
export function abrirDetalle(sec, i) {
  const g = datos[mesActual][sec][i];
  document.getElementById('det-titulo').textContent  = g.nombre;
  document.getElementById('det-desc').value          = g.descripcion  || '';
  document.getElementById('det-dia').value           = g.diaLimite    || '';
  document.getElementById('det-alerta').checked      = g.alertaEmail  || false;
  document.getElementById('det-sec').value           = sec;
  document.getElementById('det-idx').value           = i;
  document.getElementById('modal-detalle').style.display = 'flex';
}
export function cerrarDetalle() {
  document.getElementById('modal-detalle').style.display = 'none';
}
export function guardarDetalle() {
  const sec    = document.getElementById('det-sec').value;
  const i      = parseInt(document.getElementById('det-idx').value);
  const desc   = document.getElementById('det-desc').value.trim();
  const dia    = parseInt(document.getElementById('det-dia').value) || null;
  const alerta = document.getElementById('det-alerta').checked;

  if (dia !== null && (dia < 1 || dia > 31)) {
    alert('El día debe ser entre 1 y 31'); return;
  }
  datos[mesActual][sec][i].descripcion = desc;
  datos[mesActual][sec][i].diaLimite   = dia;
  datos[mesActual][sec][i].alertaEmail = alerta;
  autoGuardar();
  renderSeccion(datos, mesActual, sec);
  cerrarDetalle();
}

// ── Nuevo mes ──
export function abrirNuevoMes() {
  const ahora = new Date(); const sugeridos = [];
  for (let i = -1; i <= 4; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
    const str = formatMes(d);
    if (!datos[str]) sugeridos.push(str);
  }
  const sel = prompt('Escribe el mes (ej: May 2026)\nDisponibles:\n' + sugeridos.join('\n'));
  if (!sel) return;
  const mes = sel.trim(); const parts = mes.split(' ');
  if (parts.length !== 2 || !MESES.includes(parts[0]) || isNaN(parseInt(parts[1])))
    return alert('Formato inválido. Usa: Mes YYYY');
  if (!datos[mes]) datos[mes] = mesVacio();
  guardarMes(mes, datos[mes]).then(() => cargarMes(mes));
}

export function eliminarMesActual() {
  if (!mesActual) return;
  if (!confirm(`¿Eliminar "${mesActual}" y todos sus datos?`)) return;
  eliminarMes(mesActual);
  delete datos[mesActual];
  const lista = mesesOrdenados();
  if (lista.length) cargarMes(lista[lista.length - 1]);
  else { mesActual = ''; poblarSelector([], ''); }
}

export function copiarDelMesAnterior() {
  if (!mesActual) return;
  const ant = mesAnterior(mesActual);
  if (!datos[ant]) return alert('No hay datos del mes anterior (' + ant + ')');
  if (!confirm('¿Copiar gastos FIJOS de ' + ant + ' a ' + mesActual + '?')) return;

  const existentes = datos[mesActual].fijos || [];
  const porCopiar  = JSON.parse(JSON.stringify(datos[ant].fijos || []));

  // Evitar duplicados: si ya existe un gasto con el mismo nombre y diaLimite, no agregar
  const nuevos = porCopiar.filter(g => {
    return !existentes.some(e =>
      e.nombre === g.nombre && e.diaLimite === g.diaLimite
    );
  });

  // Resetear pagado a false (es un mes nuevo), pero conservar alertas y diaLimite
  const nuevosReset = nuevos.map(g => ({
    ...g,
    pagado: false,   // siempre pendiente en el nuevo mes
    // descripcion, diaLimite y alertaEmail se conservan tal cual
  }));

  datos[mesActual].fijos = [...existentes, ...nuevosReset];
  autoGuardar();
  renderSeccion(datos, mesActual, 'fijos');

  if (nuevosReset.length === 0) {
    alert('No hay gastos nuevos que copiar (todos ya existen en este mes).');
  }
}

export function exportarCSV() {
  const meses = mesesOrdenados();
  let csv = 'Mes,Tipo,Nombre,Monto,Descripcion,DiaLimite\n';
  meses.forEach(mes => {
    const d = datos[mes];
    (d.ingresos || []).forEach(x => csv += `${mes},Ingreso,${x.nombre},${x.monto},,\n`);
    ['fijos','varios','otros'].forEach(sec =>
      (d[sec] || []).forEach(x =>
        csv += `${mes},${sec},${x.nombre},${x.monto},${x.descripcion||''},${x.diaLimite||''}\n`
      )
    );
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'gastos_export.csv'; a.click();
}

// ── Init ──
export async function initApp(uid, email) {
  userEmail = email;
  setUserId(uid);
  datos = await cargarTodosLosMeses();
  const lista = mesesOrdenados();
  if (lista.length) cargarMes(lista[lista.length - 1]);
  revisarAlertas(datos, userEmail).catch(console.error);
}

export function resetApp() {
  datos = {}; mesActual = ''; userEmail = '';
}

// ── Exponer al HTML ──
window.cargarMes            = cargarMes;
window.navMes               = navMes;
window.agregarIngreso       = agregarIngreso;
window.agregarIngresoCustom = agregarIngresoCustom;
window.addGasto             = addGasto;
window.abrirNuevoMes        = abrirNuevoMes;
window.eliminarMesActual    = eliminarMesActual;
window.copiarDelMesAnterior = copiarDelMesAnterior;
window.exportarCSV          = exportarCSV;
window.abrirDetalle         = abrirDetalle;
window.cerrarDetalle        = cerrarDetalle;
window.guardarDetalle       = guardarDetalle;
window._setIng  = (i, v)    => setIngreso(i, v);
window._delIng  = (i)       => delIngreso(i);
window._setNom  = (s, i, v) => setNombre(s, i, v);
window._setMon  = (s, i, v) => setMonto(s, i, v);
window._togPag  = (s, i)    => togglePagado(s, i);
window._delGas  = (s, i)    => delGasto(s, i);
window._detalle = (s, i)    => abrirDetalle(s, i);