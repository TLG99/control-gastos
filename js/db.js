// js/db.js
// Todas las operaciones de lectura y escritura con Firestore

import { db } from "./firebase.js";
import {
  doc, setDoc, deleteDoc,
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

let userId = '';

export function setUserId(uid) {
  userId = uid;
}

// Referencia a la colección de meses del usuario actual
function colMeses()    { return collection(db, 'usuarios', userId, 'meses'); }
function docMes(mes)   { return doc(db, 'usuarios', userId, 'meses', mes); }

// ── Indicador de sync ──
export function setSyncStatus(estado, texto) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = estado;
  document.getElementById('sync-txt').textContent = texto;
}

// ── Leer todos los meses del usuario ──
export async function cargarTodosLosMeses() {
  setSyncStatus('syncing', 'Cargando...');
  try {
    const snap = await getDocs(colMeses());
    const datos = {};
    snap.forEach(d => { datos[d.id] = d.data(); });
    setSyncStatus('ok', 'Sincronizado');
    return datos;
  } catch (e) {
    setSyncStatus('error', 'Sin conexión');
    return {};
  }
}

// ── Guardar un mes (con debounce desde app.js) ──
export async function guardarMes(mes, datosMes) {
  setSyncStatus('syncing', 'Guardando...');
  try {
    // JSON.parse/stringify elimina undefined que Firestore no acepta
    await setDoc(docMes(mes), JSON.parse(JSON.stringify(datosMes)));
    setSyncStatus('ok', 'Guardado ✓');
  } catch (e) {
    setSyncStatus('error', 'Error al guardar');
  }
}

// ── Eliminar un mes ──
export async function eliminarMes(mes) {
  try {
    await deleteDoc(docMes(mes));
  } catch (e) {
    console.error('Error al eliminar mes:', e);
  }
}
