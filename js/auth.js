// js/auth.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { initApp, resetApp } from "./app.js";

export async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');
  if (!email || !pass) { err.textContent = 'Completa todos los campos'; return; }
  btn.disabled = true; btn.textContent = 'Ingresando...'; err.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Entrar';
    err.textContent = e.code === 'auth/invalid-credential'
      ? 'Email o contraseña incorrectos'
      : 'Error al ingresar. Intenta de nuevo.';
  }
}

export async function doLogout() {
  await signOut(auth);
}

export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      document.getElementById('login-screen').style.display   = 'none';
      document.getElementById('main-app').style.display       = 'flex';
      document.getElementById('sync-status').style.display    = 'flex';
      document.getElementById('bottom-nav').style.display     = 'flex';
      document.getElementById('user-email-label').textContent = user.email;
      // Pasamos uid Y email para las alertas
      await initApp(user.uid, user.email);
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('main-app').style.display     = 'none';
      document.getElementById('sync-status').style.display  = 'none';
      document.getElementById('bottom-nav').style.display   = 'none';
      document.getElementById('login-btn').disabled         = false;
      document.getElementById('login-btn').textContent      = 'Entrar';
      document.getElementById('login-error').textContent    = '';
      resetApp();
    }
  });
}

window.doLogin  = doLogin;
window.doLogout = doLogout;
