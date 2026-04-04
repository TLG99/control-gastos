// js/app.js
// Estado central y lógica de negocio

import { setUserId, cargarTodosLosMeses, guardarMes, eliminarMes } from "./db.js";
import { poblarSelector, renderIngresos, renderSeccion, recalcular, fmt, escHtml } from "./ui.js";

// ── Estado ──
let datos     = {};
let mesActual = '';
let saveTimer = null;

// ── Helpers de fecha ──
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

// ── Guardar con debounce (no spamear Firebase en cada tecla) ──
function autoGuardar() {
  recalcular(datos, mesActual);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => guardarMes(mesActual, datos[mesActual]), 1200);
}

// ── Cargar mes en pantalla ──
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

// ── Navegación entre meses ──
export function navMes(dir) {
  if (!mesActual) return;
  const lista = mesesOrdenados();
  const idx   = lista.indexOf(mesActual);
  const n     = idx + dir;
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
  const n = prompt('Nombre del ingreso (ej: Freelance, Arriendo):');
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
  datos[mesActual][sec].push({ nombre, monto: Number(mon.value) || 0, pagado: false });
  nom.value = '';
  mon.value = '';
  autoGuardar();
  renderSeccion(datos, mesActual, sec);
  nom.focus();
}

// ── Nuevo mes ──
export function abrirNuevoMes() {
  const ahora     = new Date();
  const sugeridos = [];
  for (let i = -1; i <= 4; i++) {
    const d   = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
    const str = formatMes(d);
    if (!datos[str]) sugeridos.push(str);
  }
  const sel = prompt('Escribe el mes (ej: May 2026)\nDisponibles:\n' + sugeridos.join('\n'));
  if (!sel) return;
  const mes   = sel.trim();
  const parts = mes.split(' ');
  if (parts.length !== 2 || !MESES.includes(parts[0]) || isNaN(parseInt(parts[1]))) {
    return alert('Formato inválido. Usa: Mes YYYY (ej: May 2026)');
  }
  if (!datos[mes]) datos[mes] = mesVacio();
  guardarMes(mes, datos[mes]).then(() => cargarMes(mes));
}

// ── Eliminar mes ──
export function eliminarMesActual() {
  if (!mesActual) return;
  if (!confirm(`¿Eliminar "${mesActual}" y todos sus datos?`)) return;
  eliminarMes(mesActual);
  delete datos[mesActual];
  const lista = mesesOrdenados();
  if (lista.length) cargarMes(lista[lista.length - 1]);
  else { mesActual = ''; poblarSelector([], ''); }
}

// ── Copiar fijos del mes anterior ──
export function copiarDelMesAnterior() {
  if (!mesActual) return;
  const ant = mesAnterior(mesActual);
  if (!datos[ant]) return alert('No hay datos del mes anterior (' + ant + ')');
  if (!confirm('¿Copiar gastos FIJOS de ' + ant + ' a ' + mesActual + '?')) return;
  datos[mesActual].fijos = [
    ...(datos[mesActual].fijos || []),
    ...JSON.parse(JSON.stringify(datos[ant].fijos || []))
  ];
  autoGuardar();
  renderSeccion(datos, mesActual, 'fijos');
}

// ── Exportar CSV ──
export function exportarCSV() {
  const meses = mesesOrdenados();
  let csv = 'Mes,Tipo,Nombre,Monto\n';
  meses.forEach(mes => {
    const d = datos[mes];
    (d.ingresos || []).forEach(x => csv += `${mes},Ingreso,${x.nombre},${x.monto}\n`);
    (d.fijos    || []).forEach(x => csv += `${mes},Fijo,${x.nombre},${x.monto}\n`);
    (d.varios   || []).forEach(x => csv += `${mes},Varios,${x.nombre},${x.monto}\n`);
    (d.otros    || []).forEach(x => csv += `${mes},Otros,${x.nombre},${x.monto}\n`);
  });
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'gastos_export.csv';
  a.click();
}

// ── Init (llamado desde auth.js cuando hay usuario) ──
export async function initApp(uid) {
  setUserId(uid);
  datos = await cargarTodosLosMeses();
  const lista = mesesOrdenados();
  if (lista.length) cargarMes(lista[lista.length - 1]);
}

// ── Reset (llamado desde auth.js al cerrar sesión) ──
export function resetApp() {
  datos     = {};
  mesActual = '';
}

// ── Exponer funciones al HTML (onclick en botones) ──
window.cargarMes            = cargarMes;
window.navMes               = navMes;
window.agregarIngreso       = agregarIngreso;
window.agregarIngresoCustom = agregarIngresoCustom;
window.addGasto             = addGasto;
window.abrirNuevoMes        = abrirNuevoMes;
window.eliminarMesActual    = eliminarMesActual;
window.copiarDelMesAnterior = copiarDelMesAnterior;
window.exportarCSV          = exportarCSV;

// Handlers inline de inputs (onchange/oninput en HTML generado dinámicamente)
window._setIng  = (i, v)       => setIngreso(i, v);
window._delIng  = (i)          => delIngreso(i);
window._setNom  = (s, i, v)    => setNombre(s, i, v);
window._setMon  = (s, i, v)    => setMonto(s, i, v);
window._togPag  = (s, i)       => togglePagado(s, i);
window._delGas  = (s, i)       => delGasto(s, i);
